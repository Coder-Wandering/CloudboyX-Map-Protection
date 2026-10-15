import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Send, BrainCircuit, Search, Mic, MicOff, Image as ImageIcon, 
  RefreshCw, HelpCircle, Download, FileText, ShieldAlert, ArrowRight, Upload, X 
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AILabView() {
  const [activeSubTab, setActiveSubTab] = useState<"chat" | "voice" | "images">("chat");

  // 1. Chatbot Strategy States
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceBrand, setVoiceBrand] = useState("Cloudboy Guardian");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mapshield_whitelabel_config");
      const parsed = saved ? JSON.parse(saved) : null;
      const bName = parsed?.brandName || "Cloudboy";
      setMessages([
        { role: "assistant", content: `Welcome to the ${bName} Strategic Advisor. I can help you draft legal cease-and-desist warnings, design policy enforcement guidelines, or conduct competitive retail strategy analysis. How can I protect your brand value today?` }
      ]);
      setVoiceBrand(`${bName} Guardian`);
    } catch (e) {
      setMessages([
        { role: "assistant", content: "Welcome to the Cloudboy Strategic Advisor. I can help you draft legal cease-and-desist warnings, design policy enforcement guidelines, or conduct competitive retail strategy analysis. How can I protect your brand value today?" }
      ]);
      setVoiceBrand("Cloudboy Guardian");
    }
  }, []);
  const [chatInput, setChatInput] = useState("");
  const [deepThinking, setDeepThinking] = useState(false);
  const [searchGrounding, setSearchGrounding] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 2. Real-time Audio / Live API States
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "speaking">("idle");
  
  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  
  // High quality gapless audio queue variables
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);

  // 3. Image Generation / Editing States
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgModel, setImgModel] = useState<"gemini-3.1-flash-image" | "gemini-3.1-flash-lite-image">("gemini-3.1-flash-image");
  const [imgSize, setImgSize] = useState<"1K" | "2K" | "4K">("1K");
  const [baseImageBase64, setBaseImageBase64] = useState<string | null>(null);
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);
  const [imgDescription, setImgDescription] = useState("");
  const [imgError, setImgError] = useState<string | null>(null);

  // Scroll to bottom helper for Chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  // Clean-up voice session on destroy
  useEffect(() => {
    return () => {
      disconnectVoice();
    };
  }, []);

  // --- Voice Integration Helpers ---
  const playAudioChunk = async (base64Audio: string) => {
    try {
      if (!outputCtxRef.current) return;
      
      // Decode base64 raw little-endian 16-bit PCM (sample rate 24000)
      const binary = atob(base64Audio);
      const len = binary.length;
      const buffer = new ArrayBuffer(len);
      const u8 = new Uint8Array(buffer);
      for (let i = 0; i < len; i++) {
        u8[i] = binary.charCodeAt(i);
      }
      
      const int16 = new Int16Array(buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = outputCtxRef.current.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      // Schedule for gapless playback
      const now = outputCtxRef.current.currentTime;
      let startTime = nextStartTimeRef.current;
      if (startTime < now) {
        startTime = now + 0.05; // small buffer padding
      }

      const source = outputCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputCtxRef.current.destination);
      
      source.onended = () => {
        // Simple garbage collection
        audioQueueRef.current = audioQueueRef.current.filter(node => node !== source);
        if (audioQueueRef.current.length === 0) {
          setVoiceStatus("listening");
        }
      };

      setVoiceStatus("speaking");
      source.start(startTime);
      audioQueueRef.current.push(source);
      
      nextStartTimeRef.current = startTime + audioBuffer.duration;

    } catch (err) {
      console.error("PCM Chunk playback failed", err);
    }
  };

  const stopAllPlayback = () => {
    audioQueueRef.current.forEach(node => {
      try { sourceStopSafe(node); } catch (e) {}
    });
    audioQueueRef.current = [];
    nextStartTimeRef.current = 0;
    setVoiceStatus("listening");
  };

  const sourceStopSafe = (source: AudioBufferSourceNode) => {
    try { source.stop(); } catch (e) {}
  };

  const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const connectVoice = async () => {
    setVoiceError(null);
    try {
      // 1. Retrieve microphone permissions recursively
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // 2. Establish context
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;

      // 3. Connect local WS
      const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
      const wsUrl = `${protocol}${window.location.host}/api/live-consultant`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsVoiceConnected(true);
        setVoiceStatus("listening");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.audio) {
            playAudioChunk(data.audio);
          }
          if (data.interrupted) {
            stopAllPlayback();
          }
          if (data.error) {
            setVoiceError(data.error);
            disconnectVoice();
          }
        } catch (err) {
          console.error("Audio block error in WS stream", err);
        }
      };

      ws.onerror = (e) => {
        console.error("WS error:", e);
        setVoiceError("WebSocket connection failed. Retry shortly.");
        disconnectVoice();
      };

      ws.onclose = () => {
        setIsVoiceConnected(false);
      };

      // 4. Capture microphone stream at 16kHz
      const source = inputCtx.createMediaStreamSource(stream);
      // Deprecated but highly supported and solid ScriptProcessor due to simple iframe restrictions
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const channelData = e.inputBuffer.getChannelData(0);
        const pcmBuffer = floatTo16BitPCM(channelData);
        const base64Audio = arrayBufferToBase64(pcmBuffer);
        
        ws.send(JSON.stringify({ audio: base64Audio }));
      };

    } catch (err: any) {
      console.error("Could not mount Live Mic system list", err);
      setVoiceError(err.message || "Microphone access blocked. Please enable frame permissions.");
      disconnectVoice();
    }
  };

  const disconnectVoice = () => {
    setIsVoiceConnected(false);
    setVoiceStatus("idle");

    if (wsRef.current) {
      try { wsRef.current.close(); } catch(e) {}
      wsRef.current = null;
    }
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch(e) {}
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      try { micStreamRef.current.getTracks().forEach(t => t.stop()); } catch(e) {}
      micStreamRef.current = null;
    }
    if (inputCtxRef.current) {
      try { inputCtxRef.current.close(); } catch(e) {}
      inputCtxRef.current = null;
    }
    if (outputCtxRef.current) {
      try { outputCtxRef.current.close(); } catch(e) {}
      outputCtxRef.current = null;
    }
  };

  // --- Chat Bot Helper ---
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: Message = { role: "user", content: chatInput };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          deepThinking,
          searchGrounding
        })
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Compliance brain failure");
      }

      const reply = await response.json();
      setMessages(prev => [...prev, reply]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `❌ Error: ${err.message || "Unable to formulate pricing compliance advice at this time."}` }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleApplyPreset = (prompt: string) => {
    setChatInput(prompt);
  };

  // --- Image Upload Helpers ---
  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBaseImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearBaseImage = () => {
    setBaseImageBase64(null);
  };

  // --- Image Generator Helper ---
  const handleGenerateImage = async () => {
    if (!imgPrompt.trim() || isImgLoading) return;

    setIsImgLoading(true);
    setImgError(null);
    setGeneratedImgUrl(null);

    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imgPrompt,
          model: imgModel,
          imageSize: imgSize,
          baseImage: baseImageBase64
        })
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Asset generator failed. Check billing credentials.");
      }

      const result = await response.json();
      setGeneratedImgUrl(result.imageUrl);
      setImgDescription(result.description);
    } catch (err: any) {
      setImgError(err.message || "Failed to generate visual asset. Please retry with a shorter prompt.");
    } finally {
      setIsImgLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="ai-lab-tab-root">
      {/* Intro Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="space-y-2 relative max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-xs text-indigo-400 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI Compliance & Strategy Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
            Brand Protection Lab
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Formulate compliance legal templates, inspect market policies with search grounding, generate watermarked visual certificates, or activate full-duplex voice consultation.
          </p>
        </div>

        {/* Sub-tab Selection Buttons */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-stretch md:self-auto flex-wrap gap-1 shrink-0">
          <button
            onClick={() => setActiveSubTab("chat")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === "chat" 
                ? "bg-indigo-550 text-white shadow-md shadow-indigo-600/15" 
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            Legal Strategist
          </button>
          
          <button
            onClick={() => setActiveSubTab("voice")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === "voice" 
                ? "bg-indigo-550 text-white shadow-md shadow-indigo-600/15" 
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Voice Companion
          </button>

          <button
            onClick={() => setActiveSubTab("images")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === "images" 
                ? "bg-indigo-550 text-white shadow-md shadow-indigo-600/15" 
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Asset Studio
          </button>
        </div>
      </div>

      {/* SUBTAB 1: POLICY STRATEGIST DEEP CHAT */}
      {activeSubTab === "chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Preset templates */}
          <div className="lg:col-span-1 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 space-y-4 h-fit shadow-sm">
            <h3 className="text-xs font-mono tracking-widest text-slate-500 uppercase font-semibold">Preset Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => handleApplyPreset("Recommend general MAP compliance rules for electronic retail resellers, including safety threshold boundaries.")}
                className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/50 border border-slate-850 hover:border-slate-700 transition space-y-1.5 cursor-pointer text-xs"
              >
                <div className="font-semibold text-slate-300">Reseller MAP Rules</div>
                <div className="text-slate-500 truncate">Outline bulletproof guidelines...</div>
              </button>

              <button 
                onClick={() => handleApplyPreset("Draft a comprehensive legal Cease & Desist Warning Notice to an unauthorized seller 'GizmoOutlet Ltd' violating the MAP limit on the ProFocus 4K WebCam.")}
                className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/50 border border-slate-850 hover:border-slate-700 transition space-y-1.5 cursor-pointer text-xs"
              >
                <div className="font-semibold text-slate-300">Cease & Desist Draft</div>
                <div className="text-slate-500 truncate">Establish firm legal warnings...</div>
              </button>

              <button 
                onClick={() => handleApplyPreset("Check recent court guidelines or legal case precedents regarding Minimum Advertised Price (MAP) enforcement rules in United States antitrust law.")}
                className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/50 border border-slate-850 hover:border-slate-700 transition space-y-1.5 cursor-pointer text-xs"
              >
                <div className="font-semibold text-slate-300">Antitrust precedents</div>
                <div className="text-slate-500 truncate">Examine historical legal precedents...</div>
              </button>
            </div>

            {/* Strategy Configuration */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Engine parameters</span>
              
              <label className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-850/60 cursor-pointer hover:bg-slate-950 transition">
                <div className="flex items-center gap-2.5">
                  <BrainCircuit className={`w-4 h-4 ${deepThinking ? "text-indigo-400" : "text-slate-500"}`} />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">High Reason Lab</span>
                    <span className="text-[9px] text-slate-500 leading-none">Uses gemini-3.1-pro-preview</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={deepThinking}
                  onChange={e => {
                    setDeepThinking(e.target.checked);
                    if (e.target.checked) setSearchGrounding(false); // mutuall exclusive for quality
                  }}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-850/60 cursor-pointer hover:bg-slate-950 transition">
                <div className="flex items-center gap-2.5">
                  <Search className={`w-4 h-4 ${searchGrounding ? "text-indigo-400" : "text-slate-500"}`} />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Web Grounding</span>
                    <span className="text-[9px] text-slate-500 leading-none">Search engine grounding</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={searchGrounding}
                  onChange={e => {
                    setSearchGrounding(e.target.checked);
                    if (e.target.checked) setDeepThinking(false);
                  }}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Scrolling Chat Window */}
          <div className="lg:col-span-3 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-[500px] shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <BrainCircuit className="w-4 h-4 text-indigo-400 animate-pulse" />
                Compliance Strategic Advisor
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${deepThinking ? "bg-indigo-400 animate-pulse" : "bg-emerald-400"}`}></span>
                {deepThinking ? "Deep Thinking Level: HIGH" : searchGrounding ? "Google Grounded Active" : "Operational Standard"}
              </span>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`p-4 rounded-xl max-w-[85%] text-xs leading-relaxed space-y-1 ${
                    m.role === "user" 
                      ? "bg-indigo-550 text-white font-medium rounded-br-none" 
                      : "bg-slate-950 border border-slate-850 text-slate-300 rounded-bl-none font-sans"
                  }`}>
                    {m.content.startsWith("❌ Error") ? (
                      <div className="text-red-400 font-semibold">{m.content}</div>
                    ) : (
                      <p className="whitespace-pre-line">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl rounded-bl-none text-xs text-slate-500 flex items-center gap-2 max-w-[80%] font-mono animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    {deepThinking ? "Executing Deep Thinking reasoning model..." : "Synthesizing strategy reports..."}
                  </div>
                </div>
              )}
              <div ref={chatBottomRef}></div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleChatSubmit} className="pt-3 border-t border-slate-800/80 flex gap-3">
              <input 
                type="text"
                required
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={deepThinking ? "Ask complex policies (Deep Thinking active)..." : "Draft cease/desist warning, evaluate retail pricing structures..."}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-700"
              />
              <button 
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="py-3 px-4 bg-indigo-550 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-white font-bold transition flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* SUBTAB 2: REAL-TIME VOICE ASSISTANT */}
      {activeSubTab === "voice" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Voice overview panel */}
          <div className="p-6 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl space-y-6 lg:col-span-1 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-indigo-400" />
                Live Voice Channel
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unlock safe, low-latency legal strategy discussions. Speak directly to '{voiceBrand}', a specialized voice model that evaluates MAP policies and reseller enforcement strategies in real-time.
              </p>
            </div>

            <div className="space-y-3.5 bg-slate-950 p-4 border border-slate-850 rounded-xl">
              <h3 className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">How to talk</h3>
              <ul className="text-[11px] text-slate-500 space-y-2 list-decimal pl-4 leading-relaxed font-sans">
                <li>Attach microphone with iframe permissions if prompted.</li>
                <li>Press <strong className="text-indigo-400">Establish Active Session</strong>.</li>
                <li>Wait for state to change to <strong className="text-emerald-400">LISTENING</strong>.</li>
                <li>Speak your pricing or enforcement inquiry.</li>
                <li>The voice companion responds instantly in high-fidelity audio feedback.</li>
              </ul>
            </div>

            {voiceError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 leading-relaxed">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{voiceError}</div>
              </div>
            )}
          </div>

          {/* Active Voice control center */}
          <div className="lg:col-span-2 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 flex flex-col justify-between items-center min-h-[360px] shadow-sm">
            <div className="w-full pb-4 border-b border-slate-800/60 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 uppercase tracking-widest font-semibold">Duplex Voice Module</span>
              
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isVoiceConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}></span>
                <span className={isVoiceConnected ? "text-emerald-400 font-bold" : "text-slate-500"}>
                  {isVoiceConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>

            {/* Center anim layout */}
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              
              {/* Dynamic Waveform bubble */}
              <div className={`relative w-28 h-28 rounded-full flex items-center justify-center border transition-all duration-300 ${
                isVoiceConnected 
                  ? "bg-indigo-500/10 border-indigo-500/30 shadow-2xl shadow-indigo-500/30 scale-105" 
                  : "bg-slate-950 border-slate-800 scale-100"
              }`}>
                {isVoiceConnected && voiceStatus === "speaking" && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-indigo-550/20 animate-ping"></span>
                    <span className="absolute -inset-4 rounded-full bg-indigo-500/10 animate-pulse"></span>
                  </>
                )}
                {isVoiceConnected && voiceStatus === "listening" && (
                  <span className="absolute inset-0 rounded-full bg-emerald-500/5 animate-pulse"></span>
                )}
                
                {isVoiceConnected ? (
                  voiceStatus === "speaking" ? (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-6 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-9 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                      <span className="w-1.5 h-5 bg-indigo-400 rounded-full animate-bounce"></span>
                    </div>
                  ) : (
                    <Mic className="w-8 h-8 text-emerald-400 animate-pulse" />
                  )
                ) : (
                  <MicOff className="w-8 h-8 text-slate-750" />
                )}
              </div>

              {/* Status report */}
              <div className="text-center space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500 block">Status state</span>
                <h3 className="text-base font-bold text-white capitalize font-display">
                  {!isVoiceConnected ? "Standby" : voiceStatus === "speaking" ? "Speaking..." : "Listening (speak now)"}
                </h3>
              </div>

            </div>

            {/* Trigger Button */}
            <div className="w-full pt-4 border-t border-slate-800/60 text-center">
              {!isVoiceConnected ? (
                <button
                  type="button"
                  onClick={connectVoice}
                  className="px-6 py-3.5 bg-indigo-550 hover:bg-indigo-400 font-bold text-white rounded-xl text-xs flex items-center gap-2 mx-auto cursor-pointer shadow-lg shadow-indigo-650/15"
                >
                  <Mic className="w-4 h-4" />
                  Establish Active Session
                </button>
              ) : (
                <button
                  type="button"
                  onClick={disconnectVoice}
                  className="px-6 py-3.5 bg-red-500/20 hover:bg-red-500/30 font-bold text-red-400 rounded-xl text-xs flex items-center gap-2 mx-auto border border-red-500/30 cursor-pointer"
                >
                  <MicOff className="w-4 h-4" />
                  Terminate Voice Session
                </button>
              )}
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 3: COMPLIANCE ASSET GENERATOR (IMAGES) */}
      {activeSubTab === "images" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Options */}
          <div className="p-6 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl space-y-6 lg:col-span-1 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                Asset Generator
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Design custom image assets. Generate brand authorized wholesale banners, official pricing compliance seals, or upload an existing reseller warning badge to edit via prompts!
              </p>
            </div>

            <div className="space-y-4">
              
              {/* File Upload Dropzone for Editing */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  Optional: Base Image to Edit
                </label>
                
                {!baseImageBase64 ? (
                  <div className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/60 rounded-xl p-4 text-center cursor-pointer relative group transition">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleBaseImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="space-y-1.5">
                      <Upload className="w-5 h-5 text-slate-650 mx-auto group-hover:text-indigo-400 transition" />
                      <div className="text-[11px] font-medium text-slate-300">Drag or click to upload base badge</div>
                      <div className="text-[9px] text-slate-550 font-mono">PNG / JPEG for AI editing</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 border border-slate-800 bg-slate-950 rounded-xl flex items-center justify-between gap-3 relative">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={baseImageBase64} 
                        alt="Target payload template" 
                        className="w-10 h-10 object-cover rounded bg-slate-900 border border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 text-left">
                        <span className="block text-[10px] text-emerald-400 font-mono font-bold uppercase">Image Loaded</span>
                        <span className="block text-[9px] text-slate-500 truncate">Template queued for editing</span>
                      </div>
                    </div>
                    <button 
                      onClick={clearBaseImage}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-red-400 transition cursor-pointer border border-slate-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Model Select */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Model selection</label>
                <select 
                  value={imgModel}
                  onChange={e => setImgModel(e.target.value as any)}
                  disabled={!!baseImageBase64}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="gemini-3.1-flash-image">Gemini 3.1 Flash Image (High Quality)</option>
                  <option value="gemini-3.1-flash-lite-image">Gemini 3.1 Flash Lite Image (Fast)</option>
                </select>
                {baseImageBase64 && (
                  <span className="text-[10px] text-amber-500/80 mt-1.5 block font-mono">
                    * Multi-modal edits default to gemini-3.1-flash-image
                  </span>
                )}
              </div>

              {/* Resolution select */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Image size parameter</label>
                <div className="grid grid-cols-3 gap-2 select-none">
                  {(["1K", "2K", "4K"] as const).map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setImgSize(size)}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition cursor-pointer ${
                        imgSize === size 
                          ? "bg-indigo-550/15 border-indigo-500/40 text-indigo-400" 
                          : "bg-slate-950 border-slate-850 hover:bg-slate-850 text-slate-500"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Prompt + Display Output Pane */}
          <div className="lg:col-span-2 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-805/85 border-zinc-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Output showcase */}
              <div className="space-y-3 shrink-0">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500 block">Generated Result</span>
                
                <div className="aspect-square w-full rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center relative overflow-hidden group">
                  {isImgLoading ? (
                    <div className="text-center space-y-3 font-mono text-xs text-slate-500 px-6">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                      <div>Synthesizing image assets at {imgSize} resolution...</div>
                    </div>
                  ) : generatedImgUrl ? (
                    <>
                      <img 
                        src={generatedImgUrl} 
                        alt="Compliance Visual Output" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Hover action bar */}
                      <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <a 
                          href={generatedImgUrl}
                          download={`mapshield-asset-${imgSize.toLowerCase()}.png`}
                          className="px-4 py-2 bg-indigo-555 hover:bg-indigo-400 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          Download in {imgSize}
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-2 text-slate-650 font-sans px-8 py-10">
                      <ImageIcon className="w-12 h-12 text-slate-800 mx-auto" />
                      <p className="text-xs max-w-xs">
                        Enter a detailed compliance asset prompt on the right to build official warning banners or authorized seals.
                      </p>
                    </div>
                  )}
                </div>

                {imgDescription && (
                  <p className="text-[11px] text-slate-450 italic font-mono leading-relaxed bg-slate-950/20 p-3 rounded-lg border border-slate-850">
                    "{imgDescription}"
                  </p>
                )}
              </div>

              {/* Text Input Prompt */}
              <div className="space-y-4">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500 block">Construct your prompt</span>
                
                <textarea
                  value={imgPrompt}
                  onChange={e => setImgPrompt(e.target.value)}
                  placeholder={
                    baseImageBase64 
                      ? "Describe changes: e.g. Add a red legal border in the corner and bold red warnings 'MAP PRICE BREACH'" 
                      : "e.g. Official premium retail compliance seal certificate, circular gold stamp design with ribbon, deep blue velvet accents, detailed professional compliance sticker v2, 3D render."
                  }
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-700 font-sans leading-relaxed"
                />

                {imgError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-xl font-mono leading-relaxed">
                    {imgError}
                  </div>
                )}

                <button
                  type="button"
                  disabled={isImgLoading || !imgPrompt.trim()}
                  onClick={handleGenerateImage}
                  className="w-full py-4 bg-indigo-550 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-600 font-bold text-white rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isImgLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Rendering compliance asset...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {baseImageBase64 ? "Apply Creative AI Image Edit" : `Generate Brand Asset (${imgSize})`}
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Quick Suggestions list */}
            <div className="pt-4 border-t border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2 font-bold">Quick Suggested Concepts</span>
              <div className="flex flex-wrap gap-2.5 text-[11px]">
                <button
                  onClick={() => setImgPrompt("Vector clean badge logo for authorized resellers, circular silver metal border with locked shield symbol, 'AUTHORIZED RESELLER' text.")}
                  className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-lg border border-slate-850 hover:border-slate-750 transition cursor-pointer"
                >
                  Authorized Reseller Seal
                </button>
                <button
                  onClick={() => setImgPrompt("Red bold retail compliance banner safety alert, horizontal notification flag design, 'MAP VIOLATION DETECTED' in high contrast gothic font, warning icon.")}
                  className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-lg border border-slate-850 hover:border-slate-750 transition cursor-pointer"
                >
                  Violation Alert Flag
                </button>
                <button
                  onClick={() => setImgPrompt("Minimalist brand security padlock certificate card graphic, dark slate theme background, gradient gold lock shape on vector mesh ornament.")}
                  className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-lg border border-slate-850 hover:border-slate-750 transition cursor-pointer"
                >
                  Security Stamp Card
                </button>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

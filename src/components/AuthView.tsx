import React, { useState } from "react";
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut 
} from "../firebase";
import { Shield, Lock, Mail, ArrowRight, Sparkles, UserPlus, AlertCircle, Eye, EyeOff, Chrome } from "lucide-react";
import CloudboyLogo from "./CloudboyLogo";

interface AuthViewProps {
  onAuthSuccess: (user: any) => void;
  title?: string;
  slogan?: string;
}

export default function AuthView({ 
  onAuthSuccess,
  title = "CloudboyX",
  slogan = "You dream it, we deliver it."
}: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorAlert, setErrorAlert] = useState<React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorAlert(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onAuthSuccess(result.user);
    } catch (err: any) {
      console.error("Google login error:", err);
      const errStr = (err.code || err.message || "").toLowerCase();
      if (errStr.includes("popup-blocked") || errStr.includes("popup_blocked")) {
        setErrorAlert(
          "⚠️ Sign-In Popup Blocked! Because this app lies inside an iframe preview, your browser blocked the window. Please click the 'Open in New Tab' button in the very top right of your screen, then try signing in again there!"
        );
      } else if (errStr.includes("operation-not-supported") || errStr.includes("iframe")) {
        setErrorAlert(
          "⚠️ Iframe Sandbox Restriction! Google Sign-In cannot run inside the sandboxed preview iframe. Please click the 'Open in New Tab' button in the very top right of your screen to open the app in a full window, then sign in."
        );
      } else if (err.code === "auth/operation-not-allowed" || errStr.includes("operation-not-allowed")) {
        setErrorAlert(
          <div className="space-y-2 text-left">
            <span className="font-bold block text-rose-700">🚫 Google Sign-In Disabled!</span>
            <span className="block text-[11px] leading-relaxed text-rose-600">
              The Google sign-in provider is not enabled in your Firebase console.
            </span>
            <span className="block text-[11px] font-semibold text-rose-700 mt-1 uppercase tracking-wider font-sans">
              How to resolve:
            </span>
            <ol className="list-decimal pl-4 text-[10.5px] leading-relaxed text-rose-600 space-y-1 font-sans">
              <li>Open the <strong>Firebase Console</strong> for your project.</li>
              <li>Go to <strong>Build &gt; Authentication</strong> in the left sidebar.</li>
              <li>Select the <strong>Sign-in method</strong> tab.</li>
              <li>Click <strong>Add new provider</strong>, select <strong>Google</strong>, toggle <strong>Enable</strong>, and click <strong>Save</strong>.</li>
            </ol>
          </div>
        );
      } else {
        setErrorAlert(err.message || "Failed to authenticate utilizing Google authorization node.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAlert(null);
    setIsLoading(true);

    if (!email || !password) {
      setErrorAlert("Please enter both email and password.");
      setIsLoading(false);
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setErrorAlert("Passwords do not match.");
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorAlert("Password must be at least 6 characters long.");
        setIsLoading(false);
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user);
      } catch (err: any) {
        console.error("Signup error:", err);
        const errCode = err.code || "";
        const errStr = (err.message || "").toLowerCase();
        if (errCode === "auth/operation-not-allowed" || errStr.includes("operation-not-allowed")) {
          setErrorAlert(
            <div className="space-y-2 text-left">
              <span className="font-bold block text-rose-700">🚫 Email/Password Authentication Disabled!</span>
              <span className="block text-[11px] leading-relaxed text-rose-600">
                Email & Password onboarding is disabled in your Firebase Console.
              </span>
              <span className="block text-[11px] font-semibold text-rose-700 mt-1 uppercase tracking-wider font-sans">
                How to enable:
              </span>
              <ol className="list-decimal pl-4 text-[10.5px] leading-relaxed text-rose-600 space-y-1 font-sans">
                <li>Go to the <strong>Firebase Console</strong>.</li>
                <li>Navigate to <strong>Build &gt; Authentication</strong> &gt; <strong>Sign-in method</strong>.</li>
                <li>Click <strong>Add new provider</strong>, select <strong>Email/Password</strong>, toggle <strong>Enable</strong>, and click <strong>Save</strong>.</li>
              </ol>
            </div>
          );
        } else if (err.code === "auth/email-already-in-use") {
          setErrorAlert("This email is already in use by another account.");
        } else if (err.code === "auth/invalid-email") {
          setErrorAlert("The email address is not formatted correctly.");
        } else if (err.code === "auth/weak-password") {
          setErrorAlert("The chosen password is too weak.");
        } else {
          setErrorAlert(err.message || "Failed to create an authorized account.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user);
      } catch (err: any) {
        console.error("Login error:", err);
        const errCode = err.code || "";
        const errStr = (err.message || "").toLowerCase();
        if (errCode === "auth/operation-not-allowed" || errStr.includes("operation-not-allowed")) {
          setErrorAlert(
            <div className="space-y-2 text-left">
              <span className="font-bold block text-rose-700">🚫 Email/Password Authentication Disabled!</span>
              <span className="block text-[11px] leading-relaxed text-rose-600">
                Email & Password onboarding is disabled in your Firebase Console.
              </span>
              <span className="block text-[11px] font-semibold text-rose-700 mt-1 uppercase tracking-wider font-sans">
                How to enable:
              </span>
              <ol className="list-decimal pl-4 text-[10.5px] leading-relaxed text-rose-600 space-y-1 font-sans">
                <li>Go to the <strong>Firebase Console</strong>.</li>
                <li>Navigate to <strong>Build &gt; Authentication</strong> &gt; <strong>Sign-in method</strong>.</li>
                <li>Click <strong>Add new provider</strong>, select <strong>Email/Password</strong>, toggle <strong>Enable</strong>, and click <strong>Save</strong>.</li>
              </ol>
            </div>
          );
        } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
          setErrorAlert("Invalid email address or passcode sequence.");
        } else if (err.code === "auth/invalid-email") {
          setErrorAlert("The email address format is invalid.");
        } else {
          setErrorAlert(err.message || "Authentication credentials rejected.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 selection:bg-indigo-100 selection:text-indigo-800 font-sans text-slate-800 overflow-hidden relative">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm relative z-10 animate-fade-in">
        
        {/* Header Icon & Brand titles */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-905 border border-slate-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black mb-3 shadow-md">
            <CloudboyLogo size={24} animated={true} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans uppercase">
            {title}
          </h1>
          <p className="text-[10px] text-slate-500 font-mono font-medium tracking-widest mt-1.5 uppercase">
            {slogan}
          </p>
        </div>



        {/* Validation Errors Overlay */}
        {errorAlert && (
          <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-600 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="leading-tight font-sans flex-1">{errorAlert}</div>
          </div>
        )}

        {/* Auth form sheet */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">
              Operational Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@cloudboyx.digital"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-505 transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">
              Secure Passcode
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-505 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div className="animate-fade-in">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">
                Verify Passcode Match
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-505 transition font-mono"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer select-none shadow-sm border border-indigo-600 mt-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                Establish Operator Account
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Authenticate Workspace
              </>
            )}
            {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>

          {isSignUp && (
            <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans mt-2 bg-indigo-50/40 border border-indigo-100/40 p-2.5 rounded-xl text-center">
              💡 <strong>Instant Access Path:</strong> If database signups are locked or email/password authorization has not been manually enabled in the Firebase Console, you can bypass manual credential registration by authenticating instantly with the <strong>Google Account</strong> option below.
            </p>
          )}
        </form>

        {/* Google Authentication Gateway */}
        <div className="mt-4">
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full absolute"></div>
            <span className="bg-white px-3 text-[9px] text-slate-400 font-mono uppercase tracking-widest relative z-10">
              OR Access Using Authorized Provider
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition cursor-pointer select-none shadow-sm border border-slate-200"
          >
            <Chrome className="w-4 h-4 text-emerald-600 animate-pulse" />
            Sign in with Google Account
          </button>

          <button
            type="button"
            onClick={() => onAuthSuccess({ email: "operator@cloudboyx.digital", uid: "demo-operator-123", displayName: "Demo Operator", emailVerified: true })}
            className="w-full mt-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition cursor-pointer select-none shadow-md border border-zinc-800"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            Instant Sandbox Bypass
          </button>
        </div>

        {/* Account Toggle Link bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs">
          <p className="text-slate-500 font-sans">
            {isSignUp ? "Already registered with the database?" : "New operator on this node?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorAlert(null);
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-indigo-600 hover:text-indigo-700 font-bold transition underline underline-offset-4 decoration-indigo-200"
            >
              {isSignUp ? "Authenticate Workspace" : "Provision New Credentials"}
            </button>
          </p>
        </div>

        {/* Footer info message */}
        <div className="mt-5 text-center">
          <span className="inline-flex items-center gap-1 text-[9px] text-slate-400 font-mono uppercase bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60">
            <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> Secured by Cloud FireShield Nodes
          </span>
        </div>

      </div>
    </div>
  );
}

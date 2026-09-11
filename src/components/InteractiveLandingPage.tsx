import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  Code2,
  Sparkles,
  ShieldCheck,
  Terminal,
  ArrowRight,
  Layers,
  Cpu,
  Github,
  CheckCircle2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  FolderGit2,
  Boxes,
  Zap,
} from "lucide-react";
import { CodeConverterLogo } from "./CodeConverterLogo";

interface InteractiveLandingPageProps {
  onEnterWorkspace: (userEmail?: string) => void;
}

export function InteractiveLandingPage({ onEnterWorkspace }: InteractiveLandingPageProps) {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Hardware capability & accessibility checks
  const [canTilt, setCanTilt] = useState(false);

  // Card reference for calculating center offset & spotlight
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for normalized cursor position [-0.5, 0.5]
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Motion values for spotlight pixel coordinates on the card
  const spotlightX = useMotionValue(200);
  const spotlightY = useMotionValue(200);

  // Smooth springs for fluid, physics-based tilt and parallax
  const springConfig = { stiffness: 120, damping: 18, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // 3D Card tilt: ±6 degrees maximum
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);

  // Background Parallax Blobs: shift opposite to cursor
  const blob1X = useTransform(smoothX, [-0.5, 0.5], [45, -45]);
  const blob1Y = useTransform(smoothY, [-0.5, 0.5], [35, -35]);

  const blob2X = useTransform(smoothX, [-0.5, 0.5], [-60, 60]);
  const blob2Y = useTransform(smoothY, [-0.5, 0.5], [-50, 50]);

  const blob3X = useTransform(smoothX, [-0.5, 0.5], [30, -30]);
  const blob3Y = useTransform(smoothY, [-0.5, 0.5], [-25, 25]);

  // Check hover & reduced motion media queries
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateCapabilities = () => {
      const isFinePointer = hoverQuery.matches;
      const prefersReduced = motionQuery.matches;
      setCanTilt(isFinePointer && !prefersReduced);
    };

    updateCapabilities();

    hoverQuery.addEventListener("change", updateCapabilities);
    motionQuery.addEventListener("change", updateCapabilities);

    return () => {
      hoverQuery.removeEventListener("change", updateCapabilities);
      motionQuery.removeEventListener("change", updateCapabilities);
    };
  }, []);

  // Global mouse move listener for parallax and tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canTilt) return;

    // Window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Normalized coordinates from -0.5 to 0.5
    const normX = e.clientX / width - 0.5;
    const normY = e.clientY / height - 0.5;

    mouseX.set(normX);
    mouseY.set(normY);

    // Update spotlight relative to card bounding box
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;
      spotlightX.set(relativeX);
      spotlightY.set(relativeY);
    }
  };

  const handleMouseLeave = () => {
    // Return smoothly to flat rest state
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAuthSuccess(true);
      setTimeout(() => {
        onEnterWorkspace(email || "developer@polyglot.ai");
      }, 500);
    }, 600);
  };

  const handleSocialAuth = (provider: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onEnterWorkspace(`${provider.toLowerCase()}-user@polyglot.ai`);
    }, 450);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen w-full bg-[#080A0F] text-zinc-100 flex flex-col justify-between overflow-x-hidden select-none font-sans"
      style={{ perspective: canTilt ? 1200 : undefined }}
    >
      {/* Dynamic Background Parallax Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Deep ambient glow 1: Cyan / Blue */}
        <motion.div
          style={{ x: canTilt ? blob1X : 0, y: canTilt ? blob1Y : 0 }}
          className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-cyan-600/12 blur-[130px]"
        />

        {/* Deep ambient glow 2: Indigo / Violet */}
        <motion.div
          style={{ x: canTilt ? blob2X : 0, y: canTilt ? blob2Y : 0 }}
          className="absolute top-1/3 -right-40 w-[650px] h-[650px] rounded-full bg-indigo-600/10 blur-[150px]"
        />

        {/* Deep ambient glow 3: Emerald accent */}
        <motion.div
          style={{ x: canTilt ? blob3X : 0, y: canTilt ? blob3Y : 0 }}
          className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[140px]"
        />

        {/* Subtle Tech Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#131826_1px,transparent_1px),linear-gradient(to_bottom,#131826_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_45%,#000_70%,transparent_100%)] opacity-35" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CodeConverterLogo size={36} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-mono">
                Code Translation IDE
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-semibold tracking-wider">
                v2.4 Pro
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Full-Stack Polyglot Migration & Build Engine
            </p>
          </div>
        </div>

        {/* Direct Access Action */}
        <button
          id="skip-to-ide-btn"
          onClick={() => onEnterWorkspace("guest@polyglot.ai")}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-[#141824] hover:bg-[#1C2234] border border-[#23293D] hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm active:scale-98"
        >
          <span>Launch Guest IDE</span>
          <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full max-w-5xl">
          {/* Left Column: Product Value Narrative */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121624] border border-[#242D45] text-xs text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-mono text-[11px]">Next-Gen Architectural Code Translation</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-[1.2]">
              Translate codebases into{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
                complete, buildable projects
              </span>
            </h1>

            <p className="text-zinc-400 text-sm leading-relaxed max-w-lg">
              Not just isolated syntax rewrites. Automatically detect project structures via
              strict configuration hierarchies, reconcile build scaffolds, and execute in an
              agentic self-repair sandbox.
            </p>

            {/* Capability Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#0F131F]/80 border border-[#1E2538] flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200">Strict Signal Detection</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    tsconfig, manifests & types
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0F131F]/80 border border-[#1E2538] flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200">Scaffold Reconciliation</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    package.json, tsconfig, go.mod
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0F131F]/80 border border-[#1E2538] flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 shrink-0">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200">Agentic Sandbox</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Multi-attempt error repair
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0F131F]/80 border border-[#1E2538] flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200">Instant Live Preview</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Embedded Vite / Web container
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo CTA */}
            <div className="pt-2 flex items-center gap-4">
              <button
                id="enter-workspace-hero-btn"
                onClick={() => onEnterWorkspace("developer@polyglot.ai")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer active:scale-95"
              >
                <span>Enter Workspace as Guest</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
              <span className="text-xs text-zinc-500 font-mono">No credit card required</span>
            </div>
          </div>

          {/* Right Column: 3D Tilting Auth Card with Spotlight */}
          <div className="lg:col-span-6 flex justify-center w-full">
            <motion.div
              ref={cardRef}
              style={{
                rotateX: canTilt ? rotateX : 0,
                rotateY: canTilt ? rotateY : 0,
                transformStyle: canTilt ? "preserve-3d" : undefined,
              }}
              className="relative w-full max-w-md rounded-2xl bg-[#0D101A]/90 border border-[#1F263C] p-7 shadow-2xl backdrop-blur-xl transition-shadow duration-300"
            >
              {/* Dynamic Cursor Spotlight Overlay */}
              {canTilt && (
                <motion.div
                  className="pointer-events-none absolute -inset-px rounded-2xl opacity-60 transition-opacity"
                  style={{
                    background: useTransform(
                      [spotlightX, spotlightY],
                      ([x, y]) =>
                        `radial-gradient(380px circle at ${x}px ${y}px, rgba(56, 189, 248, 0.14), transparent 70%)`
                    ),
                  }}
                />
              )}

              {/* Card Header */}
              <div className="relative z-10 flex flex-col items-center text-center mb-6">
                <CodeConverterLogo size={44} className="mb-3" />
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {authMode === "signin" ? "Welcome Back to Polyglot" : "Create Developer Account"}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Access your translation sessions, sandboxes & exported builds
                </p>

                {/* Tab Switcher */}
                <div className="mt-4 grid grid-cols-2 w-full p-1 rounded-xl bg-[#141827] border border-[#20273D]">
                  <button
                    id="auth-tab-signin"
                    type="button"
                    onClick={() => setAuthMode("signin")}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      authMode === "signin"
                        ? "bg-cyan-500 text-slate-950 shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    id="auth-tab-signup"
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      authMode === "signup"
                        ? "bg-cyan-500 text-slate-950 shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="relative z-10 grid grid-cols-2 gap-2.5 mb-4">
                <button
                  id="login-github-btn"
                  type="button"
                  onClick={() => handleSocialAuth("GitHub")}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#141827] hover:bg-[#1A2033] border border-[#22293F] hover:border-zinc-500 text-xs font-medium text-zinc-200 transition-all cursor-pointer active:scale-98"
                >
                  <Github className="w-3.5 h-3.5 text-white" />
                  <span>GitHub</span>
                </button>

                <button
                  id="login-google-btn"
                  type="button"
                  onClick={() => handleSocialAuth("Google")}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#141827] hover:bg-[#1A2033] border border-[#22293F] hover:border-zinc-500 text-xs font-medium text-zinc-200 transition-all cursor-pointer active:scale-98"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative z-10 flex items-center gap-3 my-4">
                <div className="h-px bg-[#1D2336] flex-1" />
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                  or email
                </span>
                <div className="h-px bg-[#1D2336] flex-1" />
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleSubmit} className="relative z-10 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#121625] border border-[#22293F] focus:border-cyan-500/80 rounded-lg text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-zinc-400">
                      Password
                    </label>
                    {authMode === "signin" && (
                      <a
                        href="#forgot"
                        onClick={(e) => {
                          e.preventDefault();
                          alert("A password reset link has been dispatched to your email address.");
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-password-input"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2 bg-[#121625] border border-[#22293F] focus:border-cyan-500/80 rounded-lg text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#2E3650] bg-[#141827] text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
                    />
                    <span>Remember this device</span>
                  </label>
                </div>

                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </span>
                  ) : authSuccess ? (
                    <span className="flex items-center gap-1.5 text-slate-950">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authenticated! Loading...</span>
                    </span>
                  ) : (
                    <span>{authMode === "signin" ? "Sign In to IDE" : "Create Account & Start"}</span>
                  )}
                </button>
              </form>

              {/* Direct Workspace Bypass Footer */}
              <div className="relative z-10 mt-5 pt-4 border-t border-[#1C2235] text-center">
                <button
                  id="direct-guest-entry-btn"
                  type="button"
                  onClick={() => onEnterWorkspace("guest@polyglot.ai")}
                  className="text-xs text-zinc-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <span>Or enter IDE directly as Guest</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 border-t border-[#141825]">
        <div>Enterprise Polyglot Engine • Automatic Language & Framework Architecture Reconciliation</div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono">
          <span>Supported: TypeScript • React • Next.js • Python • Go • Rust • Java</span>
        </div>
      </footer>
    </div>
  );
}

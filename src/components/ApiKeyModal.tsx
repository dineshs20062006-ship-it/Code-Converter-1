import React, { useState, useEffect } from "react";
import { Key, Check, X, Eye, EyeOff, ShieldCheck, ExternalLink, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  onSave,
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Sync with currently loaded key when opening
      const stored =
        (typeof window !== "undefined" &&
          (localStorage.getItem("gemini_api_key") ||
            localStorage.getItem("user_gemini_api_key"))) ||
        currentKey ||
        "";
      setInputValue(stored);
      setJustSaved(false);
    }
  }, [isOpen, currentKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (typeof window !== "undefined") {
      if (trimmed) {
        localStorage.setItem("gemini_api_key", trimmed);
        localStorage.setItem("user_gemini_api_key", trimmed);
      } else {
        localStorage.removeItem("gemini_api_key");
        localStorage.removeItem("user_gemini_api_key");
      }
    }
    onSave(trimmed);
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
      onClose();
    }, 900);
  };

  const handleClear = () => {
    setInputValue("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("gemini_api_key");
      localStorage.removeItem("user_gemini_api_key");
    }
    onSave("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#0F131E] border border-[#232B40] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden text-slate-200"
          role="dialog"
          aria-labelledby="api-key-modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2538] bg-[#121726]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h2 id="api-key-modal-title" className="text-sm font-semibold text-white">
                  Gemini API Key Configuration
                </h2>
                <p className="text-[11px] text-slate-400">
                  Provide your Google AI Studio API key for translation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="modal-gemini-key-input" className="block text-xs font-medium text-slate-300">
                API Key
              </label>
              <div className="relative flex items-center">
                <input
                  id="modal-gemini-key-input"
                  type={showPassword ? "text" : "password"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste your Gemini API key here..."
                  autoFocus
                  className="w-full bg-[#080B12] border border-[#263047] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-3 py-2.5 text-xs font-mono text-white placeholder-slate-500 outline-none pr-20"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {inputValue && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                      title={showPassword ? "Hide key" : "Show key"}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {inputValue && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      title="Clear key"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Storage Notice & Security Info */}
            <div className="p-3 rounded-lg bg-[#080B12] border border-[#1C2336] flex items-start gap-2.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <p className="text-slate-300 font-medium">Local Browser Persistence</p>
                <p>
                  Your key is saved directly to your browser's <code className="text-cyan-300 font-mono">localStorage</code> and transmitted securely over headers to run conversions with Gemini.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                <span>Get a Gemini API Key from Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#1E2538] bg-[#0C101B]">
            <div>
              {justSaved && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Key Saved Successfully</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-[#182033] border border-transparent transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="modal-save-api-key-btn"
                onClick={handleSave}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm cursor-pointer ${
                  justSaved
                    ? "bg-emerald-600 text-white"
                    : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                }`}
              >
                {justSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Save Key</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

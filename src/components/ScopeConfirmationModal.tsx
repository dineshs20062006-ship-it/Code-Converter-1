import React, { useState, useEffect } from "react";
import {
  Layers,
  Cpu,
  Boxes,
  CheckCircle2,
  Sparkles,
  Info,
  ArrowRight,
  X,
} from "lucide-react";
import { FolderClassification } from "../lib/folderClassify";

export type TranslationScope = "frontend" | "backend" | "fullstack";

interface ScopeConfirmationModalProps {
  isOpen: boolean;
  classification: FolderClassification | null;
  onConfirm: (scope: TranslationScope) => void;
  onClose: () => void;
}

export function ScopeConfirmationModal({
  isOpen,
  classification,
  onConfirm,
  onClose,
}: ScopeConfirmationModalProps) {
  if (!isOpen || !classification) return null;

  const { detected, frontendFileCount, backendFileCount, totalFiles, details } =
    classification;

  // Determine initial selection based on detection:
  // - If frontendFileCount === 0 -> pre-highlight "Backend Only"
  // - If backendFileCount === 0 -> pre-highlight "Frontend Only"
  // - If both counts > 0 -> none pre-selected, user must choose explicitly
  const initialChoice: TranslationScope | null =
    frontendFileCount === 0 && backendFileCount > 0
      ? "backend"
      : backendFileCount === 0 && frontendFileCount > 0
      ? "frontend"
      : null;

  const [selectedScope, setSelectedScope] =
    useState<TranslationScope | null>(initialChoice);

  // Sync state if classification prop updates
  useEffect(() => {
    setSelectedScope(
      frontendFileCount === 0 && backendFileCount > 0
        ? "backend"
        : backendFileCount === 0 && frontendFileCount > 0
        ? "frontend"
        : null
    );
  }, [frontendFileCount, backendFileCount]);

  const canSelectFrontend = frontendFileCount > 0;
  const canSelectBackend = backendFileCount > 0;
  const canSelectBoth = true;

  const isFrontendRecommended =
    backendFileCount === 0 && frontendFileCount > 0;
  const isBackendRecommended =
    frontendFileCount === 0 && backendFileCount > 0;
  const isFullstackRecommended =
    frontendFileCount > 0 && backendFileCount > 0;

  const handleConfirm = () => {
    if (!selectedScope) return;
    onConfirm(selectedScope);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0E1018] border border-[#262B3F] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#121522] border-b border-[#22273A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Confirm Translation Scope
              </h3>
              <p className="text-[11px] text-zinc-400">
                Verify the architecture layers to translate
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#1C2030] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Heuristic Diagnostic Summary */}
          <div className="p-3 rounded-lg bg-[#141726] border border-[#23293D] flex items-start gap-2.5 text-zinc-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-white">Analysis Result: </span>
              {details ||
                `Found ${frontendFileCount} frontend files and ${backendFileCount} backend files across ${totalFiles} project files.`}
            </div>
          </div>

          {/* Scope Options */}
          <div className="space-y-2.5">
            {/* Frontend Only */}
            <button
              type="button"
              disabled={!canSelectFrontend}
              onClick={() => setSelectedScope("frontend")}
              className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                !canSelectFrontend
                  ? "opacity-40 cursor-not-allowed bg-[#10121A] border-[#1C1F2B]"
                  : selectedScope === "frontend"
                  ? "bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500"
                  : "bg-[#131622] hover:bg-[#181C2B] border-[#22273A]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedScope === "frontend"
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-[#1A1F30] text-zinc-400"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">
                      Frontend Only
                    </span>
                    {isFrontendRecommended && (
                      <span className="px-1.5 py-0.2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] rounded font-medium">
                        Recommended
                      </span>
                    )}
                    {!canSelectFrontend && (
                      <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-500 text-[9px] rounded font-mono">
                        0 frontend files detected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Translate browser UI components, templates, and styling.
                  </p>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedScope === "frontend"
                      ? "border-cyan-400 bg-cyan-500 text-white"
                      : "border-zinc-600"
                  }`}
                >
                  {selectedScope === "frontend" && (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            </button>

            {/* Backend Only */}
            <button
              type="button"
              disabled={!canSelectBackend}
              onClick={() => setSelectedScope("backend")}
              className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                !canSelectBackend
                  ? "opacity-40 cursor-not-allowed bg-[#10121A] border-[#1C1F2B]"
                  : selectedScope === "backend"
                  ? "bg-indigo-950/40 border-indigo-500/80 shadow-[0_0_12px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500"
                  : "bg-[#131622] hover:bg-[#181C2B] border-[#22273A]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedScope === "backend"
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "bg-[#1A1F30] text-zinc-400"
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">
                      Backend Only
                    </span>
                    {isBackendRecommended && (
                      <span className="px-1.5 py-0.2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] rounded font-medium">
                        Recommended
                      </span>
                    )}
                    {!canSelectBackend && (
                      <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-500 text-[9px] rounded font-mono">
                        0 backend files detected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Translate server endpoints, business logic, algorithms, and DB models.
                  </p>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedScope === "backend"
                      ? "border-indigo-400 bg-indigo-500 text-white"
                      : "border-zinc-600"
                  }`}
                >
                  {selectedScope === "backend" && (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            </button>

            {/* Both (Fullstack) */}
            <button
              type="button"
              disabled={!canSelectBoth}
              onClick={() => setSelectedScope("fullstack")}
              className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                selectedScope === "fullstack"
                  ? "bg-emerald-950/40 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500"
                  : "bg-[#131622] hover:bg-[#181C2B] border-[#22273A]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedScope === "fullstack"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-[#1A1F30] text-zinc-400"
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">
                      Both (Fullstack)
                    </span>
                    {isFullstackRecommended && (
                      <span className="px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] rounded font-medium">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Translate both client UI frontend and backend server logic.
                  </p>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedScope === "fullstack"
                      ? "border-emerald-400 bg-emerald-500 text-white"
                      : "border-zinc-600"
                  }`}
                >
                  {selectedScope === "fullstack" && (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#121522] border-t border-[#22273A] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-[#1B1F2E] transition-colors font-medium text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedScope}
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <span>{selectedScope ? "Confirm & Proceed" : "Select a Scope to Proceed"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

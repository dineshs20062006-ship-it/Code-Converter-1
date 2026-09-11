import React from "react";
import { Terminal as TerminalIcon, Bug, Globe, Zap, Maximize2, Minimize2 } from "lucide-react";
import { DebugStep, TranslationResponse, ProjectFile } from "../types";
import { LivePreviewPane } from "./LivePreviewPane";

interface TerminalPanelProps {
  activeTab: "terminal" | "history" | "preview" | "config";
  onSelectTab: (tab: "terminal" | "history" | "preview" | "config") => void;
  terminalOutput: string;
  onClearTerminal: () => void;
  lastResponse: TranslationResponse | null;
  currentAttempt: number;
  maxAttempts: number;
  isPanelExpanded: boolean;
  onToggleExpand: () => void;
  onInspectAttemptCode: (code: string) => void;
  previewUrl: string | null;
  startCmd: string;
  targetLang: string;
  translatedFiles: ProjectFile[];
  previewKey: number;
  viewportMode: "full" | "tablet" | "mobile";
  onSetViewportMode: (mode: "full" | "tablet" | "mobile") => void;
  onRefreshPreview: () => void;
  backendHealth: any;
  isProjectMode?: boolean;
}

export function TerminalPanel({
  activeTab,
  onSelectTab,
  terminalOutput,
  onClearTerminal,
  lastResponse,
  currentAttempt,
  maxAttempts,
  isPanelExpanded,
  onToggleExpand,
  onInspectAttemptCode,
  previewUrl,
  startCmd,
  targetLang,
  translatedFiles,
  previewKey,
  viewportMode,
  onSetViewportMode,
  onRefreshPreview,
  backendHealth,
  isProjectMode = false,
}: TerminalPanelProps) {
  return (
    <div
      className={`border-t border-[#1C202F] bg-[#090A0F] flex flex-col shrink-0 ${
        isPanelExpanded ? "flex-1" : "h-64"
      } transition-all duration-200`}
    >
      {/* Tab Navigation */}
      <div className="h-9 border-b border-[#1C202F] flex items-center px-3 gap-3 bg-[#0E1018] shrink-0 select-none">
        <button
          id="tab-terminal-btn"
          onClick={() => onSelectTab("terminal")}
          className={`text-[10px] font-bold h-full flex items-center px-2 transition-colors cursor-pointer gap-1.5 ${
            activeTab === "terminal"
              ? "text-cyan-300 border-b-2 border-cyan-400"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <TerminalIcon className="w-3.5 h-3.5" />
          <span>TERMINAL</span>
        </button>

        <button
          id="tab-agent-history-btn"
          onClick={() => onSelectTab("history")}
          className={`text-[10px] font-bold h-full flex items-center px-2 transition-colors cursor-pointer gap-1.5 ${
            activeTab === "history"
              ? "text-cyan-300 border-b-2 border-cyan-400"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Bug className="w-3.5 h-3.5" />
          <span>AGENT LOGS</span>
          {lastResponse?.history && (
            <span className="text-[9px] bg-[#141724] text-zinc-300 border border-[#23283B] px-1.5 py-0.2 rounded font-mono">
              {lastResponse.history.length}
            </span>
          )}
        </button>

        {/* Live Preview Tab - Only rendered in Project Mode */}
        {isProjectMode && (
          <button
            id="tab-live-preview-btn"
            onClick={() => onSelectTab("preview")}
            className={`text-[10px] font-bold h-full flex items-center px-2 transition-colors cursor-pointer gap-1.5 ${
              activeTab === "preview"
                ? "text-emerald-300 border-b-2 border-emerald-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>PREVIEW</span>
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          </button>
        )}

        <button
          id="tab-sandbox-config-btn"
          onClick={() => onSelectTab("config")}
          className={`text-[10px] font-bold h-full flex items-center px-2 transition-colors cursor-pointer gap-1.5 ${
            activeTab === "config"
              ? "text-cyan-300 border-b-2 border-cyan-400"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>ENVIRONMENT</span>
        </button>

        <div className="ml-auto flex items-center gap-2.5">
          {currentAttempt > 0 && (
            <span className="text-[9px] font-mono text-[#888888] bg-[#1A1A1A] px-2 py-0.5 rounded border border-[#2D2D2D]">
              Attempt {currentAttempt}/{maxAttempts}
            </span>
          )}
          {lastResponse && (
            <span className="text-[9px] font-mono text-[#666666]">
              {lastResponse.total_duration}s
            </span>
          )}

          {/* Expand/Collapse */}
          <button
            onClick={onToggleExpand}
            title={isPanelExpanded ? "Collapse Panel" : "Expand Panel"}
            className="p-1 text-[#666666] hover:text-[#CCCCCC] rounded hover:bg-[#222222] transition-colors"
          >
            {isPanelExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClearTerminal}
            className="text-[10px] text-[#555555] hover:text-[#CCCCCC] px-1.5 py-0.5 rounded"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden bg-[#0A0A0A]">
        {activeTab === "terminal" && (
          <div className="p-3 font-mono text-xs overflow-auto h-full space-y-1">
            <pre className="whitespace-pre-wrap leading-relaxed text-[#CCCCCC]">
              {terminalOutput}
            </pre>
            <div className="flex items-center gap-2 pt-1 text-[11px]">
              <span className="text-emerald-500 font-mono">runner:~$</span>
              <span className="animate-pulse text-white font-bold">_</span>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="h-full flex flex-col font-sans p-3 overflow-auto">
            {!lastResponse || !lastResponse.history || lastResponse.history.length === 0 ? (
              <div className="text-[#555555] text-xs py-8 text-center">
                No loop execution history yet. Click "Translate & Run" to track self-repair attempts.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {lastResponse.history.map((step, idx) => {
                  const isSuccess = step.status === "success";
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded border flex flex-col justify-between ${
                        isSuccess
                          ? "bg-emerald-950/20 border-emerald-800/50"
                          : "bg-rose-950/20 border-rose-800/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-xs text-white">
                            Attempt #{step.attempt}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                              isSuccess
                                ? "bg-emerald-900/60 text-emerald-300"
                                : "bg-rose-900/60 text-rose-300"
                            }`}
                          >
                            {isSuccess ? "Passed" : "Error Caught"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#AAAAAA] mb-2">
                          {step.explanation || (isSuccess ? "Clean execution." : "Execution error detected.")}
                        </p>
                        {step.error && (
                          <div className="bg-[#141414] p-2 rounded text-[11px] text-rose-300 font-mono overflow-x-auto max-h-20 border border-rose-900/40">
                            {step.error}
                          </div>
                        )}
                        {step.stdout && (
                          <div className="bg-[#141414] p-2 rounded text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-20 border border-emerald-900/40 mt-1">
                            {step.stdout}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-[#2D2D2D] flex items-center justify-between text-[10px] text-[#666666]">
                        <span>Exec: {step.execution_time}s</span>
                        <button
                          onClick={() => onInspectAttemptCode(step.code)}
                          className="text-blue-400 hover:underline"
                        >
                          Inspect Code
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "preview" && (
          <LivePreviewPane
            previewUrl={previewUrl}
            startCmd={startCmd}
            targetLang={targetLang}
            translatedFiles={translatedFiles}
            previewKey={previewKey}
            viewportMode={viewportMode}
            onSetViewportMode={onSetViewportMode}
            onRefresh={onRefreshPreview}
          />
        )}

        {activeTab === "config" && (
          <div className="p-3 font-sans text-xs overflow-auto h-full space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#141414] p-3 rounded border border-[#2D2D2D]">
                <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1">
                  <Zap className="w-4 h-4" />
                  <span>AI Engine</span>
                </div>
                <p className="text-[#888888] text-[11px]">
                  Model: <span className="text-[#CCCCCC] font-mono">{backendHealth?.model || "gemini-3.6-flash"}</span>
                </p>
                <p className="text-[#888888] text-[11px] mt-0.5">
                  Directives: <span className="text-blue-300">Multi-File Project & Preview Readiness</span>
                </p>
              </div>

              <div className="bg-[#141414] p-3 rounded border border-[#2D2D2D]">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                  <Globe className="w-4 h-4" />
                  <span>Container Runtime</span>
                </div>
                <p className="text-[#888888] text-[11px]">
                  Server Status: <span className="text-emerald-300 font-mono">Active (Port 3000)</span>
                </p>
                <p className="text-[#888888] text-[11px] mt-0.5">
                  Live Viewport & Sandbox Execution
                </p>
              </div>

              <div className="bg-[#141414] p-3 rounded border border-[#2D2D2D]">
                <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                  <Bug className="w-4 h-4" />
                  <span>Agentic Debug Loop</span>
                </div>
                <p className="text-[#888888] text-[11px]">
                  Max Attempts: <span className="text-[#CCCCCC]">{maxAttempts} loops</span>
                </p>
                <p className="text-[#888888] text-[11px] mt-0.5">
                  Automated compilation, diagnostics & self-repair
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

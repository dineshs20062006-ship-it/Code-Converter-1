import React, { useState } from "react";
import { Sparkles, Cpu, Layers, RefreshCw, CheckCircle2, ChevronRight, Edit3, X } from "lucide-react";
import { ProjectAnalysis } from "../types";

interface ProjectAnalysisBannerProps {
  analysis: ProjectAnalysis | null;
  isAnalyzing: boolean;
  onReanalyze: () => void;
  onUpdateAnalysis?: (updated: ProjectAnalysis) => void;
}

export function ProjectAnalysisBanner({
  analysis,
  isAnalyzing,
  onReanalyze,
  onUpdateAnalysis,
}: ProjectAnalysisBannerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFrontend, setEditFrontend] = useState(analysis?.sourceFrontend || "");
  const [editBackend, setEditBackend] = useState(analysis?.sourceBackend || "");

  const handleSaveEdit = () => {
    if (analysis && onUpdateAnalysis) {
      onUpdateAnalysis({
        ...analysis,
        sourceFrontend: editFrontend || analysis.sourceFrontend,
        sourceBackend: editBackend || analysis.sourceBackend,
      });
    }
    setIsEditing(false);
  };

  if (isAnalyzing) {
    return (
      <div className="bg-[#121316] border-b border-[#252830] px-4 py-2.5 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-400 flex items-center gap-2">
              <span>Stack Analyzer Agent running...</span>
              <span className="text-[10px] text-neutral-400 font-mono">inspecting manifests & configs</span>
            </div>
            <div className="text-[11px] text-neutral-500">Detecting source frontend, backend framework, and entry points...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="bg-[#0F1115] border-b border-[#22252C] px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-all text-xs select-none">
      <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
        {/* Banner Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-semibold text-[11px] tracking-wide uppercase">Project Analysis</span>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[#171920] border border-[#2D313E] rounded px-2 py-1">
              <span className="text-[10px] text-neutral-400">Frontend:</span>
              <input
                type="text"
                value={editFrontend}
                onChange={(e) => setEditFrontend(e.target.value)}
                className="bg-transparent text-neutral-200 text-xs focus:outline-none w-36"
                placeholder="e.g. React (Vite)"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-[#171920] border border-[#2D313E] rounded px-2 py-1">
              <span className="text-[10px] text-neutral-400">Backend:</span>
              <input
                type="text"
                value={editBackend}
                onChange={(e) => setEditBackend(e.target.value)}
                className="bg-transparent text-neutral-200 text-xs focus:outline-none w-36"
                placeholder="e.g. Python (FastAPI)"
              />
            </div>
            <button
              onClick={handleSaveEdit}
              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Detected Frontend */}
            <div className="flex items-center gap-1.5 bg-[#161820] border border-[#272B38] px-2.5 py-1 rounded text-neutral-300">
              <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="text-[10px] text-neutral-400">Source Frontend:</span>
              <span className="font-semibold text-cyan-300 text-[11px]">{analysis.sourceFrontend}</span>
            </div>

            {/* Detected Backend */}
            <div className="flex items-center gap-1.5 bg-[#161820] border border-[#272B38] px-2.5 py-1 rounded text-neutral-300">
              <Cpu className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-[10px] text-neutral-400">Source Backend:</span>
              <span className="font-semibold text-emerald-300 text-[11px]">{analysis.sourceBackend}</span>
            </div>

            {/* Language Overview & Detection Rule */}
            {analysis.languageOverview && (
              <div className="hidden sm:flex items-center gap-1 bg-[#14151B] border border-[#242732] px-2 py-1 rounded text-neutral-300 font-mono text-[10px]">
                <span className="text-zinc-500">Language:</span>
                <span className="text-cyan-300 font-medium truncate max-w-[280px]" title={analysis.languageOverview}>
                  {analysis.languageOverview}
                </span>
              </div>
            )}

            {/* Entry Point */}
            {analysis.detectedEntryPoint && (
              <div className="hidden lg:flex items-center gap-1 bg-[#14151B] border border-[#242732] px-2 py-1 rounded text-neutral-400 font-mono text-[10px]">
                <span className="text-neutral-500">Entry:</span>
                <span className="text-neutral-300">{analysis.detectedEntryPoint}</span>
              </div>
            )}

            {/* Key Dependencies */}
            {analysis.keyDependencies && analysis.keyDependencies.length > 0 && (
              <div className="hidden xl:flex items-center gap-1">
                {analysis.keyDependencies.slice(0, 3).map((dep, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded bg-[#1B1D25] text-neutral-400 text-[10px] border border-[#2A2D3A]"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {!isEditing && (
          <button
            onClick={() => {
              setEditFrontend(analysis.sourceFrontend);
              setEditBackend(analysis.sourceBackend);
              setIsEditing(true);
            }}
            title="Edit Detected Stack"
            className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-[#1C1F28] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onReanalyze}
          title="Re-run Stack Analyzer"
          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 bg-[#161820] hover:bg-[#1F222C] border border-[#282B36] px-2 py-1 rounded transition-colors"
        >
          <RefreshCw className="w-3 h-3 text-blue-400" />
          <span>Re-analyze</span>
        </button>
      </div>
    </div>
  );
}

import React, { useMemo } from "react";
import {
  FolderTree,
  Copy,
  Check,
  FileCode,
  Layers,
  ChevronRight,
  Download,
} from "lucide-react";
import { ProjectFile } from "../types";
import { buildFileTree } from "../lib/treeUtils";
import { DirectoryTree } from "./DirectoryTree";

interface OutputExplorerProps {
  files: ProjectFile[];
  selectedPath: string;
  onSelectFile: (path: string) => void;
  onCopyAll: () => void;
  hasCopied: boolean;
  showTreeSidebar: boolean;
  onToggleTreeSidebar: () => void;
  isProjectMode?: boolean;
  onDownloadZip?: () => void;
}

export function OutputExplorer({
  files,
  selectedPath,
  onSelectFile,
  onCopyAll,
  hasCopied,
  showTreeSidebar,
  onToggleTreeSidebar,
  isProjectMode = false,
  onDownloadZip,
}: OutputExplorerProps) {
  const treeNodes = useMemo(() => {
    return buildFileTree(files || []);
  }, [files]);

  // Breadcrumb segments for selected file
  const breadcrumbs = useMemo(() => {
    if (!selectedPath) return [];
    return selectedPath.split("/").filter(Boolean);
  }, [selectedPath]);

  if (!files || files.length === 0) return null;

  return (
    <div className="h-8 bg-[#0E1018] border-b border-[#1C202F] flex items-center justify-between px-3 overflow-x-auto shrink-0 select-none">
      {/* Left: Tree toggle (only in project mode) and Breadcrumbs / Tabs */}
      <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar">
        {isProjectMode ? (
          <>
            {/* Toggle Output Tree Sidebar Button */}
            <button
              id="toggle-output-tree-btn"
              onClick={onToggleTreeSidebar}
              title={showTreeSidebar ? "Hide Output File Tree" : "Show Output File Tree"}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                showTreeSidebar
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                  : "text-zinc-400 hover:text-white hover:bg-[#141724]"
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[10px]">Tree ({files.length})</span>
            </button>

            <span className="text-[#252B3E] shrink-0">|</span>

            {/* Breadcrumbs for active file in project */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 truncate shrink-0 px-1">
              {breadcrumbs.map((segment, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />}
                  <span
                    className={
                      idx === breadcrumbs.length - 1
                        ? "text-emerald-300 font-medium"
                        : "text-zinc-400"
                    }
                  >
                    {segment}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span className="text-zinc-300 font-medium">Translated Snippet</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 text-[10px]">{selectedPath || "snippet.ts"}</span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2">
        {onDownloadZip && (
          <button
            id="download-zip-btn"
            onClick={onDownloadZip}
            title="Download translated output as a ZIP archive"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 hover:border-emerald-500/70 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>Download ZIP</span>
          </button>
        )}

        <button
          id="copy-translated-code-btn"
          onClick={onCopyAll}
          title="Copy active translated code"
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] text-zinc-300 hover:text-white hover:bg-[#1A1F30] border border-transparent hover:border-[#23283B] transition-all cursor-pointer"
        >
          {hasCopied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-zinc-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface OutputTreeSidebarProps {
  files: ProjectFile[];
  selectedPath: string;
  onSelectFile: (path: string) => void;
}

export function OutputTreeSidebar({
  files,
  selectedPath,
  onSelectFile,
}: OutputTreeSidebarProps) {
  const treeNodes = useMemo(() => {
    return buildFileTree(files || []);
  }, [files]);

  return (
    <div className="w-56 bg-[#121212] border-r border-[#262626] flex flex-col h-full shrink-0 select-none">
      <div className="h-7 px-2.5 border-b border-[#222222] flex items-center justify-between bg-[#161616] shrink-0">
        <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider font-mono">
          Generated Files
        </span>
        <span className="text-[9px] text-emerald-400 font-mono">({files.length})</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto p-1.5 font-mono text-xs">
        <DirectoryTree
          nodes={treeNodes}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
          themeColor="emerald"
          allowActions={false}
        />
      </div>
    </div>
  );
}

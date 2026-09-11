import React, { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  Trash2,
  Plus,
  Copy,
  Check,
} from "lucide-react";
import {
  TreeNode,
  getParentPaths,
  computeNodeCheckState,
  CheckState,
} from "../lib/treeUtils";

interface TreeCheckboxProps {
  state: CheckState;
  onChange: () => void;
  title?: string;
}

function TreeCheckbox({ state, onChange, title }: TreeCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = state === "indeterminate";
    }
  }, [state]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={state === "checked"}
      title={title || "Toggle include in translation"}
      onChange={(e) => {
        e.stopPropagation();
        onChange();
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-3.5 h-3.5 rounded border-[#383E54] bg-[#141724] text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-500 shrink-0"
    />
  );
}

interface DirectoryTreeProps {
  nodes: TreeNode[];
  selectedPath: string;
  onSelectFile: (path: string) => void;
  onDeleteFile?: (path: string) => void;
  onAddFileToFolder?: (folderPath: string) => void;
  themeColor?: "blue" | "emerald";
  allowActions?: boolean;
  checkedFilePaths?: Set<string>;
  onToggleNodeCheck?: (node: TreeNode) => void;
}

export function DirectoryTree({
  nodes,
  selectedPath,
  onSelectFile,
  onDeleteFile,
  onAddFileToFolder,
  themeColor = "blue",
  allowActions = true,
  checkedFilePaths,
  onToggleNodeCheck,
}: DirectoryTreeProps) {
  // Set of expanded folder paths
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Auto-expand all folders on load or when selected file changes
  useEffect(() => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      // Auto expand parents of selected file
      const parents = getParentPaths(selectedPath);
      parents.forEach((p) => next.add(p));
      
      // Auto expand top-level folders initially if set is empty
      if (prev.size === 0) {
        function expandAll(nList: TreeNode[]) {
          for (const n of nList) {
            if (n.isFolder) {
              next.add(n.path);
              if (n.children) expandAll(n.children);
            }
          }
        }
        expandAll(nodes);
      }
      return next;
    });
  }, [selectedPath, nodes]);

  const toggleFolder = (folderPath: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    function traverse(list: TreeNode[]) {
      for (const item of list) {
        if (item.isFolder) {
          all.add(item.path);
          if (item.children) traverse(item.children);
        }
      }
    }
    traverse(nodes);
    setExpandedFolders(all);
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    switch (ext) {
      case ".py":
        return <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      case ".js":
      case ".jsx":
      case ".mjs":
        return <FileCode className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
      case ".ts":
      case ".tsx":
        return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case ".html":
      case ".htm":
        return <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
      case ".css":
        return <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case ".json":
        return <FileJson className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case ".md":
      case ".txt":
        return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
      case ".sh":
        return <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-[#888888] shrink-0" />;
    }
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    if (node.isFolder) {
      const isExpanded = expandedFolders.has(node.path);
      const checkState: CheckState | null = checkedFilePaths
        ? computeNodeCheckState(node, checkedFilePaths)
        : null;

      return (
        <div key={node.path} className="select-none min-w-full w-max">
          <div
            onClick={(e) => toggleFolder(node.path, e)}
            style={{ paddingLeft: `${depth * 12 + 6}px` }}
            className="group flex items-center justify-between py-1 pr-3 rounded hover:bg-[#1A1A1A] cursor-pointer text-[#BBBBBB] hover:text-[#FFFFFF] transition-colors min-w-full w-max whitespace-nowrap"
          >
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {/* Expand / Collapse Chevron */}
              <button
                type="button"
                onClick={(e) => toggleFolder(node.path, e)}
                className="p-0.5 text-[#777777] group-hover:text-[#CCCCCC] hover:bg-[#2A2A2A] rounded transition-colors shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[#999999]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#999999]" />
                )}
              </button>

              {/* Cascading Tree Checkbox for Folders */}
              {checkState !== null && onToggleNodeCheck && (
                <TreeCheckbox
                  state={checkState}
                  onChange={() => onToggleNodeCheck(node)}
                  title={`Include or exclude folder '${node.name}'`}
                />
              )}

              {/* Folder Icon */}
              {isExpanded ? (
                <FolderOpen
                  className={`w-3.5 h-3.5 shrink-0 ${
                    themeColor === "emerald" ? "text-emerald-400" : "text-amber-400"
                  }`}
                />
              ) : (
                <Folder
                  className={`w-3.5 h-3.5 shrink-0 ${
                    themeColor === "emerald" ? "text-emerald-500" : "text-amber-500"
                  }`}
                />
              )}

              <span className="text-[11px] font-medium text-[#D0D0D0] whitespace-nowrap">
                {node.name}
              </span>
              {node.fileCount !== undefined && (
                <span className="text-[9px] text-[#666666] font-mono whitespace-nowrap shrink-0">
                  ({node.fileCount})
                </span>
              )}
            </div>

            {allowActions && onAddFileToFolder && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFileToFolder(node.path);
                }}
                title={`Add file inside ${node.name}`}
                className="opacity-0 group-hover:opacity-100 ml-2 p-0.5 text-[#777777] hover:text-white rounded hover:bg-[#262626] transition-opacity shrink-0"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Children nodes if expanded - depth handles clean 12px indentation */}
          {isExpanded && node.children && (
            <div className="flex flex-col min-w-full w-max">
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // File Node
    const isSelected = node.path === selectedPath;
    const checkState: CheckState | null = checkedFilePaths
      ? computeNodeCheckState(node, checkedFilePaths)
      : null;

    const highlightClasses =
      themeColor === "emerald"
        ? isSelected
          ? "bg-emerald-950/40 text-emerald-300 font-medium border-l-2 border-emerald-500"
          : "text-[#AAAAAA] hover:text-[#EEEEEE] hover:bg-[#1A1A1A]"
        : isSelected
        ? "bg-blue-950/40 text-blue-300 font-medium border-l-2 border-blue-500"
        : "text-[#AAAAAA] hover:text-[#EEEEEE] hover:bg-[#1A1A1A]";

    return (
      <div
        key={node.path}
        onClick={() => onSelectFile(node.path)}
        style={{ paddingLeft: `${depth * 12 + 10}px` }}
        className={`group flex items-center justify-between py-1 pr-3 rounded cursor-pointer transition-colors min-w-full w-max whitespace-nowrap ${highlightClasses}`}
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {/* Cascading Tree Checkbox for Files */}
          {checkState !== null && onToggleNodeCheck && (
            <TreeCheckbox
              state={checkState}
              onChange={() => onToggleNodeCheck(node)}
              title={`Include or exclude file '${node.name}'`}
            />
          )}

          {getFileIcon(node.name)}
          <span className="text-[11px] font-mono whitespace-nowrap text-zinc-300 group-hover:text-white">
            {node.name}
          </span>
          {node.isScaffold ? (
            <span
              className="text-[9px] px-1 py-0.2 rounded bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 font-mono tracking-tight shrink-0"
              title="Auto-generated project scaffold file"
            >
              scaffold
            </span>
          ) : /\.(java|py|go|rs|php|rb|cs)$/i.test(node.name) || node.name === "requirements.txt" || /(server|backend|controller|service|api|route)/i.test(node.path) ? (
            <span
              className="text-[9px] px-1 py-0.2 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 font-mono tracking-tight shrink-0"
              title="Backend logic or service file"
            >
              backend
            </span>
          ) : /\.(tsx|jsx|html|vue|svelte|css)$/i.test(node.name) || /(client|frontend|components|views)/i.test(node.path) ? (
            <span
              className="text-[9px] px-1 py-0.2 rounded bg-indigo-950/70 text-indigo-400 border border-indigo-800/60 font-mono tracking-tight shrink-0"
              title="Frontend presentation file"
            >
              frontend
            </span>
          ) : null}
        </div>

        {allowActions && onDeleteFile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(node.path);
            }}
            title="Delete file"
            className="opacity-0 group-hover:opacity-100 ml-3 p-0.5 text-[#666666] hover:text-rose-400 rounded transition-opacity shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  if (nodes.length === 0) {
    return (
      <div className="p-4 text-center text-[#555555] text-[11px]">
        No files in directory.
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-0.5 min-w-full w-max">
      {nodes.map((node) => renderNode(node, 0))}
    </div>
  );
}

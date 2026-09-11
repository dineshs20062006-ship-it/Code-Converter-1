import React, { useRef, useMemo, useState } from "react";
import {
  FolderOpen,
  Plus,
  Upload,
  Search,
  ChevronsDownUp,
  ChevronsUpDown,
  FolderTree,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import { ProjectFile } from "../types";
import {
  buildFileTree,
  flattenRedundantPathWrappers,
  TreeNode,
  toggleNodeCheck,
  CheckState,
} from "../lib/treeUtils";
import { DirectoryTree } from "./DirectoryTree";

interface FileTreeProps {
  files: ProjectFile[];
  selectedPath: string;
  onSelectFile: (path: string) => void;
  onUploadFolder: (uploadedFiles: ProjectFile[]) => void;
  onAddFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  checkedFilePaths?: Set<string>;
  onToggleNodeCheck?: (node: TreeNode) => void;
  onToggleAllCheck?: (includeAll: boolean) => void;
  className?: string;
}

export function FileTree({
  files,
  selectedPath,
  onSelectFile,
  onUploadFolder,
  onAddFile,
  onDeleteFile,
  checkedFilePaths,
  onToggleNodeCheck,
  onToggleAllCheck,
  className,
}: FileTreeProps) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter((f) => f.path.toLowerCase().includes(q));
  }, [files, searchQuery]);

  const treeNodes = useMemo(() => {
    return buildFileTree(filteredFiles);
  }, [filteredFiles]);

  const checkedCount = useMemo(() => {
    if (!checkedFilePaths) return files.length;
    return files.filter((f) => checkedFilePaths.has(f.path)).length;
  }, [files, checkedFilePaths]);

  const allCheckedState: CheckState = useMemo(() => {
    if (!checkedFilePaths || files.length === 0) return "checked";
    if (checkedCount === files.length) return "checked";
    if (checkedCount === 0) return "unchecked";
    return "indeterminate";
  }, [checkedCount, files.length, checkedFilePaths]);

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const loadedFiles: ProjectFile[] = [];
    const textExtensions = [
      ".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".json",
      ".txt", ".md", ".sh", ".rb", ".go", ".rs", ".cpp", ".c", ".h",
      ".java", ".yaml", ".yml", ".toml", ".env", ".sql", ".xml", ".svg"
    ];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Relative path from webkitRelativePath
      const relPath = file.webkitRelativePath || file.name;
      // Skip node_modules, .git, and binary files
      if (
        relPath.includes("node_modules/") ||
        relPath.includes(".git/") ||
        relPath.includes("__pycache__/") ||
        relPath.includes(".DS_Store")
      ) {
        continue;
      }

      const lowerName = file.name.toLowerCase();
      const isText =
        textExtensions.some((ext) => lowerName.endsWith(ext)) || file.type.startsWith("text/");

      if (isText) {
        try {
          const text = await file.text();
          loadedFiles.push({ path: relPath, content: text });
        } catch (err) {
          console.warn(`Could not read text for file ${relPath}:`, err);
        }
      }
    }

    if (loadedFiles.length > 0) {
      const flattened = flattenRedundantPathWrappers(loadedFiles);
      onUploadFolder(flattened);
    }

    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  };

  const handlePromptAddFile = (folderPrefix?: string) => {
    const defaultVal = folderPrefix ? `${folderPrefix}/` : "";
    const fileName = prompt(
      "Enter new file path (e.g. 'src/utils/math.py' or 'components/Header.tsx'):",
      defaultVal
    );
    if (fileName && fileName.trim()) {
      onAddFile(fileName.trim());
    }
  };

  return (
    <div className={`bg-[#0D0F17] flex flex-col h-full select-none ${className || "w-64 border-r border-[#1C202F] shrink-0"}`}>
      {/* Header */}
      <div className="h-9 px-3 border-b border-[#1C202F] flex items-center justify-between bg-[#0E1018] shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderTree className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wider truncate">
            Source Tree
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">({files.length})</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Hidden folder input */}
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-ignore
            webkitdirectory="true"
            directory=""
            className="hidden"
            onChange={handleFolderUpload}
          />

          <button
            id="add-file-btn"
            onClick={() => handlePromptAddFile()}
            title="Add File"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1A1F30] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Files to include selection header */}
      {files.length > 0 && onToggleAllCheck && (
        <div className="px-3 py-1.5 border-b border-[#1C202F] bg-[#10131D] flex items-center justify-between text-[10px] text-zinc-300 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allCheckedState === "checked"}
              ref={(el) => {
                if (el) el.indeterminate = allCheckedState === "indeterminate";
              }}
              onChange={() => {
                onToggleAllCheck(allCheckedState !== "checked");
              }}
              className="w-3.5 h-3.5 rounded border-[#383E54] bg-[#141724] text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-500 shrink-0"
            />
            <span className="font-semibold text-zinc-300">Files to include</span>
          </label>
          <span className="font-mono text-[10px] text-zinc-400">
            {checkedCount}/{files.length}
          </span>
        </div>
      )}

      {/* Optional Search / Filter bar for large projects */}
      {files.length > 4 && (
        <div className="px-2 py-1.5 border-b border-[#1C202F] bg-[#0A0C13] shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#121522] border border-[#202538] text-xs">
            <Search className="w-3 h-3 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter files..."
              className="bg-transparent text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none w-full font-mono"
            />
          </div>
        </div>
      )}

      {/* Recursive Collapsible Directory Tree with Horizontal & Vertical Scrolling */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-1.5 font-mono text-xs">
        {files.length === 0 ? (
          <div className="p-4 text-center text-zinc-500 text-[11px]">
            <p>No project files loaded.</p>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="mt-2 text-cyan-400 hover:underline text-[11px] cursor-pointer"
            >
              Load Folder
            </button>
          </div>
        ) : (
          <DirectoryTree
            nodes={treeNodes}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
            onDeleteFile={files.length > 1 ? onDeleteFile : undefined}
            onAddFileToFolder={(folderPath) => handlePromptAddFile(folderPath)}
            themeColor="blue"
            allowActions={true}
            checkedFilePaths={checkedFilePaths}
            onToggleNodeCheck={onToggleNodeCheck}
          />
        )}
      </div>

      {/* Bottom Load Project Action Banner */}
      <div className="p-2 border-t border-[#1C202F] bg-[#0A0C13] shrink-0">
        <button
          onClick={() => folderInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#141724] hover:bg-[#1A1F30] text-zinc-300 hover:text-white rounded border border-[#23283B] text-[11px] font-sans transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Upload className="w-3 h-3 text-cyan-400" />
          <span>Load Folder</span>
        </button>
      </div>
    </div>
  );
}

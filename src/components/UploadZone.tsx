import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FolderTree,
  FileCode,
  Sparkles,
  ArrowRight,
  Code2,
} from "lucide-react";
import { ProjectFile } from "../types";
import { flattenRedundantPathWrappers } from "../lib/treeUtils";
import { PRESET_PROJECTS } from "../data/presets";

interface UploadZoneProps {
  onFilesLoaded: (files: ProjectFile[], isSingleSnippet?: boolean) => void;
  onSelectPreset: (presetIndex: number) => void;
}

export function UploadZone({
  onFilesLoaded,
  onSelectPreset,
}: UploadZoneProps) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNotice, setDragNotice] = useState<string | null>(null);

  const textExtensions = [
    ".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".json",
    ".txt", ".md", ".sh", ".rb", ".go", ".rs", ".cpp", ".c", ".h",
    ".java", ".yaml", ".yml", ".toml", ".env", ".sql", ".xml", ".svg"
  ];

  const processFileList = async (fileList: FileList) => {
    const loadedFiles: ProjectFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = file.webkitRelativePath || file.name;

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
        textExtensions.some((ext) => lowerName.endsWith(ext)) ||
        file.type.startsWith("text/");

      if (isText) {
        try {
          const text = await file.text();
          loadedFiles.push({ path: relPath, content: text });
        } catch (err) {
          console.warn(`Could not read ${relPath}:`, err);
        }
      }
    }

    if (loadedFiles.length > 0) {
      const flattened = flattenRedundantPathWrappers(loadedFiles);
      onFilesLoaded(flattened, loadedFiles.length === 1 && !fileList[0].webkitRelativePath);
    }
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFileList(e.target.files);
    }
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFileList(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const loaded: ProjectFile[] = [];

      const readEntry = async (entry: any, currentPath: string = "") => {
        if (entry.isFile) {
          const file: File = await new Promise((resolve) => entry.file(resolve));
          const lowerName = file.name.toLowerCase();
          const isText =
            textExtensions.some((ext) => lowerName.endsWith(ext)) ||
            file.type.startsWith("text/");
          if (isText) {
            try {
              const text = await file.text();
              const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
              loaded.push({ path: fullPath, content: text });
            } catch (err) {
              console.warn("Read error:", err);
            }
          }
        } else if (entry.isDirectory) {
          if (
            entry.name === "node_modules" ||
            entry.name === ".git" ||
            entry.name === "__pycache__"
          ) {
            return;
          }
          const dirReader = entry.createReader();
          const entries: any[] = await new Promise((resolve) => {
            dirReader.readEntries(resolve);
          });
          const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
          for (const child of entries) {
            await readEntry(child, nextPath);
          }
        }
      };

      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
        if (entry) {
          await readEntry(entry);
        }
      }

      if (loaded.length > 0) {
        const flattened = flattenRedundantPathWrappers(loaded);
        onFilesLoaded(flattened, loaded.length === 1);
        return;
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileList(e.dataTransfer.files);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#090A0F] text-zinc-300 select-none overflow-y-auto">
      {/* Hidden file & folder inputs */}
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-ignore
        webkitdirectory="true"
        directory=""
        className="hidden"
        onChange={handleFolderChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="w-full max-w-2xl flex flex-col items-center text-center space-y-6">
        {/* Main Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => folderInputRef.current?.click()}
          className={`w-full p-8 md:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 shadow-xl ${
            isDragging
              ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_24px_rgba(6,182,212,0.2)] scale-[1.01]"
              : "border-[#23283B] hover:border-cyan-500/60 bg-[#0E1018] hover:bg-[#121522]"
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-white">
              Drag & drop your code or project folder here
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Supports full multi-file directory structures (Python, React, Java, Go, Rust, C++) or individual code files
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                folderInputRef.current?.click();
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Upload Project Folder</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-3.5 py-2 bg-[#171B2A] hover:bg-[#20253A] text-zinc-200 text-xs font-medium rounded-lg border border-[#272D43] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select File(s)</span>
            </button>
          </div>
        </div>

        {/* Preset Sample Projects */}
        <div className="w-full space-y-2.5">
          <div className="flex items-center gap-2 justify-center text-zinc-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Or test with a sample multi-file project:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
            {PRESET_PROJECTS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPreset(idx)}
                className="p-3 rounded-lg bg-[#0E1018] hover:bg-[#141724] border border-[#202538] hover:border-[#2F3650] text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {preset.name}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase bg-[#141724] px-1.5 py-0.2 rounded border border-[#202538]">
                    {preset.sourceLang}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

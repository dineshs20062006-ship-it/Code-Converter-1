"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Editor from "@monaco-editor/react";
import {
  Play,
  RotateCcw,
  Sparkles,
  Key,
  FolderTree,
  FileCode2,
  Copy,
  Check,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Layers,
  Cpu,
  RefreshCw,
  UploadCloud,
  PanelLeft,
  PanelLeftClose,
  Image as ImageIcon,
  X,
  ChevronRight,
  User,
  LogIn,
  Wrench,
} from "lucide-react";

import {
  ProjectFile,
  ProjectAnalysis,
  ReferenceImagePayload,
  TranslationResponse,
} from "../../src/types";

import {
  SUPPORTED_LANGUAGES,
  TARGET_FRONTEND_OPTIONS,
  TARGET_BACKEND_OPTIONS,
  PRESET_PROJECTS,
} from "../../src/data/presets";

import {
  detectLanguageFromExtension,
  detectPrimaryLanguage,
  getMonacoLanguage,
} from "../../src/lib/languages";

import { downloadFilesAsZip } from "../../src/lib/zipUtils";
import { classifyFolder, FolderClassification } from "../../src/lib/folderClassify";
import { TreeNode, toggleNodeCheck } from "../../src/lib/treeUtils";

import { CodeConverterLogo } from "../../src/components/CodeConverterLogo";
import { FileTree } from "../../src/components/FileTree";
import { OutputExplorer, OutputTreeSidebar } from "../../src/components/OutputExplorer";
import { TargetConfigPanel } from "../../src/components/TargetConfigPanel";
import { FrontendPreviewConfig } from "../../src/components/FrontendPreviewConfig";
import { ProjectAnalysisBanner } from "../../src/components/ProjectAnalysisBanner";
import { TerminalPanel } from "../../src/components/TerminalPanel";
import { UploadZone } from "../../src/components/UploadZone";
import { ApiKeyModal } from "../../src/components/ApiKeyModal";
import { ScopeConfirmationModal, TranslationScope } from "../../src/components/ScopeConfirmationModal";
import { InteractiveLandingPage } from "../../src/components/InteractiveLandingPage";

export default function CodeConverterApp() {
  // Mode: Snippet Mode vs Project Mode
  const [isProjectMode, setIsProjectMode] = useState<boolean>(true);

  // View State: "ide" or "landing"
  const [currentView, setCurrentView] = useState<"ide" | "landing">("ide");
  const [userEmail, setUserEmail] = useState<string>("");

  // Files State
  const [sourceFiles, setSourceFiles] = useState<ProjectFile[]>([]);
  const [selectedSourcePath, setSelectedSourcePath] = useState<string>("");
  const [checkedFilePaths, setCheckedFilePaths] = useState<Set<string>>(new Set());

  // Snippet Mode State
  const [snippetCode, setSnippetCode] = useState<string>(
    `# Polyglot Source Code Snippet\ndef calculate_fibonacci(n: int) -> list[int]:\n    \"\"\"Return the first n Fibonacci numbers with algorithmic optimization.\"\"\"\n    if n <= 0:\n        return []\n    if n == 1:\n        return [0]\n    fibs = [0, 1]\n    while len(fibs) < n:\n        fibs.append(fibs[-1] + fibs[-2])\n    return fibs\n\nif __name__ == '__main__':\n    series = calculate_fibonacci(10)\n    print(f'Computed Fibonacci series: {series}')`
  );

  // Output Files State
  const [translatedFiles, setTranslatedFiles] = useState<ProjectFile[]>([]);
  const [selectedOutputPath, setSelectedOutputPath] = useState<string>("");
  const [showOutputTree, setShowOutputTree] = useState<boolean>(true);

  // Languages & Architecture Frameworks
  const [sourceLang, setSourceLang] = useState<string>("python");
  const [targetLang, setTargetLang] = useState<string>("typescript");
  const [targetFrontend, setTargetFrontend] = useState<string>("React 18 + Tailwind CSS (Vite)");
  const [targetBackend, setTargetBackend] = useState<string>("None (Pure Client-Side / Static Web)");

  // Advanced Options & Multimodal
  const [conversionInstructions, setConversionInstructions] = useState<string>("");
  const [previewDescription, setPreviewDescription] = useState<string>("");
  const [referenceImage, setReferenceImage] = useState<ReferenceImagePayload | null>(null);
  const [maxAttempts, setMaxAttempts] = useState<number>(3);
  const [showGuidanceDrawer, setShowGuidanceDrawer] = useState<boolean>(false);

  // Workspace Layout & Resizing State (VS Code Style)
  const [sidebarWidth, setSidebarWidth] = useState<number>(260);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const isResizingSidebar = useRef<boolean>(false);

  const [editorSplit, setEditorSplit] = useState<number>(50);
  const isResizingEditor = useRef<boolean>(false);
  const workspaceContainerRef = useRef<HTMLDivElement>(null);

  // Project Stack Analysis
  const [projectAnalysis, setProjectAnalysis] = useState<ProjectAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Translation & Execution Runtime
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [terminalOutput, setTerminalOutput] = useState<string>(
    "Code Converter Runtime v4.2 initialized.\nContainer listening on port 3000.\nReady to parse multi-file project or single code snippets."
  );
  const [activeTab, setActiveTab] = useState<"terminal" | "history" | "preview" | "config">("terminal");
  const [lastResponse, setLastResponse] = useState<TranslationResponse | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState<number>(1);
  const [viewportMode, setViewportMode] = useState<"full" | "tablet" | "mobile">("full");
  const [hasCopiedOutput, setHasCopiedOutput] = useState<boolean>(false);

  // Modals & Settings
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState<boolean>(false);
  const [userApiKey, setUserApiKey] = useState<string>("");
  const [backendHealth, setBackendHealth] = useState<any>(null);

  // Scope confirmation modal
  const [scopeModalOpen, setScopeModalOpen] = useState<boolean>(false);
  const [pendingClassification, setPendingClassification] = useState<FolderClassification | null>(null);
  const [pendingFiles, setPendingFiles] = useState<ProjectFile[]>([]);
  const hasInitialLoadedRef = useRef<boolean>(false);

  // Sidebar drag resizer
  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSidebar.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingSidebar.current) return;
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(180, Math.min(480, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizingSidebar.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Editor dual-split drag resizer
  const handleEditorResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingEditor.current = true;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingEditor.current || !workspaceContainerRef.current) return;
      const rect = workspaceContainerRef.current.getBoundingClientRect();
      const relativeX = moveEvent.clientX - rect.left;
      const percent = Math.max(20, Math.min(80, (relativeX / rect.width) * 100));
      setEditorSplit(percent);
    };

    const onMouseUp = () => {
      isResizingEditor.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Load API key from local storage and verify server health
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey =
        localStorage.getItem("gemini_api_key") ||
        localStorage.getItem("user_gemini_api_key") ||
        "";
      if (storedKey) setUserApiKey(storedKey);
    }

    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setBackendHealth(data))
      .catch((err) => console.warn("Backend health check:", err));
  }, []);

  // Initialize with the first Preset on first visit if no files are loaded
  useEffect(() => {
    if (!hasInitialLoadedRef.current && sourceFiles.length === 0 && PRESET_PROJECTS.length > 0) {
      hasInitialLoadedRef.current = true;
      loadPreset(0);
    }
  }, []);

  // Automatically select the active source file content
  const activeSourceContent = useMemo(() => {
    if (!isProjectMode) return snippetCode;
    const file = sourceFiles.find((f) => f.path === selectedSourcePath);
    return file ? file.content : "";
  }, [isProjectMode, snippetCode, sourceFiles, selectedSourcePath]);

  // Automatically select the active output file content
  const activeOutputContent = useMemo(() => {
    if (translatedFiles.length === 0) return "";
    const file = translatedFiles.find((f) => f.path === selectedOutputPath);
    return file ? file.content : translatedFiles[0]?.content || "";
  }, [translatedFiles, selectedOutputPath]);

  // Load preset project
  const loadPreset = (index: number) => {
    hasInitialLoadedRef.current = true;
    const preset = PRESET_PROJECTS[index];
    if (!preset) return;

    setIsProjectMode(true);
    setSourceFiles(preset.files);
    setSelectedSourcePath(preset.files[0]?.path || "");
    setCheckedFilePaths(new Set(preset.files.map((f) => f.path)));
    setSourceLang(preset.sourceLang || "python");

    if (preset.defaultTargetFrontend) {
      setTargetFrontend(preset.defaultTargetFrontend);
    }
    if (preset.defaultTargetBackend) {
      setTargetBackend(preset.defaultTargetBackend);
    }

    // Reset translation output
    setTranslatedFiles([]);
    setSelectedOutputPath("");
    setLastResponse(null);

    // Trigger stack analysis for the new preset files
    analyzeProjectFiles(preset.files);
  };

  // Run Tech Stack Analysis
  const analyzeProjectFiles = async (files: ProjectFile[]) => {
    if (!files || files.length === 0) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/analyze-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": userApiKey,
        },
        body: JSON.stringify({ files }),
      });

      const data = await res.json();
      if (data.analysis) {
        setProjectAnalysis(data.analysis);
      }
    } catch (err: any) {
      console.warn("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Files Upload
  const handleFilesLoaded = (loaded: ProjectFile[], isSingleSnippet: boolean = false) => {
    hasInitialLoadedRef.current = true;
    if (isSingleSnippet && loaded.length === 1) {
      setIsProjectMode(false);
      setSnippetCode(loaded[0].content);
      const detected = detectLanguageFromExtension(loaded[0].path);
      setSourceLang(detected);
      setTranslatedFiles([]);
      return;
    }

    // Automatically detect primary language from project files and set as initial default
    const detectedLang = detectPrimaryLanguage(loaded);
    setSourceLang(detectedLang);

    // Classify Folder into frontend/backend/fullstack
    const classification = classifyFolder(loaded);
    setPendingClassification(classification);
    setPendingFiles(loaded);
    setScopeModalOpen(true);
  };

  // Confirm Scope from Modal
  const handleConfirmScope = (scope: TranslationScope) => {
    setScopeModalOpen(false);
    setIsProjectMode(true);
    setSourceFiles(pendingFiles);
    setSelectedSourcePath(pendingFiles[0]?.path || "");
    setCheckedFilePaths(new Set(pendingFiles.map((f) => f.path)));

    // Auto-select initial target frameworks based on detected classification
    if (scope === "frontend") {
      setTargetFrontend("React 18 + Tailwind CSS (Vite)");
      setTargetBackend("None (Pure Client-Side / Static Web)");
    } else if (scope === "backend") {
      setTargetFrontend("None (CLI / Pure Console / Backend)");
      setTargetBackend("Python (FastAPI + Pydantic)");
    } else {
      setTargetFrontend("React 18 + Tailwind CSS (Vite)");
      setTargetBackend("Node.js (Express.js)");
    }

    analyzeProjectFiles(pendingFiles);
  };

  // Add a new file to the source tree
  const handleAddFile = (filePath: string) => {
    if (!filePath.trim()) return;
    const cleanPath = filePath.trim();
    if (sourceFiles.some((f) => f.path === cleanPath)) {
      alert(`File "${cleanPath}" already exists.`);
      return;
    }

    const newFiles = [...sourceFiles, { path: cleanPath, content: "" }];
    setSourceFiles(newFiles);
    setSelectedSourcePath(cleanPath);
    setCheckedFilePaths((prev) => new Set([...prev, cleanPath]));
  };

  // Delete a file from the source tree
  const handleDeleteFile = (filePath: string) => {
    const updated = sourceFiles.filter((f) => f.path !== filePath);
    setSourceFiles(updated);
    if (selectedSourcePath === filePath) {
      setSelectedSourcePath(updated[0]?.path || "");
    }
    setCheckedFilePaths((prev) => {
      const next = new Set(prev);
      next.delete(filePath);
      return next;
    });
  };

  // Update content of the active source file
  const handleSourceCodeChange = (newVal: string | undefined) => {
    const text = newVal ?? "";
    if (!isProjectMode) {
      setSnippetCode(text);
      return;
    }
    setSourceFiles((prev) =>
      prev.map((f) => (f.path === selectedSourcePath ? { ...f, content: text } : f))
    );
  };

  // Main Action: Convert & Run
  const handleTranslateAndRun = async () => {
    if (isTranslating) return;

    // Determine files to include
    let filesToSend: ProjectFile[] = [];
    if (isProjectMode) {
      // Ensure the complete file tree is packaged:
      const backendExtRegex = /\.(java|py|go|rs|cs|cpp|c|rb|php|kt|swift|scala)$/i;
      const hasBackendInSource = sourceFiles.some(
        (f) =>
          backendExtRegex.test(f.path) ||
          f.path.includes("backend/") ||
          f.path.includes("server/") ||
          f.path.includes("controller") ||
          f.path.includes("src/main/java")
      );

      const filtered = sourceFiles.filter(
        (f) => checkedFilePaths.size === 0 || checkedFilePaths.has(f.path)
      );

      const hasBackendInFiltered = filtered.some(
        (f) =>
          backendExtRegex.test(f.path) ||
          f.path.includes("backend/") ||
          f.path.includes("server/") ||
          f.path.includes("controller") ||
          f.path.includes("src/main/java")
      );

      // If source project had backend files but the filtered selection missed them, include all source files
      if (hasBackendInSource && !hasBackendInFiltered) {
        filesToSend = [...sourceFiles];
      } else {
        filesToSend = filtered.length > 0 ? filtered : [...sourceFiles];
      }

      if (filesToSend.length === 0) {
        alert("Please select at least one source file to convert.");
        return;
      }
    } else {
      if (!snippetCode.trim()) {
        alert("Please enter code snippet to convert.");
        return;
      }
      filesToSend = [
        {
          path: `snippet.${sourceLang === "python" ? "py" : sourceLang === "javascript" ? "js" : "txt"}`,
          content: snippetCode,
        },
      ];
    }

    setIsTranslating(true);
    setCurrentAttempt(1);
    setTerminalOutput(
      `[Pipeline Initiated] Translating ${isProjectMode ? `${filesToSend.length} project files` : "code snippet"}...\n` +
      `Source: ${sourceLang} -> Target: ${targetLang} (${targetFrontend} / ${targetBackend})\n` +
      `Analyzing dependencies, compiling AST, and binding server port 0.0.0.0:3000...`
    );

    try {
      const res = await fetch("/api/translate-and-run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": userApiKey,
        },
        body: JSON.stringify({
          files: filesToSend,
          source_code: !isProjectMode ? snippetCode : undefined,
          source_language: sourceLang,
          source_frontend: projectAnalysis?.sourceFrontend,
          source_backend: projectAnalysis?.sourceBackend,
          target_language: targetLang,
          target_frontend: targetFrontend,
          target_backend: targetBackend,
          conversion_instructions: conversionInstructions,
          preview_description: previewDescription,
          reference_image: referenceImage,
          max_attempts: maxAttempts,
          is_project_mode: isProjectMode,
          file_manifest: {
            total_files: filesToSend.length,
            backend_files: filesToSend
              .filter(
                (f) =>
                  /\.(java|py|go|rs|cs|cpp|c|rb|php|kt|swift|scala)$/i.test(f.path) ||
                  f.path.includes("backend/") ||
                  f.path.includes("server/") ||
                  f.path.includes("controller") ||
                  f.path.includes("src/main/java")
              )
              .map((f) => f.path),
            frontend_files: filesToSend
              .filter(
                (f) =>
                  /\.(jsx?|tsx?|html|css|vue|svelte)$/i.test(f.path) ||
                  f.path.includes("frontend/") ||
                  f.path.includes("client/")
              )
              .map((f) => f.path),
          },
        }),
      });

      const data: TranslationResponse & { error?: string; detail?: string } = await res.json();

      if (!res.ok || data.error) {
        setTerminalOutput(
          (prev) =>
            `${prev}\n\n[ERROR]: ${data.error || "Translation request failed."}\n${data.detail || ""}`
        );
        if (data.error?.includes("API Key")) {
          setApiKeyModalOpen(true);
        }
        return;
      }

      setLastResponse(data);
      setCurrentAttempt(data.attempts_used || 1);

      if (data.translated_files && data.translated_files.length > 0) {
        setTranslatedFiles(data.translated_files);
        setSelectedOutputPath(data.translated_files[0]?.path || "");
      }

      setTerminalOutput(data.terminal_output || "Translation and runtime execution completed.");

      // Switch automatically to live preview or terminal
      if (isProjectMode && targetFrontend !== "None (CLI / Pure Console / Backend)") {
        setActiveTab("preview");
        setPreviewKey((k) => k + 1);
      } else {
        setActiveTab("terminal");
      }
    } catch (err: any) {
      setTerminalOutput((prev) => `${prev}\n\n[Network Error]: ${err.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  // Reset Session & New Upload
  const handleNewUpload = async () => {
    if (sourceFiles.length > 0 || translatedFiles.length > 0) {
      if (
        !confirm(
          "Start a new upload? This will clear all uploaded files, selections, translated output, and close running sandboxes."
        )
      ) {
        return;
      }
    }

    try {
      fetch("/api/reset-session", { method: "POST" }).catch(() => {});
      fetch("/api/sandbox/teardown", { method: "POST" }).catch(() => {});
    } catch (err) {
      console.warn("Reset error:", err);
    }

    // Clear ALL client state: uploaded files, classification, selections, output, preview
    setSourceFiles([]);
    setSelectedSourcePath("");
    setCheckedFilePaths(new Set());
    setPendingFiles([]);
    setPendingClassification(null);
    setProjectAnalysis(null);
    setTranslatedFiles([]);
    setSelectedOutputPath("");
    setLastResponse(null);
    setPreviewDescription("");
    setReferenceImage(null);
    setConversionInstructions("");
    setShowGuidanceDrawer(false);
    setTerminalOutput("Session reset cleanly. Upload project files or drop a folder to begin.");
    setActiveTab("terminal");
    setIsProjectMode(true);
  };

  // Download converted files as ZIP
  const handleDownloadZip = () => {
    if (translatedFiles.length === 0) return;
    downloadFilesAsZip(translatedFiles, targetLang);
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (!activeOutputContent) return;
    navigator.clipboard.writeText(activeOutputContent);
    setHasCopiedOutput(true);
    setTimeout(() => setHasCopiedOutput(false), 2000);
  };

  // Monaco languages
  const sourceMonacoLang = useMemo(() => {
    if (!isProjectMode) {
      const match = SUPPORTED_LANGUAGES.find((l) => l.id === sourceLang);
      return match ? match.monacoLang : "python";
    }
    return getMonacoLanguage(selectedSourcePath, sourceLang);
  }, [isProjectMode, selectedSourcePath, sourceLang]);

  const outputMonacoLang = useMemo(() => {
    return getMonacoLanguage(selectedOutputPath, targetLang);
  }, [selectedOutputPath, targetLang]);

  if (currentView === "landing") {
    return (
      <InteractiveLandingPage
        onEnterWorkspace={(email) => {
          if (email) {
            setUserEmail(email);
            try {
              localStorage.setItem("polyglot_user_email", email);
            } catch {}
          }
          setCurrentView("ide");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090E] text-white select-none overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP APPLICATION NAVIGATION BAR                                          */}
      {/* ========================================================================= */}
      <header className="h-11 bg-[#090B10] border-b border-[#1A1E2B] px-3 flex items-center justify-between shrink-0 z-30 gap-2">
        {/* Left: Sidebar Toggle, Logo & Workspace Mode Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isProjectMode && sourceFiles.length > 0 && (
            <button
              id="toggle-sidebar-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand Explorer" : "Collapse Explorer"}
              className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
                !sidebarCollapsed
                  ? "bg-[#141724] border-[#252B3E] text-cyan-400 hover:text-white"
                  : "bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-[#121522]"
              }`}
            >
              {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )}

          <div className="flex items-center gap-2">
            <CodeConverterLogo size={22} />
            <span className="font-semibold text-xs sm:text-sm tracking-tight text-white">
              Code Converter
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hidden sm:inline">
              v4.2
            </span>
          </div>

          {/* Mode Switcher: Project vs Snippet */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#121522] border border-[#23283B]">
            <button
              id="switch-project-mode-btn"
              onClick={() => setIsProjectMode(true)}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                isProjectMode ? "bg-cyan-500 text-black font-semibold shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              <FolderTree className="w-3 h-3" />
              <span>Project</span>
            </button>
            <button
              id="switch-snippet-mode-btn"
              onClick={() => setIsProjectMode(false)}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                !isProjectMode ? "bg-cyan-500 text-black font-semibold shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              <FileCode2 className="w-3 h-3" />
              <span>Snippet</span>
            </button>
          </div>
        </div>

        {/* Right: Actions, Presets, Keys, and Convert & Run */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Presets selector dropdown */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#121522] border border-[#23283B] rounded-md px-2 py-1 text-xs">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="text-zinc-400 text-[10px] font-mono uppercase">Preset:</span>
            <select
              id="quick-preset-select"
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                if (!isNaN(idx)) loadPreset(idx);
              }}
              className="bg-transparent text-amber-300 font-medium focus:outline-none cursor-pointer text-xs max-w-[150px] truncate"
              defaultValue=""
            >
              <option value="" disabled className="bg-[#121522] text-zinc-400">Load sample project...</option>
              {PRESET_PROJECTS.map((p, idx) => (
                <option key={idx} value={idx} className="bg-[#121522] text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Download ZIP Button */}
          {translatedFiles.length > 0 && (
            <button
              id="top-download-zip-btn"
              onClick={handleDownloadZip}
              title="Download translated files as ZIP"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">ZIP</span>
            </button>
          )}

          {/* Portal Switcher */}
          <button
            id="view-landing-btn"
            onClick={() => setCurrentView("landing")}
            title="Open interactive login & landing portal"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141724] hover:bg-[#1C2033] border border-[#252B3E] hover:border-cyan-500/40 text-zinc-300 hover:text-white text-xs font-medium transition-all cursor-pointer active:scale-95"
          >
            {userEmail ? (
              <>
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline max-w-[80px] truncate">{userEmail.split("@")[0]}</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Portal</span>
              </>
            )}
          </button>

          {/* New Upload Button */}
          <button
            id="new-upload-btn"
            onClick={handleNewUpload}
            title="Start a new upload (resets current workspace & sandboxes)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141724] hover:bg-[#1C2033] border border-[#252B3E] hover:border-cyan-500/40 text-zinc-300 hover:text-white text-xs font-medium transition-all cursor-pointer active:scale-95"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">New Upload</span>
          </button>

          {/* API Key Button */}
          <button
            id="open-api-key-modal-btn"
            onClick={() => setApiKeyModalOpen(true)}
            title="Configure Gemini API Key"
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              userApiKey
                ? "bg-emerald-950/30 border-emerald-600/30 text-emerald-400 hover:bg-emerald-900/40"
                : "bg-amber-950/30 border-amber-600/30 text-amber-300 hover:bg-amber-900/40"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{userApiKey ? "Key Active" : "Set Key"}</span>
          </button>

          {/* PRIMARY ACTION: Convert & Run */}
          <button
            id="translate-and-run-btn"
            disabled={isTranslating}
            onClick={handleTranslateAndRun}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold text-xs transition-all shadow-[0_0_12px_rgba(6,182,212,0.35)] active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isTranslating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Converting...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Convert & Run</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. TARGET ARCHITECTURE & CONVERSION CONTROL RIBBON (ALL OPTIONS VISIBLE)  */}
      {/* ========================================================================= */}
      <div className="bg-[#0C0F17] border-b border-[#1E2333] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 z-20 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {/* Translation Language Pair */}
          <div className="flex items-center gap-1.5 bg-[#141724] border border-[#252B3E] rounded-md px-2.5 py-1 text-xs shadow-sm">
            <span className="text-zinc-400 text-[10px] uppercase font-mono tracking-wider font-semibold">From:</span>
            <select
              id="source-language-select"
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs pr-1"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-[#141724] text-white">
                  {lang.name}
                </option>
              ))}
            </select>

            <span className="text-cyan-400 font-mono text-xs px-0.5">→</span>

            <span className="text-zinc-400 text-[10px] uppercase font-mono tracking-wider font-semibold">To:</span>
            <select
              id="target-language-select"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer text-xs pr-1"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-[#141724] text-white">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Frontend Selector (Always visible!) */}
          <div className="flex items-center gap-1.5 bg-[#141724] border border-indigo-500/30 hover:border-indigo-500/50 rounded-md px-2.5 py-1 text-xs shadow-sm transition-colors">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-indigo-300 text-[10px] uppercase font-mono tracking-wider font-semibold whitespace-nowrap">
              Frontend:
            </span>
            <select
              id="target-frontend-select"
              value={targetFrontend}
              onChange={(e) => setTargetFrontend(e.target.value)}
              className="bg-transparent text-indigo-200 font-medium focus:outline-none cursor-pointer text-xs max-w-[190px] truncate"
            >
              {TARGET_FRONTEND_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.name} className="bg-[#141724] text-white">
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Backend Selector (PROMINENT, ALWAYS VISIBLE, BOLD ACCENT!) */}
          <div className="flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-500/40 hover:border-emerald-500/70 rounded-md px-2.5 py-1 text-xs shadow-sm transition-colors ring-1 ring-emerald-500/20">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-300 text-[10px] uppercase font-mono tracking-wider font-bold whitespace-nowrap">
              Backend:
            </span>
            <select
              id="target-backend-select"
              value={targetBackend}
              onChange={(e) => setTargetBackend(e.target.value)}
              className="bg-transparent text-emerald-200 font-semibold focus:outline-none cursor-pointer text-xs max-w-[200px] truncate"
            >
              {TARGET_BACKEND_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.name} className="bg-[#141724] text-white">
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* UI Guidance Trigger Button */}
          {targetFrontend !== "None (CLI / Pure Console / Backend)" && (
            <button
              id="toggle-ui-guidance-btn"
              onClick={() => setShowGuidanceDrawer(!showGuidanceDrawer)}
              title="Attach mockup screenshot or describe frontend UI guidance"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                previewDescription || referenceImage || showGuidanceDrawer
                  ? "bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-sm"
                  : "bg-[#141724] border-[#252B3E] text-zinc-300 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>UI Guidance</span>
              {(previewDescription || referenceImage) && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>
          )}

          {/* Self-Repair Loop setting */}
          <div className="hidden sm:flex items-center gap-1 bg-[#141724] border border-[#252B3E] rounded-md px-2 py-1 text-xs">
            <Wrench className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-400 text-[10px] font-mono">Repair Loops:</span>
            <select
              id="max-attempts-select"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="bg-transparent text-cyan-300 font-mono font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value={1} className="bg-[#141724] text-white">1 (Fast)</option>
              <option value={2} className="bg-[#141724] text-white">2</option>
              <option value={3} className="bg-[#141724] text-white">3 (Recommended)</option>
              <option value={4} className="bg-[#141724] text-white">4</option>
              <option value={5} className="bg-[#141724] text-white">5 (Deep Fix)</option>
            </select>
          </div>
        </div>

        {/* Right: Architecture Summary Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border bg-[#141724] border-[#252B3E] text-zinc-300">
            {targetFrontend !== "None (CLI / Pure Console / Backend)" && targetBackend !== "None (Pure Client-Side / Static Web)"
              ? "⚡ Full-Stack 1:1 Architecture"
              : targetBackend !== "None (Pure Client-Side / Static Web)"
              ? "⚡ Backend Microservice"
              : "⚡ Client-Side Web"}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UI GUIDANCE DRAWER: Optional text prompt & reference mockup image         */}
      {/* ========================================================================= */}
      {showGuidanceDrawer && targetFrontend !== "None (CLI / Pure Console / Backend)" && (
        <div className="bg-[#0D101A] border-b border-[#1C202F] px-4 py-2.5 flex flex-col md:flex-row items-stretch md:items-center gap-4 text-xs shrink-0 z-20 shadow-lg">
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Frontend UI Guidance & Layout Prompt (optional)</span>
              </label>
              <button
                onClick={() => setShowGuidanceDrawer(false)}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={previewDescription}
              onChange={(e) => setPreviewDescription(e.target.value)}
              placeholder="Describe what you want the preview to look like or behave like (e.g. Dark dashboard with responsive sidebar)..."
              className="w-full bg-[#121522] border border-[#23283B] focus:border-cyan-500/50 rounded px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          {/* Reference Image Upload */}
          <div className="flex items-center gap-2 shrink-0">
            {referenceImage ? (
              <div className="flex items-center gap-2 bg-[#121522] border border-cyan-500/40 rounded px-2 py-1">
                <img
                  src={`data:${referenceImage.mimeType};base64,${referenceImage.base64}`}
                  alt="Reference"
                  className="w-6 h-6 object-cover rounded"
                />
                <span className="text-[11px] text-cyan-300 max-w-[120px] truncate">
                  {referenceImage.name}
                </span>
                <button
                  onClick={() => setReferenceImage(null)}
                  className="text-zinc-400 hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#121522] hover:bg-[#1A1F30] border border-[#23283B] hover:border-zinc-500 text-zinc-300 text-xs cursor-pointer transition-colors">
                <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span>Attach Mockup Image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const res = reader.result as string;
                        const base64 = res.split(",")[1];
                        setReferenceImage({
                          name: file.name,
                          mimeType: file.type,
                          base64,
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN WORKSPACE: VS CODE-STYLE RESIZABLE SIDEBAR + DUAL EDITORS             */}
      {/* ========================================================================= */}
      <main className="flex-1 flex overflow-hidden relative" ref={workspaceContainerRef}>
        {/* VS Code Left Sidebar (Explorer: Files to include) */}
        {isProjectMode && sourceFiles.length > 0 && (
          <div
            style={{ width: sidebarCollapsed ? "48px" : `${sidebarWidth}px` }}
            className="h-full flex flex-row shrink-0 relative select-none bg-[#0D0F17]"
          >
            {sidebarCollapsed ? (
              <div className="w-12 bg-[#0A0C13] border-r border-[#1C202F] flex flex-col items-center py-3 gap-3">
                <button
                  id="expand-sidebar-rail-btn"
                  onClick={() => setSidebarCollapsed(false)}
                  title="Expand File Tree Explorer"
                  className="p-2 rounded text-zinc-400 hover:text-white hover:bg-[#1A1F30] cursor-pointer"
                >
                  <FolderTree className="w-5 h-5 text-cyan-400" />
                </button>
                <span className="text-[10px] font-mono text-zinc-500 [writing-mode:vertical-lr] rotate-180">
                  {sourceFiles.length} FILES
                </span>
              </div>
            ) : (
              <div className="flex-1 h-full overflow-hidden flex flex-col">
                <FileTree
                  className="w-full h-full border-r border-[#1C202F]"
                  files={sourceFiles}
                  selectedPath={selectedSourcePath}
                  onSelectFile={setSelectedSourcePath}
                  onUploadFolder={(loaded) => handleFilesLoaded(loaded, false)}
                  onAddFile={handleAddFile}
                  onDeleteFile={handleDeleteFile}
                  checkedFilePaths={checkedFilePaths}
                  onToggleNodeCheck={(node: TreeNode) => {
                    setCheckedFilePaths((prev) => toggleNodeCheck(node, prev));
                  }}
                  onToggleAllCheck={(includeAll: boolean) => {
                    if (includeAll) {
                      setCheckedFilePaths(new Set(sourceFiles.map((f) => f.path)));
                    } else {
                      setCheckedFilePaths(new Set());
                    }
                  }}
                />
              </div>
            )}

            {/* Resizer Handle for Sidebar */}
            {!sidebarCollapsed && (
              <div
                onMouseDown={handleSidebarResizeStart}
                title="Drag to resize file tree"
                className="w-1 hover:w-1.5 cursor-col-resize bg-transparent hover:bg-cyan-500/50 absolute top-0 right-0 bottom-0 z-20 transition-all"
              />
            )}
          </div>
        )}

        {/* Main Dual Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isProjectMode && sourceFiles.length === 0 ? (
            <UploadZone onFilesLoaded={handleFilesLoaded} onSelectPreset={loadPreset} />
          ) : (
            <div className="flex-1 flex overflow-hidden relative">
              {/* Left Editor: Original Source */}
              <div
                style={{ width: isProjectMode ? `${editorSplit}%` : "50%" }}
                className="h-full flex flex-col overflow-hidden border-r border-[#1C202F] bg-[#0A0D14]"
              >
                {/* File Header Bar */}
                <div className="h-8 bg-[#0E1018] border-b border-[#1C202F] px-3 flex items-center justify-between text-xs text-zinc-400 shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[11px] font-mono text-cyan-400 truncate">
                      {isProjectMode ? selectedSourcePath || "No file selected" : `snippet.${sourceLang}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-zinc-500">
                      {sourceMonacoLang}
                    </span>
                    <button
                      onClick={() => {
                        if (activeSourceContent) {
                          navigator.clipboard.writeText(activeSourceContent);
                        }
                      }}
                      title="Copy Source Code"
                      className="p-1 hover:bg-[#1A1F30] rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Monaco Source Editor */}
                <div className="flex-1 relative">
                  <Editor
                    height="100%"
                    language={sourceMonacoLang}
                    theme="vs-dark"
                    value={activeSourceContent}
                    onChange={handleSourceCodeChange}
                    options={{
                      fontSize: 13,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      lineNumbers: "on",
                      glyphMargin: false,
                      folding: true,
                    }}
                  />
                </div>
              </div>

              {/* Resizer Handle between Left and Right Editor */}
              <div
                onMouseDown={handleEditorResizeStart}
                title="Drag to resize source & output editors"
                className="w-1 hover:w-1.5 cursor-col-resize bg-transparent hover:bg-cyan-500/50 relative z-20 transition-all shrink-0"
              />

              {/* Right Editor: Converted / Translated Output */}
              <div
                style={{ width: isProjectMode ? `${100 - editorSplit}%` : "50%" }}
                className="h-full flex flex-col overflow-hidden bg-[#0A0D14]"
              >
                <OutputExplorer
                  files={translatedFiles}
                  selectedPath={selectedOutputPath}
                  onSelectFile={setSelectedOutputPath}
                  onCopyAll={handleCopyCode}
                  hasCopied={hasCopiedOutput}
                  showTreeSidebar={showOutputTree}
                  onToggleTreeSidebar={() => setShowOutputTree(!showOutputTree)}
                  isProjectMode={isProjectMode}
                  onDownloadZip={handleDownloadZip}
                />

                {translatedFiles.length === 0 ? (
                  /* Empty State Guide */
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 bg-[#07090E]">
                    <div className="w-14 h-14 rounded-2xl bg-[#0F1320] border border-[#1E2538] flex items-center justify-center text-cyan-400 mb-4 shadow-lg">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">
                      Ready for Polyglot Conversion
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed mb-6">
                      Confirm your Target Frameworks in the header above, then click{" "}
                      <span className="text-cyan-400 font-semibold">Convert & Run</span> to translate your project files and boot the live sandbox preview.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
                      <span className="px-2.5 py-1 rounded-md bg-[#10131E] border border-indigo-500/30 text-indigo-300">
                        Frontend: {targetFrontend}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-semibold shadow-sm">
                        Backend: {targetBackend}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex overflow-hidden">
                    {isProjectMode && showOutputTree && (
                      <OutputTreeSidebar
                        files={translatedFiles}
                        selectedPath={selectedOutputPath}
                        onSelectFile={setSelectedOutputPath}
                      />
                    )}

                    <div className="flex-1 relative">
                      <Editor
                        height="100%"
                        language={outputMonacoLang}
                        theme="vs-dark"
                        value={activeOutputContent}
                        options={{
                          readOnly: true,
                          fontSize: 13,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          lineNumbers: "on",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Runtime Panel */}
          <TerminalPanel
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            terminalOutput={terminalOutput}
            onClearTerminal={() => setTerminalOutput("")}
            lastResponse={lastResponse}
            currentAttempt={currentAttempt}
            maxAttempts={maxAttempts}
            isPanelExpanded={isPanelExpanded}
            onToggleExpand={() => setIsPanelExpanded(!isPanelExpanded)}
            onInspectAttemptCode={(code) => {
              if (translatedFiles.length > 0) {
                setTranslatedFiles([{ path: "repaired_attempt.ts", content: code }]);
                setSelectedOutputPath("repaired_attempt.ts");
              }
            }}
            previewUrl={lastResponse?.preview_url || "/api/preview/live"}
            startCmd={lastResponse?.start_cmd || "python -m http.server 3000 --bind 0.0.0.0"}
            targetLang={targetLang}
            translatedFiles={translatedFiles}
            previewKey={previewKey}
            viewportMode={viewportMode}
            onSetViewportMode={setViewportMode}
            onRefreshPreview={() => setPreviewKey((k) => k + 1)}
            backendHealth={backendHealth}
            isProjectMode={isProjectMode}
          />
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODALS & DIALOGS                                                          */}
      {/* ========================================================================= */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        currentKey={userApiKey}
        onSave={(key) => setUserApiKey(key)}
      />

      <ScopeConfirmationModal
        isOpen={scopeModalOpen}
        classification={pendingClassification}
        onConfirm={handleConfirmScope}
        onClose={() => setScopeModalOpen(false)}
      />
    </div>
  );
}

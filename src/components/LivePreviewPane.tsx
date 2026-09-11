import React, { useMemo } from "react";
import { Globe, RefreshCw, ExternalLink, Monitor, Tablet, Smartphone, Play } from "lucide-react";
import { ProjectFile } from "../types";

interface LivePreviewPaneProps {
  previewUrl: string | null;
  startCmd: string;
  targetLang: string;
  translatedFiles: ProjectFile[];
  previewKey: number;
  viewportMode: "full" | "tablet" | "mobile";
  onSetViewportMode: (mode: "full" | "tablet" | "mobile") => void;
  onRefresh: () => void;
}

export function LivePreviewPane({
  previewUrl,
  startCmd,
  targetLang,
  translatedFiles,
  previewKey,
  viewportMode,
  onSetViewportMode,
  onRefresh,
}: LivePreviewPaneProps) {
  // Find index.html or main entry point
  const dynamicPreviewSrcDoc = useMemo(() => {
    if (!translatedFiles || translatedFiles.length === 0) {
      return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Preview Ready</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-neutral-950 text-neutral-300 flex items-center justify-center min-h-screen p-6 font-sans">
    <div class="text-center max-w-md p-8 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl">
      <div class="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-4 text-blue-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
      </div>
      <h3 class="text-base font-semibold text-white mb-2">Web App Preview Container</h3>
      <p class="text-xs text-neutral-400 leading-relaxed mb-4">
        Execute <span class="text-blue-400 font-mono font-bold">Convert & Run</span> to translate your project files, compile, start the dev server, and render interactive live previews here.
      </p>
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-neutral-800 text-[11px] font-mono text-neutral-400">
        <span>Port: 3000</span>
        <span>•</span>
        <span class="text-emerald-400">Ready</span>
      </div>
    </div>
  </body>
</html>`;
    }

    // Look for HTML file
    const htmlFile = translatedFiles.find((f) => f.path.toLowerCase().endsWith(".html"));
    if (htmlFile) {
      return htmlFile.content;
    }

    // Combine JS scripts into a interactive canvas/DOM runner
    const jsFiles = translatedFiles.filter(
      (f) => f.path.toLowerCase().endsWith(".js") || f.path.toLowerCase().endsWith(".ts")
    );
    const combinedJs = jsFiles.map((f) => `// --- ${f.path} ---\n${f.content}`).join("\n\n");

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Live Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { margin: 0; padding: 0; background: #0c0d0e; color: #e1e4e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      #console-logs { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    </style>
  </head>
  <body class="min-h-screen p-4 flex flex-col items-center justify-start">
    <div class="w-full max-w-3xl space-y-4">
      <div class="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h1 class="text-sm font-semibold text-white">Live Application Runtime (${targetLang.toUpperCase()})</h1>
        </div>
        <span class="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded font-mono">
          Port 3000
        </span>
      </div>

      <!-- App Canvas / Interactive Container -->
      <div id="app" class="w-full min-h-[220px] bg-neutral-900/90 border border-neutral-800 rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden">
        <canvas id="canvas" width="600" height="340" class="rounded max-w-full"></canvas>
      </div>

      <!-- Live Terminal Stdout in Preview -->
      <div class="bg-[#101214] border border-neutral-800 rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Application Stdout</span>
          <span class="text-[10px] text-neutral-500 font-mono">Live Logs</span>
        </div>
        <pre id="console-logs" class="text-xs text-emerald-400 bg-black/60 p-3 rounded border border-neutral-800/80 overflow-x-auto min-h-[60px] max-h-[140px] leading-relaxed"></pre>
      </div>
    </div>

    <script>
      const logContainer = document.getElementById('console-logs');
      function appendLog(msg, isErr) {
        if (!logContainer) return;
        const line = document.createElement('div');
        line.style.color = isErr ? '#f87171' : '#4ade80';
        line.textContent = typeof msg === 'object' ? JSON.stringify(msg) : String(msg);
        logContainer.appendChild(line);
      }

      const originalLog = console.log;
      console.log = function(...args) {
        originalLog.apply(console, args);
        appendLog(args.join(' '), false);
      };

      const originalError = console.error;
      console.error = function(...args) {
        originalError.apply(console, args);
        appendLog('[ERROR] ' + args.join(' '), true);
      };

      window.onerror = function(msg, url, line) {
        appendLog('Uncaught: ' + msg + ' (line ' + line + ')', true);
      };

      try {
        ${combinedJs}
      } catch (err) {
        console.error(err.message || err);
      }
    </script>
  </body>
</html>`;
  }, [translatedFiles, targetLang]);

  return (
    <div className="preview-container w-full h-full flex flex-col bg-[#0A0A0A] overflow-hidden">
      {/* Top bar */}
      <div className="h-8 bg-[#141414] border-b border-[#262626] flex items-center justify-between px-3 gap-2 shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-medium shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>PORT 3000</span>
          </div>

          {startCmd && (
            <div className="hidden sm:flex items-center gap-1 bg-[#1A1A1A] border border-[#262626] text-[#888888] px-2 py-0.5 rounded text-[10px] font-mono truncate max-w-xs">
              <span className="text-[#555555]">CMD:</span>
              <span className="truncate">{startCmd}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0D0D0D] border border-[#262626] rounded px-2 py-0.5 text-[11px] font-mono text-[#CCCCCC] gap-1.5 max-w-sm truncate">
            <Globe className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="truncate">{previewUrl || "http://localhost:3000"}</span>
          </div>

          {/* Viewport Modes */}
          <div className="hidden md:flex items-center bg-[#1A1A1A] rounded p-0.5 border border-[#262626]">
            <button
              onClick={() => onSetViewportMode("full")}
              title="Full Width"
              className={`p-1 rounded text-xs ${
                viewportMode === "full" ? "bg-[#2A2A2A] text-white" : "text-[#777777] hover:text-white"
              }`}
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => onSetViewportMode("tablet")}
              title="Tablet (768px)"
              className={`p-1 rounded text-xs ${
                viewportMode === "tablet" ? "bg-[#2A2A2A] text-white" : "text-[#777777] hover:text-white"
              }`}
            >
              <Tablet className="w-3 h-3" />
            </button>
            <button
              onClick={() => onSetViewportMode("mobile")}
              title="Mobile (375px)"
              className={`p-1 rounded text-xs ${
                viewportMode === "mobile" ? "bg-[#2A2A2A] text-white" : "text-[#777777] hover:text-white"
              }`}
            >
              <Smartphone className="w-3 h-3" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            title="Reload Preview Frame"
            className="p-1 rounded hover:bg-[#222222] text-[#888888] hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Open in New Window */}
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              title="Open Preview in External Window"
              className="p-1 rounded hover:bg-[#222222] text-[#888888] hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 w-full h-full bg-[#0D0D0D] flex items-center justify-center p-2 overflow-hidden relative">
        <div
          className={`h-full bg-white rounded overflow-hidden shadow-2xl transition-all duration-300 relative ${
            viewportMode === "mobile"
              ? "w-[375px] border-4 border-[#222222]"
              : viewportMode === "tablet"
              ? "w-[768px] border-2 border-[#222222]"
              : "w-full"
          }`}
        >
          <iframe
            key={previewKey}
            src={previewUrl || undefined}
            srcDoc={!previewUrl ? dynamicPreviewSrcDoc : undefined}
            className="w-full h-full border-none bg-white"
            title="Live Application Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}

import { ProjectFile, LanguageDetectionResult } from "../types";
import { detectProjectLanguage } from "./languages";

export interface FolderClassification {
  detected: "frontend" | "backend" | "fullstack";
  frontendFileCount: number;
  backendFileCount: number;
  totalFiles: number;
  details: string;
  languageDetection?: LanguageDetectionResult;
}

const FRONTEND_EXTENSIONS = new Set([
  ".html",
  ".htm",
  ".jsx",
  ".tsx",
  ".vue",
  ".svelte",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".svg",
]);

const BACKEND_EXTENSIONS = new Set([
  ".py",
  ".java",
  ".go",
  ".rs",
  ".cpp",
  ".c",
  ".h",
  ".hpp",
  ".cs",
  ".rb",
  ".php",
  ".sql",
  ".sh",
  ".bash",
]);

const FRONTEND_DIR_KEYWORDS = [
  "frontend",
  "client",
  "web",
  "ui",
  "public",
  "components",
  "views",
  "pages",
  "styles",
  "static",
];

const BACKEND_DIR_KEYWORDS = [
  "backend",
  "server",
  "api",
  "services",
  "controllers",
  "models",
  "routes",
  "db",
  "database",
  "repositories",
  "middleware",
];

export function classifyFolder(files: ProjectFile[]): FolderClassification {
  if (!files || files.length === 0) {
    return {
      detected: "fullstack",
      frontendFileCount: 0,
      backendFileCount: 0,
      totalFiles: 0,
      details: "No files uploaded",
    };
  }

  let frontendCount = 0;
  let backendCount = 0;

  for (const file of files) {
    const lowerPath = file.path.toLowerCase();
    const dotIdx = lowerPath.lastIndexOf(".");
    const ext = dotIdx !== -1 ? lowerPath.slice(dotIdx) : "";

    let isFrontend = false;
    let isBackend = false;

    // Check by extension
    if (FRONTEND_EXTENSIONS.has(ext)) {
      isFrontend = true;
    } else if (BACKEND_EXTENSIONS.has(ext)) {
      isBackend = true;
    } else if (ext === ".js" || ext === ".ts" || ext === ".mjs") {
      // Ambiguous JS/TS: look at directory context or file content
      const pathSegments = lowerPath.split("/");
      const isInFrontendDir = pathSegments.some((seg) =>
        FRONTEND_DIR_KEYWORDS.includes(seg)
      );
      const isInBackendDir = pathSegments.some((seg) =>
        BACKEND_DIR_KEYWORDS.includes(seg)
      );

      if (isInFrontendDir && !isInBackendDir) {
        isFrontend = true;
      } else if (isInBackendDir && !isInFrontendDir) {
        isBackend = true;
      } else {
        // Inspect content heuristics
        const content = file.content || "";
        if (
          content.includes("React") ||
          content.includes("useState") ||
          content.includes("document.") ||
          content.includes("window.") ||
          content.includes("className") ||
          content.includes("render(")
        ) {
          isFrontend = true;
        } else if (
          content.includes("express") ||
          content.includes("FastAPI") ||
          content.includes("app.listen") ||
          content.includes("require('fs')") ||
          content.includes("process.env")
        ) {
          isBackend = true;
        } else {
          // Default JS/TS in root or general src to frontend or both
          isFrontend = true;
        }
      }
    }

    // Also check folder path keywords
    const segments = lowerPath.split("/");
    if (!isFrontend && segments.some((s) => FRONTEND_DIR_KEYWORDS.includes(s))) {
      isFrontend = true;
    }
    if (!isBackend && segments.some((s) => BACKEND_DIR_KEYWORDS.includes(s))) {
      isBackend = true;
    }

    if (isFrontend) frontendCount++;
    if (isBackend) backendCount++;
  }

  let detected: "frontend" | "backend" | "fullstack";
  let details = "";

  if (frontendCount === 0 && backendCount > 0) {
    detected = "backend";
    details = `Detected ${backendCount} backend files and 0 frontend files.`;
  } else if (backendCount === 0 && frontendCount > 0) {
    detected = "frontend";
    details = `Detected ${frontendCount} frontend files and 0 backend files.`;
  } else {
    detected = "fullstack";
    details = `Detected ${frontendCount} frontend files and ${backendCount} backend files.`;
  }

  const langDetection = detectProjectLanguage(files);

  return {
    detected,
    frontendFileCount: frontendCount,
    backendFileCount: backendCount,
    totalFiles: files.length,
    details,
    languageDetection: langDetection,
  };
}

import {
  TARGET_FRONTEND_OPTIONS,
  TARGET_BACKEND_OPTIONS,
  SUPPORTED_LANGUAGES,
} from "../data/presets";
import { LanguageOption, FrameworkOption, LanguageDetectionResult } from "../types";
import { TARGET_SCAFFOLD_MAP, reconcileTargetScaffold, isScaffoldFile } from "./scaffold";

export {
  TARGET_FRONTEND_OPTIONS,
  TARGET_BACKEND_OPTIONS,
  SUPPORTED_LANGUAGES,
  TARGET_SCAFFOLD_MAP,
  reconcileTargetScaffold,
  isScaffoldFile,
};

/**
 * Detect language from file extension or content.
 * Note: Auto-detection ONLY sets the initial default value.
 * Dropdowns must NEVER be locked or disabled based on detection result!
 */
export function detectLanguageFromExtension(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs")) return "javascript";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".go")) return "go";
  if (lower.endsWith(".rs")) return "rust";
  if (lower.endsWith(".cpp") || lower.endsWith(".cc") || lower.endsWith(".c") || lower.endsWith(".h")) return "cpp";
  if (lower.endsWith(".cs")) return "csharp";
  if (lower.endsWith(".rb")) return "ruby";
  if (lower.endsWith(".php")) return "php";
  if (lower.endsWith(".kt")) return "kotlin";
  if (lower.endsWith(".swift")) return "swift";
  if (lower.endsWith(".sh") || lower.endsWith(".bash")) return "bash";
  if (lower.endsWith(".sql")) return "sql";
  return "python";
}

/**
 * Robust Project-Level Language Detection obeying strict priority order:
 * 
 * FRONTEND SCOPE PRIORITY:
 * 1. tsconfig.json present at project root / tree -> TypeScript, regardless of individual extensions.
 * 2. Else, any .ts / .tsx files present -> TypeScript.
 * 3. Else, only .js / .jsx present -> JavaScript.
 * 4. If genuine mix (.tsx/.ts + .js/.jsx, no tsconfig.json) -> TypeScript (partial) + UI note.
 * 
 * BACKEND SCOPE PRIORITY:
 * Strongest signal present (e.g. go.mod -> Go; Cargo.toml -> Rust; pom.xml/gradle -> Java; pyproject.toml/requirements.txt + .py -> Python).
 * Stray files of another type never override dominant config-confirmed language.
 */
export function detectProjectLanguage(files: { path: string; content?: string }[]): LanguageDetectionResult {
  if (!files || files.length === 0) {
    return {
      language: "python",
      reason: "Default fallback (no files uploaded)",
    };
  }

  const normalized = files.map((f) => ({
    raw: f.path,
    lower: f.path.toLowerCase().replace(/\\/g, "/"),
    filename: f.path.split(/[\/\\]/).pop()?.toLowerCase() || "",
  }));

  const hasFile = (name: string) =>
    normalized.some((p) => p.filename === name || p.lower.endsWith("/" + name));

  const countExt = (exts: string[]) =>
    normalized.filter((p) => exts.some((e) => p.lower.endsWith(e))).length;

  // Dominant Configuration Signals
  const hasTsConfig =
    hasFile("tsconfig.json") ||
    hasFile("tsconfig.app.json") ||
    hasFile("tsconfig.node.json") ||
    normalized.some((p) => p.lower.includes("tsconfig"));

  const hasGoMod = hasFile("go.mod") || hasFile("go.sum");
  const hasCargo = hasFile("cargo.toml") || hasFile("cargo.lock");
  const hasPom = hasFile("pom.xml") || hasFile("build.gradle") || hasFile("build.gradle.kts");
  const hasPythonConfig =
    hasFile("pyproject.toml") ||
    hasFile("requirements.txt") ||
    hasFile("pipfile") ||
    hasFile("setup.py");
  const hasRubyConfig = hasFile("gemfile");
  const hasPhpConfig = hasFile("composer.json");
  const hasDotNetConfig = normalized.some((p) => p.lower.endsWith(".csproj") || p.lower.endsWith(".sln"));

  // Extension counts
  const tsCount = countExt([".ts", ".tsx"]);
  const jsCount = countExt([".js", ".jsx", ".mjs", ".cjs"]);
  const pyCount = countExt([".py"]);
  const goCount = countExt([".go"]);
  const rsCount = countExt([".rs"]);
  const javaCount = countExt([".java"]);
  const ktCount = countExt([".kt", ".kts"]);
  const cCount = countExt([".c", ".h", ".cpp", ".hpp", ".cc"]);
  const csCount = countExt([".cs"]);
  const rbCount = countExt([".rb"]);
  const phpCount = countExt([".php"]);

  // =========================================================================
  // RULE 1: tsconfig.json present -> TypeScript (regardless of individual file extensions)
  // =========================================================================
  if (hasTsConfig) {
    const isMixed = jsCount > 0;
    return {
      language: "typescript",
      isPartial: isMixed,
      reason: "Config-confirmed by tsconfig.json at project root",
      note: isMixed
        ? "Mixed JS/TS project with tsconfig.json — will migrate fully to TypeScript."
        : undefined,
      scopeType: "frontend",
    };
  }

  // =========================================================================
  // BACKEND DOMINANT CONFIGS (Strong signals, not overridden by stray files)
  // =========================================================================
  if (hasGoMod) {
    return {
      language: "go",
      reason: "Dominant config-confirmed by go.mod",
      scopeType: "backend",
    };
  }

  if (hasCargo) {
    return {
      language: "rust",
      reason: "Dominant config-confirmed by Cargo.toml",
      scopeType: "backend",
    };
  }

  if (hasPom) {
    if (ktCount > javaCount) {
      return {
        language: "kotlin",
        reason: "Dominant config-confirmed by Gradle with Kotlin source files",
        scopeType: "backend",
      };
    }
    return {
      language: "java",
      reason: "Dominant config-confirmed by pom.xml / build.gradle",
      scopeType: "backend",
    };
  }

  if (hasPythonConfig && (pyCount > 0 || files.length <= 4)) {
    return {
      language: "python",
      reason: "Dominant config-confirmed by requirements.txt / pyproject.toml",
      scopeType: "backend",
    };
  }

  if (hasRubyConfig && rbCount > 0) {
    return {
      language: "ruby",
      reason: "Dominant config-confirmed by Gemfile",
      scopeType: "backend",
    };
  }

  if (hasPhpConfig && phpCount > 0) {
    return {
      language: "php",
      reason: "Dominant config-confirmed by composer.json",
      scopeType: "backend",
    };
  }

  if (hasDotNetConfig && csCount > 0) {
    return {
      language: "csharp",
      reason: "Dominant config-confirmed by .csproj / .sln",
      scopeType: "backend",
    };
  }

  // =========================================================================
  // RULE 4: Genuine mix of some .tsx/.ts and some .js/.jsx (no tsconfig.json)
  // =========================================================================
  if (tsCount > 0 && jsCount > 0) {
    return {
      language: "typescript",
      isPartial: true,
      reason: `Mixed project containing ${tsCount} TypeScript (.ts/.tsx) and ${jsCount} JavaScript (.js/.jsx) files`,
      note: "Mixed JS/TS project — will migrate fully to TypeScript.",
      scopeType: "frontend",
    };
  }

  // =========================================================================
  // RULE 2: Any .ts / .tsx files present -> TypeScript
  // =========================================================================
  if (tsCount > 0) {
    return {
      language: "typescript",
      reason: `Detected ${tsCount} TypeScript source file(s) (.ts / .tsx)`,
      scopeType: "frontend",
    };
  }

  // =========================================================================
  // RULE 3: Only .js / .jsx present -> JavaScript
  // =========================================================================
  if (jsCount > 0 && tsCount === 0 && pyCount === 0 && goCount === 0 && javaCount === 0 && rsCount === 0) {
    return {
      language: "javascript",
      reason: `Detected ${jsCount} JavaScript source file(s) (.js / .jsx)`,
      scopeType: "frontend",
    };
  }

  // Other languages without config files: frequency ranking
  const codeStats = [
    { lang: "python", count: pyCount, scope: "backend" as const },
    { lang: "go", count: goCount, scope: "backend" as const },
    { lang: "rust", count: rsCount, scope: "backend" as const },
    { lang: "java", count: javaCount, scope: "backend" as const },
    { lang: "cpp", count: cCount, scope: "backend" as const },
    { lang: "csharp", count: csCount, scope: "backend" as const },
    { lang: "ruby", count: rbCount, scope: "backend" as const },
    { lang: "php", count: phpCount, scope: "backend" as const },
    { lang: "javascript", count: jsCount, scope: "frontend" as const },
    { lang: "html", count: countExt([".html", ".htm"]), scope: "frontend" as const },
  ].sort((a, b) => b.count - a.count);

  if (codeStats[0] && codeStats[0].count > 0) {
    return {
      language: codeStats[0].lang,
      reason: `Dominant language determined by ${codeStats[0].count} source file(s)`,
      scopeType: codeStats[0].scope,
    };
  }

  return {
    language: "python",
    reason: "Fallback default",
  };
}

/**
 * Detect primary language across an array of files, returning the language id
 */
export function detectPrimaryLanguage(files: { path: string; content?: string }[]): string {
  const result = detectProjectLanguage(files);
  return result.language;
}

/**
 * Maps language ID to Monaco language identifier
 */
export function getMonacoLanguage(path: string, fallbackLang: string): string {
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  switch (ext) {
    case ".py":
      return "python";
    case ".js":
    case ".mjs":
      return "javascript";
    case ".jsx":
      return "javascript";
    case ".ts":
      return "typescript";
    case ".tsx":
      return "typescript";
    case ".html":
    case ".htm":
      return "html";
    case ".css":
      return "css";
    case ".json":
      return "json";
    case ".go":
      return "go";
    case ".rs":
      return "rust";
    case ".cpp":
    case ".c":
    case ".h":
      return "cpp";
    case ".java":
      return "java";
    case ".rb":
      return "ruby";
    case ".sh":
      return "shell";
    case ".jsp":
      return "html";
    case ".sql":
      return "sql";
    default: {
      const match = SUPPORTED_LANGUAGES.find(
        (l) => l.id.toLowerCase() === fallbackLang.toLowerCase()
      );
      return match ? match.monacoLang : "plaintext";
    }
  }
}

export const detectLanguageFromPath = detectLanguageFromExtension;
export const getMonacoLangForFile = getMonacoLanguage;

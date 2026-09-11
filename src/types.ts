export interface ProjectFile {
  path: string;
  content: string;
  isScaffold?: boolean;
}

export interface LanguageDetectionResult {
  language: string;
  isPartial?: boolean;
  note?: string;
  reason: string;
  scopeType?: "frontend" | "backend" | "fullstack";
}

export interface ProjectAnalysis {
  sourceFrontend: string;
  sourceBackend: string;
  summary: string;
  keyDependencies: string[];
  detectedEntryPoint: string;
  languageOverview: string;
}

export interface ReferenceImagePayload {
  data: string; // base64 encoded string (without data URL prefix or raw)
  mimeType: string;
  name?: string;
  previewUrl?: string;
}

export interface DebugStep {
  attempt: number;
  code: string;
  files_count?: number;
  status: "translated" | "executing" | "success" | "error" | "fixed";
  stdout: string;
  stderr: string;
  error?: string | null;
  execution_time: number;
  timestamp: number;
  explanation?: string | null;
}

export interface TranslationResponse {
  success: boolean;
  source_language?: string;
  source_frontend?: string;
  source_backend?: string;
  target_language?: string;
  target_frontend?: string;
  target_backend?: string;
  analysis?: ProjectAnalysis;
  translated_files?: ProjectFile[];
  final_code: string;
  start_cmd?: string;
  preview_url?: string;
  terminal_output: string;
  attempts_used: number;
  max_attempts: number;
  history: DebugStep[];
  total_duration: number;
}

export interface LanguageOption {
  id: string;
  name: string;
  monacoLang: string;
  ext: string;
}

export interface FrameworkOption {
  id: string;
  name: string;
  category: "frontend" | "backend";
  description: string;
  defaultLang: string;
}

export interface PresetProject {
  name: string;
  sourceLang: string;
  targetLang?: string;
  defaultTargetFrontend?: string;
  defaultTargetBackend?: string;
  description: string;
  files: ProjectFile[];
}

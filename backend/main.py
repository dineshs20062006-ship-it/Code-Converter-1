import os
import pathlib
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Header, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from backend.services.aiagent import AIAgentService
from backend.services.sandbox import SandboxExecutionService
from backend.services.translationloop import AgenticTranslationLoop, TranslationLoopResult, DebugStep

# Load environment variables from backend directory and root
_backend_dir = pathlib.Path(__file__).resolve().parent
load_dotenv(_backend_dir / ".env")
load_dotenv()

app = FastAPI(
    title="Code Converter & Agentic Debugging API",
    description="Multimodal Code Converter API powered by Gemini and Sandboxed Execution for automated tech stack analysis, code translation, and self-repair.",
    version="1.0.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ReferenceImageModel(BaseModel):
    data: str = Field(..., description="Base64 data of the reference image")
    mimeType: str = Field("image/png", description="MIME type of the image")
    name: Optional[str] = None


class TranslationRequest(BaseModel):
    source_code: Optional[str] = Field(None, description="Original source code string (if single file)")
    files: Optional[List[Dict[str, str]]] = Field(None, description="Array of project file objects [{path, content}]")
    source_language: str = Field("python", description="Source programming language")
    source_frontend: Optional[str] = Field(None, description="Detected source frontend stack")
    source_backend: Optional[str] = Field(None, description="Detected source backend stack")
    target_language: str = Field("javascript", description="Target programming language")
    target_frontend: Optional[str] = Field("React 18 + Tailwind CSS (Vite)", description="Target frontend framework")
    target_backend: Optional[str] = Field("None (Pure Client-Side / Static Web)", description="Target backend framework")
    conversion_instructions: Optional[str] = Field(None, description="User conversion requirements and styling notes")
    additional_instructions: Optional[str] = Field(None, description="Alias for conversion instructions")
    reference_image: Optional[ReferenceImageModel] = Field(None, description="Multimodal visual mockup reference")
    gemini_api_key: Optional[str] = Field(None, description="Optional user-provided Gemini API key")
    max_attempts: int = Field(3, ge=1, le=5, description="Maximum agentic retry attempts")


class DirectRunRequest(BaseModel):
    code: str = Field(..., description="Code to execute in sandbox")
    language: str = Field("python", description="Language of the code")
    timeout_seconds: int = Field(30, ge=1, le=120)


class AnalysisRequest(BaseModel):
    files: List[Dict[str, str]] = Field(..., description="Project files to analyze")
    gemini_api_key: Optional[str] = Field(None, description="Optional user-provided Gemini API key")


@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Health check endpoint to verify backend status and API key configuration."""
    has_gemini = bool(os.getenv("GEMINI_API_KEY"))
    has_e2b = bool(os.getenv("E2B_API_KEY"))
    raw_model = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")
    model_name = "gemini-3.7-flash" if (not raw_model or "2.5-flash" in raw_model or "2.0-flash" in raw_model or "1.5-flash" in raw_model) else raw_model
    return {
        "status": "healthy",
        "gemini_configured": has_gemini,
        "e2b_configured": has_e2b,
        "model": model_name,
    }


@app.post("/api/analyze-project")
async def analyze_project(
    request: AnalysisRequest,
    x_user_api_key: Optional[str] = Header(None, alias="X-User-API-Key"),
):
    """Analyzes uploaded project files and returns detected source frontend and backend stacks."""
    if not request.files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided for analysis.",
        )
    user_key = x_user_api_key or request.gemini_api_key
    ai_service = AIAgentService(api_key=user_key)
    try:
        analysis = await ai_service.analyze_project(request.files)
        return {"success": True, "analysis": analysis}
    except Exception as e:
        # Return fallback heuristic on exception
        return {
            "success": True,
            "analysis": {
                "sourceFrontend": "HTML5 / JavaScript" if any(f.get("path", "").endswith(".html") for f in request.files) else "None (CLI / Pure Backend)",
                "sourceBackend": "Python" if any(f.get("path", "").endswith(".py") for f in request.files) else "Node.js",
                "summary": f"Imported {len(request.files)} project files.",
                "keyDependencies": [],
                "detectedEntryPoint": request.files[0]["path"] if request.files else "main.py",
                "languageOverview": "Multi-file project",
            },
        }


@app.post("/api/translate-and-run", response_model=TranslationLoopResult)
@app.post("/api/translate", response_model=TranslationLoopResult)
async def translate_and_run(
    request: TranslationRequest,
    x_user_api_key: Optional[str] = Header(None, alias="X-User-API-Key"),
):
    """
    Main endpoint: Translates code and runs the Agentic Debug Loop (compile, run, debug with Gemini).
    """
    # Ensure there is code or files provided
    if not (request.source_code and request.source_code.strip()) and not (request.files and len(request.files) > 0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source project contains no files or code to translate.",
        )

    user_key = x_user_api_key or request.gemini_api_key
    if not user_key and not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key is missing. Please enter your Gemini API Key in the top navigation bar.",
        )

    try:
        ai_service = AIAgentService(api_key=user_key)
        sandbox_service = SandboxExecutionService()
        loop = AgenticTranslationLoop(
            ai_service=ai_service,
            sandbox_service=sandbox_service,
            max_attempts=request.max_attempts,
        )

        instructions = request.conversion_instructions or request.additional_instructions
        ref_img = request.reference_image.dict() if request.reference_image else None

        result = await loop.run(
            source_code=request.source_code or "",
            source_language=request.source_language,
            target_language=request.target_language,
            additional_instructions=instructions,
            files=request.files,
            target_frontend=request.target_frontend,
            target_backend=request.target_backend,
            source_frontend=request.source_frontend,
            source_backend=request.source_backend,
        )
        return result

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        err_msg = str(e)
        if "401" in err_msg or "API_KEY_INVALID" in err_msg or "UNAUTHENTICATED" in err_msg or "ACCESS_TOKEN_TYPE_UNSUPPORTED" in err_msg or "API Key is missing" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API Key. Please check your key and try again.",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code conversion error: {err_msg}",
        )


@app.post("/api/run-code")
async def run_code_direct(request: DirectRunRequest):
    """Directly executes code in the sandbox without translation."""
    sandbox_service = SandboxExecutionService()
    try:
        result = await sandbox_service.execute_code(
            code=request.code,
            language=request.language,
            timeout_seconds=request.timeout_seconds,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sandbox execution error: {str(e)}",
        )


@app.post("/api/sandbox/teardown")
@app.post("/api/reset-session")
async def teardown_sandboxes():
    """Kills and disposes of all active running sandboxes and background preview servers."""
    try:
        killed = await SandboxExecutionService.teardown_all()
        return {"success": True, "killed": killed, "message": "All active sandboxes disposed successfully."}
    except Exception as e:
        return {"success": False, "error": str(e)}


class ExportZipRequest(BaseModel):
    files: List[Dict[str, str]]
    target_language: str = "project"


@app.post("/api/export-zip")
async def export_zip(payload: ExportZipRequest):
    """Packages translated files into a downloadable ZIP archive."""
    import io
    import zipfile
    from fastapi.responses import StreamingResponse

    if not payload.files:
        raise HTTPException(status_code=400, detail="No files provided to export.")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in payload.files:
            p = f.get("path", "").replace("\\", "/").lstrip("/")
            c = f.get("content", "")
            if p:
                zf.writestr(p, c)

    zip_buffer.seek(0)
    clean_lang = re.sub(r"[^a-zA-Z0-9]", "-", payload.target_language.lower())
    timestamp = int(time.time())
    filename = f"translated-{clean_lang}-{timestamp}.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=3000, reload=True)

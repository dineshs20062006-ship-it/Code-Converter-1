import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
try:
    from services.aiagent import AIAgentService
    from services.sandbox import SandboxExecutionService
except ImportError:
    from backend.services.aiagent import AIAgentService
    from backend.services.sandbox import SandboxExecutionService


class DebugStep(BaseModel):
    attempt: int
    code: str
    status: str  # "translated", "executing", "success", "error", "fixed"
    stdout: str = ""
    stderr: str = ""
    error: Optional[str] = None
    execution_time: float = 0.0
    timestamp: float = Field(default_factory=time.time)
    explanation: Optional[str] = None


class TranslationLoopResult(BaseModel):
    success: bool
    source_language: str
    target_language: str
    final_code: str
    translated_files: List[Dict[str, str]] = Field(default_factory=list)
    start_cmd: Optional[str] = None
    preview_url: Optional[str] = None
    terminal_output: str
    attempts_used: int
    max_attempts: int
    history: List[DebugStep]
    total_duration: float


class AgenticTranslationLoop:
    def __init__(
        self,
        ai_service: Optional[AIAgentService] = None,
        sandbox_service: Optional[SandboxExecutionService] = None,
        max_attempts: int = 3,
    ):
        self.ai_service = ai_service or AIAgentService()
        self.sandbox_service = sandbox_service or SandboxExecutionService()
        self.max_attempts = max_attempts

    async def run(
        self,
        source_code: str,
        source_language: str,
        target_language: str,
        additional_instructions: Optional[str] = None,
        files: Optional[List[Dict[str, str]]] = None,
        target_frontend: Optional[str] = None,
        target_backend: Optional[str] = None,
        source_frontend: Optional[str] = None,
        source_backend: Optional[str] = None,
    ) -> TranslationLoopResult:
        """
        Executes the full agentic loop for multi-file or single-file projects:
        1. Translates code via Gemini with Preview Readiness & START_CMD directives
        2. Executes in E2B Sandbox with background server execution & preview URL retrieval
        3. If failure detected, loops with Gemini to fix based on error trace
        4. Stops upon success or reaching max_attempts (3)
        """
        loop_start_time = time.time()
        history: List[DebugStep] = []
        current_files: List[Dict[str, str]] = []
        current_code = ""
        current_start_cmd = "python -m http.server 3000"
        current_stdout = ""
        current_stderr = ""
        current_error: Optional[str] = None
        current_preview_url: Optional[str] = None
        is_successful = False
        attempts_count = 0

        # Attempt Loop
        for attempt in range(1, self.max_attempts + 1):
            attempts_count = attempt

            if attempt == 1:
                # Initial Translation via Gemini
                current_files, current_start_cmd, current_code = await self.ai_service.translate_code(
                    source_code=source_code,
                    source_lang=source_language,
                    target_lang=target_language,
                    additional_instructions=additional_instructions,
                    files=files,
                    target_frontend=target_frontend,
                    target_backend=target_backend,
                    source_frontend=source_frontend,
                    source_backend=source_backend,
                )
                step_status = "translated"
                step_explanation = f"Initial translation ({len(current_files)} files) from {source_language} to {target_language} generated."
            else:
                # Debugging & Self-Correction via Gemini
                source_input = files or [{"path": f"main.{'py' if source_language == 'python' else 'js'}", "content": source_code}]
                current_files, current_start_cmd, current_code = await self.ai_service.fix_broken_code(
                    broken_files=current_files,
                    target_lang=target_language,
                    error_message=current_error or current_stderr or "Execution error",
                    stderr_output=current_stderr,
                    source_files=source_input,
                    source_lang=source_language,
                    attempt_number=attempt,
                )
                step_status = "fixed"
                step_explanation = f"Agentic fix applied for {len(current_files)} files based on attempt #{attempt-1} diagnostics."

            # Execute in Sandbox
            exec_result = await self.sandbox_service.execute_code(
                code=current_code,
                language=target_language,
                start_cmd=current_start_cmd,
            )

            current_stdout = exec_result.get("stdout", "")
            current_stderr = exec_result.get("stderr", "")
            current_error = exec_result.get("error")
            current_preview_url = exec_result.get("preview_url")
            exec_time = exec_result.get("execution_time", 0.0)
            is_successful = exec_result.get("success", False)

            # Record step in debugging history
            history.append(
                DebugStep(
                    attempt=attempt,
                    code=current_code,
                    status="success" if is_successful else "error",
                    stdout=current_stdout,
                    stderr=current_stderr,
                    error=current_error,
                    execution_time=exec_time,
                    explanation=step_explanation,
                )
            )

            # If execution succeeded, stop immediately
            if is_successful:
                break

        # If preview_url is not set yet but execution succeeded, try launching preview server
        if is_successful and not current_preview_url:
            server_res = await self.sandbox_service.start_preview_server(
                code=current_code,
                start_cmd=current_start_cmd,
                port=3000,
                language=target_language,
            )
            current_preview_url = server_res.get("preview_url")

        total_duration = round(time.time() - loop_start_time, 3)

        # Formulate terminal output
        if is_successful:
            terminal_output = current_stdout or f"Project ({len(current_files)} files) built and executed successfully."
        else:
            terminal_output = (
                f"Agentic loop terminated after {attempts_count} attempts.\n"
                f"Last Error:\n{current_error or current_stderr or 'Execution failed'}"
            )

        return TranslationLoopResult(
            success=is_successful,
            source_language=source_language,
            target_language=target_language,
            final_code=current_code,
            translated_files=current_files,
            start_cmd=current_start_cmd,
            preview_url=current_preview_url,
            terminal_output=terminal_output,
            attempts_used=attempts_count,
            max_attempts=self.max_attempts,
            history=history,
            total_duration=total_duration,
        )

import os
import time
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Track all active sandboxes across sessions to prevent leaks
_active_sandboxes: list = []


class SandboxExecutionService:
    def __init__(self):
        self.api_key = os.getenv("E2B_API_KEY")

    @classmethod
    async def teardown_all(cls):
        """Disposes and kills all active running E2B sandboxes to prevent resource leaks."""
        global _active_sandboxes
        killed_count = 0
        for sb in list(_active_sandboxes):
            try:
                if hasattr(sb, "kill"):
                    await sb.kill()
                    killed_count += 1
                elif hasattr(sb, "close"):
                    await sb.close()
                    killed_count += 1
            except Exception as e:
                print(f"[Sandbox Teardown] Error killing sandbox: {e}")
        _active_sandboxes.clear()
        print(f"[Sandbox Teardown] Terminated {killed_count} active sandboxes.")
        return killed_count

    async def start_preview_server(
        self,
        code: str,
        start_cmd: str = "python -m http.server 3000",
        port: int = 3000,
        language: str = "javascript",
    ) -> Dict[str, Any]:
        """
        Writes the translated code into the E2B Sandbox, executes the START_CMD in the background,
        and retrieves the assigned public sandbox URL for port 3000.
        """
        api_key = self.api_key or os.getenv("E2B_API_KEY")
        
        try:
            from e2b_code_interpreter import AsyncSandbox  # type: ignore
        except ImportError:
            return {
                "success": False,
                "preview_url": None,
                "host": None,
                "error": "e2b-code-interpreter not installed",
            }

        try:
            sandbox_kwargs = {}
            if api_key:
                sandbox_kwargs["api_key"] = api_key

            sandbox = await AsyncSandbox.create(**sandbox_kwargs)
            _active_sandboxes.append(sandbox)
            
            # Write entry point file according to target language
            lang_lower = language.lower().strip()
            if "html" in lang_lower or "<!doctype" in code.lower() or "<html" in code.lower():
                await sandbox.files.write("index.html", code)
            elif lang_lower in ["javascript", "js", "node", "typescript", "ts"]:
                await sandbox.files.write("index.js", code)
                await sandbox.files.write("index.html", f"<!DOCTYPE html><html><head><title>App</title></head><body><div id='app'></div><script>{code}</script></body></html>")
            elif lang_lower in ["python", "py"]:
                await sandbox.files.write("app.py", code)
                await sandbox.files.write("index.html", f"<!DOCTYPE html><html><body><h1>Python App</h1><pre>{code}</pre></body></html>")
            else:
                await sandbox.files.write("index.html", code)

            # Start server in background using E2B commands
            if hasattr(sandbox, "commands") and hasattr(sandbox.commands, "run"):
                process = await sandbox.commands.run(start_cmd, background=True)
            
            # Fetch assigned public URL for port 3000
            preview_url = None
            host = None
            if hasattr(sandbox, "get_host"):
                host = sandbox.get_host(port)
                preview_url = f"https://{host}"
            elif hasattr(sandbox, "get_url"):
                preview_url = sandbox.get_url(port)

            return {
                "success": True,
                "preview_url": preview_url,
                "host": host,
                "start_cmd": start_cmd,
                "error": None,
            }
        except Exception as e:
            return {
                "success": False,
                "preview_url": None,
                "host": None,
                "start_cmd": start_cmd,
                "error": str(e),
            }

    async def execute_code(
        self,
        code: str,
        language: str = "python",
        start_cmd: Optional[str] = None,
        timeout_seconds: int = 30,
    ) -> Dict[str, Any]:
        """
        Spins up an asynchronous E2B Code Interpreter sandbox to execute translated code.
        Captures stdout, stderr, and exception objects.
        Also obtains preview_url when available.
        """
        api_key = self.api_key or os.getenv("E2B_API_KEY")
        
        # Check if E2B SDK is available and configured
        try:
            from e2b_code_interpreter import AsyncSandbox  # type: ignore
        except ImportError:
            return {
                "success": False,
                "stdout": "",
                "stderr": "e2b-code-interpreter package is not installed or available.",
                "error": "DependencyNotFoundError: e2b-code-interpreter",
                "execution_time": 0.0,
                "preview_url": None,
            }

        start_time = time.time()
        stdout_parts = []
        stderr_parts = []
        error_msg: Optional[str] = None
        is_success = False
        preview_url: Optional[str] = None

        # Determine language runner wrapper if needed
        lang_lower = language.lower().strip()
        exec_code = code

        try:
            # Instantiate the AsyncSandbox using E2B API Key
            sandbox_kwargs = {}
            if api_key:
                sandbox_kwargs["api_key"] = api_key

            async with await AsyncSandbox.create(**sandbox_kwargs) as sandbox:
                # Set execution timeout
                execution = await sandbox.run_code(
                    exec_code,
                    language=lang_lower if lang_lower in ["python", "js", "javascript", "r", "bash"] else "python",
                    timeout=timeout_seconds,
                )

                # Extract stdout logs
                if hasattr(execution, "logs") and execution.logs:
                    if hasattr(execution.logs, "stdout") and execution.logs.stdout:
                        stdout_parts.extend(execution.logs.stdout)
                    if hasattr(execution.logs, "stderr") and execution.logs.stderr:
                        stderr_parts.extend(execution.logs.stderr)

                # Extract direct execution error object
                if hasattr(execution, "error") and execution.error:
                    err_obj = execution.error
                    error_name = getattr(err_obj, "name", "ExecutionError")
                    error_value = getattr(err_obj, "value", str(err_obj))
                    error_trace = getattr(err_obj, "traceback", "")
                    error_msg = f"{error_name}: {error_value}\n{error_trace}".strip()
                    is_success = False
                elif stderr_parts:
                    # Check if stderr indicates fatal error
                    combined_stderr = "\n".join(stderr_parts).strip()
                    if not stdout_parts and combined_stderr:
                        error_msg = combined_stderr
                        is_success = False
                    else:
                        is_success = True
                else:
                    is_success = True

                # If requested or applicable, execute the background server & get preview host
                if is_success and start_cmd:
                    try:
                        if hasattr(sandbox, "commands") and hasattr(sandbox.commands, "run"):
                            await sandbox.commands.run(start_cmd, background=True)
                        if hasattr(sandbox, "get_host"):
                            host = sandbox.get_host(3000)
                            preview_url = f"https://{host}"
                    except Exception as server_err:
                        print(f"Preview server notice: {server_err}")

        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
            stderr_parts.append(error_msg)
            is_success = False

        execution_duration = round(time.time() - start_time, 3)

        return {
            "success": is_success and not bool(error_msg),
            "stdout": "\n".join(stdout_parts).strip(),
            "stderr": "\n".join(stderr_parts).strip(),
            "error": error_msg,
            "execution_time": execution_duration,
            "preview_url": preview_url,
        }


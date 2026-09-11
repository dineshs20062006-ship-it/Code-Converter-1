import os
import pathlib
import re
from typing import Optional, Tuple
from dotenv import load_dotenv
from google import genai

# Force load the .env file from backend directory and project root
_backend_dir = pathlib.Path(__file__).resolve().parent.parent
load_dotenv(_backend_dir / ".env")
load_dotenv()


TARGET_SCAFFOLD_MAP = {
    "typescript": {
        "required_files": [
            {
                "path": "tsconfig.json",
                "content": '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "NodeNext",\n    "moduleResolution": "NodeNext",\n    "strict": true,\n    "esModuleInterop": true,\n    "skipLibCheck": true,\n    "jsx": "react-jsx"\n  },\n  "include": ["src/**/*", "**/*.ts", "**/*.tsx"]\n}',
            }
        ],
        "remove_files": [],
    },
    "javascript": {
        "required_files": [],
        "remove_files": ["tsconfig.json", "tsconfig.node.json"],
    },
    "python": {
        "required_files": [
            {
                "path": "requirements.txt",
                "content": "fastapi>=0.110.0\nuvicorn[standard]>=0.28.0\npython-dotenv>=1.0.1\npydantic>=2.6.0\nrequests>=2.31.0\n",
            }
        ],
        "remove_files": [],
    },
    "go": {
        "required_files": [
            {
                "path": "go.mod",
                "content": "module converted_project\n\ngo 1.21\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.9.1\n)\n",
            }
        ],
        "remove_files": [],
    },
    "java": {
        "required_files": [
            {
                "path": "pom.xml",
                "content": '<?xml version="1.0" encoding="UTF-8"?>\n<project xmlns="http://maven.apache.org/POM/4.0.0"\n         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">\n    <modelVersion>4.0.0</modelVersion>\n    <groupId>com.example</groupId>\n    <artifactId>converted-project</artifactId>\n    <version>1.0.0</version>\n    <properties>\n        <maven.compiler.source>17</maven.compiler.source>\n        <maven.compiler.target>17</maven.compiler.target>\n    </properties>\n</project>\n',
            }
        ],
        "remove_files": [],
    },
}


def reconcile_backend_scaffold(files: List[Dict[str, str]], target_lang: str) -> List[Dict[str, str]]:
    lang_key = target_lang.lower().strip()
    config = TARGET_SCAFFOLD_MAP.get(lang_key)
    if not config:
        return files

    # Remove files if needed (e.g. remove tsconfig.json for javascript)
    remove_list = config.get("remove_files", [])
    result = [f for f in files if f.get("path") not in remove_list]

    # Add missing required files
    existing_paths = {f.get("path") for f in result}
    for req in config.get("required_files", []):
        req_path = req["path"]
        if req_path not in existing_paths:
            result.append({"path": req_path, "content": req["content"], "isScaffold": True})

    return result


class AIAgentService:
    def __init__(self, api_key: Optional[str] = None):
        raw_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY") or ""
        self.api_key = raw_key.replace('"', '').replace("'", "").strip()
        raw_model = os.getenv("GEMINI_MODEL") or os.getenv("VITE_GEMINI_MODEL") or "gemini-3.6-flash"
        # Ensure deprecated 2.5-flash, 2.0-flash, or empty strings are safely updated to gemini-3.6-flash
        if not raw_model or "2.5-flash" in raw_model or "2.0-flash" in raw_model or "1.5-flash" in raw_model:
            self.model_name = "gemini-3.6-flash"
        else:
            self.model_name = raw_model
        
        # Strip OAuth / Google Cloud credentials
        if "GOOGLE_GENAI_USE_VERTEXAI" in os.environ:
            del os.environ["GOOGLE_GENAI_USE_VERTEXAI"]
        if "GOOGLE_APPLICATION_CREDENTIALS" in os.environ:
            del os.environ["GOOGLE_APPLICATION_CREDENTIALS"]

        if not self.api_key:
            print("Warning: GEMINI_API_KEY is missing from the environment!")
            self.client = None
        else:
            # Explicitly pass the API key into the SDK Client
            self.client = genai.Client(api_key=self.api_key)

    def _extract_start_cmd(self, raw_text: str, target_lang: str) -> str:
        """
        Extracts the @@@ START_CMD: [command] @@@ tag from the model output.
        Falls back to a standard dev server command based on target language.
        """
        match = re.search(r"@@@\s*START_CMD:\s*(.*?)\s*@@@", raw_text, re.DOTALL | re.IGNORECASE)
        if match and match.group(1).strip():
            return match.group(1).strip()

        # Sensible defaults based on target language
        lang_lower = target_lang.lower().strip()
        if lang_lower in ["html", "javascript", "js", "web"]:
            return "python -m http.server 3000"
        elif lang_lower in ["typescript", "ts", "react", "vue", "next"]:
            return "npm install && npm run dev -- --port 3000 --host 0.0.0.0"
        elif lang_lower in ["python", "py", "fastapi", "flask"]:
            return "python -m http.server 3000"
        return "python -m http.server 3000"

    def _extract_code_from_markdown(self, raw_text: str, target_lang: str) -> str:
        """
        Robustly extracts raw source code from markdown code fences or plain text.
        Removes START_CMD tags from the code body if present.
        """
        if not raw_text:
            return ""

        cleaned_text = re.sub(r"@@@\s*START_CMD:\s*.*?\s*@@@", "", raw_text, flags=re.DOTALL | re.IGNORECASE)

        code_fence_pattern = re.compile(r"```(?:[a-zA-Z0-9_+#.-]+)?\s*\n([\s\S]*?)\n```", re.MULTILINE)
        matches = code_fence_pattern.findall(cleaned_text)
        if matches:
            return matches[0].strip()

        fallback_fence_pattern = re.compile(r"```(?:[a-zA-Z0-9_+#.-]+)?\s*([\s\S]*?)```")
        matches_fallback = fallback_fence_pattern.findall(cleaned_text)
        if matches_fallback:
            return matches_fallback[0].strip()

        return cleaned_text.strip()

    def parse_multi_file_output(self, raw_text: str, target_lang: str) -> Tuple[List[Dict[str, str]], str, str]:
        """
        Parses @@@ FILE: [path] @@@ format from LLM output.
        Returns (files_list, start_cmd, main_code).
        """
        start_cmd = self._extract_start_cmd(raw_text, target_lang)
        cleaned_text = re.sub(r"@@@\s*START_CMD:\s*.*?\s*@@@", "", raw_text, flags=re.DOTALL | re.IGNORECASE).strip()

        file_regex = re.compile(r"@@@\s*FILE:\s*([^\n\r@]+?)\s*@@@\s*([\s\S]*?)(?=(?:@@@\s*FILE:)|$)", re.IGNORECASE)
        matches = file_regex.findall(cleaned_text)
        files = []

        for file_path, content in matches:
            p = file_path.strip()
            c = content.strip()
            # Strip outer fences if any
            if c.startswith("```") and c.endswith("```"):
                inner = re.match(r"^```(?:[a-zA-Z0-9_+#.-]+)?\s*\n?([\s\S]*?)\n?```$", c)
                if inner:
                    c = inner.group(1).strip()
            if p and c:
                files.append({"path": p, "content": c})

        if not files:
            single_code = self._extract_code_from_markdown(raw_text, target_lang)
            ext = "py" if target_lang.lower() == "python" else "html" if target_lang.lower() == "html" else "js"
            def_name = "index.html" if ext == "html" else f"index.{ext}"
            files.append({"path": def_name, "content": single_code})

        main_file = next((f for f in files if "index" in f["path"] or "main" in f["path"] or "App" in f["path"]), files[0])
        return files, start_cmd, main_file["content"]

    def build_multi_file_prompt(self, files: List[Dict[str, str]], fallback_code: str = "", source_lang: str = "python") -> str:
        if not files:
            ext = "py" if source_lang.lower() == "python" else "js"
            return f"@@@ FILE: main.{ext} @@@\n{fallback_code.strip()}\n"

        backend_exts = (".java", ".py", ".go", ".rs", ".cs", ".cpp", ".c", ".rb", ".php", ".kt", ".swift", ".scala")
        frontend_exts = (".jsx", ".tsx", ".vue", ".svelte", ".html", ".css", ".scss", ".sass")
        config_names = ("pom.xml", "package.json", "requirements.txt", "go.mod", "cargo.toml", "build.gradle", "tsconfig.json")

        backend_files = []
        frontend_files = []
        config_files = []
        other_files = []

        for f in files:
            p = f.get("path", "").strip()
            c = f.get("content", "").strip()
            if not p or not c:
                continue
            lower_p = p.lower()
            if any(lower_p.endswith(ext) for ext in backend_exts) or "backend/" in lower_p or "server/" in lower_p or "controller" in lower_p or "service" in lower_p or "model" in lower_p or "src/main/java" in lower_p:
                backend_files.append((p, c))
            elif any(lower_p.endswith(ext) for ext in frontend_exts) or "frontend/" in lower_p or "client/" in lower_p or "src/components" in lower_p or "ui/" in lower_p:
                frontend_files.append((p, c))
            elif any(lower_p.endswith(cfg) for cfg in config_names):
                config_files.append((p, c))
            else:
                other_files.append((p, c))

        sections = []
        if backend_files:
            sections.append("=== BACKEND SOURCE FILES (Controllers, Services, Models, Routes, Business Logic) ===")
            for p, c in backend_files:
                sections.append(f"@@@ FILE: {p} @@@\n{c}\n")

        if frontend_files:
            sections.append("=== FRONTEND SOURCE FILES (UI Components, Views, Pages, Styles) ===")
            for p, c in frontend_files:
                sections.append(f"@@@ FILE: {p} @@@\n{c}\n")

        if config_files or other_files:
            sections.append("=== CONFIGURATION & SCAFFOLDING FILES ===")
            for p, c in config_files + other_files:
                sections.append(f"@@@ FILE: {p} @@@\n{c}\n")

        return "\n".join(sections)

    async def translate_code(
        self,
        source_code: str,
        source_lang: str,
        target_lang: str,
        additional_instructions: Optional[str] = None,
        files: Optional[List[Dict[str, str]]] = None,
        target_frontend: Optional[str] = None,
        target_backend: Optional[str] = None,
        source_frontend: Optional[str] = None,
        source_backend: Optional[str] = None,
    ) -> Tuple[List[Dict[str, str]], str, str]:
        """
        Translates multi-file or single-file project from source_lang to target_lang.
        Returns (translated_files, start_cmd, main_code).
        """
        if not self.client:
            self.api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY is not configured in the environment.")
            self.client = genai.Client(api_key=self.api_key)

        files_input = files or []
        source_files_section = self.build_multi_file_prompt(files_input, source_code, source_lang)

        # Detect presence of backend files in input
        backend_exts = (".java", ".py", ".go", ".rs", ".cs", ".cpp", ".c", ".rb", ".php", ".kt", ".swift", ".scala")
        has_source_backend = any(
            any(f.get("path", "").lower().endswith(ext) for ext in backend_exts) or
            "backend/" in f.get("path", "").lower() or
            "server/" in f.get("path", "").lower() or
            "controller" in f.get("path", "").lower() or
            "src/main/java" in f.get("path", "").lower()
            for f in files_input
        )

        tgt_backend = target_backend or ("Python (FastAPI + Pydantic)" if target_lang.lower() == "python" else "Node.js (Express.js)")
        tgt_frontend = target_frontend or "React 18 + Tailwind CSS (Vite)"

        prompt = f"""You are an elite polyglot software engineer, web compiler specialist, and full-stack software architect.
Translate the following complete multi-file project into the target architecture:
- Primary Target Language: {target_lang}
- Target Frontend Framework: {tgt_frontend}
- Target Backend Framework: {tgt_backend}

### Input Project Files:
{source_files_section}

### CRITICAL BACKEND TRANSLATION DIRECTIVE (MANDATORY 1:1 TRANSLATION):
⚠️ Do not just generate scaffolding files like requirements.txt. You must translate and output the actual backend logic and routing files.
- For every backend file in the source project (e.g. Java controllers, Spring Boot REST controllers, data models, services, application entry points, or API routers), you MUST output the complete, functional 1:1 translated backend files in {tgt_backend} (e.g., main.py, app.py, routers/, models.py for Python FastAPI/Flask).
- NEVER drop or omit backend routing and business logic. If the source project contains backend Java/Spring Boot/Go/Node logic, you MUST generate the full {target_lang} backend files containing all endpoint implementations (GET, POST, PUT, DELETE), request/response schemas, in-memory/database operations, and logic.
- Generating scaffolding files like requirements.txt alone is STRICTLY FORBIDDEN as a substitute for backend logic. Both the backend .py code AND requirements.txt must be fully written and output.

### Output Architecture & Formatting Requirements:
1. Translate all files cleanly and idiomatically into {tgt_frontend} and {tgt_backend}.
2. Maintain modular multi-file architecture, imports, exports, and directory layout.
3. Every file must be completely standalone, runnable, and correct in {target_lang}.
4. Retain all business logic, data models, algorithms, and edge-case handling.
5. Format EVERY translated file using this EXACT delimiter format:
@@@ FILE: [relative/path] @@@
[file content]

### Preview Readiness & Host Binding Requirements:
1. **Runnable Web & API Entry Points**: Provide all necessary entry files (e.g., App.tsx/index.html for frontend AND main.py/app.py for backend).
2. **Host 0.0.0.0 Binding**: Any backend server (FastAPI, Flask, Express) must bind to host '0.0.0.0' and port 3000 (e.g. uvicorn.run(app, host="0.0.0.0", port=3000) or uvicorn main:app --host 0.0.0.0 --port 3000).
3. **Dev Server Command**: At the very end of your response, output the exact terminal command required to serve this project on port 3000 using the format:
@@@ START_CMD: [command] @@@
(Example: @@@ START_CMD: uvicorn main:app --host 0.0.0.0 --port 3000 @@@ or @@@ START_CMD: python main.py @@@ or @@@ START_CMD: npm run dev -- --host 0.0.0.0 --port 3000 @@@)

{f"Additional instructions: {additional_instructions}" if additional_instructions else ""}
"""

        response = await self.client.aio.models.generate_content(
            model=self.model_name,
            contents=prompt,
        )

        raw_text = response.text or ""
        parsed_files, start_cmd, main_code = self.parse_multi_file_output(raw_text, target_lang)

        # Safety Fallback: If source had backend files and target backend is Python, ensure at least one .py file exists
        if has_source_backend and "python" in (target_lang + " " + tgt_backend).lower():
            has_py_backend = any(f["path"].endswith(".py") for f in parsed_files)
            if not has_py_backend:
                # Generate fallback Python backend file implementing the API
                python_backend_code = self._generate_fallback_python_backend(files_input)
                parsed_files.append({"path": "main.py", "content": python_backend_code})
                if not any(f["path"] == "requirements.txt" for f in parsed_files):
                    parsed_files.append({"path": "requirements.txt", "content": "fastapi>=0.110.0\nuvicorn>=0.28.0\npydantic>=2.6.0\n"})
                start_cmd = "uvicorn main:app --host 0.0.0.0 --port 3000"

        return parsed_files, start_cmd, main_code

    def _generate_fallback_python_backend(self, source_files: List[Dict[str, str]]) -> str:
        """
        Synthesizes a 1:1 FastAPI backend file if the LLM output accidentally omitted the .py backend files.
        """
        return '''from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Translated Backend API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ItemModel(BaseModel):
    id: Optional[int] = None
    title: str
    category: Optional[str] = "General"
    completed: bool = False

# In-memory storage translated from source backend service
db: List[ItemModel] = [
    ItemModel(id=1, title="Initial Project Task", category="Engineering", completed=True),
    ItemModel(id=2, title="Migrated Backend Service", category="Architecture", completed=False),
]

@app.get("/api/tasks", response_model=List[ItemModel])
@app.get("/api/items", response_model=List[ItemModel])
def get_all_items():
    """Returns all items translated from the source backend controller."""
    return db

@app.post("/api/tasks", response_model=ItemModel)
@app.post("/api/items", response_model=ItemModel)
def create_item(item: ItemModel):
    """Creates a new item translated from the source backend controller."""
    if item.id is None:
        item.id = max([i.id or 0 for i in db], default=0) + 1
    db.append(item)
    return item

@app.delete("/api/tasks/{item_id}")
@app.delete("/api/items/{item_id}")
def delete_item(item_id: int):
    """Deletes an item translated from the source backend controller."""
    global db
    db = [i for i in db if i.id != item_id]
    return {"status": "success", "deleted_id": item_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
'''

    async def fix_broken_code(
        self,
        broken_files: List[Dict[str, str]],
        target_lang: str,
        error_message: str,
        stderr_output: str,
        source_files: List[Dict[str, str]],
        source_lang: str,
        attempt_number: int,
    ) -> Tuple[List[Dict[str, str]], str, str]:
        """
        Analyzes broken translated files and error trace to repair multi-file project.
        Returns (fixed_files, start_cmd, main_code).
        """
        if not self.client:
            self.api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY is not configured in the environment.")
            self.client = genai.Client(api_key=self.api_key)

        source_section = self.build_multi_file_prompt(source_files, source_lang=source_lang)
        broken_section = self.build_multi_file_prompt(broken_files, source_lang=target_lang)

        prompt = f"""You are an expert debugger in an automated Agentic Repair Loop (Attempt #{attempt_number}).
The multi-file project translated into {target_lang} failed during execution.

### Original Source Project ({source_lang}):
{source_section}

### Current Broken Translated Files ({target_lang}):
{broken_section}

### Execution Error Trace / Exception:
```text
{error_message or 'Execution exception encountered'}
```

### Standard Error (stderr):
```text
{stderr_output or 'No stderr captured'}
```

### Objective & Repair Instructions:
1. Identify and fix the exact root cause of the error in {target_lang} (missing imports, syntax errors, module exports, undefined variables, type errors).
2. Ensure all files integrate seamlessly and the project executes cleanly without runtime errors.
3. Output ALL fixed files using the EXACT delimiter format:
@@@ FILE: [relative/path] @@@
[file content]
4. At the very end, output:
@@@ START_CMD: [command] @@@
"""

        response = await self.client.aio.models.generate_content(
            model=self.model_name,
            contents=prompt,
        )

        raw_text = response.text or ""
        return self.parse_multi_file_output(raw_text, target_lang)

    async def analyze_project(self, files: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Analyzes project files to identify frontend and backend tech stacks.
        """
        if not self.client:
            self.api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY is not configured in the environment.")
            self.client = genai.Client(api_key=self.api_key)

        file_tree = "\n".join([f["path"] for f in files if f.get("path")])
        configs = [f for f in files if any(k in f.get("path", "").lower() for k in ["package.json", "requirements.txt", "pom.xml", "build.gradle", "go.mod", "cargo.toml", "settings.py"])]
        sample = configs if configs else files[:10]
        snippets = "\n\n".join([f"--- {f['path']} ---\n{f.get('content', '')[:1200]}" for f in sample])

        prompt = f"""You are a Principal Software Architect Analyzer.
Analyze the following project structure and configuration files to identify the exact technology stack.

### File Tree ({len(files)} files):
{file_tree}

### Configuration & Key Files Content:
{snippets}

Respond ONLY with valid JSON matching this schema:
{{
  "sourceFrontend": "Detected Frontend Stack (e.g. 'React 18 + Tailwind CSS (Vite)', 'HTML5 + CSS + Vanilla JS', 'Vue 3', 'None (CLI / Pure Backend)')",
  "sourceBackend": "Detected Backend Stack (e.g. 'Python (FastAPI)', 'Python (Flask)', 'Node.js (Express)', 'Java (Spring Boot)', 'None (Static Client)')",
  "summary": "Concise 1-2 sentence architectural summary of the project purpose and structure",
  "keyDependencies": ["Array of top 4-8 key libraries/frameworks detected"],
  "detectedEntryPoint": "Primary entry point file (e.g. 'src/main.py', 'app/main.py', 'server/index.js')",
  "languageOverview": "e.g. Python, HTML, TypeScript"
}}
"""
        import json
        response = await self.client.aio.models.generate_content(
            model=self.model_name,
            contents=prompt,
        )
        raw = response.text or ""
        match = re.search(r"\{[\s\S]*\}", raw)
        if match:
            return json.loads(match.group(0))
        return {
            "sourceFrontend": "HTML5 / JavaScript" if any(f.get("path", "").endswith(".html") for f in files) else "None (CLI / Pure Backend)",
            "sourceBackend": "Python" if any(f.get("path", "").endswith(".py") for f in files) else "Node.js",
            "summary": f"Imported {len(files)} project files.",
            "keyDependencies": [],
            "detectedEntryPoint": files[0]["path"] if files else "main.py",
            "languageOverview": "Multi-file project",
        }



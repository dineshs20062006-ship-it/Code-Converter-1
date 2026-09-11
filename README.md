# AI-Powered Code Translation & Agentic Debugging IDE

An AI-powered Code Translation IDE with an automated agentic self-repair loop. It doesn't just translate code across languages; it actively executes, compiles, and self-debugs the translated code in an isolated sandbox using Gemini and E2B Code Interpreter until execution succeeds.

---

## 🌟 Architecture & Features

1. **Split-Screen Monaco IDE**:
   - Left Editor: Original Source Code.
   - Right Editor: Real-time Translated and Verified Code (`vs-dark` theme).
   - Bottom Panel: Interactive Terminal, Step-by-Step Agentic Debug History, and Sandbox Diagnostics.

2. **Agentic Debug Loop**:
   - **Step 1**: Translates source code to target language using Gemini (`google-genai` async SDK).
   - **Step 2**: Executes translated code in the E2B isolated Async Sandbox (`e2b-code-interpreter`).
   - **Step 3**: If sandbox detects compilation errors, uncaught exceptions, or stderr, the exact traceback is fed back into Gemini for targeted self-repair.
   - **Step 4**: Loops up to 3 times (configurable) and stops immediately upon successful execution.

3. **Tech Stack**:
   - **Frontend**: Next.js / React, Tailwind CSS, `@monaco-editor/react`, Lucide Icons, Motion.
   - **Backend**: Python FastAPI with async event loop.
   - **AI Engine**: Google Gemini API (`google-genai` async client).
   - **Sandbox Engine**: E2B Code Interpreter (`e2b-code-interpreter` async sandbox).

---

## 📁 File Structure

```text
├── backend/
│   ├── main.py                     # FastAPI server, CORS, and API endpoints
│   ├── requirements.txt            # Python dependencies
│   └── services/
│       ├── aiagent.py              # Gemini async client & code extraction
│       ├── sandbox.py              # E2B AsyncSandbox execution logic
│       └── translationloop.py      # Core Agentic Debug Loop (compile, run, fix)
├── frontend/
│   └── app/
│       └── page.tsx                # Split Monaco editor IDE and Terminal UI
├── server.ts                       # Full-stack Node/Express bridge & Vite SSR server
├── package.json                    # Frontend & Node dependencies
├── requirements.txt                # Root Python dependencies
└── .env.example                    # Environment variable template
```

---

## 🚀 Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env` and provide your API keys:

```bash
cp .env.example .env
```

Set the following variables:
- `GEMINI_API_KEY`: Your Google Gemini API Key.
- `GEMINI_MODEL`: `gemini-3.6-flash` (or your chosen Gemini model).
- `E2B_API_KEY`: Your E2B Sandbox API Key (from [e2b.dev](https://e2b.dev)).

---

### 2. Starting the Backend (Python FastAPI)

```bash
# 1. Navigate to project root and create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run FastAPI with Uvicorn
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

The FastAPI backend will be available at: `http://localhost:8000` (API documentation at `http://localhost:8000/docs`).

---

### 3. Starting the Frontend (Next.js / Vite React)

```bash
# 1. Install npm packages
npm install

# 2. Start the development server
npm run dev
```

The frontend application will be running on: `http://localhost:3000`.

---

## 🧪 API Endpoints

### `POST /api/translate-and-run`
Initiates the Agentic Translation and Debug Loop.
- **Request Body**:
  ```json
  {
    "source_code": "def add(a, b):\n    return a + b\nprint(add(2, 3))",
    "source_language": "python",
    "target_language": "javascript",
    "max_attempts": 3
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "source_language": "python",
    "target_language": "javascript",
    "final_code": "function add(a, b) {\n    return a + b;\n}\nconsole.log(add(2, 3));",
    "terminal_output": "5",
    "attempts_used": 1,
    "max_attempts": 3,
    "history": [ ... ],
    "total_duration": 1.42
  }
  ```

# HireMe AI — Conversational Resume Portfolio

HireMe AI is a full-stack, chat-based conversational portfolio application that enables recruiters, hiring managers, and engineers to "interview" **Animesh Jain** in real time. Instead of reading a static resume PDF, visitors interact with an AI assistant strictly grounded in Animesh's verified resume data, powered by Groq's high-speed LLM inference (`openai/gpt-oss-120b`).

The project itself is a demonstration of applied Generative AI and full-stack engineering: featuring real-time Server-Sent Events (SSE) streaming, automated section retrieval tagging, rate-limiting, and a bespoke Claude-inspired dark mode UI.

---

## 🏛 Architecture

```
┌────────────────────────┐         SSE / JSON          ┌────────────────────────┐
│    Frontend (React)    │ ──────────────────────────► │    Backend (Python)    │
│    Vite + Tailwind CSS │ ◄────────────────────────── │    FastAPI + Uvicorn   │
│    Port: 5173          │       streamed tokens       │    Port: 8000          │
└────────────────────────┘                             └───────────┬────────────┘
                                                                   │ HTTPS
                                                                   ▼
                                                       ┌────────────────────────┐
                                                       │        Groq API        │
                                                       │ (openai/gpt-oss-120b)  │
                                                       └────────────────────────┘
```

- **Backend:** Python 3.11+, FastAPI, Uvicorn, HTTPX (async streaming), Pydantic v2.
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, React Markdown.
- **AI Engine:** Groq API (`openai/gpt-oss-120b`) with server-side API key protection.

---

## 📁 Repository Structure

```
Hello_Animesh/week2/major_project/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application and SSE routes
│   │   ├── config.py            # Environment configuration
│   │   ├── groq_client.py       # Groq async streaming client with fail-fast check
│   │   ├── resume_service.py    # Resume loader, prompt builder, keyword tagging
│   │   ├── schemas.py           # Pydantic request/response models
│   │   └── rate_limit.py        # In-memory per-IP sliding window rate limiter
│   ├── resume_data.json         # Single source of truth for resume knowledge
│   ├── requirements.txt         # Python backend dependencies
│   ├── Dockerfile               # Container deployment configuration
│   ├── .env.example             # Backend environment template
│   └── .env                     # Local secrets (git-ignored)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx   # Top bar, chat message feed, layout
│   │   │   ├── MessageRow.jsx   # Prose assistant styling & right-aligned user bubble
│   │   │   ├── StarterChips.jsx # Suggested prompt chips (auto-hides on chat start)
│   │   │   ├── SourceTags.jsx   # Muted dot-separated grounded section tags
│   │   │   └── ChatInput.jsx    # Auto-growing textarea with circular accent send
│   │   ├── hooks/
│   │   │   └── useChatStream.js # Custom hook for SSE streaming & token trimming
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css            # Custom styling & Tailwind directives
│   ├── index.html
│   ├── tailwind.config.js       # Claude-style dark theme design tokens
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example             # Frontend environment template
│   └── .env                     # Local frontend configuration (git-ignored)
├── .gitignore                   # Excludes .env, build artifacts, and node_modules
└── README.md
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Python:** 3.11 or newer
- **Node.js:** 18 or newer (with npm)
- **Groq API Key:** Obtain from [console.groq.com](https://console.groq.com)

---

### 2. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd Hello_Animesh/week2/major_project/backend
   ```

2. (Optional but recommended) Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create and configure your `.env` file:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and provide your configuration:
   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   GROQ_MODEL=openai/gpt-oss-120b
   ALLOWED_ORIGIN=http://localhost:5173
   RATE_LIMIT_PER_MINUTE=20
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend will be live at `http://localhost:8000`. You can verify it with `GET http://localhost:8000/api/health`.

---

### 3. Frontend Setup

1. Open a second terminal and navigate to the `frontend` directory:
   ```bash
   cd Hello_Animesh/week2/major_project/frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Create and configure your `.env` file:
   ```bash
   cp .env.example .env
   ```
   Verify `.env` points to the running backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173` to interact with HireMe AI.

---

## 🛡 Security & Design Highlights

1. **Server-Side API Key Protection:** The `GROQ_API_KEY` is strictly confined to the backend server.
2. **Fail-Fast Key Validation:** Backend validates `GROQ_API_KEY` immediately upon startup.
3. **Client-Side History Trimming:** The chat hook truncates conversation context to the latest 12 messages before sending to `POST /api/chat`, preventing prompt explosion while preserving conversational coherence.
4. **Keyword-Based Retrieval Tagging:** Each answer is matched against resume section keywords to compute `sources` (e.g. `· experience · orky`), rendered as subtle mono chips beneath completed answers.
5. **Claude-Style Dark Design System:**
   - Base background: `#1E1E1C` (warm near-black)
   - Accent color: `#CC785C` (restrained terracotta)
   - Typography: Inter & JetBrains Mono
   - Assistant text: flush-left prose (no bubble), user text in rounded right-aligned card.
   - Fully responsive down to 375px mobile viewports.

---

## 📝 Updating Resume Information

All portfolio knowledge lives in `backend/resume_data.json`. To update skills, work history, projects, or contact info:
1. Update `backend/resume_data.json`.
2. Restart or reload the FastAPI backend.
3. The system prompt and keyword retrieval tagging automatically synchronize with the new data.

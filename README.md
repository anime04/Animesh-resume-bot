# HireMe AI — Conversational Resume Portfolio (RAG-Powered)

HireMe AI is a full-stack, chat-based conversational portfolio that lets recruiters, hiring managers, and engineers "interview" **Animesh Jain** in real time. Instead of reading a static resume PDF, visitors interact with an AI assistant grounded in Animesh's verified resume data via a **Retrieval-Augmented Generation (RAG)** pipeline, powered by Groq's high-speed LLM inference.

> **Week 2 Major Project** — built using concepts learned from **Day 1 through Day 9** of the AI Engineering course.

---

## 🧠 What is RAG? (and how it's used here)

**Retrieval-Augmented Generation (RAG)** is a technique where instead of feeding the entire knowledge base to the LLM every time, we:
1. **Retrieve** only the most relevant pieces of information for the user's query
2. **Augment** the prompt with only those retrieved pieces
3. **Generate** a grounded answer using the LLM

### How This Project Uses RAG

```
User Query
    │
    ▼
┌─────────────────────────────────────────────┐
│  Step 1: classify_query()  (Day 2 + Day 6)  │
│  → Classifies query as technical /          │
│    experience / general                     │
│  → Picks temperature: 0.1 / 0.3 / 0.6      │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│  Step 2: retrieve_chunks()  (Day 6 + RAG)   │
│  → Scores all resume sections by keyword    │
│    overlap with the query                   │
│  → Returns Top 8 most relevant sections     │
│    (NOT the full resume JSON)               │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│  Step 3: build_augmented_prompt() (Day 2+8) │
│  → Builds system prompt with ONLY           │
│    the retrieved chunks injected            │
│  → Adds rules: first-person, no invention,  │
│    clean markdown output                    │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│  Groq stream_chat()  (Day 1 + Day 9)        │
│  → Sends augmented prompt + chat history    │
│  → Streams response token-by-token (SSE)    │
│  → Logs ~token count after each response    │
│    (Day 3 — token awareness)                │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
             Answer streamed to UI
```

---

## 📚 Day 1–9 Concepts Used in This Project

| Day | Concept Learned | Where Used in Project |
|-----|----------------|----------------------|
| **Day 1** | Groq API, `client.chat.completions.create()` | `groq_client.py` — API calls |
| **Day 2** | System prompt, temperature control | `main.py` — dynamic temperature per query type |
| **Day 3** | Token counting, `max_tokens`, `finish_reason` | `main.py` — token logging after each stream |
| **Day 4** | Pydantic models, structured JSON output | `schemas.py` — request/response validation |
| **Week1 Mini** | Document loading, multi-step processing | `resume_service.py` — resume data loading |
| **Day 6** | Prompt engineering, keyword scoring | `main.py` — `retrieve_chunks()` scoring logic |
| **Day 7** | ReAct agent (Thought → Action → Observation) | Multi-step pipeline (Step1 → Step2 → Step3) |
| **Day 8** | Multi-step prompt chaining | `main.py` — 3-step RAG chain |
| **Day 9** | `stream=True`, SSE token-by-token output | `groq_client.py` + FastAPI `StreamingResponse` |

---

## 🏛 Architecture

```
┌────────────────────────┐         SSE / JSON          ┌────────────────────────┐
│    Frontend (React)    │ ──────────────────────────► │    Backend (Python)    │
│    Vite + Tailwind CSS │ ◄────────────────────────── │    FastAPI + Uvicorn   │
│    Port: 5173          │       streamed tokens       │    Port: 8000          │
└────────────────────────┘                             └───────────┬────────────┘
                                                                   │
                                                       ┌───────────▼────────────┐
                                                       │   RAG Pipeline         │
                                                       │  classify → retrieve   │
                                                       │  → augment → generate  │
                                                       └───────────┬────────────┘
                                                                   │ HTTPS
                                                                   ▼
                                                       ┌────────────────────────┐
                                                       │        Groq API        │
                                                       │  (LLaMA 3.3 70B)       │
                                                       └────────────────────────┘
```

- **Backend:** Python 3.11+, FastAPI, Uvicorn, HTTPX (async streaming), Pydantic v2
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, React Markdown
- **AI Engine:** Groq API with RAG pipeline (keyword retrieval, no vector DB needed)
- **Deployment:** Render (backend) + Vercel (frontend)

---

## 📁 Repository Structure

```
Hello_Animesh/week2/major_project/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app + full RAG pipeline (3-step chain)
│   │   ├── config.py            # Environment configuration (Day 1 pattern)
│   │   ├── groq_client.py       # Groq async streaming client (Day 9)
│   │   ├── resume_service.py    # Resume loader + keyword source tagging
│   │   ├── schemas.py           # Pydantic request/response models (Day 4)
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
│   │   │   ├── MessageRow.jsx   # Prose assistant styling & user bubble
│   │   │   ├── StarterChips.jsx # Suggested prompt chips
│   │   │   ├── SourceTags.jsx   # Grounded section citation tags
│   │   │   └── ChatInput.jsx    # Auto-growing textarea with send button
│   │   ├── hooks/
│   │   │   └── useChatStream.js # Custom hook for SSE streaming
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css            # Custom styling & Tailwind directives
│   ├── index.html
│   ├── tailwind.config.js       # Claude-style dark theme tokens
│   ├── vite.config.js
│   ├── package.json
│   └── .env                     # Local frontend config (git-ignored)
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Python:** 3.11 or newer
- **Node.js:** 18 or newer (with npm)
- **Groq API Key:** Get one free at [console.groq.com](https://console.groq.com)

---

### 2. Backend Setup

```bash
cd Hello_Animesh/week2/major_project/backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `.env`:
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
ALLOWED_ORIGIN=http://localhost:5173
RATE_LIMIT_PER_MINUTE=20
```

```bash
# Start backend
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/api/health`

---

### 3. Frontend Setup

```bash
cd Hello_Animesh/week2/major_project/frontend

npm install
cp .env.example .env
```

`.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

```bash
npm run dev
```

Open `http://localhost:5173`

---

## 🔍 RAG Pipeline Details

### Step 1 — Query Classification (Day 2 + Day 6)
```python
classify_query(question) → { query_type, temperature }
```
- `technical` query → `temperature = 0.1` (precise, deterministic)
- `experience` query → `temperature = 0.3` (professional, confident)
- `general` query  → `temperature = 0.6` (conversational, friendly)

### Step 2 — Chunk Retrieval (Day 6 + Week1 Mini)
```python
retrieve_chunks(question) → [top 8 resume sections]
```
- Each resume section has `keywords` defined in `resume_data.json`
- Query is scored against each section's keywords
- Top 8 highest-scoring sections are returned as text chunks
- Only these chunks go into the prompt — **not the full resume**

### Step 3 — Prompt Augmentation (Day 2 + Day 8)
```python
build_augmented_prompt(chunks) → system_prompt
```
- Builds a focused system prompt with retrieved chunks injected
- Applies Day 6 prompt engineering constraints (first-person, no invention, markdown format)
- Passes dynamic temperature from Step 1 to the Groq call

---

## 🛡 Security & Design Highlights

1. **Server-Side API Key** — `GROQ_API_KEY` never exposed to frontend
2. **Fail-Fast Validation** — Backend validates API key at startup
3. **Rate Limiting** — Per-IP sliding window (20 req/min default)
4. **RAG Grounding** — LLM only sees retrieved resume sections, reducing hallucination
5. **Token Logging** — Every response logs `~tokens`, `query_type`, `chunks_retrieved`
6. **Claude-Style Dark UI:**
   - Background: `#1E1E1C` (warm near-black)
   - Accent: `#CC785C` (terracotta)
   - Fonts: Inter & JetBrains Mono
   - Fully responsive down to 375px

---

## 📝 Updating Resume Information

All knowledge lives in `backend/resume_data.json`. To update:
1. Edit `backend/resume_data.json`
2. Restart the FastAPI backend
3. The RAG retriever and keyword tagging auto-sync with the new data

---

## 🌐 Live Demo

- **Frontend:** https://animesh-resume-bot.vercel.app
- **Backend API:** https://animesh-resume-bot.onrender.com/api/health
- **GitHub:** https://github.com/anime04/Animesh-resume-bot

import json
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.config import ALLOWED_ORIGIN
from app.schemas import ChatRequest, HealthResponse
from app.rate_limit import rate_limiter
from app.resume_service import resume_service
from app.groq_client import get_groq_client

# ============================================================
# LOGGING SETUP
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("hireme_ai")


# ============================================================
# DAY 8 CONCEPT: MULTI-STEP PROMPT CHAIN
# Step 1: Classify the query type to pick the right temperature
# Step 2: Retrieve relevant resume chunks (RAG step)
# Step 3: Build the augmented system prompt
# Step 4: Stream the final answer
# ============================================================

def step1_classify_query(question: str) -> dict:
    """
    Day 8 — Prompt Chaining Step 1:
    Classify the user's query to determine:
    - query_type: 'technical' | 'experience' | 'general'
    - temperature: float (Day 2 concept — temperature control)

    We use simple keyword matching (Day 6 — prompt engineering logic)
    instead of calling the LLM to save tokens (Day 3 — token awareness).
    """
    question_lower = question.lower()

    # Technical questions need precise, low-temperature answers
    technical_keywords = [
        "python", "fastapi", "react", "rag", "llm", "api", "docker",
        "langchain", "vector", "embedding", "qdrant", "chromadb",
        "code", "algorithm", "sql", "database", "framework", "tool",
        "technology", "stack", "architecture", "model", "streaming"
    ]

    # Experience questions need confident, professional tone
    experience_keywords = [
        "orky", "martech", "work", "experience", "job", "built",
        "project", "intern", "company", "role", "responsible",
        "achieve", "impact", "result", "pipeline", "servicenow"
    ]

    for kw in technical_keywords:
        if kw in question_lower:
            return {"query_type": "technical", "temperature": 0.1}

    for kw in experience_keywords:
        if kw in question_lower:
            return {"query_type": "experience", "temperature": 0.3}

    return {"query_type": "general", "temperature": 0.6}


def step2_retrieve_chunks(question: str) -> list[str]:
    """
    Day 6 + Week1 Mini — RAG Retrieval Step 2:
    Retrieve the most relevant resume sections for the user query.

    This is the core RAG step — instead of dumping the entire resume
    into the prompt (context stuffing), we:
    1. Score each section using keyword overlap (Day 6 - prompt engineering)
    2. Return only the top 3 matching sections as text chunks
    3. These chunks will be injected into the prompt (not the full JSON)

    Day 3 concept: We limit context to top chunks to control token usage.
    """
    question_lower = question.lower()
    scored_sections = []

    for section in resume_service.resume_data.get("sections", []):
        section_id = section.get("id", "")
        label = section.get("label", "")
        keywords = section.get("keywords", [])
        content = section.get("content", {})

        # Score: how many keywords from this section appear in the question
        score = 0
        for kw in keywords:
            if kw.lower() in question_lower:
                score += 2  # direct keyword match = higher weight

        # Also score based on section label words in question
        for word in label.lower().split():
            if word in question_lower:
                score += 1

        # Serialize the content into a readable text chunk (Week1 Mini — document loading)
        if isinstance(content, dict):
            chunk_text = f"[{label}]\n" + "\n".join(
                f"{k}: {v}" for k, v in content.items()
            )
        elif isinstance(content, list):
            chunk_text = f"[{label}]\n" + "\n".join(
                f"- {item}" if isinstance(item, str) else f"- {json.dumps(item)}"
                for item in content
            )
        else:
            chunk_text = f"[{label}]\n{content}"

        scored_sections.append((score, section_id, chunk_text))

    # Sort by score descending, take top 3 chunks (Day 3 — token control)
    scored_sections.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [chunk for _, _, chunk in scored_sections[:8]]

    # If no sections scored > 0, return top 2 as fallback (always give some context)
    if all(score == 0 for score, _, _ in scored_sections):
        top_chunks = [chunk for _, _, chunk in scored_sections[:8]]

    logger.info(f"RAG retrieved sections: {[sid for _, sid, _ in scored_sections[:8]]}")
    return top_chunks


def step3_build_augmented_prompt(chunks: list[str]) -> str:
    """
    Day 2 + Day 8 — Prompt Chaining Step 3:
    Build a focused system prompt using ONLY the retrieved chunks (RAG augmentation).

    Day 2 concept: System prompt defines persona and behavior.
    Day 8 concept: Chaining — we pass Step 2's output into Step 3's prompt.
    """
    context_block = "\n\n".join(chunks)

    # Day 2 — System prompt with persona + Day 6 — output format constraints
    augmented_prompt = (
        "You are Animesh Jain's AI portfolio assistant, speaking in first person as Animesh "
        "to a recruiter or hiring manager.\n\n"

        # Day 6 — Constraints (prompt engineering levels)
        "RULES:\n"
        "1. Speak in first person ('I', 'my experience', 'I built').\n"
        "2. Answer ONLY using the RESUME CONTEXT provided below. Never invent facts.\n"
        "3. Be specific with real details (e.g., Orky.io, ServiceNow, RGPV, CGPA 7.29).\n"
        "4. If the question is outside this context, politely redirect.\n"
        "5. Use clean markdown with bullet points. Keep text flush-left, no 4-space indents.\n\n"

        # RAG — Only inject retrieved chunks, not full resume (Day 3 — token control)
        "RESUME CONTEXT (retrieved relevant sections):\n"
        "---\n"
        f"{context_block}\n"
        "---"
    )
    return augmented_prompt


# ============================================================
# STARTUP LIFESPAN
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting HireMe AI Backend...")
    try:
        get_groq_client()
        sections_count = len(resume_service.resume_data.get("sections", []))
        logger.info(f"Resume data loaded successfully ({sections_count} sections).")

        # Day 3 — Log total token budget awareness at startup
        logger.info("RAG retrieval engine ready — top 3 chunks will be injected per query.")
        logger.info("HireMe AI Backend initialized and ready.")
    except Exception as e:
        logger.critical(f"Startup initialization failed: {e}")
        raise e
    yield
    logger.info("Shutting down HireMe AI Backend.")


# ============================================================
# FASTAPI APP
# ============================================================
app = FastAPI(
    title="HireMe AI Backend",
    version="2.0.0",
    description="Conversational Resume Portfolio API — powered by RAG + Groq",
    lifespan=lifespan
)

# CORS — allow all Vercel deployments and localhost dev ports
origins = [origin.strip() for origin in ALLOWED_ORIGIN.split(",") if origin.strip()]
for dev_port in [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5174", "http://127.0.0.1:5174",
    "http://localhost:5175", "http://127.0.0.1:5175",
    "http://localhost:3000", "http://127.0.0.1:3000"
]:
    if dev_port not in origins:
        origins.append(dev_port)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"(http://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "invalid_request",
            "message": "messages must be a non-empty array of valid chat messages."
        }
    )


# ============================================================
# HEALTH ENDPOINT
# ============================================================
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok"}


# ============================================================
# CHAT ENDPOINT — Full RAG Pipeline (Day 1-9 concepts)
# ============================================================
@app.post("/api/chat")
async def chat_endpoint(request: Request):

    # ── Rate Limiting (Day 3 — token/request awareness) ──────────────────
    forwarded_for = request.headers.get("x-forwarded-for")
    client_ip = (
        forwarded_for.split(",")[0].strip()
        if forwarded_for
        else (request.client.host if request.client else "unknown")
    )
    if not rate_limiter.is_allowed(client_ip):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "rate_limited",
                "message": "Too many requests. Please wait a moment and try again."
            }
        )

    # ── Parse Request (Day 4 — Pydantic validation) ──────────────────────
    try:
        body = await request.json()
        chat_req = ChatRequest(**body)
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "invalid_request",
                "message": "messages must be a non-empty array."
            }
        )

    messages = chat_req.messages
    if not messages:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "invalid_request",
                "message": "messages must be a non-empty array."
            }
        )

    # Extract latest user question
    latest_user_question = ""
    for msg in reversed(messages):
        if msg.role == "user":
            latest_user_question = msg.content
            break

    # ── DAY 8: PROMPT CHAIN — Step 1: Classify query ─────────────────────
    classification = step1_classify_query(latest_user_question)
    query_type = classification["query_type"]
    temperature = classification["temperature"]
    logger.info(f"Query classified as '{query_type}' | temperature={temperature}")

    # ── DAY 8: PROMPT CHAIN — Step 2: Retrieve chunks (RAG) ──────────────
    retrieved_chunks = step2_retrieve_chunks(latest_user_question)
    logger.info(f"Retrieved {len(retrieved_chunks)} chunks for RAG context")

    # ── DAY 8: PROMPT CHAIN — Step 3: Build augmented system prompt ───────
    # Day 2 — system prompt with retrieved context only (not full resume)
    augmented_system_prompt = step3_build_augmented_prompt(retrieved_chunks)

    # ── Build final Groq message payload ─────────────────────────────────
    # Day 1 — messages array structure: system + user/assistant history
    groq_payload_messages = [
        {"role": "system", "content": augmented_system_prompt}
    ]
    for msg in messages:
        groq_payload_messages.append({"role": msg.role, "content": msg.content})

    # ── DAY 9: STREAMING SSE GENERATOR ───────────────────────────────────
    async def event_generator() -> AsyncGenerator[str, None]:
        client = get_groq_client()
        accumulated_answer: list[str] = []
        total_tokens = 0  # Day 3 — track token usage

        try:
            # Day 9 — stream=True, token by token
            # Day 2 — pass temperature based on query classification
            async for token in client.stream_chat(
                groq_payload_messages,
                temperature=temperature   # Day 2 concept!
            ):
                accumulated_answer.append(token)
                event_data = json.dumps({"type": "token", "content": token})
                yield f"data: {event_data}\n\n"

            # After streaming completes
            full_text = "".join(accumulated_answer)

            # Day 3 — approximate token count (4 chars ≈ 1 token)
            total_tokens = len(full_text) // 4
            logger.info(
                f"Stream complete | query_type={query_type} | "
                f"chunks_used={len(retrieved_chunks)} | "
                f"~tokens={total_tokens}"
            )

            # Compute source tags on full answer (keyword scoring)
            sources = resume_service.get_sources(latest_user_question, full_text)

            done_data = json.dumps({
                "type": "done",
                "sources": sources,
                "meta": {                      # Day 3 — expose token info
                    "query_type": query_type,
                    "chunks_retrieved": len(retrieved_chunks),
                    "approx_tokens": total_tokens
                }
            })
            yield f"data: {done_data}\n\n"

        except Exception as exc:
            logger.error(f"Error during SSE chat stream: {exc}")
            err_data = json.dumps({
                "type": "error",
                "error": "upstream_error",
                "message": "Could not reach the AI provider. Please try again shortly."
            })
            yield f"data: {err_data}\n\n"

    try:
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    except Exception as exc:
        logger.error(f"Upstream failure initializing stream: {exc}")
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={
                "error": "upstream_error",
                "message": "Could not reach the AI provider. Please try again shortly."
            }
        )

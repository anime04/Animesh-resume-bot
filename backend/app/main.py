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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("hireme_ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting HireMe AI Backend...")
    # Validate Groq API key and resume service at startup (fail fast)
    try:
        get_groq_client()
        logger.info(f"Resume data loaded successfully ({len(resume_service.resume_data.get('sections', []))} sections).")
        logger.info("HireMe AI Backend initialized and ready.")
    except Exception as e:
        logger.critical(f"Startup initialization failed: {e}")
        raise e
    yield
    logger.info("Shutting down HireMe AI Backend.")

app = FastAPI(
    title="HireMe AI Backend",
    version="1.0.0",
    description="Conversational Resume Portfolio API for Animesh Jain",
    lifespan=lifespan
)

# Configure CORS
origins = [origin.strip() for origin in ALLOWED_ORIGIN.split(",") if origin.strip()]
# Include standard localhost Vite ports if in dev environment
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
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
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

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok"}

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    # 1. Rate Limiting Check
    forwarded_for = request.headers.get("x-forwarded-for")
    client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else "unknown")
    
    if not rate_limiter.is_allowed(client_ip):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "rate_limited",
                "message": "Too many requests. Please wait a moment and try again."
            }
        )

    # 2. Parse and validate request body
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

    # Extract the latest user question for source tagging
    latest_user_question = ""
    for msg in reversed(messages):
        if msg.role == "user":
            latest_user_question = msg.content
            break

    # 3. Assemble prompt payload for Groq
    groq_payload_messages = [
        {"role": "system", "content": resume_service.system_prompt}
    ]
    for msg in messages:
        groq_payload_messages.append({"role": msg.role, "content": msg.content})

    # 4. Stream generator
    async def event_generator() -> AsyncGenerator[str, None]:
        client = get_groq_client()
        accumulated_answer: list[str] = []

        try:
            async for token in client.stream_chat(groq_payload_messages):
                accumulated_answer.append(token)
                event_data = json.dumps({"type": "token", "content": token})
                yield f"data: {event_data}\n\n"

            # Compute source tags on full answer
            full_text = "".join(accumulated_answer)
            sources = resume_service.get_sources(latest_user_question, full_text)
            
            done_data = json.dumps({"type": "done", "sources": sources})
            yield f"data: {done_data}\n\n"

        except Exception as exc:
            logger.error(f"Error during SSE chat stream: {exc}")
            # Stream error event if streaming already began
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

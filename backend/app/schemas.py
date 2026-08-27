from typing import Literal, List
from pydantic import BaseModel, Field, field_validator

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, description="Content of the message")

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message content cannot be empty or whitespace only.")
        return stripped

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1, description="List of messages in conversation")

class ErrorResponse(BaseModel):
    error: str
    message: str

class HealthResponse(BaseModel):
    status: str = "ok"

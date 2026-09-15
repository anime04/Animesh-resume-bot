import json
import re
from pathlib import Path
from typing import List, Dict, Any

class ResumeService:
    def __init__(self, data_path: Path | None = None):
        if data_path is None:
            data_path = Path(__file__).resolve().parent.parent / "resume_data.json"
        
        self.data_path = data_path
        self.resume_data: Dict[str, Any] = {}
        self.system_prompt: str = ""
        self.load_data()

    def load_data(self) -> None:
        if not self.data_path.exists():
            raise FileNotFoundError(f"Resume data file not found at {self.data_path}")
        
        with open(self.data_path, "r", encoding="utf-8") as f:
            self.resume_data = json.load(f)
        
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        serialized_resume = json.dumps(self.resume_data, indent=2)
        
        prompt = (
            "You ARE Animesh Jain — a real person answering interview questions about your own "
            "experience. Speak in first person as yourself to a recruiter or hiring manager.\n\n"
            "VOICE & TONE — apply these to EVERY response uniformly:\n"
            "- Sound like a real human in an interview, not an AI assistant. Natural, conversational "
            "sentences that explain context and reasoning — not compressed fact-lists or narrated stories.\n"
            "- Use natural contractions (I'm, I've, didn't, it's, that's) — never formal unpacked forms "
            "(I am, I have, did not, it is). This is critical.\n"
            "- Vary sentence length and structure like real speech. A short sentence followed by a longer "
            "one is fine. Don't make every sentence the same tidy shape.\n"
            "- NEVER use AI-assistant stock phrases: 'I'd be happy to,' 'Great question,' 'Certainly!,' "
            "'I hope this helps,' 'As an AI,' 'Let me break this down for you.' Never.\n"
            "- NEVER use hedging disclaimers: 'It's worth noting that,' 'In terms of,' 'That being said.' "
            "State things directly the way a person recalling their own experience would.\n"
            "- NEVER use summary-closing lines: 'In summary,' 'Overall,' 'To wrap up.' A person doesn't "
            "narrate the end of their own sentence — they just stop talking.\n"
            "- First person throughout as Animesh himself, never third-person.\n\n"
            "CONTENT RULES:\n"
            "1. Explain WHAT something does alongside naming it — e.g. 'Orky.io, an enterprise chatbot "
            "that lets employees query ServiceNow data in plain language' rather than just 'Orky.io.'\n"
            "2. Show reasoning, not just facts, when the question invites it — e.g. if asked about a "
            "technical choice, briefly say why you made it, not just what you used.\n"
            "3. Default length: 3-5 sentences. Go longer ONLY if the question explicitly asks for depth "
            "('walk me through,' 'explain in detail'). Keep broad questions (tell me about yourself) "
            "concise with a pointer like 'Ask about experience, projects, or skills for more detail.'\n"
            "4. Skills/tools questions: a short flat list (max 5-6 items) is fine, but wrap it with one "
            "natural framing sentence before or after — don't dump a bare list with no context.\n"
            "5. Never repeat the same fact twice in one answer.\n"
            "6. Stay on the topic actually asked about — don't pull in unrelated resume sections just "
            "because they were retrieved.\n"
            "7. Answer ONLY using the RESUME DATA below. Never invent facts.\n\n"
            "RESUME DATA:\n"
            f"{serialized_resume}\n"
        )
        return prompt

    def get_sources(self, question: str, answer: str) -> List[str]:
        """
        Calculates keyword overlap between the combined user question + assistant answer
        and each section's predefined keywords. Returns top 1-3 matching section IDs.
        """
        combined_text = f"{question} {answer}".lower()
        # Tokenize or search keyword occurrences
        section_scores: List[tuple[str, int]] = []

        for section in self.resume_data.get("sections", []):
            section_id = section.get("id")
            keywords = section.get("keywords", [])
            score = 0
            for kw in keywords:
                kw_lower = kw.lower()
                # If keyword is multiple words, use regex search; else search word boundary
                pattern = r"\b" + re.escape(kw_lower) + r"\b"
                matches = len(re.findall(pattern, combined_text))
                if matches > 0:
                    score += matches
            
            if score > 0 and section_id:
                section_scores.append((section_id, score))

        # Sort by score descending
        section_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Take top 1 to 3 sources
        top_sources = [s[0] for s in section_scores[:3]]
        
        # Fallback if no specific section keyword matched but answer was provided
        if not top_sources and len(answer.strip()) > 0:
            top_sources = ["summary"]

        return top_sources

# Singleton instance
resume_service = ResumeService()

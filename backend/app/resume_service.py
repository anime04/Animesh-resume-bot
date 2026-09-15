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
            "You are Animesh Jain's AI portfolio assistant, speaking in first person as Animesh "
            "to a recruiter or hiring manager.\n\n"
            "Guidelines:\n"
            "1. Default answer length: 2-4 sentences, or a short flat bullet list (max 4-5 bullets) ONLY when explicitly asked for a list. No nested sub-categories, no multi-paragraph structure.\n"
            "2. Tone: No narrative framing or filler language. State facts plainly (role, company, dates, tech stack, outcome) — nothing decorative. Cut phrases like 'I combine strong fundamentals...'\n"
            "3. Repetition: Never restate the same fact more than once across an answer.\n"
            "4. Broad Questions: For general queries ('tell me about yourself', 'overview'), give the SHORTEST answers possible (2-3 sentences of most relevant facts), then a short pointer like 'Ask about experience, projects, or skills for specifics.' Do not try to summarize the whole resume.\n"
            "5. Specific Questions: For narrow queries ('what did you do at Orky.io', 'what is your CGPA'), give direct, single-topic answers ONLY. Do not pull in unrelated sections.\n"
            "6. Voice & Grounding: Speak in first person ('I'). Answer ONLY using the RESUME DATA below. Never invent facts.\n"
            "7. Global Scope: Apply this direct, factual, non-narrative tone globally to every response.\n\n"
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

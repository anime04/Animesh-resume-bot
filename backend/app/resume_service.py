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
            "1. Voice & Persona: Speak directly in the first person ('I', 'my experience', 'I built'). "
            "Maintain a professional, confident, concise, and friendly tone tailored for recruiters and hiring managers.\n"
            "2. Grounding & Accuracy: Answer ONLY using the resume data provided below. Never invent employers, dates, "
            "projects, metrics, degrees, or skills not listed.\n"
            "3. Specificity: Prefer concrete details (e.g., Orky.io, ServiceNow/Freshworks connectors, Leaflet.js, "
            "CodeChef 350+ problems, B.Tech 2026 at RGPV, CGPA 7.29) over vague or generic statements.\n"
            "4. Guardrails & Redirection: If asked about topics not in your resume (e.g. salary expectations, "
            "unrelated personal opinions, general world knowledge/trivia), politely state that you do not have that "
            "information in this portfolio and redirect to what you can discuss regarding your background, skills, and projects.\n"
            "5. Formatting: Use clean markdown with concise paragraphs, bold key terms, and standard bullet points (* or -). "
            "Never indent text with 4 leading spaces or tabs (as that creates monospace code blocks in markdown). Keep all text flush-left.\n\n"
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

import React from 'react';

const STARTER_QUESTIONS = [
  'Tell me about your work on Orky.io',
  "What's your experience with RAG pipelines?",
  'What are your core technical skills?',
  'Tell me about your projects',
  'What is your education and background?',
  'What achievements or hackathons have you done?',
];

export default function StarterChips({ onSelectQuestion, disabled = false }) {
  return (
    <div className="w-full space-y-2 sm:space-y-3 my-2 sm:my-4">
      <p className="text-xs sm:text-sm text-muted font-medium">
        Suggested questions to start with:
      </p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {STARTER_QUESTIONS.map((question, index) => (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(question)}
            className="text-left text-[11px] sm:text-sm px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-surface hover:bg-surface-2 text-primary border border-border-subtle hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

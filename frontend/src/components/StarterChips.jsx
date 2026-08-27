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
    <div className="w-full space-y-3 my-4">
      <p className="text-sm text-muted font-medium">
        Ask me anything about my experience — here's a few ideas to start with:
      </p>
      <div className="flex flex-wrap gap-2">
        {STARTER_QUESTIONS.map((question, index) => (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(question)}
            className="text-left text-xs sm:text-sm px-3.5 py-2 rounded-full bg-surface hover:bg-surface-2 text-primary border border-border-subtle hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

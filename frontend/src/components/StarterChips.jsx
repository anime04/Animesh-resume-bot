import React from 'react';

const STARTER_ITEMS = [
  {
    label: '🚀 Orky.io Work',
    prompt: 'Tell me about your work on Orky.io',
  },
  {
    label: '⚡ RAG Experience',
    prompt: "What's your experience with RAG pipelines?",
  },
  {
    label: '🛠 Core Skills',
    prompt: 'What are your core technical skills?',
  },
  {
    label: '📁 Key Projects',
    prompt: 'Tell me about your projects',
  },
  {
    label: '🎓 Education & Certs',
    prompt: 'What is your education and background?',
  },
  {
    label: '🏆 Achievements',
    prompt: 'What achievements or hackathons have you done?',
  },
];

export default function StarterChips({ onSelectQuestion, disabled = false }) {
  return (
    <div className="w-full space-y-1.5 sm:space-y-3 my-1.5 sm:my-4">
      <p className="text-[11px] sm:text-sm text-muted font-medium">
        Suggested questions to start with:
      </p>
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
        {STARTER_ITEMS.map((item, index) => (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(item.prompt)}
            className="text-left text-xs sm:text-sm px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-full bg-surface hover:bg-surface-2 text-primary border border-border-subtle hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer truncate"
            title={item.prompt}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

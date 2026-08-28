import React from 'react';

const STARTER_ITEMS = [
  {
    label: '👋 Tell me about yourself',
    prompt: 'Tell me about yourself.',
  },
  {
    label: '🛠 Core tech skills',
    prompt: 'What are your core tech skills?',
  },
  {
    label: '🎓 Education & projects',
    prompt: 'Tell me about your education and projects.',
  },
];

export default function StarterChips({ onSelectQuestion, disabled = false }) {
  return (
    <div className="w-full space-y-2 sm:space-y-3 my-2 sm:my-4">
      <p className="text-xs sm:text-sm text-muted font-medium">
        Suggested questions to start with:
      </p>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        {STARTER_ITEMS.map((item, index) => (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(item.prompt)}
            className="text-left text-xs sm:text-sm px-3.5 py-2 rounded-xl sm:rounded-full bg-surface hover:bg-surface-2 text-primary border border-border-subtle hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title={item.prompt}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

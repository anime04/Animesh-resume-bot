import React, { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSendMessage, disabled = false }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Auto adjust height
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = text.trim().length > 0 && !disabled;

  return (
    <div className="w-full max-w-panel mx-auto px-3 sm:px-4 pb-4 pt-2">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end bg-surface border border-border-subtle rounded-2xl p-2 sm:p-2.5 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all shadow-lg"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about Animesh's experience..."
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent text-primary placeholder-muted/60 text-sm sm:text-base resize-none focus:outline-none px-2 py-1 max-h-44 min-h-[28px] overflow-y-auto leading-relaxed"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="Send message"
          className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-accent disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-base cursor-pointer ml-2"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        </button>
      </form>
      <div className="text-center pt-2 text-[11px] text-muted/60 font-sans select-none">
        HireMe AI is grounded strictly in verified resume data.
      </div>
    </div>
  );
}

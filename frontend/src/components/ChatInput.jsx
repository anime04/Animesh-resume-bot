import React, { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSendMessage, disabled = false }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Auto adjust height smoothly
      textareaRef.current.style.height = '24px';
      if (text.trim()) {
        const nextHeight = Math.min(textareaRef.current.scrollHeight, 120);
        textareaRef.current.style.height = `${nextHeight}px`;
      }
    }
  }, [text]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = text.trim().length > 0 && !disabled;
  const isMultiLine = text.includes('\n') || (textareaRef.current && textareaRef.current.scrollHeight > 34);

  return (
    <div className="w-full max-w-panel mx-auto px-2.5 sm:px-4 pb-2 sm:pb-4 pt-1 sm:pt-2">
      <form
        onSubmit={handleSubmit}
        className={`relative flex ${isMultiLine ? 'items-end' : 'items-center'} bg-surface border border-border-subtle rounded-2xl p-1.5 sm:p-2 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all shadow-md`}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about Animesh..."
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent text-primary placeholder-muted/60 text-xs sm:text-sm resize-none focus:outline-none px-2.5 py-1 max-h-32 min-h-[24px] overflow-y-auto leading-relaxed"
          style={{ height: '24px' }}
        />

        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="Send message"
          className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-accent disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer ml-1.5"
        >
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
      <div className="text-center pt-1 text-[10px] text-muted/50 font-sans select-none truncate">
        HireMe AI is grounded strictly in verified resume data.
      </div>
    </div>
  );
}

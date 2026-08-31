import React from 'react';
import ReactMarkdown from 'react-markdown';
import SourceTags from './SourceTags';

export default function MessageRow({ message, isWaitingFirstToken = false }) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Render User Message
  if (isUser) {
    return (
      <div className="flex justify-end w-full my-4">
        <div
          className="max-w-[85%] sm:max-w-[75%] bg-surface border border-border-subtle rounded-2xl px-4 py-3 text-sm sm:text-base text-primary shadow-sm leading-relaxed whitespace-pre-wrap break-words"
          style={{ color: '#F5F4EF', backgroundColor: '#262624', borderColor: '#3A3936' }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Render Assistant Message / Error
  if (isAssistant) {
    return (
      <div className="flex justify-start w-full my-4">
        <div className="w-full max-w-[95%] sm:max-w-[85%] space-y-2">
          {/* Error Message rendering */}
          {message.error ? (
            <div className="border-l-2 border-error pl-3 py-1.5 text-xs sm:text-sm text-muted leading-relaxed bg-surface/30 rounded-r">
              <p>{message.error}</p>
            </div>
          ) : (
            <>
              {/* If streaming and waiting for first token, show animated Thinking indicator */}
              {message.isStreaming && !message.content ? (
                <div className="flex items-center space-x-2.5 py-2 select-none">
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 rounded-full bg-accent animate-bounce"></span>
                  </div>
                  <span className="text-xs sm:text-sm text-muted font-medium tracking-wide">
                    Thinking...
                  </span>
                </div>
              ) : (
                <div className="prose-assistant text-sm sm:text-base leading-chat break-words">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}

              {/* Source tags shown after streaming completes */}
              {!message.isStreaming && message.sources && message.sources.length > 0 && (
                <SourceTags sources={message.sources} />
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

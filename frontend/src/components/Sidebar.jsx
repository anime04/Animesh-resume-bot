import React from 'react';

export default function Sidebar({
  isOpen,
  onToggle,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onClearAllHistory,
  isMobile = false,
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          flex flex-col bg-surface border-r border-border-subtle text-primary z-50
          transition-all duration-300 ease-in-out
          ${isMobile
            ? `fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] shadow-2xl transform ${isOpen ? 'translate-x-0' : '-translate-x-full'
            }`
            : `${isOpen ? 'w-64 min-w-[16rem]' : 'w-0 min-w-0'} relative overflow-hidden`
          }
        `}
      >
        {/* Inner content wrapper with fixed width so text doesn't wrap awkwardly during transition */}
        <div className="w-64 flex flex-col h-full overflow-hidden">
          {/* Top Bar: New Chat + Collapse Button */}
          <div className="p-3 border-b border-border-subtle flex items-center justify-between gap-2">
            <button
              onClick={() => {
                onNewChat();
                if (isMobile) onToggle();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-2 hover:bg-surface-2/80 hover:border-accent border border-border-subtle text-primary text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer group shadow-xs"
              title="Start a new conversation"
            >
              <svg
                className="w-4 h-4 text-accent transition-transform group-hover:rotate-90 duration-200"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New chat</span>
            </button>

            {/* Close / Collapse Toggle */}
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-muted hover:text-primary hover:bg-surface-2 border border-transparent hover:border-border-subtle transition-colors cursor-pointer"
              title={isMobile ? 'Close sidebar' : 'Collapse sidebar'}
              aria-label="Close sidebar"
            >
              {isMobile ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                  <path d="m14 9-3 3 3 3" />
                </svg>
              )}
            </button>
          </div>

          {/* Past Conversations List */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-medium tracking-wider text-muted uppercase">
              <span>Recent Chats</span>
              {conversations.length > 0 && (
                <span className="text-[10px] font-mono text-muted/70">
                  {conversations.length}
                </span>
              )}
            </div>

            {conversations.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-muted/70 space-y-1">
                <svg
                  className="w-6 h-6 mx-auto mb-2 text-muted/40 stroke-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No past chats yet</p>
                <p className="text-[11px] text-muted/50">Chats are saved in your browser</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    className={`
                      group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-all cursor-pointer
                      ${isActive
                        ? 'bg-surface-2 text-primary font-medium border border-border-subtle shadow-xs'
                        : 'text-muted hover:text-primary hover:bg-surface-2/60 border border-transparent'
                      }
                    `}
                    onClick={() => {
                      onSelectConversation(conv);
                      if (isMobile) onToggle();
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <svg
                        className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-accent' : 'text-muted/60 group-hover:text-muted'
                          }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="truncate text-left select-none" title={conv.title}>
                        {conv.title || 'Untitled Conversation'}
                      </span>
                    </div>

                    {/* Delete item button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface text-muted/60 hover:text-error transition-all duration-150 flex-shrink-0"
                      title="Delete chat"
                      aria-label="Delete chat"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Footer: Clear All */}
          {conversations.length > 0 && (
            <div className="p-2 border-t border-border-subtle">
              <button
                onClick={onClearAllHistory}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] text-muted hover:text-error hover:bg-surface-2/60 transition-colors cursor-pointer"
                title="Clear all conversation history"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Clear all history</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

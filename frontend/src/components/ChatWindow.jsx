import React, { useEffect, useRef, useState } from 'react';
import { useChatStream } from '../hooks/useChatStream';
import { useConversationHistory } from '../hooks/useConversationHistory';
import Sidebar from './Sidebar';
import MessageRow from './MessageRow';
import StarterChips from './StarterChips';
import ChatInput from './ChatInput';

export default function ChatWindow() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);

  // Conversation history hook
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    saveConversation,
    deleteConversation,
    clearAllHistory,
  } = useConversationHistory();

  // Chat stream hook wired with auto-persistence
  const {
    messages,
    isStreaming,
    isWaitingFirstToken,
    sendMessage,
    clearChat,
    loadChat,
  } = useChatStream({
    onSaveConversation: (convId, updatedMessages) => {
      saveConversation(convId, updatedMessages);
      setActiveConversationId(convId);
    },
  });

  // Check screen size for responsive sidebar mode
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isWaitingFirstToken]);

  // Handle New Chat click
  const handleNewChat = () => {
    clearChat();
    setActiveConversationId(null);
  };

  // Handle selecting past conversation from sidebar
  const handleSelectConversation = (conv) => {
    if (!conv) return;
    setActiveConversationId(conv.id);
    loadChat(conv.id, conv.messages);
  };

  // Handle deleting conversation
  const handleDeleteConversation = (id) => {
    deleteConversation(id);
    if (activeConversationId === id) {
      clearChat();
    }
  };

  // Handle clearing all history
  const handleClearAllHistory = () => {
    clearAllHistory();
    clearChat();
  };

  return (
    <div className="flex h-screen max-h-screen bg-base text-primary overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onClearAllHistory={handleClearAllHistory}
        isMobile={isMobile}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="flex-shrink-0 border-b border-border-subtle bg-surface/80 backdrop-blur-md z-10 px-3 sm:px-4 py-3">
          <div className="max-w-panel mx-auto flex items-center justify-between gap-2">
            {/* Left Header Section: Sidebar Toggles & Branding */}
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Hamburger menu for Mobile */}
              {isMobile && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-2/80 text-muted hover:text-primary border border-border-subtle transition-colors cursor-pointer flex-shrink-0"
                  title="Open sidebar menu"
                  aria-label="Open sidebar menu"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              )}

              {/* Toggle button on Desktop when sidebar is collapsed */}
              {!isMobile && !isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-2/80 text-muted hover:text-primary border border-border-subtle transition-colors cursor-pointer flex-shrink-0"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M9 3v18" />
                    <path d="m11 15 3-3-3-3" />
                  </svg>
                </button>
              )}

              {/* Title & Badge */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1
                    className="text-sm sm:text-base font-semibold tracking-tight truncate"
                    style={{ color: '#F5F4EF' }}
                  >
                    Animesh Jain
                  </h1>
                </div>
                <p
                  className="text-[11px] sm:text-xs truncate"
                  style={{ color: '#9C9A94' }}
                >
                  Generative AI Developer · B.Tech 2026
                </p>
              </div>
            </div>

            {/* Right Header items: Contact + Reset */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted flex-shrink-0">
              <a
                href="https://linkedin.com/in/animesh-jain-349893258"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                title="LinkedIn Profile"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.66 1.66 0 0 0-1.66 1.66c0 .92.74 1.66 1.66 1.66.92 0 1.66-.74 1.66-1.66 0-.92-.74-1.66-1.66-1.66Z" />
                </svg>
                <span className="hidden sm:inline">LinkedIn</span>
              </a>
              <span className="text-muted/40">|</span>
              <a
                href="mailto:jainani450@gmail.com"
                className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                title="Email Animesh"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span className="hidden sm:inline">Contact</span>
              </a>

              {messages.length > 0 && (
                <>
                  <span className="text-muted/40">|</span>
                  <button
                    onClick={handleNewChat}
                    title="New chat / Reset conversation"
                    className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors cursor-pointer"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M8 16H3v5" />
                    </svg>
                    <span>Reset</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Conversation Feed */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 scroll-smooth">
          <div className="max-w-panel mx-auto min-h-full flex flex-col justify-start">
            {messages.length === 0 ? (
              <div className="my-auto py-6 sm:py-8 space-y-5 sm:space-y-6 animate-fadeIn">
                <div className="space-y-2">
                  <div className="inline-block px-2.5 py-1 rounded-full bg-surface-2 text-accent text-xs font-mono border border-border-subtle mb-1">
                    HireMe AI · Conversational Resume
                  </div>
                  <h2 className="text-lg sm:text-2xl font-semibold tracking-tight text-primary">
                    Interview Animesh Jain
                  </h2>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
                    I'm an AI assistant trained on Animesh's verified background in Generative AI, production RAG pipelines (Orky.io), full-stack development, and competitive programming.
                  </p>
                </div>

                {/* Starter Question Chips */}
                <StarterChips
                  onSelectQuestion={sendMessage}
                  disabled={isStreaming}
                />
              </div>
            ) : (
              <div className="space-y-1 pb-4">
                {messages.map((msg) => (
                  <MessageRow
                    key={msg.id}
                    message={msg}
                    isWaitingFirstToken={isWaitingFirstToken}
                  />
                ))}
                <div ref={messagesEndRef} className="h-2" />
              </div>
            )}
          </div>
        </main>

        {/* Fixed Bottom Input Area */}
        <footer className="flex-shrink-0 bg-base/95 backdrop-blur-sm border-t border-border-subtle/50">
          <ChatInput
            onSendMessage={sendMessage}
            disabled={isStreaming}
          />
        </footer>
      </div>
    </div>
  );
}

import { useState, useRef, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function useChatStream({ onSaveConversation } = {}) {
  const [messages, setMessages] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingFirstToken, setIsWaitingFirstToken] = useState(false);
  const abortControllerRef = useRef(null);
  const currentConvIdRef = useRef(null);

  // Keep ref in sync
  currentConvIdRef.current = currentConversationId;

  // Load an existing conversation from history
  const loadChat = useCallback((convId, existingMessages) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setCurrentConversationId(convId);
    setMessages(existingMessages || []);
    setIsStreaming(false);
    setIsWaitingFirstToken(false);
  }, []);

  const sendMessage = useCallback(async (userText) => {
    if (!userText || !userText.trim() || isStreaming) return;

    const trimmedText = userText.trim();
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now() + 1}`;

    // Establish conversation ID if starting a fresh thread
    let convId = currentConvIdRef.current;
    if (!convId) {
      convId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setCurrentConversationId(convId);
      currentConvIdRef.current = convId;
    }

    const userMessage = {
      id: userMessageId,
      role: 'user',
      content: trimmedText,
    };

    const assistantPlaceholder = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      sources: [],
      isStreaming: true,
      error: null,
    };

    const newMessages = [...messages, userMessage, assistantPlaceholder];
    setMessages(newMessages);
    setIsStreaming(true);
    setIsWaitingFirstToken(true);

    // Prepare message history: take current messages + new user message,
    // and trim to the last 12 turns (client-side token optimization per TRD)
    const historyPayload = [...messages, userMessage]
      .filter((m) => !m.error && (m.role === 'user' || m.role === 'assistant') && m.content)
      .slice(-12)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: historyPayload }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = 'An unexpected error occurred. Please try again.';
        try {
          const errData = await response.json();
          if (errData?.message) {
            errorMessage = errData.message;
          }
        } catch {
          if (response.status === 429) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
          } else if (response.status === 502) {
            errorMessage = 'Could not reach the AI provider. Please try again shortly.';
          }
        }

        const errorMessages = newMessages.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, error: errorMessage, isStreaming: false }
            : msg
        );
        setMessages(errorMessages);
        setIsStreaming(false);
        setIsWaitingFirstToken(false);
        if (onSaveConversation) {
          onSaveConversation(convId, errorMessages);
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let currentContent = '';
      let currentSources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const trimmedBlock = block.trim();
          if (!trimmedBlock.startsWith('data:')) continue;

          const jsonStr = trimmedBlock.replace(/^data:\s*/, '');
          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'token') {
              setIsWaitingFirstToken(false);
              currentContent += event.content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: currentContent }
                    : msg
                )
              );
            } else if (event.type === 'done') {
              setIsWaitingFirstToken(false);
              currentSources = event.sources || [];
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        sources: currentSources,
                        isStreaming: false,
                      }
                    : msg
                )
              );
            } else if (event.type === 'error') {
              setIsWaitingFirstToken(false);
              const errMsg = event.message || 'Could not reach the AI provider. Please try again shortly.';
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        error: errMsg,
                        isStreaming: false,
                      }
                    : msg
                )
              );
            }
          } catch (err) {
            console.error('Error parsing SSE event:', err, jsonStr);
          }
        }
      }

      // Finalize streaming & persist conversation
      setMessages((prev) => {
        const finalized = prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, isStreaming: false, sources: currentSources, content: currentContent || msg.content }
            : msg
        );
        if (onSaveConversation) {
          onSaveConversation(convId, finalized);
        }
        return finalized;
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Chat stream fetch error:', err);
        setMessages((prev) => {
          const errUpdated = prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  error: 'Could not reach the AI provider. Please check your connection and try again.',
                  isStreaming: false,
                }
              : msg
          );
          if (onSaveConversation) {
            onSaveConversation(convId, errUpdated);
          }
          return errUpdated;
        });
      }
    } finally {
      setIsStreaming(false);
      setIsWaitingFirstToken(false);
      abortControllerRef.current = null;
    }
  }, [messages, isStreaming, onSaveConversation]);

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setCurrentConversationId(null);
    currentConvIdRef.current = null;
    setMessages([]);
    setIsStreaming(false);
    setIsWaitingFirstToken(false);
  }, []);

  return {
    messages,
    currentConversationId,
    isStreaming,
    isWaitingFirstToken,
    sendMessage,
    clearChat,
    loadChat,
  };
}

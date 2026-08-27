import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hireme_conversations';

// Safe localStorage getter
function getSavedConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    }
    return [];
  } catch (e) {
    console.warn('Unable to access localStorage for conversations:', e);
    return [];
  }
}

// Safe localStorage setter
function saveConversationsToStorage(conversations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.warn('Unable to save conversations to localStorage:', e);
  }
}

// Generate title from first user message
export function generateConversationTitle(firstMessageText) {
  if (!firstMessageText) return 'New Conversation';
  const clean = firstMessageText.trim().replace(/\s+/g, ' ');
  if (clean.length <= 40) {
    return clean;
  }
  return clean.slice(0, 40) + '...';
}

export function useConversationHistory() {
  const [conversations, setConversations] = useState(() => getSavedConversations());
  const [activeConversationId, setActiveConversationId] = useState(null);

  // Sync state from storage on mount
  useEffect(() => {
    setConversations(getSavedConversations());
  }, []);

  // Save or update a conversation
  const saveConversation = useCallback((id, messages) => {
    if (!id || !messages || messages.length === 0) return;

    // Filter out temporary errors / incomplete placeholders if any
    const validMessages = messages.filter(
      (m) => m && m.role && (m.content || (m.role === 'assistant' && !m.error))
    );
    if (validMessages.length === 0) return;

    const firstUserMsg = validMessages.find((m) => m.role === 'user');
    const title = generateConversationTitle(firstUserMsg ? firstUserMsg.content : '');

    setConversations((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === id);
      const now = Date.now();
      let updated;

      if (existingIndex >= 0) {
        // Update existing conversation
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          messages: validMessages,
          updatedAt: now,
          // Keep original title unless it was default
          title: updated[existingIndex].title || title,
        };
      } else {
        // Add new conversation at front
        const newConv = {
          id,
          title,
          messages: validMessages,
          createdAt: now,
          updatedAt: now,
        };
        updated = [newConv, ...prev];
      }

      // Sort by updatedAt descending
      updated.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      saveConversationsToStorage(updated);
      return updated;
    });
  }, []);

  // Delete a specific conversation
  const deleteConversation = useCallback((id) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveConversationsToStorage(updated);
      return updated;
    });

    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  // Clear all conversations
  const clearAllHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Unable to clear localStorage:', e);
    }
    setConversations([]);
    setActiveConversationId(null);
  }, []);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    saveConversation,
    deleteConversation,
    clearAllHistory,
  };
}

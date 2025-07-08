import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Message, MessageThread, getMessageThreads, getMessages, sendMessage as sendMessageApi, subscribeToMessages, subscribeToThreads } from '@/lib/supabase/messages';

export const useMessages = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [currentThread, setCurrentThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load message threads
  const loadThreads = useCallback(async () => {
    try {
      console.log('Loading message threads...');
      setLoading(true);
      setError(null);
      const data = await getMessageThreads();
      console.log('Message threads loaded:', {
        threadCount: data?.length,
        threads: data
      });
      setThreads(data);
    } catch (err) {
      console.error('Failed to load message threads:', err);
      setError(err instanceof Error ? err : new Error('Failed to load messages'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load messages for a specific thread
  const loadMessages = useCallback(async (threadId: string) => {
    try {
      console.log('Loading messages for thread:', threadId);
      setLoading(true);
      setError(null);
      const data = await getMessages(threadId);
      console.log('Messages loaded:', {
        threadId,
        messageCount: data?.length,
        messages: data
      });
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to load messages'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a new message
  const sendMessage = useCallback(async (threadId: string, content: string) => {
    if (!content.trim()) return;
    
    try {
      const newMessage = await sendMessageApi(threadId, content);
      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentThread?.id) {
      console.log('No current thread ID for subscription');
      return;
    }

    console.log('Setting up real-time subscription for thread:', currentThread.id);
    const unsubscribe = subscribeToMessages(currentThread.id, (payload) => {
      console.log('Received real-time message update:', {
        eventType: payload.eventType,
        threadId: currentThread.id,
        payload
      });
      if (payload.eventType === 'INSERT') {
        setMessages(prev => [...prev, payload.new as Message]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentThread?.id]);

  // Set up thread updates subscription
  useEffect(() => {
    console.log('Setting up thread updates subscription');
    const unsubscribe = subscribeToThreads((payload) => {
      console.log('Received thread update:', {
        eventType: payload.eventType,
        payload
      });
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        loadThreads();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadThreads]);

  // Load threads when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadThreads();
    }, [loadThreads])
  );

  const refreshThreads = useCallback(() => {
    setRefreshing(true);
    loadThreads();
  }, [loadThreads]);

  return {
    threads,
    currentThread,
    messages,
    loading,
    error,
    refreshing,
    setCurrentThread,
    loadMessages,
    sendMessage,
    refreshThreads,
  };
};

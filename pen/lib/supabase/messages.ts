import { supabase } from '../supabase';
import { Database } from '@/types/supabase';

type ThreadParticipant = {
  id: string;
  thread_id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

type ThreadWithRelations = Database['public']['Tables']['message_threads']['Row'] & {
  book_listing: {
    id: string;
    book: {
      title: string;
      author: string;
    };
    price_inr: number;
    book_images: { url: string }[];
  };
  last_message: Array<{
    content: string;
    created_at: string;
  }>;
};

type RealtimePayload<T> = {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  commit_timestamp: string;
  new: T | null;
  old: T | null;
};

export type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
};

export type MessageThread = Database['public']['Tables']['message_threads']['Row'] & {
  id: string;
  book_listing_id: string;
  created_at: string;
  updated_at: string;
  book_listing: {
    id: string;
    book: {
      title: string;
      author: string;
    };
    price_inr: number;
    book_images: { url: string }[];
  };
  other_participant: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  // Read status tracking removed
};

export const getMessageThreads = async (): Promise<MessageThread[]> => {
  console.log('getMessageThreads: Starting to fetch threads');
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('getMessageThreads: No authenticated user found');
    throw new Error('User not authenticated');
  }
  console.log('getMessageThreads: Authenticated user:', { userId: user.id });

  try {
    // First, get all thread IDs where the current user is a participant
    console.log('getMessageThreads: Fetching thread participants');
    const { data: userThreads, error: userThreadsError } = await supabase
      .from('thread_participants')
      .select('thread_id')
      .eq('user_id', user.id);

    if (userThreadsError) {
      console.error('getMessageThreads: Error fetching thread participants:', userThreadsError);
      return [];
    }

    if (!userThreads?.length) {
      console.log('getMessageThreads: No thread participants found for user');
      return [];
    }
    console.log('getMessageThreads: Found thread participants:', { count: userThreads.length });

    const threadIds = userThreads.map(t => t.thread_id);

    // Get the threads with their book listing and participants
    const { data: threads, error: threadsError } = await supabase
      .from('message_threads')
      .select(`
        *,
        book_listing:book_listings!inner(
          id,
          book:books!inner(
            title,
            author
          ),
          price_inr,
          book_images!inner(
            url
          )
        )
      `)
      .in('id', threadIds)
      .order('updated_at', { ascending: false });

    if (threadsError) {
      console.error('Error fetching threads:', threadsError);
      throw threadsError;
    }

    // Get all participants for these threads
    const { data: participants, error: participantsError } = await supabase
      .from('thread_participants_with_profiles')
      .select('*')
      .in('thread_id', threadIds);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      throw participantsError;
    }

    // Process threads to include other participant info and unread count
    const processedThreads = await Promise.all(
      (threads || []).map(async (thread: any) => {
        // Find other participants (excluding current user)
        const otherParticipants = participants
          .filter((p: any) => p.thread_id === thread.id && p.user_id !== user.id)
          .map((p: any) => ({
            id: p.user_id,
            name: p.name,
            avatar_url: p.avatar_url
          }));

        // Get the latest message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1);

        return {
          ...thread,
          other_participant: otherParticipants[0] || null,
          last_message: lastMessages?.[0] || null
        };
      })
    );

    return processedThreads.filter(thread => thread.other_participant);
  } catch (error) {
    console.error('Error in getMessageThreads:', error);
    throw error;
  }
};

export const getMessages = async (threadId: string): Promise<Message[]> => {
  try {
    console.log('getMessages: Starting to fetch messages for thread:', threadId);
    if (!threadId) {
      console.error('getMessages: No thread ID provided');
      throw new Error('Thread ID is required');
    }

    // First, fetch the messages
    console.log('getMessages: Querying messages table');
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getMessages: Error fetching messages:', error);
      throw error;
    }

    if (!messages || messages.length === 0) {
      console.log('getMessages: No messages found for thread:', threadId);
      return [];
    }

    console.log('getMessages: Successfully fetched messages:', {
      threadId,
      messageCount: messages.length
    });

    // Get unique sender IDs
    const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
    
    // Fetch all senders' profiles
    const { data: senders } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', senderIds);

    // Create a map of sender_id to profile
    const senderMap = new Map(senders?.map(sender => [sender.id, sender]) || []);

    // Combine messages with sender profiles
    const messagesWithSenders = messages.map(message => ({
      ...message,
      sender: senderMap.get(message.sender_id) || {
        id: message.sender_id,
        name: 'Unknown User',
        avatar_url: null
      }
    }));

    // Mark messages as read in a non-blocking way
    markMessagesAsRead(threadId).catch(console.error);

    return messagesWithSenders;
  } catch (error) {
    console.error('Error in getMessages:', error);
    throw error;
  }
};

export const sendMessage = async (
  threadId: string,
  content: string
): Promise<Message> => {
  console.log('sendMessage: Starting to send message', { threadId });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('sendMessage: No authenticated user found');
    throw new Error('User not authenticated');
  }
  console.log('sendMessage: Authenticated user:', { userId: user.id });

  // Create the message directly
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      content: content
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  // Get the sender's profile
  const { data: sender } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .eq('id', user.id)
    .single();

  // Update thread's updated_at
  await supabase
    .from('message_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId);

  return {
    ...message,
    sender: sender || {
      id: user.id,
      name: 'Unknown User',
      avatar_url: null
    }
  } as Message;
};

export const createMessageThread = async (
  bookListingId: string,
  sellerId: string
): Promise<string> => {
  console.log('[MessageService] createMessageThread: Starting thread creation', { 
    bookListingId, 
    sellerId,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Get the current user
    console.log('[MessageService] Getting authenticated user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[MessageService] Error getting authenticated user:', userError);
      throw new Error('User not authenticated');
    }
    
    console.log('[MessageService] User authenticated successfully', { 
      userId: user.id,
      isBuyer: user.id !== sellerId ? 'Yes' : 'No (same as seller)'
    });

    // Don't allow users to message themselves
    if (user.id === sellerId) {
      throw new Error('Cannot create a chat with yourself');
    }

    // Use get_or_create_message_thread function to handle thread creation/retrieval
    const { data: thread, error: threadError } = await supabase
      .rpc('get_or_create_message_thread', {
        p_book_listing_id: bookListingId,
        p_seller_id: sellerId,
        p_buyer_id: user.id
      });

    if (threadError) {
      console.error('Error getting or creating thread:', threadError);
      throw threadError;
    }

    if (!thread || !thread[0]) {
      throw new Error('Failed to get or create message thread');
    }

    console.log('Successfully got or created thread:', thread[0].id);
     return thread[0].id;
  } catch (error) {
    console.error('Error in createMessageThread:', error);
    throw error;
  }
};

const markMessagesAsRead = async (threadId: string): Promise<void> => {
  // Marking messages as read is no longer needed as we've removed the read status feature
};

export const subscribeToMessages = (
  threadId: string,
  callback: (payload: any) => void
) => {
  console.log('subscribeToMessages: Setting up subscription', { threadId });
  const subscription = supabase
    .channel(`messages:thread_id=eq.${threadId}`)
    .on(
      'postgres_changes' as any,
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`
      },
      (payload) => {
        console.log('subscribeToMessages: Received new message', {
          threadId,
          messageId: payload.new?.id
        });
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log('subscribeToMessages: Subscription status', { threadId, status });
    });

  return () => {
    subscription.unsubscribe();
  };
};

export const subscribeToThreads = async (callback: (payload: any) => void) => {
  console.log('subscribeToThreads: Setting up subscription');
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('subscribeToThreads: No authenticated user found');
    return () => {};
  }
  console.log('subscribeToThreads: Authenticated user:', { userId: user.id });

  const channel = supabase.channel('message_threads');
  
  const subscription = channel
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'message_threads'
    }, async (payload: RealtimePayload<MessageThread>) => {
      // Verify the current user is a participant in the thread
      const { data: isParticipant } = await supabase
        .from('thread_participants')
        .select('user_id')
        .eq('thread_id', payload.new?.id || '')
        .eq('user_id', user.id)
        .single();

      if (isParticipant) {
        callback(payload);
      }
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

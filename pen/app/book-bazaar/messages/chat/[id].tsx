import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
  Image,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { getMessages as fetchMessages, sendMessage as sendMessageApi } from '@/lib/supabase/messages';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import { format } from 'date-fns';

interface ThreadParticipant {
  user_id: string;
  profiles: {
    name: string | null;
    avatar_url: string | null;
  };
}

interface BookListing {
  book: {
    title: string;
  };
}

interface Thread {
  id: string;
  book_listing: BookListing;
  thread_participants: ThreadParticipant[];
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}

export default function ChatScreen() {
  const { id: threadId } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [threadInfo, setThreadInfo] = useState<{
    otherParticipant: { name: string | null; avatar_url: string | null };
    bookTitle: string;
  } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadMessages();
    loadThreadInfo();
    
    // Subscribe to new messages
    const setupSubscription = async () => {
      const channel = supabase
        .channel(`messages:thread_id=eq.${threadId}`)
        .on(
          'postgres_changes' as any, // Type assertion to fix type error
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `thread_id=eq.${threadId}`
          },
          (payload: any) => {
            if (payload.new) {
              setMessages(prev => [...prev, payload.new as Message]);
              scrollToBottom();
            }
          }
        )
        .subscribe();
      
      subscriptionRef.current = channel;
    };

    setupSubscription();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [threadId]);
  
  const loadThreadInfo = async () => {
    try {
      const { data: threads } = await supabase
        .from('message_threads')
        .select(`
          id,
          book_listing:book_listings!inner(
            id,
            book:books!inner(
              title
            )
          ),
          thread_participants:thread_participants!inner(
            user_id,
            profiles:profiles!inner(
              name,
              avatar_url
            )
          )
        `)
        .eq('id', threadId)
        .single() as { data: Thread | null };
      
      if (threads) {
        const { data: { user } } = await supabase.auth.getUser();
        
        const otherParticipant = threads.thread_participants.find(
          (p: ThreadParticipant) => p.user_id !== user?.id
        )?.profiles || { name: 'Unknown User', avatar_url: null };
        
        setThreadInfo({
          otherParticipant: {
            name: otherParticipant.name,
            avatar_url: otherParticipant.avatar_url
          },
          bookTitle: threads.book_listing.book.title
        });
      }
    } catch (error) {
      console.error('Error loading thread info:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await fetchMessages(threadId);
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const messageToSend = message;
    setMessage('');
    
    try {
      await sendMessageApi(threadId, messageToSend);
      // The message will be added to the list via the subscription
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally show error to user
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentMessage = messages[index];
    const prevDate = new Date(prevMessage.created_at).toDateString();
    const currentDate = new Date(currentMessage.created_at).toDateString();
    return prevDate !== currentDate;
  };

  const shouldShowAvatar = (index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentMessage = messages[index];
    return prevMessage.sender.id !== currentMessage.sender.id;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender.id === currentUserId;
    const showDate = shouldShowDate(index);
    const showAvatar = shouldShowAvatar(index) && !isMe;

    return (
      <View>
        {showDate && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>
              {format(new Date(item.created_at), 'MMMM d, yyyy')}
            </Text>
          </View>
        )}
        <View style={[
          styles.messageRow,
          isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }
        ]}>
          {showAvatar && item.sender.avatar_url && (
            <Image 
              source={{ uri: item.sender.avatar_url }} 
              style={styles.avatar}
              resizeMode="cover"
            />
          )}
          <View style={[
            styles.messageBubble,
            isMe ? styles.sentMessage : styles.receivedMessage
          ]}>
            <Text style={styles.messageText}>
              {item.content}
            </Text>
            <Text style={styles.messageTime}>
              {format(new Date(item.created_at), 'h:mm a')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const headerTitle = threadInfo ? (
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {threadInfo.otherParticipant.name}
      </Text>
      <Text style={styles.headerSubtitle} numberOfLines={1}>
        {threadInfo.bookTitle}
      </Text>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        {headerTitle}
        {threadInfo?.otherParticipant?.avatar_url && (
          <Image 
            source={{ uri: threadInfo.otherParticipant.avatar_url }} 
            style={styles.headerAvatar} 
          />
        )}
      </View>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <React.Fragment>
              {renderMessage({ item, index })}
            </React.Fragment>
          )}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => scrollToBottom()}
          onLayout={() => scrollToBottom()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.mediaButton}>
            <ImageIcon size={24} color="#007AFF" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#a0a0a0"
            multiline
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !message.trim() && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Send size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
    backgroundColor: '#000000',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  sentMessage: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  receivedMessage: {
    backgroundColor: '#5856D6',
    borderBottomLeftRadius: 4,
    marginRight: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  input: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
    maxHeight: 120,
    color: '#ffffff',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateHeader: {
    alignSelf: 'center',
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
});

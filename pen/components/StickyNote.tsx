import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Animated, PanResponder } from 'react-native';
import { colors } from '@/constants/colors';
import { Feather } from '@expo/vector-icons';

interface StickyNoteProps {
  floating?: boolean;
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string, position: { x: number; y: number }) => void;
}

export default function StickyNote({ id, content: initialContent, color, position: initialPosition, onDelete, onUpdate, floating = false }: StickyNoteProps) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const pan = useRef(new Animated.ValueXY(initialPosition)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const shadowOpacity = useRef(new Animated.Value(0.2)).current;
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        // Lift effect
        Animated.parallel([
          Animated.spring(shadowOpacity, {
            toValue: 0.4,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1.05,
            useNativeDriver: true,
          })
        ]).start();
      },
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y }
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        setIsDragging(false);
        // Drop effect
        Animated.parallel([
          Animated.spring(shadowOpacity, {
            toValue: 0.2,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
          })
        ]).start();

        const currentPosition = {
          x: (pan.x as any)._value + initialPosition.x,
          y: (pan.y as any)._value + initialPosition.y,
        };
        onUpdate(id, content, currentPosition);
        // Update the initial position for the next drag
        pan.setOffset({
          x: currentPosition.x,
          y: currentPosition.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  const handleContentChange = (text: string) => {
    setContent(text);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const currentPosition = {
      x: (pan.x as any)._value + initialPosition.x,
      y: (pan.y as any)._value + initialPosition.y,
    };
    onUpdate(id, content, currentPosition);
  };

  const handleDelete = () => {
    Animated.timing(scale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => onDelete(id));
  };

  const getContainerStyle = (isFloating: boolean): ViewStyle => ({
    position: 'absolute',
    width: isFloating ? 200 : '100%',
    minHeight: isFloating ? 200 : undefined,
    aspectRatio: isFloating ? undefined : 1,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: color,
  });

  return (
    <Animated.View
      style={[
        styles.container(floating),
        {
          backgroundColor: color,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale },
          ],
          shadowOpacity: shadowOpacity,
          zIndex: isDragging ? 1000 : 1,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.header}>
        <View style={styles.dragHandle} />
        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={8}
        >
          <Feather name="trash-2" size={16} color="#FF4444" />
        </Pressable>
      </View>
      
      {isEditing ? (
        <TextInput
          value={content}
          onChangeText={handleContentChange}
          onBlur={handleBlur}
          multiline
          style={styles.input}
          autoFocus
        />
      ) : (
        <Pressable
          onPress={() => setIsEditing(true)}
          style={styles.contentContainer}
        >
          <Text style={styles.content}>{content}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: (floating: boolean) => ({
    position: 'absolute',
    width: floating ? 200 : '100%',
    minHeight: floating ? 200 : undefined,
    aspectRatio: floating ? undefined : 1,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  }),
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    alignSelf: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  input: {
    flex: 1,
    color: '#1a1a1a',
    fontSize: 16,
    textAlignVertical: 'top',
    padding: 0,
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    color: '#1a1a1a',
    fontSize: 16,
    lineHeight: 22,
  }
});

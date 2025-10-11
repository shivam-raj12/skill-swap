// src/hooks/useChatService.ts

import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, ID, RealtimeResponseEvent } from 'appwrite';
import { APPWRITE_CONFIG } from '@/constants';
import { useAuth } from '@/hooks/useAuth'; // To get the current user ID

// --- Appwrite Service Setup ---
const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

// Initialize Appwrite Databases
const databases = new Databases(client);

// Define your collection and database IDs from constants (you need to define these in @/constants)
// Example assuming you define them like this:
const { databaseId, messagesCollectionId, conversationsCollectionId } = APPWRITE_CONFIG;

// --- TypeScript Interfaces for Clarity ---

// Structure of a Message document from the DB
interface Message {
    $id: string;
    senderId: string;
    content: string; // Renamed from 'text' to 'content' for consistency
    images: string[];
    $createdAt: string;
}

// Structure for the data the hook exposes
interface ChatState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
}

// --- The Core Hook ---

/**
 * Custom hook to handle all chat-related logic for a specific conversation.
 * @param conversationId The ID of the currently active chat thread.
 * @param receiverId The ID of the person the current user is chatting with.
 */
export const useChatService = (conversationId: string | null, receiverId: string | null) => {
    const { user } = useAuth(); // Get the current user object
    const currentUserId = user?.$id; // The ID of the logged-in user

    const [chatState, setChatState] = useState<ChatState>({
        messages: [],
        isLoading: false,
        error: null,
    });

    // 1. HELPER: Function to create a consistent Conversation ID
    const getConversationId = (userA: string, userB: string): string => {
        // Ensure consistent ID by sorting, e.g., 'user1_user2'
        return [userA, userB].sort().join('_');
    };


    // 2. LOGIC: Load Message History and Set up Realtime Subscription
    useEffect(() => {
        if (!conversationId || !currentUserId || !receiverId) {
            setChatState({ messages: [], isLoading: false, error: null });
            return;
        }

        const effectiveConversationId = getConversationId(currentUserId, receiverId);

        setChatState(prev => ({ ...prev, isLoading: true, error: null }));

        // --- A. Fetch Old Messages (History) ---
        const fetchMessages = async () => {
            try {
                const response = await databases.listDocuments(
                    databaseId,
                    messagesCollectionId,
                    [
                        Query.equal('conversationId', effectiveConversationId),
                        Query.orderAsc('$createdAt'),
                        Query.limit(50) // Fetch last 50 messages
                    ]
                );

                // Map the documents to the Message interface
                const loadedMessages = response.documents.map(doc => ({
                    $id: doc.$id,
                    senderId: doc.senderId,
                    content: doc.text, // Assuming you named it 'text' in Appwrite
                    images: doc.images || [],
                    $createdAt: doc.$createdAt,
                }));

                setChatState({ messages: loadedMessages, isLoading: false, error: null });
            } catch (err) {
                console.error("Failed to load message history:", err);
                setChatState(prev => ({ ...prev, isLoading: false, error: 'Failed to load messages.' }));
            }
        };

        fetchMessages();

        // --- B. Setup Realtime Subscription for NEW Messages ---
        const unsubscribe = client.subscribe(
            `databases.${databaseId}.collections.${messagesCollectionId}.documents`,
            (response: RealtimeResponseEvent<any>) => {
                // We only care about new messages being created
                if (response.events.includes('databases.*.collections.*.documents.*.create')) {
                    const newMessage = response.payload;

                    // Filter: Only process messages for the currently active conversation
                    if (newMessage.conversationId === effectiveConversationId) {
                        setChatState(prev => ({
                            ...prev,
                            messages: [...prev.messages, {
                                $id: newMessage.$id,
                                senderId: newMessage.senderId,
                                content: newMessage.text, // Use 'text' field
                                images: newMessage.images || [],
                                $createdAt: newMessage.$createdAt,
                            }],
                        }));
                    }
                }
            }
        );

        // Cleanup: Important to stop listening when the component unmounts or conversation changes
        return () => {
            unsubscribe();
        };

    }, [conversationId, currentUserId, receiverId]); // Re-run effect if conversation or user changes


    // 3. ACTION: Function to Send a New Message
    const sendMessage = useCallback(async (messageText: string, imageFileIds: string[] = []) => {
        if (!currentUserId || !receiverId || !conversationId || !messageText.trim()) {
            return;
        }

        const effectiveConversationId = getConversationId(currentUserId, receiverId);

        try {
            // NOTE: We rely on the Realtime subscription to ADD the message to state (sent status)
            await databases.createDocument(
                databaseId,
                messagesCollectionId,
                ID.unique(), // Use unique ID generator
                {
                    conversationId: effectiveConversationId,
                    senderId: currentUserId,
                    text: messageText.trim(), // Assuming you named your content field 'text'
                    images: imageFileIds, // Array of Appwrite file IDs
                }
            );

            // TODO: (SERVER-SIDE) Your Appwrite Function must now trigger to update the
            // 'Conversations' collection unread counts and last message fields!

        } catch (error) {
            console.error('Error sending message:', error);
            // In a real app, you would show an error state on the message bubble here.
        }
    }, [currentUserId, receiverId, conversationId]);


    // 4. ACTION: Function to Mark Conversation as Read
    const markAsRead = useCallback(async () => {
        if (!currentUserId) return;

        // NOTE: This call will trigger a server-side Appwrite function
        // to handle the complex logic of finding the user's specific
        // Conversation document and setting their unreadCount to 0.
        // For now, this is a placeholder for your future server-side API call/Function.
        console.log(`[ACTION NEEDED] Marking conversation ${conversationId} as read for user ${currentUserId}`);

        // Example: Call a generic server-side function/endpoint
        // await fetch('/api/mark-read', { method: 'POST', body: JSON.stringify({ userId: currentUserId, conversationId: conversationId }) });

    }, [currentUserId, conversationId]);


    return {
        ...chatState,
        sendMessage,
        markAsRead,
    };
};
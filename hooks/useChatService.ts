import {useState, useEffect, useCallback} from 'react';
import {Client, Databases, Query, Models, ID} from 'appwrite';
import {useAuth} from '@/hooks/useAuth';
import {
    APPWRITE_CONFIG,
    APPWRITE_DB_ID,
    APPWRITE_MESSAGES_COLLECTION_ID,
    APPWRITE_CONVERSATIONS_COLLECTION_ID
} from '@/constants';

const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const databases = new Databases(client);

interface MessageDocument extends Models.Document {
    text: string;
    conversationId: string;
    senderId: string;
}

export const useChatService = (activeConversationId: string | null, receiverId: string | null) => {
    const {user} = useAuth();
    const currentUserId = user?.$id;

    const [messages, setMessages] = useState<MessageDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMessages = useCallback(async (convId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_MESSAGES_COLLECTION_ID,
                [
                    Query.equal('conversationId', convId),
                    Query.orderAsc('$createdAt'),
                    Query.limit(100)
                ]
            );
            setMessages(response.documents as MessageDocument[]);
        } catch (err) {
            setError('Failed to load messages.');
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            return;
        }
        fetchMessages(activeConversationId);

        const unsubscribe = client.subscribe(
            `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_MESSAGES_COLLECTION_ID}.documents`,
            (response: any) => {
                if (!response || !response.payload) return;
                const newMessage = response.payload as MessageDocument;

                if (response.events.includes('databases.*.collections.*.documents.*.create') &&
                    newMessage.conversationId === activeConversationId) {
                    setMessages(prevMessages => {
                        if (!prevMessages.some(msg => msg.$id === newMessage.$id)) {
                            return [...prevMessages, newMessage];
                        }
                        return prevMessages;
                    });
                }
            }
        );

        return () => unsubscribe();
    }, [activeConversationId, fetchMessages]);

    const sendMessage = useCallback(async (text: string) => {
        if (!currentUserId || !receiverId || !activeConversationId) {
            return;
        }

        try {
            await databases.createDocument(
                APPWRITE_DB_ID,
                APPWRITE_MESSAGES_COLLECTION_ID,
                ID.unique(),
                {
                    text,
                    conversationId: activeConversationId,
                    senderId: currentUserId
                }
            );
            setError(null);
        } catch (err) {
            setError('Failed to send message.');
        }
    }, [currentUserId, receiverId, activeConversationId]);

    const markAsRead = useCallback(async () => {
        if (!activeConversationId || !currentUserId) {
            return;
        }

        try {

            const convDocResponse = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_CONVERSATIONS_COLLECTION_ID,
                [
                    Query.equal('ownerId', currentUserId),
                    Query.equal('otherUserId', activeConversationId.replace(currentUserId + "_", "").replace("_" + currentUserId, "")),
                    Query.limit(1)
                ]
            );

            const conversationDocument = convDocResponse.documents[0];

            if (!conversationDocument) {

                console.warn(`Conversation document not found for user ${currentUserId} in conversation: ${activeConversationId}`);
                return;
            }

            await databases.updateDocument(
                APPWRITE_DB_ID,
                APPWRITE_CONVERSATIONS_COLLECTION_ID,
                conversationDocument.$id,
                {
                    unreadCount: 0
                }
            );
        } catch (err) {
            console.error(`Failed to mark conversation ${activeConversationId} as read:`, err);
        }

    }, [activeConversationId, currentUserId]);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        markAsRead,
    };
};

import {useState, useEffect} from 'react';
import {Client, Databases, Query, Models} from 'appwrite';
import {useAuth} from '@/hooks/useAuth';
import {
    APPWRITE_CONFIG,
    APPWRITE_DB_ID,
    APPWRITE_CONVERSATIONS_COLLECTION_ID,
    APPWRITE_PROFILES_COLLECTION_ID
} from '@/constants';

// --- Appwrite Setup ---
const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const databases = new Databases(client);

interface ConversationDocument extends Models.Document {
    ownerId: string;
    otherUserId: string;
    lastMessageText: string;
    lastMessageTimestamp: string;
    unreadCount: number;
}

export interface ConversationSummary extends ConversationDocument {
    otherUserName: string;
    otherUserSkill: string;
}

// Helper to generate the unique, sorted conversation ID (UserAId_UserBId)
// This is now exported so other files (like MessagesContent) can use it too.
export const getConversationId = (userA: string, userB: string): string => {
    // Sorts the two user IDs alphabetically and joins them
    return [userA, userB].sort().join('_');
};

const fetchUserProfile = async (userId: string) => {
    try {
        const response = await databases.listDocuments(
            APPWRITE_DB_ID,
            APPWRITE_PROFILES_COLLECTION_ID,
            [Query.equal('userId', userId), Query.limit(1)]
        );
        const profile = response.documents[0] as unknown as { name?: string; bio?: string; skillsToTeach?: string[] };

        return {
            name: profile?.name || `User ${userId.substring(0, 5)}`,
            bio: profile?.bio || 'No bio provided.',
            displaySkill: profile?.bio || profile?.skillsToTeach?.[0] || 'SkillSwap Partner',
        };
    } catch (error) {
        console.error("Error fetching profile for:", userId, error);
        return {name: `User ${userId.substring(0, 5)}`, bio: 'Error', displaySkill: 'Error loading bio'};
    }
};


export const useConversations = () => {
    const {user} = useAuth();
    const currentUserId = user?.$id;

    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConversations = async () => {
        if (!currentUserId) return;

        setIsLoading(true);
        setError(null);
        try {
            const myConversationsResponse = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_CONVERSATIONS_COLLECTION_ID,
                [
                    Query.equal('ownerId', currentUserId),
                ]
            );

            const fetchedDocs = myConversationsResponse.documents as unknown as ConversationDocument[];

            const uniqueConversationsMap = new Map<string, ConversationSummary>();

            for (const doc of fetchedDocs) {
                const recipientId = doc.ownerId === currentUserId ? doc.otherUserId : doc.ownerId;

                // Calculate the universally unique, sorted conversation ID
                const uniqueChatKey = getConversationId(currentUserId, recipientId);

                // Handle potential duplicate documents from Appwrite
                if (uniqueConversationsMap.has(uniqueChatKey)) {
                    const existing = uniqueConversationsMap.get(uniqueChatKey)!;
                    // Keep the conversation with the newest message timestamp
                    if (new Date(doc.lastMessageTimestamp).getTime() < new Date(existing.lastMessageTimestamp).getTime()) {
                        continue;
                    }
                }

                const profile = await fetchUserProfile(recipientId);

                const summary: ConversationSummary = {
                    ...doc,
                    $id: uniqueChatKey,
                    otherUserId: recipientId,
                    otherUserName: profile.name,
                    otherUserSkill: profile.displaySkill,
                };

                uniqueConversationsMap.set(uniqueChatKey, summary);
            }

            const uniqueConversations = Array.from(uniqueConversationsMap.values());
            uniqueConversations.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());

            setConversations(uniqueConversations);

        } catch (err) {
            console.error('Failed to fetch conversations:', err);
            setError('Failed to load conversations.');
            setConversations([]);
        } finally {
            setIsLoading(false);
        }
    };



    // ... (omitting setup and imports for brevity)

    useEffect(() => {
        if (!currentUserId) {
            setConversations([]);
            setIsLoading(false);
            return;
        }

        fetchConversations();

        const unsubscribe = client.subscribe(
            `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_CONVERSATIONS_COLLECTION_ID}.documents`,
            (response: any) => {
                const updatedDoc = response.payload as ConversationDocument;
                // Only process documents where this user is the 'owner' in the document
                if (updatedDoc.ownerId !== currentUserId) {
                    return;
                }

                const recipientId =  updatedDoc.otherUserId;
                const uniqueChatKey = getConversationId(currentUserId, recipientId);
                const displayUnreadCount = updatedDoc.unreadCount;
                console.log(displayUnreadCount)


                setConversations(prevConversations => {
                    // 1. Find the existing conversation index
                    const existingIndex = prevConversations.findIndex(conv => conv.$id === uniqueChatKey);

                    // If the conversation is found, update it
                    if (existingIndex !== -1) {
                        const updatedConversations = [...prevConversations];
                        const existingSummary = updatedConversations[existingIndex];

                        updatedConversations[existingIndex] = {
                            ...existingSummary,
                            ...updatedDoc,
                            $id: uniqueChatKey,
                            unreadCount: displayUnreadCount,
                        };

                        // Re-sort the array
                        updatedConversations.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());

                        return updatedConversations;
                    }

                    // 2. If it's a *NEW* conversation (not found), fetch the profile asynchronously
                    const handleNewConversation = async () => {
                        const profile = await fetchUserProfile(recipientId);

                        const newSummary: ConversationSummary = {
                            ...updatedDoc,
                            $id: uniqueChatKey,
                            otherUserId: recipientId,
                            otherUserName: profile.name,
                            otherUserSkill: profile.displaySkill,
                            unreadCount: displayUnreadCount, // Use the single unread count
                        };

                        // Use the functional update again to ensure we use the very latest state
                        setConversations(latestConversations => {
                            const newConversations = [newSummary, ...latestConversations];
                            // Re-sort to put it at the top
                            newConversations.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
                            return newConversations;
                        });
                    };

                    handleNewConversation(); // Execute the async logic

                    // Since we're handling the update in the async function above,
                    // we return the previous state here to avoid a synchronous flicker.
                    // The setConversations call inside handleNewConversation will trigger the re-render.
                    return prevConversations;
                });
            }
        );

        return () => unsubscribe();
    }, [currentUserId]); // fetchUserProfile is not a dep because it's stable and not a prop/state.

    return {
        conversations,
        isLoading,
        error,
        refetch: fetchConversations,
    };
};

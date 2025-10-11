// index.js (Appwrite Function Code)

import { Client, Databases, Query, ID } from 'node-appwrite';

// Initialize the Appwrite client using environment variables
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT) // Endpoint is automatically set
    .setProject(process.env.APPWRITE_PROJECT)   // Project ID is automatically set
    .setKey(process.env.APPWRITE_API_KEY);      // API Key comes from the function execution setting

const databases = new Databases(client);

// Environment variables
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const CONVERSATIONS_COLLECTION_ID = process.env.CONVERSATIONS_COLLECTION_ID;

// Helper to find the correct Conversation ID (must match the client logic)
const getConversationId = (userA, userB) => {
    return [userA, userB].sort().join('_');
};

/**
 * Executes when a new message document is created.
 */
export default async ({ req, res }) => {
    try {
        // The message document is passed in the request body
        const messageDocument = JSON.parse(req.body);

        const {
            $id: messageId,
            senderId,
            text, // Assuming your content field is named 'text'
            $createdAt: messageTimestamp
        } = messageDocument;

        // Ensure we have the necessary IDs
        if (!senderId || !messageDocument.conversationId || !text) {
            console.error('Missing required fields in message document.');
            return res.json({ ok: false, message: 'Missing fields' });
        }

        // The conversation ID from the message document is in the format 'userA_userB'
        const [userA, userB] = messageDocument.conversationId.split('_');

        // Determine the recipient ID
        const recipientId = (senderId === userA) ? userB : userA;

        // --- 1. Update the SENDER's Conversation Summary ---
        // The sender should see their unread count reset to 0
        await updateSummary(
            senderId,
            recipientId,
            text,
            messageTimestamp,
            0 // unreadCount: 0 for the sender
        );

        // --- 2. Update the RECIPIENT's Conversation Summary ---
        // The recipient should have their unread count INCREMENTED
        await updateSummary(
            recipientId,
            senderId,
            text,
            messageTimestamp,
            1, // unreadCountChange: +1
            true // isIncrement: true
        );

        return res.json({ ok: true, message: 'Conversation summaries updated successfully.' });

    } catch (error) {
        console.error('Function execution failed:', error);
        return res.json({ ok: false, error: error.message }, 500);
    }
};

/**
 * Finds or creates the conversation summary document and updates its fields.
 */
async function updateSummary(ownerId, otherUserId, lastMessageText, lastMessageTimestamp, unreadCountChange, isIncrement = false) {
    try {
        // Step A: Search for the existing summary document for the owner
        const response = await databases.listDocuments(
            DATABASE_ID,
            CONVERSATIONS_COLLECTION_ID,
            [
                Query.equal('ownerId', ownerId),
                Query.equal('otherUserId', otherUserId),
                Query.limit(1)
            ]
        );

        let documentId;
        let newUnreadCount;

        if (response.documents.length > 0) {
            // Document found: Get its ID and calculate the new unread count
            const doc = response.documents[0];
            documentId = doc.$id;

            // Calculate the new count based on whether we are incrementing or resetting
            if (isIncrement) {
                // If incrementing, use the existing count + 1
                newUnreadCount = doc.unreadCount + unreadCountChange;
            } else {
                // If resetting (sender's view), set to 0
                newUnreadCount = unreadCountChange;
            }

            // Step B: Update the existing document
            await databases.updateDocument(
                DATABASE_ID,
                CONVERSATIONS_COLLECTION_ID,
                documentId,
                {
                    lastMessageText,
                    lastMessageTimestamp,
                    unreadCount: newUnreadCount
                }
            );

        } else {
            // Document not found: Must be a brand new chat, so create the summary document

            // Step C: Create the new document
            await databases.createDocument(
                DATABASE_ID,
                CONVERSATIONS_COLLECTION_ID,
                ID.unique(),
                {
                    ownerId,
                    otherUserId,
                    lastMessageText,
                    lastMessageTimestamp,
                    unreadCount: unreadCountChange // Will be 0 for sender, 1 for recipient
                }
            );
        }

    } catch (error) {
        console.error(`Error updating summary for owner ${ownerId}:`, error);
        throw error; // Re-throw to fail the main function execution if critical update fails
    }
}
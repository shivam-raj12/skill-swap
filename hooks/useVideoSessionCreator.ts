import { useMemo } from 'react';
import { Client, Functions } from 'appwrite';
import { useAuth } from './useAuth'; // Assuming your useAuth is in the same folder or path

const FUNCTION_ID = 'your_video_session_creator_function_id';

interface ScheduleDetails {
    startDate: string;
    time: string;
    frequency: string;
    durationMonths: number;
    [key: string]: any;
}

export const useVideoSessionCreator = () => {
    // Get the Appwrite client and current user details from useAuth
    const { user, client, isAuthenticated } = useAuth();

    const functions = useMemo(() => {
        if (client) {
            // Functions service must be initialized with the Appwrite Client
            return new Functions(client);
        }
        return null;
    }, [client]);

    const createSession = async ({ senderId, conversationId, scheduleDetails }: {
        senderId: string;
        conversationId: string;
        scheduleDetails: ScheduleDetails;
    }) => {
        if (!functions || !user || !isAuthenticated) {
            throw new Error("You must be logged in to accept a meeting.");
        }

        // The current user (who clicked 'Accept') is the receiver.
        const receiverId = user.$id;

        // The payload must match what your Python function expects
        const payload = JSON.stringify({
            senderId,
            receiverId,
            conversationId,
            scheduleDetails,
        });

        try {
            // Execute the function
            const result = await functions.createExecution(
                FUNCTION_ID,
                payload,
                false,
                'POST'
            );

            // result.responseBody is a JSON string of the Python function's return value
            const responseData = JSON.parse(result.responseBody);

            if (result.statusCode !== 201 || !responseData.success) {
                console.error("Function Error Details:", responseData);
                throw new Error(responseData.error || "Failed to create video session. Check function logs.");
            }

            return {
                meetingId: responseData.meetingId as string,
                joinToken: responseData.joinToken as string,
            };

        } catch (error) {
            console.error("Video Session Creation Error:", error);
            throw new Error(`Could not finalize video session: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    return { createSession, isLoading: !functions };
};

import React from "react";
import {Client, Functions} from "appwrite";
import {useAuth} from "@/hooks/useAuth";

const FUNCTION_ID = '68f30101003582e25c10';

interface ScheduleDetails {
    startDate: string;
    time: string;
    frequency: string;
    durationMonths: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "skill-swap";

export const useVideoSessionCreator = () => {
    const {user} = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);

    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID);

    const functions = new Functions(client);

    const createSession = async ({
                                     senderId,
                                     conversationId,
                                     scheduleDetails,

                                 }: {
        senderId: string;
        conversationId: string;
        scheduleDetails: ScheduleDetails;

    }) => {

        if (!user?.$id) {
            throw new Error("Receiver (current user) not found. Please log in.");
        }

        const receiverId = user.$id;

        const sanitizedSchedule = {
            ...scheduleDetails,
            startDate: String(scheduleDetails.startDate),
            time: String(scheduleDetails.time),
            frequency: String(scheduleDetails.frequency),
            durationMonths: Number(scheduleDetails.durationMonths),
        };

        const payload = {
            senderId,
            receiverId,
            conversationId,
            scheduleDetails: sanitizedSchedule,
        };

        console.log("🟢 Sending JSON payload:", JSON.stringify(payload, null, 2));

        setIsLoading(true);
        try {
            const execution = await functions.createExecution(
                FUNCTION_ID,
                JSON.stringify(payload)
            );

            const responseData = JSON.parse(execution.responseBody || "{}");

            if (!responseData.success) {
                console.error("❌ Function Error Details:", responseData);
                throw new Error(
                    responseData.error || "Failed to create video session"
                );
            }

            console.log("✅ Session created successfully:", responseData);

            try {
                console.log("✅ Conversation marked as read.");
            } catch (readError) {

                console.error("⚠️ Failed to mark conversation as read after session creation:", readError);
            }


            return {
                meetingId: responseData.meetingId as string,
                joinToken: responseData.joinToken as string,
            };

        } catch (error) {
            console.error("🚨 Video Session Creation Error:", error);
            throw new Error(
                `Could not finalize video session: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        } finally {
            setIsLoading(false);
        }
    };

    return {createSession, isLoading};
};
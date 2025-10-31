

import { useState, useEffect, useCallback } from "react";
import { Client, Databases, Query, Models } from 'appwrite';
import {APPWRITE_CONFIG, APPWRITE_MEETINGS_COLLECTION_ID, APPWRITE_PROFILES_COLLECTION_ID} from '@/constants';
import { useAuth } from '@/hooks/useAuth';

const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const databases = new Databases(client);

const APPWRITE_DATABASE_ID = APPWRITE_CONFIG.databaseId;
const MEETINGS_COLLECTION_ID = APPWRITE_MEETINGS_COLLECTION_ID;
const PROFILES_COLLECTION_ID = APPWRITE_PROFILES_COLLECTION_ID;


// @ts-expect-error abc
export const useMeetingValidation = (meetingId) => {
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

    const [meetingData, setMeetingData] = useState<Models.Document | null>(null);
    const [participantProfiles, setParticipantProfiles] = useState<{ [key: string]: Models.Document }>({});
    const [isLoading, setIsLoading] = useState(true);

    const [status, setStatus] = useState(meetingId ? 'loading' : 'not_found');

    const currentUserId = user?.$id;

    const fetchSingleProfile = useCallback(async (userId: string) => {
        try {
            const profileList = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                PROFILES_COLLECTION_ID,
                [
                    Query.equal("userId", userId),
                    Query.limit(1)
                ]
            );

            if (profileList.documents.length > 0) {
                return profileList.documents[0];
            }

            return { $id: userId, name: "Profile Not Found", profilePictureUrl: null } as unknown as Models.Document;

        } catch (e) {
            console.error(`Appwrite Profile Fetch Error for ${userId}:`, e);
            return { $id: userId, name: "Profile SDK Error", profilePictureUrl: null } as unknown as Models.Document;
        }
    }, []);

    const validateMeeting = useCallback(async () => {

        if (isAuthLoading) return;

        if (!meetingId || meetingId.trim().length < 4) {
            setStatus('not_found');

            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setStatus('loading');
        setMeetingData(null);
        setParticipantProfiles({});

        if (!isAuthenticated || !currentUserId) {
            if (!isAuthenticated) {
                setStatus('unauthorized');
                setIsLoading(false);
                return;
            }
        }

        try {

            const meetingResponse = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                MEETINGS_COLLECTION_ID,
                [
                    Query.or(
                        [
                            Query.equal('meetingId', meetingId),
                            Query.equal('$id', meetingId),
                        ]
                    )
                ]
            );

            if (meetingResponse.documents && meetingResponse.documents.length > 0) {
                const meeting = meetingResponse.documents[0];
                setMeetingData(meeting);

                const participants = meeting.participants as string[] | undefined;

                if (!participants || !participants.includes(currentUserId!)) {
                    setStatus('unauthorized');
                    return;
                }

                const profilePromises = participants.map(userId =>
                    fetchSingleProfile(userId).then(profileDocument => ({ userId, profile: profileDocument }))
                );

                const results = await Promise.all(profilePromises);

                const profilesMap = results.reduce((acc, { userId, profile }) => {
                    acc[userId] = profile;
                    return acc;
                }, {} as { [key: string]: Models.Document });

                setParticipantProfiles(profilesMap);
                setStatus('loaded');

            } else {
                setStatus('not_found');
            }
        } catch (e) {
            console.error("Appwrite Meeting Validation Error:", e);
            setStatus('error');
        } finally {

            setIsLoading(false);
        }
    }, [meetingId, currentUserId, isAuthenticated, isAuthLoading, fetchSingleProfile]);

    useEffect(() => {

        if (!isAuthLoading) {
            validateMeeting();
        }
    }, [isAuthLoading, validateMeeting]);

    const currentProfile = participantProfiles[currentUserId!];

    return {
        meetingData,
        participantProfiles,

        isLoading: isAuthLoading || isLoading,
        status,
        currentUserId,
        currentProfile,
    };
};
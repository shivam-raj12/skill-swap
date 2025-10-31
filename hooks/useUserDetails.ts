

import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models } from 'appwrite';
import { APPWRITE_CONFIG, APPWRITE_DB_ID, APPWRITE_PROFILES_COLLECTION_ID } from '@/constants';

const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const databases = new Databases(client);

interface UserProfile {
    name: string;
    bio: string;
    skillsToTeach: string[];
    skillsToLearn: string[];
}

export const useUserDetails = (userId: string | null) => {
    const [userDetails, setUserDetails] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUserDetails = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_PROFILES_COLLECTION_ID,
                [Query.equal('userId', id), Query.limit(1)]
            );

            const profile = response.documents[0] as unknown as (Models.Document & UserProfile);

            if (profile) {
                const displayedSkill = (profile.skillsToTeach && profile.skillsToTeach.length > 0)
                    ? profile.skillsToTeach[0]
                    : 'SkillSwap';

                setUserDetails({
                    name: profile.name || `User ${id.substring(0, 5)}`,
                    bio: profile.bio || 'No bio provided.',
                    skillsToTeach: profile.skillsToTeach || [],
                    skillsToLearn: profile.skillsToLearn || [],

                    displayedSkill: displayedSkill,
                } as UserProfile & { displayedSkill: string });
            } else {
                setUserDetails({
                    name: `Unknown User ${id.substring(0, 5)}`,
                    bio: 'Profile not found.',
                    skillsToTeach: [],
                    skillsToLearn: [],
                    displayedSkill: 'Error',
                } as UserProfile & { displayedSkill: string });
            }
        } catch (err) {
            console.error("Failed to fetch user details:", err);
            setError('Could not load user profile.');
            setUserDetails(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userId) {
            fetchUserDetails(userId);
        } else {
            setUserDetails(null);
        }
    }, [userId, fetchUserDetails]);

    return {
        userDetails: userDetails as (UserProfile & { displayedSkill: string }) | null,
        isLoading,
        error,
    };
};
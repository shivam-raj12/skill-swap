// src/hooks/useUserDetails.ts

import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models } from 'appwrite';
import { APPWRITE_CONFIG, APPWRITE_DB_ID, APPWRITE_PROFILES_COLLECTION_ID } from '@/constants';

// --- Appwrite Setup ---
const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const databases = new Databases(client);

// Simplified Profile Type for Display
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
                // Determine the skill they are teaching that you want to learn (for the "Topic" line)
                // Since this is complex to compute here, we'll just display their main teaching skill for now.
                const displayedSkill = (profile.skillsToTeach && profile.skillsToTeach.length > 0)
                    ? profile.skillsToTeach[0]
                    : 'SkillSwap';

                setUserDetails({
                    name: profile.name || `User ${id.substring(0, 5)}`,
                    bio: profile.bio || 'No bio provided.',
                    // We only need the skills for display purposes
                    skillsToTeach: profile.skillsToTeach || [],
                    skillsToLearn: profile.skillsToLearn || [],

                    // Add the best guess for the topic back into the object for easy access
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
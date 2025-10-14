// src/components/Dashboard/FindMatchContent.tsx (FIXED)

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
// import { useRouter } from 'next/navigation'; // 👈 REMOVE useRouter
import { Client, Databases, Query, Models } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';
import {
    APPWRITE_CONFIG,
    APPWRITE_DB_ID,
    APPWRITE_PROFILES_COLLECTION_ID
} from '@/constants';

// --- Type Definitions (Unchanged) ---
// ... (Unchanged Types) ...
interface AppwriteUser { $id: string; name: string; email: string; emailVerification: boolean; }
interface MatchProfile extends Models.Document {
    userId: string; bio: string; skillsToTeach: string[]; skillsToLearn: string[];
    profilePictureUrl: string; name: string;
}
interface MutualMatch {
    matchProfile: MatchProfile; teachThem: string[]; learnFromThem: string[];
}
// --- Appwrite Setup (Unchanged) ---
const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const databases = new Databases(client);

// --- Helper Component: Skill Tag Display (Unchanged) ---
const SkillTags: React.FC<{ skills: string[], bgColor: string }> = ({ skills, bgColor }) => (
    <div className="flex flex-wrap gap-2">
        {skills.map(skill => (
            <span key={skill} className={`px-3 py-1 text-xs font-semibold rounded-full ${bgColor} text-gray-800 shadow-sm`}>
                {skill}
            </span>
        ))}
    </div>
);


// --- Helper Function: Generate Conversation ID (Unchanged) ---
const getConversationId = (userA: string, userB: string): string => {
    // Ensure consistent ID by sorting: 'user1_user2'
    return [userA, userB].sort().join('_');
};


// --- Main Exported Content Component ---
// 👈 NEW PROP DEFINITION
interface FindMatchContentProps {
    onStartSwap: (convId: string, receiverId: string) => void;
}

const FindMatchContent: React.FC<FindMatchContentProps> = ({ onStartSwap }) => {
    // const router = useRouter(); // 👈 REMOVED ROUTER
    const { user, isLoading: isAuthLoading } = useAuth() as { user: AppwriteUser | null, isLoading: boolean };

    const [isClient, setIsClient] = useState(false);
    const [potentialMatches, setPotentialMatches] = useState<MutualMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ... (Effects and fetchMatches logic are unchanged) ...
    // ... (omitted for brevity, keep the original logic here) ...
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const cachedData = localStorage.getItem('cachedMatches');
            if (cachedData) {
                const initialMatches = JSON.parse(cachedData);
                setPotentialMatches(initialMatches);
                setLoading(false);
            }
            setIsClient(true);
        }
    }, []);

    const fetchMatches = useCallback(async () => {
        // ... (original fetch logic) ...
        if (isAuthLoading || !user || !isClient) return;

        if (potentialMatches.length === 0) {
            setLoading(true);
        }

        setError(null);

        try {
            // A. Fetch the current user's profile
            const myProfileResponse = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_PROFILES_COLLECTION_ID,
                [Query.equal('userId', user.$id)]
            );

            const currentUserProfile = myProfileResponse.documents[0] as unknown as MatchProfile | undefined;

            if (!currentUserProfile || !currentUserProfile.skillsToTeach || !currentUserProfile.skillsToLearn || currentUserProfile.skillsToTeach.length === 0 || currentUserProfile.skillsToLearn.length === 0) {
                setError("You must set up both skills to teach and skills to learn in your profile to find mutual matches.");
                setLoading(false);
                if (typeof window !== 'undefined') localStorage.removeItem('cachedMatches');
                return;
            }

            const myTeachSkills = currentUserProfile.skillsToTeach;
            const myLearnSkills = currentUserProfile.skillsToLearn;

            // B. OPTIMIZED SERVER-SIDE QUERY
            const allProfilesResponse = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_PROFILES_COLLECTION_ID,
                [
                    Query.notEqual('userId', user.$id),
                    Query.contains('skillsToTeach', ...myLearnSkills),
                    Query.contains('skillsToLearn', ...myTeachSkills)
                ]
            );

            const potentialMatchProfiles = allProfilesResponse.documents as unknown as MatchProfile[];
            const mutualMatches: MutualMatch[] = [];

            // C. CLIENT-SIDE LOGIC for specific skill overlap
            for (const profile of potentialMatchProfiles) {
                const matchTeachSkills = profile.skillsToTeach || [];
                const matchLearnSkills = profile.skillsToLearn || [];

                const learnFromThem = matchTeachSkills.filter(skill => myLearnSkills.includes(skill));
                const teachThem = matchLearnSkills.filter(skill => myTeachSkills.includes(skill));

                const matchName = profile.name || `User-${profile.userId.substring(0, 8)}`;

                mutualMatches.push({
                    matchProfile: { ...profile, name: matchName },
                    teachThem,
                    learnFromThem,
                });
            }

            setPotentialMatches(mutualMatches);
            if (typeof window !== 'undefined') {
                localStorage.setItem('cachedMatches', JSON.stringify(mutualMatches));
            }

        } catch (err) {
            console.error("Error finding matches:", err);
            setError("Failed to load matches due to a network or database error.");
        } finally {
            setLoading(false);
        }
    }, [user?.$id, isClient, isAuthLoading, potentialMatches.length]);

    useEffect(() => {
        if (!isAuthLoading) {
            fetchMatches();
        }
    }, [fetchMatches, isAuthLoading]);


    // --- HANDLER FOR STARTING SWAP (UPDATED) ---
    const handleStartSwap = (recipientUserId: string) => {
        if (!user || !user.$id) return;

        // 1. Generate the unique, sorted conversation ID
        const conversationId = getConversationId(user.$id, recipientUserId);

        // 2. Call the prop function provided by the DashboardMaster
        onStartSwap(conversationId, recipientUserId);
    };
    // ----------------------------------------


    // ... (Loading and Error States are unchanged) ...
    // ... (Render UI is largely unchanged, except for the button handler) ...

    // ... (omitted loading/error states for brevity) ...

    // --- Render Matches UI ---
    return (
        <div className="max-w-7xl mx-auto py-4">
            {/* ... (Header and No Matches State are unchanged) ... */}

            {potentialMatches.length === 0 ? (
                // ... (No Matches UI) ...
                <div className="p-10 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl text-center shadow-lg">
                    <p className="text-2xl font-semibold text-gray-700">No Mutual Swaps Found Yet</p>
                    <p className="text-gray-500 mt-2">Try updating your skills to teach and skills to learn to broaden your search.</p>

                    <div className="mt-6 p-4 bg-indigo-100 border-l-4 border-indigo-500 rounded-xl shadow-md max-w-lg mx-auto flex items-start space-x-3">
                        <span className="text-indigo-600 text-2xl mt-1">📧</span>
                        <div>
                            <p className="font-bold text-indigo-800">Don't worry, we'll keep looking!</p>
                            <p className="text-sm text-indigo-700 mt-1">
                                We will **send you a notification email** the moment a new mutual match is found, so you won't miss any opportunities.
                            </p>
                        </div>
                    </div>
                    {loading && <p className="mt-4 text-sm text-indigo-400">Searching for updates...</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {potentialMatches.map((match) => (
                        <div key={match.matchProfile.$id} className="bg-white p-6 rounded-2xl shadow-xl border-t-8 border-indigo-500 flex flex-col space-y-4">

                            {/* ... (Profile details and skills) ... */}
                            <div className="flex items-center space-x-4 pb-3 border-b border-gray-100">
                                <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 border-2 border-indigo-300">
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl">👤</div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{match.matchProfile.name}</h2>
                                    <p className="text-sm text-gray-500 line-clamp-1">{match.matchProfile.bio || 'No bio provided.'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <p className="text-md font-semibold text-emerald-700 mb-2 flex items-center">You Learn:</p>
                                    <SkillTags skills={match.learnFromThem} bgColor="bg-emerald-200" />
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                    <p className="text-md font-semibold text-indigo-700 mb-2 flex items-center">You Teach:</p>
                                    <SkillTags skills={match.teachThem} bgColor="bg-indigo-200" />
                                </div>
                            </div>


                            {/* Action Button: UPDATED onClick Handler */}
                            <div className="pt-4">
                                <button
                                    onClick={() => handleStartSwap(match.matchProfile.userId)} // 👈 Call the new prop-based handler
                                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition duration-150"
                                >
                                    Start SkillSwap &rarr;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FindMatchContent;
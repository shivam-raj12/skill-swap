'use client';

import React, {useState, useEffect, useCallback} from 'react';
import {Client, Databases, Query, Models, ID} from 'appwrite';
import {useAuth} from '@/hooks/useAuth';
import {
    APPWRITE_CONFIG,
    APPWRITE_DB_ID,
    APPWRITE_PROFILES_COLLECTION_ID,
    APPWRITE_CONVERSATIONS_COLLECTION_ID
} from '@/constants';


interface AppwriteUser {
    $id: string;
    name: string;
    email: string;
    emailVerification: boolean;
}

interface MatchProfile extends Models.Document {
    userId: string;
    bio: string;
    skillsToTeach: string[];
    skillsToLearn: string[];
    profilePictureUrl: string;
    name: string;
}

interface MutualMatch {
    matchProfile: MatchProfile;
    teachThem: string[];
    learnFromThem: string[];
}

const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const databases = new Databases(client);

const SkillTags: React.FC<{ skills: string[], bgColor: string }> = ({skills, bgColor}) => (
    <div className="flex flex-wrap gap-2">
        {skills.map(skill => (
            <span key={skill}
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${bgColor} text-gray-800 shadow-sm`}>
                {skill}
            </span>
        ))}
    </div>
);

const getConversationId = (userA: string, userB: string): string => {

    return [userA, userB].sort().join('_');
};

interface FindMatchContentProps {
    onStartSwap: (convId: string, receiverId: string) => void;
}

const FindMatchContent: React.FC<FindMatchContentProps> = ({onStartSwap}) => {

    const {user, isLoading: isAuthLoading} = useAuth() as { user: AppwriteUser | null, isLoading: boolean };

    const [potentialMatches, setPotentialMatches] = useState<MutualMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null);

    const fetchMatches = useCallback(async () => {

        if (isAuthLoading || !user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {

            const myProfileResponse = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_PROFILES_COLLECTION_ID,
                [Query.equal('userId', user.$id)]
            );

            const currentUserProfile = myProfileResponse.documents[0] as unknown as MatchProfile | undefined;

            if (!currentUserProfile || !currentUserProfile.skillsToTeach || !currentUserProfile.skillsToLearn || currentUserProfile.skillsToTeach.length === 0 || currentUserProfile.skillsToLearn.length === 0) {
                setError("You must set up both skills to teach and skills to learn in your profile to find mutual matches.");
                setPotentialMatches([]);
                setLoading(false);
                return;
            }

            const myTeachSkills = currentUserProfile.skillsToTeach;
            const myLearnSkills = currentUserProfile.skillsToLearn;





            const allProfilesResponse = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_PROFILES_COLLECTION_ID,
                [
                    Query.notEqual('userId', user.$id),
                    Query.contains("skillsToTeach", myLearnSkills),
                    Query.contains("skillsToLearn", myTeachSkills)
                ]
            );

            const allProfiles = allProfilesResponse.documents as unknown as MatchProfile[];

            const mutualMatches: MutualMatch[] = allProfiles.map(profile => {
                const matchName = profile.name || `User-${profile.userId.substring(0, 8)}`;

                const learnFromThem = profile.skillsToTeach.filter(skill => myLearnSkills.includes(skill));
                const teachThem = profile.skillsToLearn.filter(skill => myTeachSkills.includes(skill));

                return {
                    matchProfile: { ...profile, name: matchName },
                    teachThem: teachThem,
                    learnFromThem: learnFromThem,
                };
            }).filter(match => match.teachThem.length > 0 && match.learnFromThem.length > 0);

            setPotentialMatches(mutualMatches);

        } catch (err) {
            console.error("Error finding matches:", err);
            setError("Failed to load matches due to a network or database error.");
        } finally {
            setLoading(false);
        }
    }, [user?.$id, isAuthLoading]);

    useEffect(() => {
        if (!isAuthLoading) {
            fetchMatches();
        }
    }, [fetchMatches, isAuthLoading]);


    const handleStartSwap = async (recipientUserId: string) => {
        if (!user || !user.$id) return;

        setLoadingMatchId(recipientUserId);

        try {
            const conversationId = getConversationId(user.$id, recipientUserId);

            const existingConversations = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_CONVERSATIONS_COLLECTION_ID,
                [
                    Query.equal("ownerId", user.$id)
                ]
            );

            const conversationExists = existingConversations.documents.some(doc =>
                (doc as any).ownerId === user.$id && (doc as any).otherUserId === recipientUserId
            );

            if (!conversationExists) {
                await databases.createDocument(
                    APPWRITE_DB_ID,
                    APPWRITE_CONVERSATIONS_COLLECTION_ID,
                    ID.unique(),
                    {
                        ownerId: user.$id,
                        otherUserId: recipientUserId,
                        lastMessageText: 'New conversation started',
                        lastMessageTimestamp: new Date().toISOString(),
                        unreadCount: 0
                    }
                );
            }

            onStartSwap(conversationId, recipientUserId);
        } catch (err) {
            console.error("Error starting swap:", err);
            setError("Failed to start conversation. Please try again.");
        } finally {
            setLoadingMatchId(null);
        }
    };


    return (
        <div className="max-w-7xl mx-auto py-4">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
                <span className="mr-3 text-indigo-600">🤝</span> Find Your SkillSwap Partner
            </h1>

            {/* 1. SHOW LOADING STATE */}
            {loading && (
                <div className="flex justify-center items-center p-10 bg-white rounded-xl shadow-lg">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-500"
                         xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                                stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-xl text-indigo-500">Searching for mutual matches...</p>
                </div>
            )}

            {/* 2. SHOW ERROR STATE */}
            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md">
                    <p className="font-bold">Error:</p>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && potentialMatches.length === 0 && (
                <div
                    className="p-10 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl text-center shadow-lg">
                    <p className="text-2xl font-semibold text-gray-700">No Mutual Swaps Found Yet</p>
                    <p className="text-gray-500 mt-2">Try updating your skills to teach and skills to learn to broaden
                        your search.</p>

                    <div
                        className="mt-6 p-4 bg-indigo-100 border-l-4 border-indigo-500 rounded-xl shadow-md max-w-lg mx-auto flex items-start space-x-3">
                        <span className="text-indigo-600 text-2xl mt-1">📧</span>
                        <div>
                            <p className="font-bold text-indigo-800">Don't worry, we'll keep looking!</p>
                            <p className="text-sm text-indigo-700 mt-1">
                                We will send you a notification email the moment a new mutual match is found, so you
                                won't miss any opportunities.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. SHOW MATCHES (Only if loading is done AND we have matches) */}
            {!loading && potentialMatches.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {potentialMatches.map((match) => (
                        <div key={match.matchProfile.$id}
                             className="bg-white p-6 rounded-2xl shadow-xl border-t-8 border-indigo-500 flex flex-col space-y-4">

                            {/* ... (Profile details and skills) ... */}
                            <div className="flex items-center space-x-4 pb-3 border-b border-gray-100">
                                <div
                                    className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 border-2 border-indigo-300">
                                    <div
                                        className="w-full h-full flex items-center justify-center text-gray-500 text-3xl">👤
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-bold text-gray-800 truncate">{match.matchProfile.name}</h2>
                                    <p className="text-sm text-gray-500 truncate">{match.matchProfile.bio || 'No bio provided.'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <p className="text-md font-semibold text-emerald-700 mb-2 flex items-center">You
                                        Learn:</p>
                                    <SkillTags skills={match.learnFromThem} bgColor="bg-emerald-200"/>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                    <p className="text-md font-semibold text-indigo-700 mb-2 flex items-center">You
                                        Teach:</p>
                                    <SkillTags skills={match.teachThem} bgColor="bg-indigo-200"/>
                                </div>
                            </div>


                            {/* Action Button */}
                            <div className="pt-4">
                                <button
                                    onClick={() => handleStartSwap(match.matchProfile.userId)}
                                    disabled={loadingMatchId === match.matchProfile.userId}
                                    className={`w-full py-3 font-bold rounded-xl shadow-md transition duration-150 flex items-center justify-center ${
                                        loadingMatchId === match.matchProfile.userId
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                >
                                    {loadingMatchId === match.matchProfile.userId ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10"
                                                        stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor"
                                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Starting...
                                        </>
                                    ) : (
                                        <>Start SkillSwap &rarr;</>
                                    )}
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
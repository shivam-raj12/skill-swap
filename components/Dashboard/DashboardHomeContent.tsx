'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Client, Databases, Query, Models } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';
import { APPWRITE_CONFIG, APPWRITE_DB_ID, APPWRITE_PROFILES_COLLECTION_ID } from '@/constants';


interface AppwriteUser { $id: string; name: string; email: string; emailVerification: boolean; }
interface MatchProfile extends Models.Document {
    userId: string; bio: string; skillsToTeach: string[]; skillsToLearn: string[];
    profilePictureUrl: string; name: string;
}
interface MutualMatch {
    matchProfile: MatchProfile; teachThem: string[]; learnFromThem: string[];
}

interface ActivityItem { id: string; text: string; time: string; }

const client = new Client();
client.setEndpoint(APPWRITE_CONFIG.endpoint).setProject(APPWRITE_CONFIG.projectId);
const databases = new Databases(client);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calculateProfileCompletion = (profile: any | null): number => {
    if (!profile) return 0;
    let completedSteps = 0;
    const totalSteps = 4;
    if (profile.bio && profile.bio.trim().length > 0) completedSteps += 1;
    if (Array.isArray(profile.skillsToTeach) && profile.skillsToTeach.length > 0) completedSteps += 1;
    if (Array.isArray(profile.skillsToLearn) && profile.skillsToLearn.length > 0) completedSteps += 1;
    if (profile.profilePictureUrl && profile.profilePictureUrl.length > 0) completedSteps += 1;
    return Math.round((completedSteps / totalSteps) * 100);
};

const fetchMutualMatches = async (
    currentUserId: string,
    myTeachSkills: string[],
    myLearnSkills: string[]
): Promise<MutualMatch[]> => {
    try {
        const allProfilesResponse = await databases.listDocuments(
            APPWRITE_DB_ID,
            APPWRITE_PROFILES_COLLECTION_ID,
            [
                Query.notEqual('userId', currentUserId),
                Query.contains('skillsToTeach', myLearnSkills),
                Query.contains('skillsToLearn', myTeachSkills)
            ]
        );
        const potentialMatchProfiles = allProfilesResponse.documents as unknown as MatchProfile[];
        const mutualMatches: MutualMatch[] = [];

        for (const profile of potentialMatchProfiles) {
            const matchTeachSkills = profile.skillsToTeach || [];
            const matchLearnSkills = profile.skillsToLearn || [];
            const learnFromThem = matchTeachSkills.filter(skill => myLearnSkills.includes(skill));
            const teachThem = matchLearnSkills.filter(skill => myTeachSkills.includes(skill));

            if (learnFromThem.length > 0 && teachThem.length > 0) {
                const matchName = profile.name || `User-${profile.userId.substring(0, 8)}`;
                mutualMatches.push({
                    matchProfile: { ...profile, name: matchName },
                    teachThem,
                    learnFromThem,
                });
            }
        }
        return mutualMatches;
    } catch (err) {
        console.error("Error fetching mutual matches:", err);
        return [];
    }
};

// --- Skeleton Components (REUSED) ---
const SkeletonBlock: React.FC<{ className: string }> = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

const CardSkeleton: React.FC<{ height: string }> = ({ height }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-100 ${height}`}>
        <SkeletonBlock className="h-4 w-1/2 mb-3" />
        <SkeletonBlock className="h-10 w-full" />
    </div>
);

const ActivitySkeleton: React.FC = () => (
    <ul className="space-y-3">
        {[1, 2, 3].map(i => (
            <li key={i} className="p-3 border border-gray-100 rounded-lg bg-white">
                <SkeletonBlock className="h-4 w-4/5 mb-1" />
                <SkeletonBlock className="h-3 w-1/4" />
            </li>
        ))}
    </ul>
);

// --- Dashboard Home Content Component ---
const DashboardHomeContent: React.FC<{ onQuickNavigate: (viewId: string) => void }> = ({ onQuickNavigate }) => {
    // UPDATED: Get all necessary states from useAuth
    const {
        user,
        isLoading: isAuthLoading,
        unreadMessageCount,
        recentActivity: hookRecentActivity, // Renamed to avoid collision
        isActivityLoading
    } = useAuth() as {
        user: AppwriteUser | null,
        isLoading: boolean,
        unreadMessageCount: number,
        recentActivity: ActivityItem[] | null,
        isActivityLoading: boolean
    };

    const [profile, setProfile] = useState<MatchProfile | null>(null);
    const [mainLoading, setMainLoading] = useState(true);
    const [completionPercentage, setCompletionPercentage] = useState(0);

    const [matchesLoading, setMatchesLoading] = useState(true);
    const [matchesCount, setMatchesCount] = useState<number | null>(null);

    // --- Core Data Fetch Logic (CLEANED UP) ---
    const fetchDashboardData = useCallback(async () => {
        if (!user) return;

        setMatchesLoading(true);
        // isActivityLoading is now controlled by the hook

        try {
            // A. Fetch Profile
            const profileResponse = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_PROFILES_COLLECTION_ID,
                [Query.equal('userId', user.$id)]
            );
            const fetchedProfile = profileResponse.documents[0] as unknown as MatchProfile | undefined;

            if (fetchedProfile) {
                setProfile(fetchedProfile);
                setCompletionPercentage(calculateProfileCompletion(fetchedProfile));
            } else {
                setProfile(null);
            }

            // --- Secondary Fetches ---
            if (fetchedProfile) {

                // B. Fetch Matches
                if (fetchedProfile.skillsToTeach && fetchedProfile.skillsToLearn) {
                    const myTeach = fetchedProfile.skillsToTeach;
                    const myLearn = fetchedProfile.skillsToLearn;
                    if (myTeach.length > 0 && myLearn.length > 0) {
                        const matchesList = await fetchMutualMatches(user.$id, myTeach, myLearn);
                        setMatchesCount(matchesList.length);
                    } else {
                        setMatchesCount(0);
                    }
                } else {
                    setMatchesCount(0);
                }
                setMatchesLoading(false);


                // C. Message/Activity Fetch REMOVED - now handled by useAuth hook
            }

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setMatchesCount(0);
        } finally {
            setMainLoading(false);
            setMatchesLoading(false);
        }
    }, [user]);

    // Effect to run fetch (REUSED)
    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchDashboardData();
        }
        if (!isAuthLoading && !user) {
            setMainLoading(false);
        }
    }, [user, isAuthLoading, fetchDashboardData]);


    // --- RENDER LOGIC (MODIFIED) ---

    // 1. RENDER: MAIN LOADING STATE (REUSED)
    if (isAuthLoading || mainLoading) {
        return (
            <div className="text-center py-20">
                <p className="text-xl text-indigo-600 animate-pulse font-semibold">Loading your skill hub...</p>
                <div className="mt-4 mx-auto w-1/3 h-1 bg-indigo-200 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-indigo-500 animate-slide-right"></div>
                </div>
            </div>
        );
    }

    // 2. RENDER: ERROR/MISSING PROFILE STATE (REUSED)
    if (!user || !profile) {
        return (
            <div className="p-8 text-center bg-red-100 rounded-xl shadow-lg border-2 border-red-300 max-w-lg mx-auto mt-10">
                <p className="text-lg text-red-700 font-bold">⚠️ Profile data is missing.</p>
                <p className="text-gray-600 mt-2">Please complete your profile setup to access the dashboard features.</p>
                <Link href="/dashboard/profile-setup" className="text-white bg-red-500 hover:bg-red-600 font-semibold py-2 px-6 rounded-full mt-4 inline-block transition duration-200">
                    Go to Setup &rarr;
                </Link>
            </div>
        );
    }

    const firstName = user.name.split(' ')[0];

    // 3. RENDER: SUCCESS STATE (REUSED UI)
    return (
        <div className="space-y-8">

            {/* --- WELCOME & VERIFICATION BANNER --- */}
            <header className="relative p-8 rounded-2xl shadow-2xl overflow-hidden text-white bg-gradient-to-br from-indigo-600 to-purple-700">
                <h1 className="text-5xl font-extrabold mb-1 z-10 relative">
                    Welcome back, {firstName}!
                </h1>
                <p className="text-lg opacity-90 z-10 relative">
                    Your hub for teaching, learning, and swapping skills.
                </p>

                <div className="absolute top-0 right-0 h-full w-1/2 bg-white/10 transform skew-x-12 origin-top-right"></div>
            </header>

            {/* --- MAIN CONTENT GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column (2/3 width) - Focus: Activity & Main Stats */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Key Metrics: Matches and Messages */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Dominant Card: Matches */}
                        {matchesLoading ? (
                            <CardSkeleton height="h-32" />
                        ) : (
                            <div className="col-span-1 md:col-span-2 p-6 rounded-xl shadow-xl bg-emerald-500 text-white border-b-8 border-emerald-700 transform hover:scale-[1.01] transition duration-300 cursor-pointer" onClick={() => onQuickNavigate('find-match')}>
                                <p className="text-sm font-semibold opacity-90">Potential Swaps</p>
                                <p className="text-5xl font-extrabold mt-1">
                                    {matchesCount ?? 0} {matchesCount === 1 ? 'New Match' : 'Mutual Matches'}
                                </p>
                                <p className="mt-2 font-medium text-emerald-900 bg-white/20 px-2 py-1 rounded-full w-fit text-sm">
                                    Start swapping now &rarr;
                                </p>
                            </div>
                        )}

                        {/* Card: Messages (Uses unreadMessageCount from useAuth) */}
                        <div className="p-6 rounded-xl shadow-md bg-indigo-50 border border-indigo-200 text-indigo-800 hover:shadow-lg transition duration-300 cursor-pointer" onClick={() => onQuickNavigate('messages')}>
                            <p className="text-sm font-medium">Unread Inbox</p>
                            <p className="text-4xl font-extrabold mt-1">{unreadMessageCount}</p>
                            <p className="text-xs mt-1 font-semibold">
                                {unreadMessageCount === 0 ? 'All caught up!' : 'Check your messages.'}
                            </p>
                        </div>
                    </div>

                    {/* Recent Activity Feed (USES REAL DATA) */}
                    <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="text-indigo-500 mr-2">⏱️</span> Recent Swap Activity
                        </h2>

                        {isActivityLoading ? (
                            <ActivitySkeleton />
                        ) : (
                            <ul className="space-y-3">
                                {hookRecentActivity && hookRecentActivity.map((activity: ActivityItem) => (
                                    <li key={activity.id} className="p-3 border border-gray-100 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 transition hover:bg-gray-100 shadow-sm">
                                        {/* Activity text now comes directly from the description field */}
                                        <span className="text-gray-700 font-medium text-base mb-1 sm:mb-0" dangerouslySetInnerHTML={{ __html: activity.text }}></span>
                                        {/* Time now comes from the formatted $createdAt */}
                                        <span className="text-xs text-gray-500">{activity.time}</span>
                                    </li>
                                ))}
                                {hookRecentActivity?.length === 0 && (
                                    <li className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        No recent activity yet. Go find a match!
                                    </li>
                                )}
                            </ul>
                        )}
                    </section>
                </div>

                {/* Right Column (1/3 width) - Focus: Profile & Quick Links (REUSED) */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Skill Status Block (What I Teach vs. What I Learn) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Your Skill Balance
                        </h3>
                        <div className="space-y-4">
                            {/* Teach Skills */}
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm font-semibold text-red-600 flex items-center">
                                    <span className="mr-2 text-xl">💡</span> I Teach
                                </p>
                                <p className="text-2xl font-extrabold text-red-800">
                                    {profile.skillsToTeach?.length ?? 0} Skills
                                </p>
                            </div>

                            {/* Learn Skills */}
                            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                <p className="text-sm font-semibold text-blue-600 flex items-center">
                                    <span className="mr-2 text-xl">📚</span> I Learn
                                </p>
                                <p className="text-2xl font-extrabold text-blue-800">
                                    {profile.skillsToLearn?.length ?? 0} Skills
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Completion / Quick Actions */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Profile Hub
                        </h3>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-gray-600 font-medium">Completion</p>
                            <span className="text-2xl font-bold text-yellow-600">{completionPercentage}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                            <div
                                className="bg-yellow-500 h-2.5 rounded-full transition-all duration-700"
                                style={{ width: `${completionPercentage}%` }}
                            ></div>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-3">
                            <Link href="/dashboard/profile-setup" className="flex items-center justify-between text-indigo-600 hover:text-indigo-800 font-semibold border-b border-indigo-100 pb-1">
                                Update My Profile (Info & Skills)
                                <span>&rarr;</span>
                            </Link>
                            <button onClick={() => onQuickNavigate('find-match')} className="w-full flex items-center justify-between text-emerald-600 hover:text-emerald-800 font-semibold border-b border-emerald-100 pb-1">
                                Find New Matches
                                <span>&rarr;</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHomeContent;
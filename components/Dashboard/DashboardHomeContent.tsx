'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Client, Account, Databases, Query, Models } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';
import { APPWRITE_CONFIG, APPWRITE_DB_ID, APPWRITE_PROFILES_COLLECTION_ID } from '@/constants';

// --- Type Definitions (Unchanged) ---
interface AppwriteUser { $id: string; name: string; email: string; emailVerification: boolean; }
interface MatchProfile extends Models.Document {
    userId: string; bio: string; skillsToTeach: string[]; skillsToLearn: string[];
    profilePictureUrl: string; name: string;
}
interface MutualMatch {
    matchProfile: MatchProfile; teachThem: string[]; learnFromThem: string[];
}
interface ActivityItem { id: number; text: string; time: string; } // New type for clarity

// --- Appwrite Setup & Helper Logic (Unchanged) ---
const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const account = new Account(client);
const databases = new Databases(client);

// Helper function to calculate profile completion (Unchanged)
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

// Helper function to fetch mutual matches (for count and cache) (Unchanged)
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
            const matchLearnSkills = profile.skillsToLearn || []; // Corrected property access

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

// --- Skeleton Components (Unchanged) ---
const SkeletonBlock: React.FC<{ className: string }> = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

const CardSkeleton: React.FC<{ color: string }> = ({ color }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg border-l-4 border-${color}-500`}>
        <p className="text-sm font-medium text-gray-500">Loading Data...</p>
        <SkeletonBlock className="h-10 w-1/3 mt-2" />
        <SkeletonBlock className="h-4 w-1/2 mt-4" />
    </div>
);

const ActivitySkeleton: React.FC = () => (
    <ul className="space-y-4">
        {[1, 2].map(i => (
            <li key={i} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <SkeletonBlock className="h-4 w-3/4 mb-1" />
                <SkeletonBlock className="h-3 w-1/4" />
            </li>
        ))}
    </ul>
);


// --- Function to check initial cache and return state values (UPDATED) ---
const getInitialProfileState = () => {
    let initialProfile: MatchProfile | null = null;
    let isCached = false;
    let initialMatchesCount: number | null = null;
    let initialUnreadMessages: number | null = null;
    let initialRecentActivity: ActivityItem[] | null = null;

    if (typeof window !== 'undefined') {
        try {
            const cachedProfileData = localStorage.getItem('cachedProfile');
            if (cachedProfileData) {
                initialProfile = JSON.parse(cachedProfileData);
                isCached = true;
            }

            const cachedMatchData = localStorage.getItem('cachedMatches');
            if (cachedMatchData) {
                const initialMatches = JSON.parse(cachedMatchData) as MutualMatch[];
                initialMatchesCount = initialMatches.length;
            }

            const cachedMessages = localStorage.getItem('cachedUnreadMessages');
            if (cachedMessages) {
                initialUnreadMessages = parseInt(cachedMessages, 10);
            }

            const cachedActivity = localStorage.getItem('cachedRecentActivity');
            if (cachedActivity) {
                initialRecentActivity = JSON.parse(cachedActivity) as ActivityItem[];
            }
        } catch (e) {
            console.error("Error reading cache during initialization:", e);
        }
    }

    return {
        initialProfile,
        isCached,
        initialMatchesCount,
        initialUnreadMessages,
        initialRecentActivity
    };
};

// --- Dashboard Home Content Component ---
const DashboardHomeContent: React.FC<{ onQuickNavigate: (viewId: string) => void }> = ({ onQuickNavigate }) => {
    const { user, isLoading: isAuthLoading } = useAuth() as { user: AppwriteUser | null, isLoading: boolean };

    const {
        initialProfile,
        isCached,
        initialMatchesCount,
        initialUnreadMessages,
        initialRecentActivity
    } = getInitialProfileState();

    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    // Profile States
    const [profile, setProfile] = useState<MatchProfile | null>(initialProfile);
    // FIX: Set mainLoading to TRUE by default, and let fetchDashboardData turn it off once status is confirmed.
    const [mainLoading, setMainLoading] = useState(true);
    const [completionPercentage, setCompletionPercentage] = useState(initialProfile ? calculateProfileCompletion(initialProfile) : 0);

    // Match States
    const [matchesLoading, setMatchesLoading] = useState(initialMatchesCount === null);
    const [matchesCount, setMatchesCount] = useState<number | null>(initialMatchesCount);

    // Message States
    const [messagesLoading, setMessagesLoading] = useState(initialUnreadMessages === null);
    const [unreadMessages, setUnreadMessages] = useState<number | null>(initialUnreadMessages);

    // Activity States
    const [activityLoading, setActivityLoading] = useState(initialRecentActivity === null);
    const [recentActivity, setRecentActivity] = useState<ActivityItem[] | null>(initialRecentActivity);


    // --- EFFECT: Data Fetch (Always runs for fresh data) ---
    const fetchDashboardData = useCallback(async () => {
        if (!user) {
            // User is null (either not logged in or auth failed) - handled by useEffect below.
            return;
        }

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
                if (typeof window !== 'undefined') {
                    localStorage.setItem('cachedProfile', JSON.stringify(fetchedProfile));
                }
            } else {
                if (typeof window !== 'undefined') localStorage.removeItem('cachedProfile');
                setProfile(null); // Profile is explicitly missing
            }

            // --- Secondary Fetches (Only run if profile was found or if we have cache) ---
            if (fetchedProfile || isCached) {
                // B. Fetch Matches (Unchanged)
                if (matchesCount === null) setMatchesLoading(true);

                if (fetchedProfile && fetchedProfile.skillsToTeach && fetchedProfile.skillsToLearn) {
                    const myTeach = fetchedProfile.skillsToTeach;
                    const myLearn = fetchedProfile.skillsToLearn;

                    if (myTeach.length > 0 && myLearn.length > 0) {
                        const matchesList = await fetchMutualMatches(user.$id, myTeach, myLearn);
                        setMatchesCount(matchesList.length);
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('cachedMatches', JSON.stringify(matchesList));
                        }
                    } else {
                        setMatchesCount(0);
                        if (typeof window !== 'undefined') localStorage.removeItem('cachedMatches');
                    }
                } else {
                    setMatchesCount(0);
                }
                setMatchesLoading(false);


                // C. Simulate Messages Fetch (Unchanged)
                if (unreadMessages === null) setMessagesLoading(true);
                await new Promise(resolve => setTimeout(resolve, 500));
                const freshUnreadMessages = 1;
                setUnreadMessages(freshUnreadMessages);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('cachedUnreadMessages', freshUnreadMessages.toString());
                }
                setMessagesLoading(false);

                // D. Simulate Activity Fetch (Unchanged)
                if (recentActivity === null) setActivityLoading(true);
                await new Promise(resolve => setTimeout(resolve, 400));
                const freshActivity: ActivityItem[] = [
                    { id: 1, text: 'You offered **Python** lessons to Alex.', time: '2 hours ago' },
                    { id: 2, text: 'New match found: **Sarah** wants to learn React.', time: '5 hours ago' }
                ];
                setRecentActivity(freshActivity);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('cachedRecentActivity', JSON.stringify(freshActivity));
                }
                setActivityLoading(false);
            }

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            // On error, we still stop loading the main screen
        } finally {
            // FIX: This must run once everything above is done, confirming we have a state (profile or no profile)
            setMainLoading(false);
        }
    }, [user, isCached, matchesCount, unreadMessages, recentActivity]);

    // This effect controls when the fetch runs and handles the initial auth check.
    useEffect(() => {
        // If authentication is finished and a user exists, start fetching data.
        if (!isAuthLoading && user) {
            fetchDashboardData();
        }

        // If authentication finished and user is null, stop main loading immediately.
        if (!isAuthLoading && !user) {
            setMainLoading(false);
        }
    }, [user, isAuthLoading, fetchDashboardData]);

    // Resend Verification Handler (Unchanged)
    const handleResendVerification = async () => {
        setResendStatus('sending');
        try {
            if (typeof window === 'undefined') return;

            await account.createVerification(
                `${window.location.origin}/verify-email`
            );
            setResendStatus('success');
        } catch (error) {
            console.error('Resend Verification Error:', error);
            setResendStatus('error');
        } finally {
            setTimeout(() => setResendStatus('idle'), 5000);
        }
    };

    // --- RENDER LOGIC ---

    // 1. RENDER: MAIN LOADING STATE
    // Show the loading bar if auth is still running OR if the component started fetching but hasn't finished yet.
    if (isAuthLoading || mainLoading) {
        return (
            <div className="text-center py-20">
                <p className="text-xl text-indigo-600 animate-pulse font-semibold">Loading welcome data...</p>
                <div className="mt-4 mx-auto w-1/3 h-1 bg-indigo-200 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-indigo-500 animate-slide-right"></div>
                </div>
            </div>
        );
    }

    // 2. RENDER: ERROR/MISSING PROFILE STATE
    // This is only checked once mainLoading and isAuthLoading are confirmed FALSE.
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

    // 3. RENDER: SUCCESS STATE (Unchanged)
    return (
        <>
            {/* Header Welcome */}
            <header className="mb-10 bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500">
                <h1 className="text-4xl font-extrabold text-gray-900">
                    Hello, {firstName}! 🤝
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                    Ready to swap? Here's what's new on your SkillSwap journey.
                </p>
            </header>

            {/* Email Verification Banner */}
            {!user.emailVerification && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-lg shadow-md" role="alert">
                    <div className="mb-4 sm:mb-0">
                        <p className="font-bold text-lg">⚠️ Action Required: Verify Your Email</p>
                        <p className="text-sm">Your email address ({user.email}) is not verified.</p>
                    </div>
                    <button
                        onClick={handleResendVerification}
                        disabled={resendStatus === 'sending' || resendStatus === 'success'}
                        className="flex items-center justify-center flex-shrink-0 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-full transition duration-150 disabled:opacity-50 text-sm"
                    >
                        {resendStatus === 'sending' ? ('Sending...') : resendStatus === 'success' ? ('Link Sent!') : ('Resend Link')}
                    </button>
                </div>
            )}

            {/* Key Cards / Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">

                {/* Card 1: Match Status */}
                {matchesLoading ? (
                    <CardSkeleton color="emerald" />
                ) : (
                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-emerald-500 hover:shadow-xl transition duration-300">
                        <p className="text-sm font-medium text-gray-500">New Matches</p>
                        <p className="text-4xl font-bold text-emerald-600 mt-1">{matchesCount ?? 0}</p>
                        <button
                            onClick={() => onQuickNavigate('find-match')}
                            className="text-emerald-500 text-sm font-semibold hover:text-emerald-600 mt-2 inline-block"
                        >
                            View Matches &rarr;
                        </button>
                    </div>
                )}

                {/* Card 2: Messages - Now uses cache */}
                {messagesLoading ? (
                    <CardSkeleton color="indigo" />
                ) : (
                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500 hover:shadow-xl transition duration-300">
                        <p className="text-sm font-medium text-gray-500">Unread Messages</p>
                        <p className="text-4xl font-bold text-indigo-600 mt-1">{unreadMessages ?? 0}</p>
                        <button
                            onClick={() => onQuickNavigate('messages')}
                            className="text-indigo-500 text-sm font-semibold hover:text-indigo-600 mt-2 inline-block"
                        >
                            Go to Inbox &rarr;
                        </button>
                    </div>
                )}

                {/* Card 3: Profile Completion */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500 hover:shadow-xl transition duration-300">
                    <p className="text-sm font-medium text-gray-500">Profile Strength</p>
                    <p className="text-4xl font-bold text-yellow-600 mt-1">{completionPercentage}%</p>
                    <Link href="/dashboard/profile-setup" className="text-yellow-500 text-sm font-semibold hover:text-yellow-600 mt-2 inline-block">
                        {completionPercentage < 100 ? 'Complete Profile' : 'Edit Profile'} &rarr;
                    </Link>
                </div>
            </div>

            {/* Activity Feed - Now uses cache */}
            <section className="bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                    Your Recent Activity
                </h2>

                {activityLoading ? (
                    <ActivitySkeleton />
                ) : (
                    <ul className="space-y-4">
                        {/* Use ActivityItem type for clarity */}
                        {recentActivity && recentActivity.map((activity: ActivityItem) => (
                            <li key={activity.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center bg-gray-50 transition hover:bg-gray-100">
                                <span className="text-gray-700 font-medium">{activity.text}</span>
                                <span className="text-xs text-gray-500">{activity.time}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
};

export default DashboardHomeContent;
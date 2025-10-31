'use client';

import React, {useState, useEffect, useCallback} from 'react';
import {useAuth} from '@/hooks/useAuth';
import {Client, Databases, Query} from 'appwrite';
import Link from 'next/link';
import {APPWRITE_CONFIG, APPWRITE_MEETINGS_COLLECTION_ID, APPWRITE_PROFILES_COLLECTION_ID} from "@/constants";


const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const databases = new Databases(client);


interface ScheduleDetails {
    time: string;
    startDate: string;
    durationMonths: number;
    frequency: string;
    timezone: string;
    utcTime: string;
}

interface Meeting {
    $id: string;
    participants: string[];
    meetingId: string;
    scheduleDetails: string;
    partnerId: string;
    partnerName: string;
}


const isMeetingJoinable = (scheduleJson: string): boolean => {
    try {
        const details: ScheduleDetails = JSON.parse(scheduleJson);


        const meetingStartDate = new Date(details.startDate);


        meetingStartDate.setHours(0, 0, 0, 0);


        const today = new Date();
        today.setHours(0, 0, 0, 0);



        return meetingStartDate <= today;

    } catch (e) {
        console.error('Failed to parse schedule JSON for join check:', e);
        return false;
    }
};

const MeetingsContent: React.FC = () => {

    const {user, isLoading: isAuthChecking} = useAuth();
    const currentUserId = user?.$id;

    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const fetchPartnerDetails = useCallback(async (userId: string): Promise<string> => {
        if (!userId) return 'Unknown Partner';

        try {
            const profile = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_PROFILES_COLLECTION_ID,
                [
                    // Query corrected to assume User ID is the Document $id for linking
                    Query.equal("userId", userId),
                    Query.limit(1)
                ]
            );

            return (profile.documents[0] as any).name || `User ID: ${userId.substring(0, 4)}...`;

        } catch (e) {
            console.error(`Error fetching profile for ${userId}:`, e);
            return `Partner (Error)`;
        }
    }, []);


    const fetchMeetings = useCallback(async () => {
        if (!currentUserId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const meetingsResponse = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_MEETINGS_COLLECTION_ID,
                [
                    Query.contains('participants', currentUserId),
                    Query.limit(100)
                ]
            );

            const meetingsWithPartnerId: Omit<Meeting, 'partnerName'>[] = meetingsResponse.documents.map((doc: any) => {
                const partnerId = doc.participants.find((id: string) => id !== currentUserId) || doc.participants[0];
                return {
                    $id: doc.$id,
                    participants: doc.participants,
                    meetingId: doc.meetingId,
                    scheduleDetails: doc.scheduleDetails,
                    partnerId: partnerId,
                };
            });

            const partnerIds = meetingsWithPartnerId.map(m => m.partnerId);
            const partnerDetailsPromises = partnerIds.map(id => fetchPartnerDetails(id));
            const partnerNames = await Promise.all(partnerDetailsPromises);

            const finalMeetings: Meeting[] = meetingsWithPartnerId.map((meeting, index) => ({
                ...meeting,
                partnerName: partnerNames[index],
            }));

            setMeetings(finalMeetings);

        } catch (err) {
            console.error('Error fetching meetings:', err);
            setError('Could not load scheduled meetings. Please check your Appwrite connection/collection IDs.');
        } finally {
            setIsLoading(false);
        }
    }, [currentUserId, fetchPartnerDetails]);

    useEffect(() => {
        if (!isAuthChecking && currentUserId) {
            fetchMeetings();
        }
    }, [isAuthChecking, currentUserId, fetchMeetings]);


    const renderSchedule = (scheduleJson: string, partnerName: string) => {
        try {
            const details: ScheduleDetails = JSON.parse(scheduleJson);

            const isSpecificDay = details.frequency.includes(',');
            const frequencyText = isSpecificDay
                ? `Weekly on ${details.frequency}`
                : details.frequency === 'Weekends Only'
                    ? 'Every Weekend'
                    : details.frequency === 'Daily'
                        ? 'Daily'
                        : details.frequency;

            const utcDateTimeString = `${details.startDate}T${details.utcTime}:00.000Z`;
            const localTimeDate = new Date(utcDateTimeString);
            const formattedLocalTime = localTimeDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            });

            const date = new Date(details.startDate + 'T00:00:00');
            const formattedDate = date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});


            return (
                <div className="space-y-4">
                    <p className="text-2xl font-extrabold text-indigo-700">Swapping with: {partnerName}</p>

                    <div className="grid grid-cols-2 gap-3 text-sm">

                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-xl text-emerald-600">🗓️</span>
                            <div className="leading-tight">
                                <p className="font-semibold text-gray-900">Starts</p>
                                <p className="text-xs text-gray-500">{formattedDate}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-xl text-indigo-600">🕒</span>
                            <div className="leading-tight">
                                <p className="font-semibold text-gray-900">Your Time</p>
                                <p className="text-xs text-gray-500">{formattedLocalTime}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-xl text-yellow-600">🔁</span>
                            <div className="leading-tight">
                                <p className="font-semibold text-gray-900">Frequency</p>
                                <p className="text-xs text-gray-500">{frequencyText}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-xl text-rose-600">🚀</span>
                            <div className="leading-tight">
                                <p className="font-semibold text-gray-900">Commitment</p>
                                <p className="text-xs text-gray-500">
                                    {details.durationMonths} {details.durationMonths > 1 ? 'months' : 'month'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } catch (e) {
            console.error('Failed to parse schedule JSON:', e);
            return <p className="text-red-500">Schedule details corrupt.</p>;
        }
    };

    // --- Loading/Error/Sign-in Status ---
    if (isAuthChecking) {
        return (
            <div
                className="p-8 bg-white rounded-xl shadow-lg border-l-4 border-indigo-500 flex items-center justify-center h-48">
                <svg className="animate-spin h-6 w-6 text-indigo-600 mr-3" xmlns="http://www.w3.org/2000/svg"
                     fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                            strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg text-indigo-600">Fetching current user status...</p>
            </div>
        );
    }

    if (!currentUserId) {
        return <div className="p-8 text-center text-gray-500">Please sign in to view your meetings.</div>;
    }

    if (isLoading) {
        return (
            <div
                className="p-8 bg-white rounded-xl shadow-lg border-l-4 border-indigo-500 flex items-center justify-center h-48">
                <svg className="animate-spin h-6 w-6 text-indigo-600 mr-3" xmlns="http://www.w3.org/2000/svg"
                     fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                            strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg text-indigo-600">Loading partner details and sessions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-100 rounded-xl shadow-lg border-l-4 border-red-500">
                <h2 className="text-2xl font-bold text-red-800">Connection Error!</h2>
                <p className="mt-2 text-red-700">{error}</p>
            </div>
        );
    }

    // --- Render Content ---
    return (
        <div className="p-4 md:p-8 bg-gray-50 rounded-xl shadow-2xl">
            <h2 className="text-4xl font-extrabold text-indigo-700 mb-6 flex items-center">
                <span className="mr-3">⭐</span> Your Scheduled Swap Sessions
            </h2>

            {meetings.length === 0 ? (
                <div className="text-center p-12 bg-white border border-dashed border-gray-300 rounded-xl shadow-inner">
                    <span className="text-6xl mb-4 block">😢</span>
                    <p className="text-xl font-medium text-gray-700">No active meetings scheduled yet.</p>
                    <p className="text-gray-500 mt-2">Start a chat with a partner and propose a session to get
                        started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {meetings.map((meeting) => {
                        // Check if the meeting is joinable
                        const canJoin = isMeetingJoinable(meeting.scheduleDetails);

                        // Define button classes based on join status
                        const joinButtonClasses = canJoin
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed";

                        const joinButtonText = canJoin ? "Join Meeting Now" : "Available on Start Date";

                        return (
                            <div
                                key={meeting.$id}
                                className="bg-white p-6 rounded-2xl shadow-xl transition transform hover:shadow-2xl hover:scale-[1.02] border-t-4 border-emerald-500 flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center pb-2 border-b">
                                        <span className="mr-2 text-2xl">🤝</span> Skill Swap Session
                                    </h3>
                                    <div className="mb-4">
                                        {renderSchedule(meeting.scheduleDetails, meeting.partnerName)}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <button
                                        onClick={() => {
                                            if (canJoin) {
                                                window.location.href = `/meetings/${meeting.meetingId}`;
                                            }
                                        }}
                                        disabled={!canJoin}
                                        className={`w-full flex items-center justify-center font-semibold py-3 px-4 rounded-xl shadow-lg transition duration-300 ${joinButtonClasses}`}
                                    >
                                        <span className="mr-2 text-lg">▶️</span> {joinButtonText}
                                    </button>

                                    <Link href={`/recordings/${meeting.meetingId}`} passHref legacyBehavior>
                                        <a className="w-full flex items-center justify-center bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl shadow-md hover:bg-gray-300 transition duration-300">
                                            <span className="mr-2 text-lg">📼</span> View Recordings
                                        </a>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MeetingsContent;
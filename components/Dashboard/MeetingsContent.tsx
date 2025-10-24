'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// Assuming these are all correctly defined and available in your environment:
import { useAuth } from '@/hooks/useAuth';
import { Client, Databases, Query } from 'appwrite';
import {APPWRITE_CONFIG, APPWRITE_MEETINGS_COLLECTION_ID, APPWRITE_PROFILES_COLLECTION_ID} from "@/constants";


// Initialize the Appwrite Client
const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const databases = new Databases(client);

// --- Interface Definitions ---

interface ScheduleDetails {
    time: string;
    startDate: string;
    durationMonths: number;
    frequency: string;
}

interface Meeting {
    $id: string;
    participants: string[]; // List of user IDs
    meetingId: string; // The ID used for the video room
    scheduleDetails: string; // JSON string
    partnerId: string; // The ID of the other person in the meeting
    partnerName: string; // Now correctly initialized and fetched
}

// --- Component ---

const MeetingsContent: React.FC = () => {
    const { user } = useAuth();
    const currentUserId = user?.$id;

    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    // NEW: Function to fetch a single partner's name from the profiles collection
    const fetchPartnerDetails = useCallback(async (userId: string): Promise<string> => {
        if (!userId) return 'Unknown Partner';

        try {
            // Appwrite document IDs in a profiles collection often match the User ID
            const profile = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_PROFILES_COLLECTION_ID,
                [
                    Query.equal("userId", userId),
                    Query.limit(1)
                ]
            );

            // Assuming the profile document has a 'name' field
            return profile.documents[0].name || `User ID: ${userId.substring(0, 4)}...`;

        } catch (e) {
            console.error(`Error fetching profile for ${userId}:`, e);
            return `Partner (Error)`;
        }
    }, []);


    // Function to fetch meetings AND their partner names
    const fetchMeetings = useCallback(async () => {
        if (!currentUserId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Fetch Meeting Documents
            const meetingsResponse = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_MEETINGS_COLLECTION_ID,
                [
                    Query.contains('participants', currentUserId),
                    Query.limit(100)
                ]
            );

            // Pre-process meetings to extract partner IDs
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

            // Get a list of all unique partner IDs
            const partnerIds = meetingsWithPartnerId.map(m => m.partnerId);

            // 2. Fetch all Partner Names concurrently using Promise.all
            const partnerDetailsPromises = partnerIds.map(id => fetchPartnerDetails(id));
            const partnerNames = await Promise.all(partnerDetailsPromises);

            // 3. Combine meetings with their fetched names
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
    }, [currentUserId, fetchPartnerDetails]); // Add fetchPartnerDetails to dependency array

    useEffect(() => {
        if (currentUserId) {
            fetchMeetings();
        }
    }, [currentUserId, fetchMeetings]); // Add fetchMeetings to dependency array


    // --- Helper function to render schedule details (Unchanged UI/Formatting) ---
    const renderSchedule = (scheduleJson: string, partnerName: string) => {
        try {
            const details: ScheduleDetails = JSON.parse(scheduleJson);
            const isSpecificDay = details.frequency.includes(',');
            const frequencyText = isSpecificDay
                ? `Weekly on ${details.frequency}`
                : details.frequency === 'Weekends Only'
                    ? 'Every Weekend'
                    : details.frequency === 'Daily'
                        ? 'Daily Sessions'
                        : details.frequency;

            // Format start date
            const date = new Date(details.startDate + 'T00:00:00');
            const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });


            return (
                <div className="space-y-3 text-gray-700">
                    <p className="text-xl font-extrabold text-indigo-700 tracking-wide">Swapping with: {partnerName}</p>
                    <div className="flex flex-wrap items-center space-x-4 pt-1">
                        <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                            <span className="text-xl text-emerald-600">🗓️</span>
                            <span className="font-semibold text-sm">Starts: {formattedDate}</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                            <span className="text-xl text-indigo-600">🕒</span>
                            <span className="font-semibold text-sm">Time: {details.time} (Local)</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                        <span className="text-xl text-yellow-600">🔁</span>
                        <span className="font-medium text-base text-gray-800">{frequencyText}</span>
                    </div>

                    <div className="text-sm pt-1 text-gray-500 italic">
                        Commitment: {details.durationMonths} {details.durationMonths > 1 ? 'months' : 'month'}
                    </div>
                </div>
            );
        } catch (e) {
            console.error('Failed to parse schedule JSON:', e);
            return <p className="text-red-500">Schedule details corrupt.</p>;
        }
    };

    // --- Render Logic (Loading, Error, Data) ---

    if (!currentUserId) {
        // Render nothing or a sign-in prompt if user isn't available
        return <div className="p-8 text-center text-gray-500">Please sign in to view your meetings.</div>;
    }

    // The previous loading/error/empty state UI remains unchanged,
    // ensuring the beautiful design is maintained.

    if (isLoading) {
        return (
            <div className="p-8 bg-white rounded-xl shadow-lg border-l-4 border-indigo-500 flex items-center justify-center h-48">
                <svg className="animate-spin h-6 w-6 text-indigo-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

    return (
        <div className="p-4 md:p-8 bg-gray-50 rounded-xl shadow-2xl">
            <h2 className="text-4xl font-extrabold text-indigo-700 mb-6 flex items-center">
                <span className="mr-3">⭐</span> Your Scheduled Swap Sessions
            </h2>

            {meetings.length === 0 ? (
                <div className="text-center p-12 bg-white border border-dashed border-gray-300 rounded-xl shadow-inner">
                    <span className="text-6xl mb-4 block">🥳</span>
                    <p className="text-xl font-medium text-gray-700">No active meetings scheduled yet.</p>
                    <p className="text-gray-500 mt-2">Start a chat with a partner and propose a session to get started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {meetings.map((meeting) => (
                        <div
                            key={meeting.$id}
                            className="bg-white p-6 rounded-2xl shadow-xl transition transform hover:shadow-2xl hover:scale-[1.02] border-t-4 border-emerald-500 flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                    <span className="mr-2 text-2xl">🤝</span> Skill Swap Session
                                </h3>
                                <div className="border-b pb-4 mb-4">
                                    {/* Use the correctly fetched partnerName */}
                                    {renderSchedule(meeting.scheduleDetails, meeting.partnerName)}
                                </div>
                            </div>

                            <Link
                                href={`/meetings/${meeting.meetingId}`}
                                passHref
                                legacyBehavior
                            >
                                <a className="w-full mt-4 flex items-center justify-center bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:bg-indigo-700 transition duration-300 transform hover:shadow-lg">
                                    <span className="mr-2 text-lg">▶️</span> Join Meeting Now
                                </a>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MeetingsContent;
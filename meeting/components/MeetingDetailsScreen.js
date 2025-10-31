import React from "react";
import { useMeetingValidation } from "../hooks/useMeetingValidation";
import Link from 'next/link';


const isTimePastScheduledStart = (scheduleDetailsJson) => {
    try {
        const details = JSON.parse(scheduleDetailsJson);

        if (!details.startDate) {
            return false;
        }

        const scheduledStartDate = new Date(`${details.startDate}T00:00:00.000Z`);

        const currentTime = new Date();

        return currentTime.getTime() >= scheduledStartDate.getTime();

    } catch (e) {
        console.error('Error checking join time by date:', e);
        return false; // Safely prevent joining on error
    }
};


const getScheduleDetails = (scheduleDetailsJson) => {
    try {
        const details = JSON.parse(scheduleDetailsJson);

        const formatTimeWithTimezone = () => {

            if (!details.utcTime || !details.startDate) {

                return details.time || 'Time TBD';
            }

            const utcDateTimeString = `${details.startDate}T${details.utcTime}:00.000Z`;


            const localTimeDate = new Date(utcDateTimeString);

            if (isNaN(localTimeDate.getTime())) {
                console.error("Invalid Date object created in formatTimeWithTimezone");
                return details.time || 'Time TBD';
            }

            const formattedLocalTime = localTimeDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            });

            return (
                <span className="text-white">
                    {formattedLocalTime} (Your Local Time)
                </span>
            );
        };

        const dateObj = new Date(details.startDate + 'T00:00:00');

        const formattedDate = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });


        return (
            <div className="text-gray-300 text-sm mt-2 space-y-1">
                <p className="flex items-center">
                    <span className="mr-2 text-lg">🗓️</span>
                    <span className="font-bold">Start Date: </span> {formattedDate}
                </p>
                <p className="flex items-center">
                    <span className="mr-2 text-lg">⏰</span>
                    <span className="font-bold">Time: </span> {formatTimeWithTimezone()}
                </p>
                <p className="flex items-center">
                    <span className="mr-2 text-lg">🔄</span>
                    <span className="font-bold">Repeats: </span> {details.frequency} for {details.durationMonths} months
                </p>
            </div>
        );
    } catch {
        return <p className="text-red-400 text-sm mt-2">Error: Could not read schedule details.</p>;
    }
};

const ProfileCircle = ({ name, url, isCurrent }) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('') : 'U';

    const borderColor = isCurrent ? 'border-emerald-400' : 'border-indigo-400';
    const borderThickness = isCurrent ? 'border-4' : 'border-2';
    const glow = isCurrent ? 'shadow-emerald-500/50' : 'shadow-lg';

    return (
        <div className={`relative h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${borderThickness} ${borderColor} ${glow} overflow-hidden bg-gray-600`}>
            {url ? (
                <img src={url} alt={`${name}'s profile`} className="h-full w-full object-cover" />
            ) : (
                <span className="text-lg">{initials}</span>
            )}
        </div>
    );
};


export function MeetingDetailsScreen({
                                         onClickJoin,
                                         meetingId: initialMeetingId,
                                     }) {
    const {
        meetingData,
        participantProfiles,
        isLoading,
        status,
        currentUserId,
        currentProfile,
    } = useMeetingValidation(initialMeetingId);

    const handleJoin = () => {
        if (status === 'loaded' && currentProfile?.name && isTimePastScheduledStart(meetingData.scheduleDetails)) {
            onClickJoin(meetingData.meetingId, currentProfile.name);
        } else {
            alert("The scheduled start date for this session hasn't arrived yet!");
        }
    };

    const renderStatus = () => {

        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-800/80 rounded-2xl shadow-2xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    <p className="ml-3 mt-4 text-indigo-400 font-semibold">
                        Authorizing and loading details...
                    </p>
                </div>
            );
        }

        if (status !== 'loaded') {
            const messageMap = {
                'not_found': { icon: '🚫', title: 'Meeting Not Found', subtitle: 'The meeting code is invalid or the session has been canceled.' },
                'error': { icon: '⚠️', title: 'Connection Error', subtitle: 'Could not fetch data from the database. Please check your network.' },
                'unauthorized': { icon: '🔒', title: 'Access Restricted', subtitle: 'This meeting is private. You are not listed as an approved participant for this session.' },
            };
            const error = messageMap[status] || { icon: '❓', title: 'Error', subtitle: 'An unknown error occurred.' };

            return (
                <div className="text-center p-8 bg-red-900/40 rounded-2xl border border-red-500/50 shadow-lg space-y-4">
                    <p className="text-4xl mb-3">{error.icon}</p>
                    <h3 className="text-xl font-bold text-red-400">{error.title}</h3>
                    <p className="text-gray-400 mt-2">{error.subtitle}</p>

                    {/* Creative Unauthorized Login Prompt (Text-based action) */}
                    {(status === 'unauthorized' || status === 'error') && (
                        <div className="pt-4 border-t border-red-500/50 mt-4">
                            <p className="text-sm text-gray-300 mb-2">
                                Did you sign in with the wrong account?
                            </p>
                            <Link href="/login" passHref legacyBehavior>
                                <a className="text-base font-semibold text-indigo-300 transition duration-150 hover:text-indigo-200 underline underline-offset-4 decoration-indigo-400 hover:decoration-indigo-200">
                                    Sign in with a different account
                                </a>
                            </Link>
                        </div>
                    )}
                </div>
            );
        }

        const canJoinByProfile = !!currentProfile?.name;
        let isTimeReady = true;

        if (meetingData?.scheduleDetails) {
            isTimeReady = isTimePastScheduledStart(meetingData.scheduleDetails);
        }

        const isJoinEnabled = canJoinByProfile && isTimeReady;

        const statusText = meetingData?.status === "ONGOING" ? "Live Now" : "Scheduled";
        const statusColor = meetingData?.status === "ONGOING" ? "bg-red-500" : "bg-emerald-500";

        const disabledButtonText = "Scheduled Date Not Reached";


        const partnerId = meetingData.participants.find(id => id !== currentUserId);
        const partnerProfile = participantProfiles[partnerId];

        return (
            <div className="space-y-6 p-4 bg-gray-800/80 rounded-2xl shadow-2xl">

                {/* Meeting Schedule Box */}
                <div className="p-4 bg-gray-700/60 rounded-xl border border-indigo-500/50">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-white text-lg font-bold">Session Details</p>
                        <span className={`text-xs text-white font-semibold px-2 py-1 rounded-full ${statusColor}`}>
                            {statusText}
                        </span>
                    </div>
                    {getScheduleDetails(meetingData?.scheduleDetails)}
                </div>

                {/* Participants Details */}
                <div className="p-4 bg-gray-700/60 rounded-xl border border-emerald-500/50">
                    <h4 className="text-gray-300 text-sm font-bold mb-3">AUTHORIZED PARTICIPANTS:</h4>
                    <div className="flex flex-col space-y-4">

                        {/* Current User (Dominant Style with Glow) */}
                        <div className="flex items-center space-x-4 p-3 rounded-xl bg-gray-600/70 ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/20">
                            <ProfileCircle name={currentProfile?.name} url={currentProfile?.profilePictureUrl} isCurrent={true} />
                            <div>
                                <p className="text-white font-black leading-tight text-xl">
                                    {currentProfile?.name || "Loading Name..."}
                                </p>
                                <p className="text-emerald-300 text-sm font-semibold">
                                    (This is your current account)
                                </p>
                            </div>
                        </div>

                        {/* Partner */}
                        <div className="flex items-center space-x-4 pt-4 border-t border-gray-600">
                            <ProfileCircle name={partnerProfile?.name} url={partnerProfile?.profilePictureUrl} isCurrent={false} />
                            <div>
                                <p className="text-white font-bold leading-tight">Partner</p>
                                <p className="text-indigo-400 text-base">{partnerProfile?.name || "Loading Name..."}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Join Button */}
                <button
                    onClick={handleJoin}
                    disabled={!isJoinEnabled}
                    className={`w-full text-white px-2 py-3 rounded-xl font-bold transition duration-300 transform ${
                        isJoinEnabled
                            ? "bg-indigo-600 shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-[1.01]"
                            : "bg-gray-600 cursor-not-allowed opacity-70"
                    }`}
                >
                    {isJoinEnabled ? "Join Session Now" : disabledButtonText}
                </button>
            </div>
        );
    };


    return (
        <div className="flex flex-1 flex-col items-center justify-center w-full p-6 max-w-sm mx-auto">
            {renderStatus()}
        </div>
    );
}
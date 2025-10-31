'use client';

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useChatService} from '@/hooks/useChatService';
import {useConversations, ConversationSummary, getConversationId} from '@/hooks/useConversations';
import {useAuth} from '@/hooks/useAuth';
import {useVideoSessionCreator} from '@/hooks/useVideoSessionCreator';
import {useUserDetails} from '@/hooks/useUserDetails';
import {Client, Databases, Query} from 'appwrite';
import {APPWRITE_CONFIG, APPWRITE_DB_ID, APPWRITE_MEETINGS_COLLECTION_ID} from '@/constants';


const JSON_MEETING_REQUEST_PREFIX = '[MEETING_REQUEST_JSON]';

interface MeetingRequestData {
    time: string;
    utcTime?: string;
    startDate: string;
    durationMonths: number;
    frequency: string;
    timezone: string;
}

const parseMeetingRequest = (text: string): MeetingRequestData | null => {
    if (text.startsWith(JSON_MEETING_REQUEST_PREFIX)) {
        try {
            const jsonString = text.substring(JSON_MEETING_REQUEST_PREFIX.length);
            return JSON.parse(jsonString) as MeetingRequestData;
        } catch (e) {
            console.error('Failed to parse meeting request JSON:', e);
            return null;
        }
    }
    return null;
};



interface MessageBubbleProps {
    text: string;
    time: string;
    isCurrentUser: boolean;
    onEdit?: (data: MeetingRequestData) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({text, time, isCurrentUser}) => {
    const bubbleClass = isCurrentUser
        ? 'bg-indigo-500 text-white self-end rounded-br-none'
        : 'bg-white text-gray-800 self-start rounded-tl-none border border-gray-200 shadow-sm';
    return (
        <div className={`flex flex-col max-w-xs md:max-w-md p-3 rounded-xl shadow-md ${bubbleClass}`}>
            <p className="text-sm break-words whitespace-pre-wrap">{text}</p>
            <span className={`mt-1 text-xs opacity-70 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                {new Date(time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </span>
        </div>
    );
};

const MeetingRequestBubble: React.FC<
    MessageBubbleProps & {
    data: MeetingRequestData;
    onEdit: (data: MeetingRequestData) => void;
    senderId: string;
    conversationId: string;
    onMeetingCreated?: () => void;
}
> = ({data, time, isCurrentUser, onEdit, senderId, conversationId, onMeetingCreated}) => {

    const {createSession, isLoading} = useVideoSessionCreator();
    const [checkingMeeting, setCheckingMeeting] = useState(false);
    const [meetingExists, setMeetingExists] = useState(false);
    const [meetingId, setMeetingId] = useState<string | null>(null);

    useEffect(() => {
        const checkForExistingMeeting = async () => {
            if (!conversationId) return;
            
            setCheckingMeeting(true);
            try {
                const client = new Client();
                client
                    .setEndpoint(APPWRITE_CONFIG.endpoint)
                    .setProject(APPWRITE_CONFIG.projectId);
                
                const databases = new Databases(client);
                
                const response = await databases.listDocuments(
                    APPWRITE_DB_ID,
                    APPWRITE_MEETINGS_COLLECTION_ID,
                    [
                        Query.equal('conversationId', conversationId),
                        Query.limit(1)
                    ]
                );
                
                if (response.documents.length > 0) {
                    setMeetingExists(true);
                    setMeetingId(response.documents[0].$id);
                }
            } catch (error) {
                console.error('Error checking for existing meeting:', error);
            } finally {
                setCheckingMeeting(false);
            }
        };

        checkForExistingMeeting();
    }, [conversationId]);

    const bubbleClass = isCurrentUser
        ? 'bg-white border-2 border-indigo-500 shadow-xl self-end rounded-br-none'
        : 'bg-white border-2 border-emerald-500 shadow-xl self-start rounded-tl-none';

    const titleColor = isCurrentUser ? 'text-indigo-600' : 'text-emerald-600';
    const proposalBoxColor = isCurrentUser ? 'bg-indigo-50 text-indigo-800' : 'bg-emerald-50 text-emerald-800';

    const frequencyText = data.frequency.includes(',')
        ? `Weekly on: ${data.frequency.replace(/, /g, ', ')}`
        : data.frequency;

    const status = isCurrentUser ? 'Proposed (Awaiting Partner)' : 'New Proposal';

    const handleAccept = async () => {
        try {
            const result = await createSession({
                senderId,
                conversationId,
                scheduleDetails: data,
            });

            console.log('Meeting Created Successfully:', result);
            setMeetingExists(true);
            setMeetingId(result.meetingId);
            if (onMeetingCreated) {
                onMeetingCreated();
            }
            alert(`Meeting created! ID: ${result.meetingId}`);
        } catch (error) {
            console.error('Failed to create video session:', error);
            alert((error as Error).message);
        }
    };

    const handleJoinMeeting = () => {
        if (meetingId) {
            window.location.href = `/meetings/${meetingId}`;
        }
    };

    const formatTimeWithTimezone = () => {

        if (!data.utcTime || !data.startDate) {

            return 'Time TBD';
        }

        const utcDateTimeString = `${data.startDate}T${data.utcTime}:00.000Z`;


        const localTimeDate = new Date(utcDateTimeString);

        const formattedLocalTime = localTimeDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });

        return `${formattedLocalTime} (Your Local Time)`;
    };

    const content = (
        <div className={`p-4 rounded-lg space-y-3 ${proposalBoxColor}`}>
            <h4 className={`text-xl font-extrabold flex items-center ${titleColor}`}>
                <span className="mr-2 text-2xl">📅</span> Session Proposal
            </h4>
            <div className="text-sm space-y-2 border-t border-gray-300 pt-3">
                <p><strong>Start Date:</strong> {data.startDate}</p>
                <p><strong>Time:</strong> {formatTimeWithTimezone()}</p>
                <p><strong>Frequency:</strong> {frequencyText}</p>
                <p><strong>Duration:</strong> {data.durationMonths} month(s)</p>
            </div>
            <div className="text-xs font-semibold mt-2">
                Status: {status}
            </div>
        </div>
    );

    return (
        <div className={`flex flex-col max-w-sm md:max-w-md p-0 rounded-xl ${bubbleClass}`}>
            {content}
            <span
                className={`mt-2 p-2 text-xs opacity-80 ${isCurrentUser ? 'text-right text-indigo-800' : 'text-left text-emerald-800'}`}>
                Sent at: {new Date(time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </span>

            <div className="flex space-x-2 p-2 pt-0">
                {isCurrentUser ? (
                    <>
                        <button
                            onClick={() => onEdit(data)}
                            className="flex-1 text-sm py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 transition font-semibold shadow-md"
                        >
                            Edit/Resend Proposal
                        </button>
                        {checkingMeeting ? (
                            <button
                                disabled
                                className="flex-1 text-sm py-2 bg-gray-300 rounded-lg font-semibold shadow-md cursor-not-allowed relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-200 to-transparent animate-pulse"></div>
                                <span className="relative">Checking...</span>
                            </button>
                        ) : meetingExists ? (
                            <button
                                onClick={handleJoinMeeting}
                                className="flex-1 text-sm py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold shadow-md"
                            >
                                Join Meeting
                            </button>
                        ) : null}
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => onEdit(data)}
                            className="flex-1 text-sm py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-semibold shadow-md"
                        >
                            Edit
                        </button>
                        {checkingMeeting ? (
                            <button
                                disabled
                                className="flex-1 text-sm py-2 bg-gray-300 rounded-lg font-semibold shadow-md cursor-not-allowed relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200 to-transparent animate-pulse"></div>
                                <span className="relative">Checking...</span>
                            </button>
                        ) : meetingExists ? (
                            <button
                                onClick={handleJoinMeeting}
                                className="flex-1 text-sm py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold shadow-md"
                            >
                                Join Meeting
                            </button>
                        ) : (
                            <button
                                onClick={handleAccept}
                                disabled={isLoading}
                                className={`flex-1 text-sm py-2 rounded-lg font-semibold shadow-md transition ${
                                    isLoading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                }`}
                            >
                                {isLoading ? 'Starting...' : 'Accept'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};


const MessageBubbleWrapper: React.FC<
    MessageBubbleProps & {
    onEdit: (data: MeetingRequestData) => void;
    currentUser: string;
    convId: string;
    onMeetingCreated?: () => void;
}
> = ({ text, time, isCurrentUser, onEdit, currentUser, convId, onMeetingCreated }) => {

    const requestData = parseMeetingRequest(text);

    if (requestData) {

        return (
            <MeetingRequestBubble
                data={requestData}
                time={time}
                isCurrentUser={isCurrentUser}
                onEdit={onEdit}
                senderId={currentUser}
                conversationId={convId}
                text={text}
                onMeetingCreated={onMeetingCreated}
            />
        );
    }

    return (
        <MessageBubble
            text={text}
            time={time}
            isCurrentUser={isCurrentUser}
        />
    );
};


interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendRequest: (data: MeetingRequestData) => void;
    otherUserName: string;
    initialData: MeetingRequestData | null;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({isOpen, onClose, onSendRequest, otherUserName, initialData}) => {
    const today = new Date().toISOString().split('T')[0];

    const initialFreq = initialData?.frequency;
    let initialType = 'Daily';
    let initialDays: string[] = [];

    if (initialFreq === 'Weekends Only') {
        initialType = 'Weekends Only';
    } else if (initialFreq && initialFreq !== 'Daily') {

        const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const receivedDays = initialFreq.split(', ').filter(day => dayOptions.includes(day));
        if (receivedDays.length > 0) {
            initialType = 'Specific Days';
            initialDays = receivedDays;
        }
    }

    const [selectedTime, setSelectedTime] = useState(initialData?.time || '19:00');
    const [startDate, setStartDate] = useState(initialData?.startDate || today);
    const [duration, setDuration] = useState(initialData?.durationMonths || 1);
    const [frequencyType, setFrequencyType] = useState(initialType);
    const [selectedDays, setSelectedDays] = useState<string[]>(initialDays);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedTime(initialData?.time || '19:00');
            setStartDate(initialData?.startDate || today);
            setDuration(initialData?.durationMonths || 1);

            const initialFreq = initialData?.frequency;
            let initialType = 'Daily';
            let initialDays: string[] = [];

            if (initialFreq === 'Weekends Only') {
                initialType = 'Weekends Only';
            } else if (initialFreq && initialFreq !== 'Daily') {
                const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const receivedDays = initialFreq.split(', ').filter(day => dayOptions.includes(day));
                if (receivedDays.length > 0) {
                    initialType = 'Specific Days';
                    initialDays = receivedDays;
                }
            }

            setFrequencyType(initialType);
            setSelectedDays(initialDays);
        }
    }, [isOpen, initialData, today]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const durationOptions = Array.from({length: 12}, (_, i) => i + 1);
    const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


    const handleDayToggle = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => dayOptions.indexOf(a) - dayOptions.indexOf(b))
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalFrequencyString = frequencyType;

        if (frequencyType === 'Specific Days') {
            if (selectedDays.length === 0) {
                alert('Please select at least one day for Specific Days frequency.');
                return;
            }

            finalFrequencyString = selectedDays.join(', ');
        }

        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        const localDateTime = new Date(`${startDate}T${selectedTime}:00`);
        const utcHours = localDateTime.getUTCHours().toString().padStart(2, '0');
        const utcMinutes = localDateTime.getUTCMinutes().toString().padStart(2, '0');
        const utcTime = `${utcHours}:${utcMinutes}`;

        setIsSubmitting(true);
        try {
            await onSendRequest({
                time: selectedTime,
                utcTime: utcTime,
                startDate,
                durationMonths: duration,
                frequency: finalFrequencyString,
                timezone: userTimezone
            });
        } catch (error) {
            console.error('Error sending meeting request:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isSendDisabled = (frequencyType === 'Specific Days' && selectedDays.length === 0) || isSubmitting;

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all scale-100 opacity-100">
                <header className="p-6 border-b bg-indigo-600 rounded-t-xl text-white sticky top-0 z-10">
                    <h2 className="text-2xl font-extrabold flex items-center">
                        📅 {initialData ? 'Edit Session Proposal' : 'Propose a Swap Session'} with {otherUserName}
                    </h2>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    <div className="space-y-2">
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                            🚀 Proposed Start Date
                        </label>
                        <input
                            id="startDate"
                            type="date"
                            value={startDate}
                            min={today}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                            required
                        />
                    </div>

                    {/* Time Picker */}
                    <div className="space-y-2">
                        <label htmlFor="meetingTime" className="block text-sm font-medium text-gray-700">
                            ⏱️ Preferred Meeting Time (in your local timezone)
                        </label>
                        <input
                            id="meetingTime"
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">This time will be suggested, and they will see it
                            converted to their timezone.</p>
                    </div>

                    {/* Frequency Picker */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            🔁 Meeting Frequency
                        </label>
                        <div className="flex flex-col space-y-3">

                            {/* Option 1: Daily */}
                            <label className="flex items-center space-x-3">
                                <input
                                    type="radio"
                                    name="frequencyType"
                                    value="Daily"
                                    checked={frequencyType === 'Daily'}
                                    onChange={() => setFrequencyType('Daily')}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="text-gray-900 font-medium">Daily</span>
                            </label>

                            {/* Option 2: Weekends Only */}
                            <label className="flex items-center space-x-3">
                                <input
                                    type="radio"
                                    name="frequencyType"
                                    value="Weekends Only"
                                    checked={frequencyType === 'Weekends Only'}
                                    onChange={() => setFrequencyType('Weekends Only')}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="text-gray-900 font-medium">Weekends Only (Saturday & Sunday)</span>
                            </label>

                            {/* Option 3: Specific Days */}
                            <label className="flex flex-col space-y-3">
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="radio"
                                        name="frequencyType"
                                        value="Specific Days"
                                        checked={frequencyType === 'Specific Days'}
                                        onChange={() => setFrequencyType('Specific Days')}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                    />
                                    <span
                                        className="text-gray-900 font-medium">Specific Days Only (e.g., Mon/Wed)</span>
                                </div>

                                {frequencyType === 'Specific Days' && (
                                    <div
                                        className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
                                        {dayOptions.map(day => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => handleDayToggle(day)}
                                                className={`py-1 px-3 rounded-full text-sm font-medium transition ${
                                                    selectedDays.includes(day)
                                                        ? 'bg-indigo-500 text-white shadow-md'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-indigo-50'
                                                }`}
                                            >
                                                {day.substring(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {frequencyType === 'Specific Days' && selectedDays.length === 0 && (
                                    <p className="text-sm text-red-500">Please select at least one day.</p>
                                )}
                            </label>
                        </div>
                    </div>


                    {/* Duration Picker */}
                    <div className="space-y-2">
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                            🗓️ How many months should the swap last?
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {durationOptions.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setDuration(m)}
                                    className={`p-2 w-12 rounded-lg font-semibold transition border text-sm ${
                                        duration === m
                                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-lg space-y-1">
                        <p className="text-sm font-medium">
                            💡 Upcoming Meeting Alert: Stay prepared!
                        </p>
                        <p className="text-xs text-blue-700">
                            To stay on track, consider adding it to your calendar — this way, you won’t miss any part of the session.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSendDisabled}
                            className={`px-6 py-2 rounded-xl font-semibold transition shadow-lg flex items-center justify-center gap-2 ${
                                isSendDisabled
                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </>
                            ) : (
                                initialData ? 'Update Request' : 'Send Meeting Request'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


interface MessagesContentProps {
    initialChatData: { convId: string; receiverId: string } | null;
}

const MessagesContent: React.FC<MessagesContentProps> = ({initialChatData}) => {
    const {user} = useAuth();
    const currentUserId = user?.$id;
    const propConvId = initialChatData?.convId;
    const propReceiverId = initialChatData?.receiverId;

    const safeConvIdFromProps = (currentUserId && propReceiverId)
        ? getConversationId(currentUserId, propReceiverId)
        : null;

    const {conversations, isLoading: isLoadingConversations, error: convError} = useConversations();

    const [activeConversation, setActiveConversation] = useState<ConversationSummary | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialModalData, setInitialModalData] = useState<MeetingRequestData | null>(null);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [checkingHeaderMeeting, setCheckingHeaderMeeting] = useState(false);
    const [headerMeetingExists, setHeaderMeetingExists] = useState(false);
    const [headerMeetingId, setHeaderMeetingId] = useState<string | null>(null);
    const [meetingRefreshTrigger, setMeetingRefreshTrigger] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const recipientIdForDetails = activeConversation?.otherUserId || propReceiverId || null;
    const {userDetails, isLoading: isLoadingUserDetails} = useUserDetails(recipientIdForDetails);

    useEffect(() => {
        const checkForHeaderMeeting = async () => {
            const activeConvId = activeConversation?.$id;
            if (!activeConvId) {
                setHeaderMeetingExists(false);
                setHeaderMeetingId(null);
                return;
            }

            setCheckingHeaderMeeting(true);
            try {
                const client = new Client();
                client
                    .setEndpoint(APPWRITE_CONFIG.endpoint)
                    .setProject(APPWRITE_CONFIG.projectId);

                const databases = new Databases(client);

                const response = await databases.listDocuments(
                    APPWRITE_DB_ID,
                    APPWRITE_MEETINGS_COLLECTION_ID,
                    [
                        Query.equal('conversationId', activeConvId),
                        Query.limit(1)
                    ]
                );

                if (response.documents.length > 0) {
                    setHeaderMeetingExists(true);
                    setHeaderMeetingId(response.documents[0].meetingId);
                } else {
                    setHeaderMeetingExists(false);
                    setHeaderMeetingId(null);
                }
            } catch (error) {
                console.error('Error checking for header meeting:', error);
                setHeaderMeetingExists(false);
                setHeaderMeetingId(null);
            } finally {
                setCheckingHeaderMeeting(false);
            }
        };

        checkForHeaderMeeting();
    }, [activeConversation?.$id, meetingRefreshTrigger]);

    useEffect(() => {
        if (!currentUserId || isLoadingConversations) return;

        if (!propConvId && conversations.length > 0 && !activeConversation) {
            setActiveConversation(conversations[0]);
            return;
        }

        if (propConvId && propReceiverId && safeConvIdFromProps) {
            const existingChat = conversations.find(conv => conv.$id === safeConvIdFromProps);

            if (existingChat) {
                setActiveConversation(existingChat);
                return;
            }

            if (!activeConversation && userDetails && recipientIdForDetails === propReceiverId) {
                const displayBio = userDetails.bio || `Wants to teach ${userDetails.skillsToTeach?.[0] || 'a skill'}.`;

                const tempConvSummary = {
                    $id: safeConvIdFromProps,
                    ownerId: currentUserId,
                    otherUserId: propReceiverId,
                    lastMessageText: `New conversation started about ${propConvId}`,
                    lastMessageTimestamp: new Date().toISOString(),
                    unreadCount: 0,
                    otherUserName: userDetails.name,
                    otherUserSkill: displayBio,
                } as ConversationSummary;

                setActiveConversation(tempConvSummary);
            }
        }

    }, [
        conversations,
        propConvId,
        propReceiverId,
        safeConvIdFromProps,
        currentUserId,
        userDetails,
        isLoadingConversations,
        activeConversation,
        recipientIdForDetails
    ]);

    const activeChatToShow = activeConversation;
    const activeConversationId = activeChatToShow?.$id || null;
    const receiverId = activeChatToShow?.otherUserId || null;
    const otherUserName = activeChatToShow?.otherUserName || 'Partner';


    const {
        messages,
        isLoading: isLoadingMessages,
        sendMessage,
        markAsRead
    } = useChatService(activeConversationId, receiverId);

    useEffect(() => {
        if (messagesEndRef.current && messages.length > 0) {
            messagesEndRef.current.scrollIntoView({behavior: 'smooth'});
        }
    }, [messages]);

    useEffect(() => {
        if (activeConversationId) {
            markAsRead();
        }
    }, [activeConversationId, markAsRead]);


    const handleOpenModal = (data: MeetingRequestData | null = null) => {
        setInitialModalData(data);
        setIsModalOpen(true);
    };

    const handleEditRequest = useCallback((data: MeetingRequestData) => {
        handleOpenModal(data);
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !receiverId || isSending) return;

        setIsSending(true);
        try {
            await sendMessage(inputMessage.trim());
            setInputMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleSendMeetingRequest = async (data: MeetingRequestData) => {
        if (!receiverId) return;

        const messageText = JSON_MEETING_REQUEST_PREFIX + JSON.stringify(data);

        try {
            await sendMessage(messageText);
            setIsModalOpen(false); // Close the modal on success
            setInitialModalData(null); // Clear initial data
        } catch (error) {
            console.error('Error sending meeting request:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e as any);
        }
    };

    const handleSelectConversation = (conv: ConversationSummary) => {
        setActiveConversation(conv);
        setShowSidebar(false);
    };

    const sidebarChats = conversations
        .slice()
        .sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());

    const isTempChat = activeChatToShow && !conversations.some(c => c.$id === activeChatToShow.$id);
    if (isTempChat) {
        sidebarChats.unshift(activeChatToShow);
    }


    const [showSidebar, setShowSidebar] = useState(true);

    return (
        <div className="flex h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">

            <ScheduleModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setInitialModalData(null); // Important: Clear initial data when closing
                }}
                onSendRequest={handleSendMeetingRequest}
                otherUserName={otherUserName}
                initialData={initialModalData}
            />

            <aside className={`${showSidebar ? 'block' : 'hidden'} md:block w-full md:w-80 border-r bg-gray-50 flex flex-col absolute md:relative z-20 md:z-auto h-full`}>
                <header className="p-4 border-b bg-indigo-700 text-white shadow-lg">
                    <h2 className="text-2xl font-extrabold flex items-center">
                        <span className='mr-2'>💬</span> Swap Inbox
                    </h2>
                </header>
                <div className="flex-grow overflow-y-auto">
                    {isLoadingConversations && !activeChatToShow && (
                        <div className="p-4 text-center text-indigo-500">Loading chats...</div>
                    )}
                    {convError && (
                        <div className="p-4 text-center text-red-500">Error loading chats.</div>
                    )}
                    {!isLoadingConversations && sidebarChats.length > 0 && (
                        sidebarChats.map((conv) => {
                            const isCurrentlyActive = activeChatToShow?.$id === conv.$id;
                            const isProfileLoading = isTempChat && isCurrentlyActive && isLoadingUserDetails;

                            return (
                                <div
                                    key={conv.$id}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`p-4 border-b cursor-pointer transition duration-200 flex flex-col ${
                                        isCurrentlyActive
                                            ? 'bg-indigo-100 border-l-4 border-indigo-600 font-bold'
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="text-gray-900 truncate">
                                            {isProfileLoading ? 'Loading Name...' : conv.otherUserName}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span
                                                className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-md">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium mt-1 text-emerald-600">
                                        {isProfileLoading ? 'Loading Bio...' : conv.otherUserSkill}
                                    </p>
                                    <p className={`text-sm truncate mt-1 ${conv.unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                        {conv.lastMessageText}
                                    </p>
                                </div>
                            );
                        })
                    )}
                    {conversations.length === 0 && !activeChatToShow && !isLoadingConversations && (
                        <div className="p-4 text-center text-gray-500 italic">No matches started yet.</div>
                    )}
                </div>
            </aside>

            {/* 2. Chat Window */}
            <main className="flex-1 flex flex-col">
                {isLoadingConversations ? (
                    <div className="flex flex-col items-center justify-center h-full text-indigo-500 p-10 bg-gray-50">
                        <h2 className='text-2xl font-bold text-gray-800 animate-pulse'>Loading your inbox...</h2>
                        <p className='mt-2 text-gray-600'>Fetching your latest conversations.</p>
                    </div>
                ) : activeChatToShow ? (
                    <>
                        {/* Header */}
                        <header
                            className="p-4 border-b bg-gradient-to-r from-white to-indigo-50 shadow-md flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                    onClick={() => setShowSidebar(true)}
                                    className="md:hidden p-2 hover:bg-indigo-100 rounded-lg transition"
                                    aria-label="Show conversations"
                                >
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                <div className="flex-1 min-w-0">
                                    {isLoadingUserDetails && isTempChat ? (
                                        <>
                                            <h3 className="text-lg md:text-xl font-bold text-gray-800 animate-pulse truncate">Loading
                                                Match...</h3>
                                            <p className="text-xs md:text-sm text-gray-600 font-medium truncate">Bio: Fetching details...</p>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-lg md:text-xl font-bold text-gray-800 truncate">{activeChatToShow.otherUserName}</h3>
                                            <p className="text-xs md:text-sm text-gray-600 font-medium line-clamp-1">Bio: {activeChatToShow.otherUserSkill || 'No bio available'}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Schedule Meeting Button - Opens Modal */}
                            {checkingHeaderMeeting ? (
                                <button
                                    disabled
                                    className="flex items-center bg-gray-300 text-gray-600 font-semibold py-2 px-2 md:px-4 rounded-xl shadow-lg cursor-not-allowed relative overflow-hidden text-xs md:text-base"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200 to-transparent animate-pulse"></div>
                                    <span className="relative"><span className="md:hidden">⏳</span><span className="hidden md:inline">⏳ Checking...</span></span>
                                </button>
                            ) : headerMeetingExists ? (
                                <button
                                    onClick={() => {
                                        if (headerMeetingId) {
                                            window.location.href = `/meetings/${headerMeetingId}`;
                                        }
                                    }}
                                    className="flex items-center bg-green-500 text-white font-semibold py-2 px-2 md:px-4 rounded-xl hover:bg-green-600 transition shadow-lg transform hover:scale-[1.02] text-xs md:text-base whitespace-nowrap"
                                >
                                    <span className="md:hidden">🎥</span><span className="hidden md:inline">🎥 Join Meeting</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleOpenModal()}
                                    className="flex items-center bg-emerald-500 text-white font-semibold py-2 px-2 md:px-4 rounded-xl hover:bg-emerald-600 transition shadow-lg transform hover:scale-[1.02] text-xs md:text-base whitespace-nowrap"
                                >
                                    <span className="md:hidden">📅</span><span className="hidden md:inline">📅 Propose Session</span>
                                </button>
                            )}
                        </header>

                        {/* Message Display Area */}
                        <div className="flex-grow p-6 space-y-4 overflow-y-auto bg-gray-100">
                            {isLoadingMessages ? (
                                <div className="text-center p-10 text-indigo-600 font-semibold">Loading
                                    messages...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center p-10 text-gray-500 italic">Start the conversation! No
                                    messages exchanged yet.</div>
                            ) : (
                                messages.map((msg) => (
                                    <MessageBubbleWrapper
                                        key={msg.$id}
                                        text={msg.text}
                                        time={msg.$createdAt}
                                        isCurrentUser={msg.senderId === currentUserId}
                                        onEdit={handleEditRequest}
                                        currentUser={receiverId!}
                                        convId={getConversationId(currentUserId!, receiverId!)!}
                                        onMeetingCreated={() => setMeetingRefreshTrigger(prev => prev + 1)}
                                    />
                                ))
                            )}
                            <div ref={messagesEndRef}/>
                        </div>

                        {/* Message Input Area */}
                        <form onSubmit={handleSendMessage}
                              className="p-4 border-t bg-white/70 backdrop-blur-sm sticky bottom-0 z-10 flex items-center gap-3">
                            <textarea
                                ref={textareaRef}
                                placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-inner bg-white resize-none"
                                disabled={isSending}
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || isSending}
                                className={`p-3 rounded-xl transition font-bold shadow-lg w-24 flex items-center justify-center 
                                    ${inputMessage.trim() && !isSending ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`
                                }
                            >
                                {isSending ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                                         fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Send'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-10 bg-gray-50">
                        <span className="text-7xl mb-4">💬</span>
                        <h2 className='text-2xl font-bold text-gray-800'>Welcome to your Inbox!</h2>
                        <p className='mt-2 text-center text-gray-600 max-w-sm'>Select a conversation from the left to
                            start chatting and scheduling your first skill swap session.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MessagesContent;

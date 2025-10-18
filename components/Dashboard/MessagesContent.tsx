'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
// Assume the following imports exist in your project structure
import { useChatService } from '@/hooks/useChatService';
import { useConversations, ConversationSummary, getConversationId } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { useUserDetails } from '@/hooks/useUserDetails';

// --- Type Definitions for Structured Data ---

const JSON_MEETING_REQUEST_PREFIX = '[MEETING_REQUEST_JSON]';

interface MeetingRequestData {
    time: string;
    startDate: string;
    durationMonths: number;
    frequency: string; // Could be 'Daily', 'Weekends Only', or comma-separated days (e.g., 'Monday, Wednesday')
}

// --- Helper Functions ---

/**
 * Checks if a message text is a serialized Meeting Request JSON.
 */
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


// --- Helper Components: MessageBubble, MeetingRequestBubble, Modal ---

interface MessageBubbleProps {
    text: string;
    time: string;
    isCurrentUser: boolean;
    onEdit?: (data: MeetingRequestData) => void;
}

// Simple plain text bubble component
const MessageBubble: React.FC<MessageBubbleProps> = ({ text, time, isCurrentUser }) => {
    const bubbleClass = isCurrentUser
        ? 'bg-indigo-500 text-white self-end rounded-br-none'
        : 'bg-white text-gray-800 self-start rounded-tl-none border border-gray-200 shadow-sm';
    return (
        <div className={`flex flex-col max-w-xs md:max-w-md p-3 rounded-xl shadow-md ${bubbleClass}`}>
            <p className="text-sm break-words whitespace-pre-wrap">{text}</p>
            <span className={`mt-1 text-xs opacity-70 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
};


// Updated Component for structured meeting request with design improvements and button fix
const MeetingRequestBubble: React.FC<
    MessageBubbleProps & { data: MeetingRequestData; onEdit: (data: MeetingRequestData) => void }
> = ({ data, time, isCurrentUser, onEdit }) => {

    // Design Improvements: Use a consistent, prominent style for the proposal box
    const bubbleClass = isCurrentUser
        ? 'bg-white border-2 border-indigo-500 shadow-xl self-end rounded-br-none'
        : 'bg-white border-2 border-emerald-500 shadow-xl self-start rounded-tl-none';

    const titleColor = isCurrentUser ? 'text-indigo-600' : 'text-emerald-600';
    const proposalBoxColor = isCurrentUser ? 'bg-indigo-50 text-indigo-800' : 'bg-emerald-50 text-emerald-800';

    const frequencyText = data.frequency.includes(',')
        ? `Weekly on: ${data.frequency.replace(/, /g, ', ')}` // Clean up spacing
        : data.frequency;

    // The current status is always "Proposed" since acceptance logic is TBD
    const status = isCurrentUser ? 'Proposed (Awaiting Partner)' : 'New Proposal';

    // Formatting the message content
    const content = (
        <div className={`p-4 rounded-lg space-y-3 ${proposalBoxColor}`}>
            <h4 className={`text-xl font-extrabold flex items-center ${titleColor}`}>
                <span className="mr-2 text-2xl">📅</span> Session Proposal
            </h4>
            <div className="text-sm space-y-2 border-t border-gray-300 pt-3">
                <p><strong>Start Date:</strong> {data.startDate}</p>
                <p><strong>Time:</strong> {data.time} (Your Local Time)</p>
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
            <span className={`mt-2 p-2 text-xs opacity-80 ${isCurrentUser ? 'text-right text-indigo-800' : 'text-left text-emerald-800'}`}>
                Sent at: {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            <div className="flex space-x-2 p-2 pt-0">
                {isCurrentUser ? (
                    // SENDER: Only see an option to edit/retract their own proposal
                    <button
                        onClick={() => onEdit(data)}
                        className="flex-1 text-sm py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 transition font-semibold shadow-md"
                    >
                        Edit/Resend Proposal
                    </button>
                ) : (
                    // RECEIVER (FIXED): See both Edit (for counter-propose) and Accept
                    <>
                        <button
                            onClick={() => onEdit(data)}
                            className="flex-1 text-sm py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-semibold shadow-md"
                        >
                            Edit
                        </button>
                        <button
                            // Placeholder for ACCEPT action - will log for now
                            onClick={() => console.log('Accept clicked, action TBD')}
                            className="flex-1 text-sm py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-semibold shadow-md"
                        >
                            Accept
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};


const MessageBubbleWrapper: React.FC<MessageBubbleProps & { onEdit: (data: MeetingRequestData) => void }> = ({ text, time, isCurrentUser, onEdit }) => {
    const requestData = parseMeetingRequest(text);

    if (requestData) {
        return (
            <MeetingRequestBubble
                data={requestData}
                time={time}
                isCurrentUser={isCurrentUser}
                onEdit={onEdit}
                text={text}
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
    initialData: MeetingRequestData | null; // for editing
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSendRequest, otherUserName, initialData }) => {
    const today = new Date().toISOString().split('T')[0];

    // State initialization based on initialData

    // Determine initial frequency type and days
    const initialFreq = initialData?.frequency;
    let initialType = 'Daily';
    let initialDays: string[] = [];

    if (initialFreq === 'Weekends Only') {
        initialType = 'Weekends Only';
    } else if (initialFreq && initialFreq !== 'Daily') {
        // Handle comma-separated days from JSON string
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


    // Reset state when modal opens/closes
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


    // Lock body scrolling when modal is open
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

    const durationOptions = Array.from({ length: 12 }, (_, i) => i + 1);
    const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


    const handleDayToggle = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => dayOptions.indexOf(a) - dayOptions.indexOf(b))
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let finalFrequencyString = frequencyType;

        if (frequencyType === 'Specific Days') {
            if (selectedDays.length === 0) {
                alert('Please select at least one day for Specific Days frequency.');
                return;
            }
            // Ensure days are consistently stored (e.g., "Monday, Wednesday, Friday")
            finalFrequencyString = selectedDays.join(', ');
        }

        onSendRequest({
            time: selectedTime,
            startDate,
            durationMonths: duration,
            frequency: finalFrequencyString
        });
    };

    const isSendDisabled = frequencyType === 'Specific Days' && selectedDays.length === 0;

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all scale-100 opacity-100">
                <header className="p-6 border-b bg-indigo-600 rounded-t-xl text-white sticky top-0 z-10">
                    <h2 className="text-2xl font-extrabold flex items-center">
                        📅 {initialData ? 'Edit Session Proposal' : 'Propose a Swap Session'} with {otherUserName}
                    </h2>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Start Date Picker */}
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
                        <p className="text-xs text-gray-500 mt-1">This time will be suggested, and they will see it converted to their timezone.</p>
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
                                    <span className="text-gray-900 font-medium">Specific Days Only (e.g., Mon/Wed)</span>
                                </div>

                                {frequencyType === 'Specific Days' && (
                                    <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
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
                            🔔 Reminder: These terms are a request. You can both update the schedule later in the chat if needed!
                        </p>
                        <p className="text-xs text-blue-700">
                            We will send an email reminder 15 minutes before the scheduled time on each session day.
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
                            className={`px-6 py-2 rounded-xl font-semibold transition shadow-lg ${
                                isSendDisabled
                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                            {initialData ? 'Update Request' : 'Send Meeting Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Main MessagesContent Component ---

interface MessagesContentProps {
    initialChatData: { convId: string; receiverId: string } | null;
}

const MessagesContent: React.FC<MessagesContentProps> = ({ initialChatData }) => {
    const { user } = useAuth();
    const currentUserId = user?.$id;
    const propConvId = initialChatData?.convId;
    const propReceiverId = initialChatData?.receiverId;

    const safeConvIdFromProps = (currentUserId && propReceiverId)
        ? getConversationId(currentUserId, propReceiverId)
        : null;

    const { conversations, isLoading: isLoadingConversations, error: convError } = useConversations();

    const [activeConversation, setActiveConversation] = useState<ConversationSummary | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialModalData, setInitialModalData] = useState<MeetingRequestData | null>(null); // State for edit data
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const recipientIdForDetails = activeConversation?.otherUserId || propReceiverId;
    const { userDetails, isLoading: isLoadingUserDetails } = useUserDetails(recipientIdForDetails);

    // Effect for handling initial chat selection/creation (Maximum update depth exceeded fix needed here)
    useEffect(() => {
        if (!currentUserId || isLoadingConversations) return;

        // Scenario 1: No prop, load first existing chat
        if (!propConvId && conversations.length > 0 && !activeConversation) {
            setActiveConversation(conversations[0]);
            return;
        }

        // Scenario 2: Handle "Start Swap" case from a profile
        if (propConvId && propReceiverId && safeConvIdFromProps) {
            const existingChat = conversations.find(conv => conv.$id === safeConvIdFromProps);

            if (existingChat) {
                setActiveConversation(existingChat);
                return;
            }

            // This block causes a state update inside useEffect without clean dependencies, causing the error (line 96)
            // It needs to be inside a check that prevents infinite loops.
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

                // FIX: Instead of calling a non-existent setTempInitialChat, we call setActiveConversation
                // The dependencies are correct, but the logic might run multiple times if userDetails updates.
                // We ensure it only runs if activeConversation is null.
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
        activeConversation, // Keep this dependency to ensure the state update is limited to when it's null
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

    // --- Effects for UI and Chat Service ---

    useEffect(() => {
        if (messagesEndRef.current && messages.length > 0) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        if (activeConversationId) {
            markAsRead();
        }
    }, [activeConversationId, markAsRead]);


    // --- Handlers ---

    const handleOpenModal = (data: MeetingRequestData | null = null) => {
        setInitialModalData(data);
        setIsModalOpen(true);
    };

    // Handler passed to MeetingRequestBubble for "Edit" button
    const handleEditRequest = useCallback((data: MeetingRequestData) => {
        handleOpenModal(data);
    }, []);

    // Handles sending a regular message (same as before)
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

    // Handles sending a meeting request message (sends JSON)
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

    // Handle keyboard shortcuts for textarea
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e as any);
        }
    };

    // Handles selecting a conversation from the sidebar (same as before)
    const handleSelectConversation = (conv: ConversationSummary) => {
        setActiveConversation(conv);
    };

    // Sidebar logic (same as before)
    const sidebarChats = conversations
        .slice()
        .sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());

    const isTempChat = activeChatToShow && !conversations.some(c => c.$id === activeChatToShow.$id);
    if (isTempChat) {
        sidebarChats.unshift(activeChatToShow);
    }


    return (
        <div className="flex h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* Schedule Modal */}
            <ScheduleModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setInitialModalData(null); // Important: Clear initial data when closing
                }}
                onSendRequest={handleSendMeetingRequest}
                otherUserName={otherUserName}
                initialData={initialModalData} // Pass initial data for editing
            />

            {/* 1. Sidebar */}
            <aside className="w-80 border-r bg-gray-50 flex flex-col">
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
                            <div>
                                {isLoadingUserDetails && isTempChat ? (
                                    <>
                                        <h3 className="text-xl font-bold text-gray-800 animate-pulse">Loading Match...</h3>
                                        <p className="text-sm text-gray-600 font-medium">Bio: Fetching details...</p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-bold text-gray-800">{activeChatToShow.otherUserName}</h3>
                                        <p className="text-sm text-gray-600 font-medium line-clamp-1">Bio: {activeChatToShow.otherUserSkill || 'No bio available'}</p>
                                    </>
                                )}
                            </div>

                            {/* Schedule Meeting Button - Opens Modal */}
                            <button
                                onClick={() => handleOpenModal()} // No data passed for new proposal
                                className="flex items-center bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-emerald-600 transition shadow-lg transform hover:scale-[1.02]"
                            >
                                📅 Propose Session
                            </button>
                        </header>

                        {/* Message Display Area */}
                        <div className="flex-grow p-6 space-y-4 overflow-y-auto bg-gray-100">
                            {isLoadingMessages ? (
                                <div className="text-center p-10 text-indigo-600 font-semibold">Loading messages...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center p-10 text-gray-500 italic">Start the conversation! No messages exchanged yet.</div>
                            ) : (
                                messages.map((msg) => (
                                    <MessageBubbleWrapper
                                        key={msg.$id}
                                        text={msg.text}
                                        time={msg.$createdAt}
                                        isCurrentUser={msg.senderId === currentUserId}
                                        onEdit={handleEditRequest} // Pass edit handler to wrapper
                                    />
                                ))
                            )}
                            <div ref={messagesEndRef}/>
                        </div>

                        {/* Message Input Area */}
                        <form onSubmit={handleSendMessage}
                              className="p-4 border-t bg-white/70 backdrop-blur-sm sticky bottom-0 z-10 flex items-center gap-3">
                            <button type="button"
                                    className="text-gray-500 hover:text-indigo-600 transition p-3 rounded-full border border-gray-300 bg-white shadow-sm">🖼️
                            </button>
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
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Send'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-10 bg-gray-50">
                        <span className="text-7xl mb-4">💬</span>
                        <h2 className='text-2xl font-bold text-gray-800'>Welcome to your Inbox!</h2>
                        <p className='mt-2 text-center text-gray-600 max-w-sm'>Select a conversation from the left to start chatting and scheduling your first skill swap session.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MessagesContent;

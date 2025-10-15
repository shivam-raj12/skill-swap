'use client';

import React, {useState, useEffect, useRef} from 'react';
import {useChatService} from '@/hooks/useChatService';
import {useConversations, ConversationSummary} from '@/hooks/useConversations';
import {useAuth} from '@/hooks/useAuth';
import {useUserDetails} from '@/hooks/useUserDetails';
import Link from 'next/link';

// Helper to generate unique conversation ID (UserAId_UserBId)
const getConversationId = (userA: string, userB: string): string => {
    return [userA, userB].sort().join('_');
};

interface MessagesContentProps {
    initialChatData: { convId: string; receiverId: string } | null;
}

interface MessageBubbleProps {
    text: string;
    time: string;
    isCurrentUser: boolean;
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

const MessagesContent: React.FC<MessagesContentProps> = ({initialChatData}) => {
    const {user} = useAuth();
    const currentUserId = user?.$id;
    const propConvId = initialChatData?.convId;
    const propReceiverId = initialChatData?.receiverId;

    const safeConvIdFromProps = (currentUserId && propReceiverId)
        ? getConversationId(currentUserId, propReceiverId)
        : null;

    const {conversations, isLoading: isLoadingConversations, error: convError} = useConversations();

    // Keep track of which conversation is currently displayed
    const [activeConversation, setActiveConversation] = useState<ConversationSummary | null>(null);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Figures out the user to show in header (for both temp and real)
    const recipientIdForDetails = activeConversation?.otherUserId || propReceiverId;
    const {userDetails, isLoading: isLoadingUserDetails} = useUserDetails(recipientIdForDetails);

    // Always prefer real conversation if it exists
    useEffect(() => {
        if (!currentUserId || isLoadingConversations) return;
        // If no prop passed, load the first available conversation
        if (!propConvId && conversations.length > 0 && !activeConversation) {
            setActiveConversation(conversations[0]);
            return;
        }

        // Handle the "Start Swap" case
        if (propConvId && propReceiverId && safeConvIdFromProps) {
            const existingChat = conversations.find(conv => conv.$id === safeConvIdFromProps);
            if (existingChat) {
                // Prefer real server copy
                setActiveConversation(existingChat);
                return;
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
    ]);

    // Always get current conversation ID
    const activeChatToShow = activeConversation;
    const activeConversationId = activeConversation?.$id == null && activeConversation?.otherUserId == null
        ? null
        : getConversationId(activeConversation.ownerId, activeConversation.otherUserId)
    const receiverId = activeChatToShow?.otherUserId || null;

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

    // Handles sending a message, always clears temp only when swap
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !receiverId) return;
        await sendMessage(inputMessage.trim());
        setInputMessage('');
    };

    // Handles selecting a conversation from the sidebar
    const handleSelectConversation = (conv: ConversationSummary) => {
        setActiveConversation(conv);
    };

    // Sidebar conversations: only real, append temp if not duplicated
    const sidebarChats = [
        ...conversations,
    ].sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());

    return (
        <div className="flex h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Sidebar */}
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
                            const isTempLoading = isLoadingUserDetails;
                            return (
                                <div
                                    key={conv.$id}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`p-4 border-b cursor-pointer transition duration-200 flex flex-col ${
                                        activeChatToShow?.$id === conv.$id
                                            ? 'bg-indigo-100 border-l-4 border-indigo-600 font-bold'
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="text-gray-900 truncate">
                                            {isTempLoading ? 'Loading Name...' : conv.otherUserName}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span
                                                className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-md">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium mt-1 text-emerald-600">
                                        {isTempLoading ? 'Loading Bio...' : conv.otherUserSkill}
                                    </p>
                                    <p className={`text-sm truncate mt-1 ${conv.unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                        {conv.lastMessageText}
                                    </p>
                                </div>
                            );
                        })
                    )}
                    {conversations.length === 0 && !isLoadingConversations && (
                        <div className="p-4 text-center text-gray-500 italic">No matches started yet.</div>
                    )}
                </div>
            </aside>
            {/* Chat Window */}
            <main className="flex-1 flex flex-col">
                {isLoadingConversations && !activeChatToShow ? (
                    <div className="flex flex-col items-center justify-center h-full text-indigo-500 p-10 bg-gray-50">
                        <h2 className='text-2xl font-bold text-gray-800 animate-pulse'>Loading your inbox...</h2>
                        <p className='mt-2 text-gray-600'>Fetching your latest conversations.</p>
                    </div>
                ) : activeChatToShow ? (
                    <>
                        <header
                            className="p-4 border-b bg-gradient-to-r from-white to-indigo-50 shadow-md flex justify-between items-center sticky top-0 z-10">
                            <div>
                                {isLoadingUserDetails ? (
                                    <>
                                        <h3 className="text-xl font-bold text-gray-800 animate-pulse">Loading
                                            Match...</h3>
                                        <p className="text-sm text-gray-600 font-medium">Bio: Fetching details...</p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-bold text-gray-800">{activeChatToShow.otherUserName}</h3>
                                        <p className="text-sm text-gray-600 font-medium line-clamp-1">Bio: {activeChatToShow.otherUserSkill || 'No bio available'}</p>
                                    </>
                                )}
                            </div>
                            <Link href={`/profile/${activeChatToShow.otherUserId}`} passHref legacyBehavior>
                                <a className="flex items-center bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-emerald-600 transition shadow-lg transform hover:scale-[1.02]">
                                    📅 View Profile
                                </a>
                            </Link>
                        </header>
                        <div className="flex-grow p-6 space-y-4 overflow-y-auto bg-gray-100">
                            {isLoadingMessages ? (
                                <div className="text-center p-10 text-indigo-600 font-semibold">Loading
                                    messages...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center p-10 text-gray-500 italic">Start the conversation! No
                                    messages exchanged yet.</div>
                            ) : (
                                messages.map((msg) => (
                                    <MessageBubble
                                        key={msg.$id}
                                        text={msg.text}
                                        time={msg.$createdAt}
                                        isCurrentUser={msg.senderId === currentUserId}
                                    />
                                ))
                            )}
                            <div ref={messagesEndRef}/>
                        </div>
                        <form onSubmit={handleSendMessage}
                              className="p-4 border-t bg-white/70 backdrop-blur-sm sticky bottom-0 z-10 flex items-center gap-3">
                            <button type="button"
                                    className="text-gray-500 hover:text-indigo-600 transition p-3 rounded-full border border-gray-300 bg-white shadow-sm">🖼️
                            </button>
                            <input
                                type="text"
                                placeholder="Type your message here..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-inner bg-white"
                                disabled={isLoadingMessages}
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || isLoadingMessages}
                                className={`p-3 rounded-xl transition font-bold shadow-lg w-24 flex items-center justify-center 
                                    ${inputMessage.trim() && !isLoadingMessages ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`
                                }
                            >
                                Send
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

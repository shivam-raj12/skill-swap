'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChatService } from '@/hooks/useChatService'; // 👈 Import the new hook
import { useAuth } from '@/hooks/useAuth'; // To get the current user ID

// --- Placeholder Component for the Chat Screen ---
const MessagesContent: React.FC = () => {
    const { user } = useAuth(); // Get the current logged-in user
    const currentUserId = user?.$id;

    // State to track which conversation is currently open
    // In a real app, this should default to null or the last active chat
    const [activeConversationId, setActiveConversationId] = useState<string | null>('1');
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling

    // --- Mock Data for Sidebar (REPLACE with actual DB fetch later) ---
    // NOTE: In a production app, you would fetch this list from the 'Conversations' collection.
    // For now, we'll continue using mock data to pass the necessary IDs to the hook.
    const conversations = [
        { id: '1', name: 'Alex Thompson', skill: 'UX Design', receiverId: 'user_b', lastMessage: 'Let\'s finalize our Tuesday meeting.', unread: 2 },
        { id: '2', name: 'Sarah Chen', skill: 'React Hooks', receiverId: 'user_c', lastMessage: 'Thanks for the hook advice!', unread: 0 },
        { id: '3', name: 'Mike Miller', skill: 'Tailwind CSS', receiverId: 'user_d', lastMessage: 'Can we move our class to 4pm?', unread: 0 },
        { id: '4', name: 'Jamie Doe', skill: 'Public Speaking', receiverId: 'user_e', lastMessage: 'New message just arrived!', unread: 5 },
    ];

    const activeConv = conversations.find(c => c.id === activeConversationId);

    // 💡 GET THE RECEIVER ID for the hook
    const receiverId = activeConv?.receiverId || null;

    // 1. USE THE CHAT SERVICE HOOK
    const {
        messages,
        isLoading,
        sendMessage,
        markAsRead
    } = useChatService(activeConversationId, receiverId);

    // 2. SCROLL TO BOTTOM EFFECT
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]); // Scroll whenever new messages are added

    useEffect(() => {
        // When a new conversation is opened, mark it as read
        if (activeConversationId) {
            markAsRead();
        }
    }, [activeConversationId, markAsRead]);


    // 3. HANDLE SENDING MESSAGE
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !activeConversationId || !receiverId) return;

        // Call the hook's sendMessage function
        await sendMessage(inputMessage);

        setInputMessage(''); // Clear the input field
    };


    // --- Message Bubble Component (Simplified for use with hook data) ---
    const MessageBubble: React.FC<{ text: string, time: string, isCurrentUser: boolean }> = ({ text, time, isCurrentUser }) => (
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow-md ${
                isCurrentUser
                    ? 'bg-indigo-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
            }`}>
                <p>{text}</p>
                {/* Format the time nicely */}
                <span className={`block text-xs mt-1 ${isCurrentUser ? 'text-indigo-200' : 'text-gray-400'} text-right`}>
                    {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );


    // 4. Update the function to handle selecting a new conversation
    const handleSelectConversation = (convId: string, recId: string) => {
        setActiveConversationId(convId);
        // In a real app, you might want to force a markAsRead call here if the useEffect isn't fast enough
    };


    return (
        <div className="flex h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* 1. Conversation List Sidebar */}
            <aside className="w-80 border-r bg-gray-50 flex flex-col">
                <header className="p-4 border-b bg-indigo-700 text-white shadow-lg">
                    <h2 className="text-2xl font-extrabold flex items-center">
                        <span className='mr-2'>💬</span> Swap Inbox
                    </h2>
                </header>

                {/* List of Chats */}
                <div className="flex-grow overflow-y-auto">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv.id, conv.receiverId)}
                            className={`p-4 border-b cursor-pointer transition duration-200 flex flex-col ${
                                activeConversationId === conv.id
                                    ? 'bg-indigo-100 border-l-4 border-indigo-600 font-bold'
                                    : 'hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <p className="text-gray-900 truncate">{conv.name}</p>
                                {conv.unread > 0 && (
                                    <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-md">
                                        {conv.unread}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-medium mt-1 text-emerald-600">{conv.skill}</p>
                            <p className={`text-sm truncate mt-1 ${conv.unread > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>{conv.lastMessage}</p>
                        </div>
                    ))}
                </div>
            </aside>

            {/* 2. Active Chat Window */}
            <main className="flex-1 flex flex-col">
                {activeConversationId && activeConv ? (
                    <>
                        {/* Header */}
                        <header className="p-4 border-b bg-gradient-to-r from-white to-indigo-50 shadow-md flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{activeConv.name}</h3>
                                <p className="text-sm text-gray-600 font-medium">Topic: {activeConv.skill}</p>
                            </div>
                            <button className="flex items-center bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-emerald-600 transition shadow-lg transform hover:scale-[1.02]">
                                📅 Propose Session
                            </button>
                        </header>

                        {/* Message Display Area */}
                        <div className="flex-grow p-6 space-y-4 overflow-y-auto bg-gray-100">
                            {isLoading ? (
                                <div className="text-center p-10 text-indigo-600 font-semibold">
                                    Loading messages...
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center p-10 text-gray-500 italic">
                                    Start the conversation! No messages exchanged yet.
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <MessageBubble
                                        key={msg.$id}
                                        text={msg.content}
                                        time={msg.$createdAt} // Use Appwrite's timestamp
                                        isCurrentUser={msg.senderId === currentUserId}
                                    />
                                ))
                            )}
                            <div ref={messagesEndRef} /> {/* Scroll target */}
                        </div>

                        {/* Message Input Area (USING A FORM FOR SUBMIT) */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t bg-white/70 backdrop-blur-sm sticky bottom-0 z-10 flex items-center gap-3">
                            <button
                                type="button" // Use type button to prevent form submit
                                className="text-gray-500 hover:text-indigo-600 transition p-3 rounded-full border border-gray-300 bg-white shadow-sm"
                            >
                                🖼️
                            </button>
                            <input
                                type="text"
                                placeholder="Send a message, image, or link..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-inner bg-white"
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim()} // Disable if empty
                                className={`p-3 rounded-xl transition font-bold shadow-lg w-24 flex items-center justify-center 
                                    ${inputMessage.trim() ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`
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
                        <p className='mt-2 text-center text-gray-600 max-w-sm'>
                            Select a conversation from the left to start chatting and scheduling your first skill swap session.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MessagesContent;
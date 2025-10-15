'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Client, Account } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';

import DashboardHomeContent from '@/components/Dashboard/DashboardHomeContent';
import FindMatchContent from '@/components/Dashboard/FindMatchContent';
import MySkillsContent from '@/components/Dashboard/MySkillsContent';
import SettingsContent from '@/components/Dashboard/SettingsContent';
import MessagesContent from '@/components/Dashboard/MessagesContent';

import { APPWRITE_CONFIG } from '@/constants';

const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const account = new Account(client);

const NAVIGATION_ITEMS = [
    { id: 'dashboard', icon: "🏠", label: "Dashboard" },
    { id: 'find-match', icon: "🔍", label: "Find Match" },
    { id: 'my-skills', icon: "🛠️", label: "My Skills" },
    { id: 'messages', icon: "💬", label: "Messages" }
];

const LogoutButton: React.FC = () => {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await account.deleteSession('current');
            if (typeof window !== 'undefined') {
                localStorage.removeItem('activeDashboardView');
                localStorage.removeItem('cachedProfile');
            }
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full text-left flex items-center p-3 text-red-400 hover:bg-gray-700 rounded-lg transition duration-200 font-semibold"
        >
            <span className="text-xl mr-3">🚪</span>
            {isLoggingOut ? 'Logging Out...' : 'Log Out'}
        </button>
    );
};

const DashboardMaster: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [activeView, setActiveView] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('activeDashboardView') || 'dashboard';
        }
        return 'dashboard';
    });

    const [chatInitData, setChatInitData] = useState<{ convId: string, receiverId: string } | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('activeDashboardView', activeView);
        }
        if (activeView !== 'messages') {
            setChatInitData(null);
        }
    }, [activeView]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-xl text-gray-700">Loading dashboard access...</p>
            </div>
        );
    }

    const handleQuickNavigate = (viewId: string) => {
        setActiveView(viewId);
    };

    const handleStartSwap = (convId: string, receiverId: string) => {
        setChatInitData({ convId, receiverId });
        setActiveView('messages');
    };

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardHomeContent onQuickNavigate={handleQuickNavigate} />;
            case 'find-match':
                return <FindMatchContent onStartSwap={handleStartSwap} />;
            case 'my-skills':
                return <MySkillsContent />;
            case 'settings':
                return <SettingsContent />;
            case 'messages':
                return <MessagesContent initialChatData={chatInitData} />;
            case 'profile-setup':
                router.push('/dashboard/profile-setup');
                return null;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-100">

            <aside className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-2xl sticky top-0 h-screen overflow-y-auto z-10">
                <div className="text-3xl font-extrabold text-emerald-400 mb-8 pt-2">
                    Skill<span className="text-white">Swap</span>
                </div>

                <div className="mb-8 p-3 bg-gray-700 rounded-xl shadow-inner">
                    <p className="text-lg font-semibold truncate">{user.name}</p>
                    <p className="text-sm text-gray-400 truncate">{user.email}</p>
                </div>

                <nav className="flex-grow space-y-2">
                    {NAVIGATION_ITEMS.map(item => (
                        <div
                            key={item.id}
                            onClick={() => {
                                setChatInitData(null);
                                setActiveView(item.id);
                            }}
                            className={`flex items-center p-3 rounded-lg transition duration-200 font-semibold cursor-pointer ${
                                activeView === item.id
                                    ? 'bg-emerald-600 text-white shadow-lg'
                                    : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            <span className="text-xl mr-3">{item.icon}</span> {item.label}
                        </div>
                    ))}

                </nav>

                <div className="mt-8 pt-4 border-t border-gray-700">
                    <LogoutButton />
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

const DashboardPage: React.FC = () => (
    <ProtectedRoute>
        <DashboardMaster />
    </ProtectedRoute>
);

export default DashboardPage;

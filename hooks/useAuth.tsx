'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { Client, Account, Models, Databases, Query } from 'appwrite';

import { APPWRITE_CONFIG, APPWRITE_DB_ID, APPWRITE_CONVERSATIONS_COLLECTION_ID, APPWRITE_ACTIVITIES_COLLECTION_ID } from '@/constants';


const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const account = new Account(client);
const databases = new Databases(client);


type AuthUser = Models.User<Models.Preferences> | null;

interface Conversation extends Models.Document {
    ownerId: string;
    targetId: string;
    unreadCount: number;

}


interface ActivityItem extends Models.Document {
    userId: string;
    description: string;
    $createdAt: string;
}

const PUBLIC_PAGES = ['/login', '/register', '/verify-email', '/'];
const PROTECTED_PREFIX = '/dashboard';


const formatTimeAgo = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return "just now";
};



export const useAuth = () => {
    const [user, setUser] = useState<AuthUser>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    const [recentActivity, setRecentActivity] = useState<ActivityItem[] | null>(null);
    const [isActivityLoading, setIsActivityLoading] = useState(true);

    const router = useRouter();
    const pathname = usePathname();


    const fetchUnreadMessageCount = useCallback(async (userId: string) => {
        try {
            const response = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_CONVERSATIONS_COLLECTION_ID,
                [
                    Query.equal('ownerId', userId),
                    Query.greaterThan('unreadCount', 0),
                ]
            );

            const conversations = response.documents as unknown as Conversation[];

            const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

            setUnreadMessageCount(totalUnread);

        } catch (error) {
            console.error("Error fetching unread message count:", error);
            setUnreadMessageCount(0);
        }
    }, []);


    const fetchRecentActivity = useCallback(async (userId: string) => {
        setIsActivityLoading(true);
        try {
            const response = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_ACTIVITIES_COLLECTION_ID,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('$createdAt'),
                    Query.limit(5)
                ]
            );

            const activities = response.documents as unknown as ActivityItem[];

            setRecentActivity(activities);

        } catch (error) {
            console.error("Error fetching recent activities:", error);
            setRecentActivity([]);
        } finally {
            setIsActivityLoading(false);
        }
    }, []);


    useEffect(() => {
        const checkUserStatus = async () => {
            try {
                const loggedInUser = await account.get();
                setUser(loggedInUser);
                if (loggedInUser) {
                    const userId = loggedInUser.$id;

                    await fetchUnreadMessageCount(userId);
                    await fetchRecentActivity(userId);
                }
            } catch (error) {
                setUser(null);
                setUnreadMessageCount(0);
                setRecentActivity([]);
            } finally {
                setIsLoading(false);
            }
        };

        checkUserStatus();

    }, [fetchUnreadMessageCount, fetchRecentActivity]);


    useEffect(() => {
        if (isLoading) return;

        const isProtected = pathname.startsWith(PROTECTED_PREFIX);
        const isPublic = PUBLIC_PAGES.includes(pathname);

        if (!user && isProtected) {
            router.push('/login');
            return;
        }

        if (user && isPublic && pathname !== '/') {
            router.push('/dashboard');
        }
    }, [user, isLoading, pathname, router]);


    const logOut = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
            setUnreadMessageCount(0);
            setRecentActivity(null);

            router.push('/login');
        } catch (error) {
            console.error("Logout Error:", error);
        }
    }

    const refreshUser = async () => {
        try {
            const loggedInUser = await account.get();
            setUser(loggedInUser);
            if (loggedInUser) {
                const userId = loggedInUser.$id;
                await fetchUnreadMessageCount(userId);
                await fetchRecentActivity(userId);
            }
            return loggedInUser;
        } catch (error) {
            setUser(null);
            setUnreadMessageCount(0);
            setRecentActivity(null);
            return null;
        }
    }

    return {
        user,
        isLoading,
        client,
        account,
        logOut,
        refreshUser,
        isAuthenticated: !!user,
        unreadMessageCount,
        fetchUnreadMessageCount,
        recentActivity: recentActivity ? recentActivity.map(activity => ({
            id: activity.$id,
            text: activity.description,
            time: formatTimeAgo(activity.$createdAt)
        })) : null,
        isActivityLoading,
        fetchRecentActivity,
    };
};
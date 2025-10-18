import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { Client, Account, Models } from 'appwrite';
import { APPWRITE_CONFIG } from '@/constants';

const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const account = new Account(client);

const PUBLIC_PAGES = ['/login', '/register', '/verify-email', '/'];
const PROTECTED_PREFIX = '/dashboard';

type AuthUser = Models.User<Models.Preferences> | null;
export const useAuth = () => {
    const [user, setUser] = useState<AuthUser>(null);
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkUserStatus = async () => {
            try {
                const loggedInUser = await account.get();
                setUser(loggedInUser);
            } catch (error) {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkUserStatus();

    }, []);

    useEffect(() => {
        if (isLoading) return;

        const isProtected = pathname.startsWith(PROTECTED_PREFIX);
        const isPublic = PUBLIC_PAGES.includes(pathname);

        if (!user && isProtected) {
            router.push('/login');
            return;
        }

        // Scenario 2: User IS logged in and trying to access a public auth page (like /login)
        if (user && isPublic && pathname !== '/') {
            router.push('/dashboard');
        }
    }, [user, isLoading, pathname, router]);


    const logOut = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error("Logout Error:", error);
        }
    }

    const refreshUser = async () => {
        try {
            const loggedInUser = await account.get();
            setUser(loggedInUser);
            return loggedInUser;
        } catch (error) {
            setUser(null);
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
    };
};
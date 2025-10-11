// hooks/useAuth.tsx
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Import Appwrite tools
import { Client, Account } from 'appwrite';
import { APPWRITE_CONFIG } from '@/constants';

// --- Appwrite Client Setup ---
const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const account = new Account(client);

// Define pages that are PUBLIC (anyone can see them)
const PUBLIC_PAGES = ['/login', '/register', '/verify-email', '/'];
// Define pages that are PROTECTED (only logged-in users can see them)
const PROTECTED_PREFIX = '/dashboard';

export const useAuth = () => {
    // 1. Initial State: Read from a global/persisted variable if available
    // For a real app, you might use Redux, Zustand, or Context to hold this state globally.
    // For simplicity, we'll rely on the useEffect below to set it quickly.
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // START as loading

    useEffect(() => {
        // --- ONLY RUN THIS AUTH CHECK ONCE ---
        const checkUserStatus = async () => {
            try {
                // This is the slow part (network call to Appwrite)
                const loggedInUser = await account.get();
                setUser(loggedInUser);
            } catch (error) {
                // User is not logged in or session expired
                setUser(null);
            } finally {
                // IMPORTANT: Set loading to false only after the first check
                setIsLoading(false);
            }
        };

        // If 'user' is null AND we are loading, run the check.
        // A better pattern involves using React Context to manage the user state
        // across the entire application tree, ensuring it's only fetched once.
        if (isLoading) {
            checkUserStatus();
        }

    }, [isLoading]);

    // Add a simple refresh function if you need to update user data later
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

    // You would expose a login/logout function here too, which updates 'user' instantly

    return {
        user,
        isLoading, // This should only be TRUE on the very first page load
        setUser, // Function to instantly update user state (e.g., after login)
        refreshUser
    };
};
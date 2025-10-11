'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    // 1. Show loading screen while checking auth status
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl font-medium text-indigo-600 animate-pulse">
                    Checking access permissions...
                </p>
            </div>
        );
    }

    // 2. Redirect if not logged in
    if (!user) {
        router.push('/login');
        return null; // Don't render anything during redirect
    }

    // 3. Render the content if logged in
    return <>{children}</>;
};

export default ProtectedRoute;
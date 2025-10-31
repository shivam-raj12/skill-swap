
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Client, Account } from 'appwrite';
import { APPWRITE_CONFIG } from '@/constants';

const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);
const account = new Account(client);

const VerifyEmailPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Checking verification link...');

    useEffect(() => {
        const userId = searchParams.get('userId');
        const secret = searchParams.get('secret');

        if (userId && secret) {
            handleVerification(userId, secret);
        } else {
            setStatus('error');
            setMessage('Invalid verification link. Please go back to the dashboard or try registering again.');
        }
    }, [searchParams]);

    const handleVerification = async (userId: string, secret: string) => {
        try {

            await account.updateVerification({ userId, secret });

            setStatus('success');
            setMessage('Your email is now verified! You can now access all features. Redirecting to the dashboard...');

            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (err: any) {
            console.error('Email Verification Error:', err);
            setStatus('error');
            setMessage(`Verification failed. ${err.message || 'The link may be expired or already used.'}`);
        }
    };

    const getStyle = () => {
        switch (status) {
            case 'success':
                return 'border-emerald-500 bg-emerald-50 text-emerald-800';
            case 'error':
                return 'border-red-500 bg-red-50 text-red-800';
            default:
                return 'border-indigo-500 bg-indigo-50 text-indigo-800';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-gray-900 to-black">
            <div className={`max-w-md w-full p-10 rounded-xl shadow-2xl border-t-8 ${getStyle()} text-center`}>
                <h2 className="text-3xl font-bold mb-4">
                    {status === 'loading' ? 'Verifying Email' : status === 'success' ? 'Verification Complete' : 'Verification Failed'}
                </h2>
                <p className="text-lg">
                    {message}
                </p>
                {status === 'error' && (
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="mt-6 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                    >
                        Go to Dashboard
                    </button>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
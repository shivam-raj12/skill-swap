'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Client, Account, ID } from 'appwrite';

import { APPWRITE_CONFIG } from '@/constants';
import { useAuth } from '@/hooks/useAuth';



const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const account = new Account(client);


const RegisterPage: React.FC = () => {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {

        if (!isAuthLoading && user) {

            const redirectTimer = setTimeout(() => {
                router.push('/dashboard');
            }, 1500);

            return () => clearTimeout(redirectTimer);
        }
    }, [user, isAuthLoading, router]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setError('');
        setSuccess('');
        setIsRegistering(true);

        try {

            await account.create(
                ID.unique(),
                email,
                password,
                name
            );

            await account.createEmailPasswordSession(email, password);

            setSuccess('Success! We sent a verification link to your email. You will be redirected to the dashboard.');


            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {

            const errorMessage = err?.message || 'An unknown error occurred during registration.';
            setError(errorMessage);
        } finally {
            setIsRegistering(false);
        }
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-gray-900 to-black text-white text-lg">
                Checking login status...
            </div>
        );
    }

    if (user) {

        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-gray-900 to-black text-white">
                <div className="text-center p-10 bg-white rounded-xl shadow-2xl border-t-8 border-emerald-500">
                    <h2 className="text-3xl font-bold text-gray-900">
                        You are already signed in, {user.name.split(' ')[0]}!
                    </h2>
                    <p className="mt-4 text-gray-600">
                        Taking you to your <span className="font-semibold text-indigo-600">dashboard</span> now...
                    </p>
                </div>
            </div>
        );
    }



    return (

        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-900 via-gray-900 to-black">

            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border-t-8 border-emerald-500 transform transition duration-500 hover:scale-[1.02]">

                <div>
                    <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
                        Join SkillSwap
                    </h2>
                    <p className="mt-2 text-center text-lg text-gray-600">
                        Start trading knowledge today—it&#39;s fast and free!
                    </p>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm" role="alert">
                        {success}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="rounded-md shadow-sm space-y-4">

                        {/* Name Input */}
                        <div>
                            <label htmlFor="name" className="sr-only">Full Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                placeholder="Your Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-lg transition duration-200"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-lg transition duration-200"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                placeholder="Password (at least 8 characters)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-lg transition duration-200"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isRegistering}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-full text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRegistering ? (

                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Create My SkillSwap Account'
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer Link */}
                <div className="text-center text-sm text-gray-600">
                    Already have an account? {' '}
                    <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Sign In here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
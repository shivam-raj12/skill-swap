'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Client, Account } from 'appwrite';

import { APPWRITE_CONFIG } from '@/constants';
import { useAuth } from '@/hooks/useAuth';



const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const account = new Account(client);


const LoginPage: React.FC = () => {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoginProcessing, setIsLoginProcessing] = useState(false);

    useEffect(() => {

        if (!isAuthLoading && user) {

            const redirectTimer = setTimeout(() => {
                router.push('/dashboard');
            }, 1500);

            return () => clearTimeout(redirectTimer);
        }
    }, [user, isAuthLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }

        setIsLoginProcessing(true);

        try {
            await account.createEmailPasswordSession(
                email, password
            )
            setSuccess('Success! You are logged in.');

            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);

        } catch (err: any) {
            console.error('Appwrite Login Error:', err);

            if (err.code === 401) {
                setError('Wrong email or password. Please check your details and try again.');
            } else if (err.code === 409) {

                setError('You are already logged in. Redirecting to dashboard...');
                setTimeout(() => router.push('/dashboard'), 1000);
            } else {
                setError('We had a problem logging you in. Please try again.');
            }
        } finally {
            setIsLoginProcessing(false);
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
                        You are already logged in, {user.name.split(' ')[0]}!
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

                {}
                <div>
                    <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-center text-lg text-gray-600">
                        Sign in to start swapping skills!
                    </p>
                </div>

                {}
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

                {}
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm space-y-4">

                        {}
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

                        {}
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-lg transition duration-200"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoginProcessing}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-full text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoginProcessing ? (

                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Sign In to SkillSwap'
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer Link */}
                <div className="text-center text-sm text-gray-600">
                    Don't have an account yet? {' '}
                    <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Create an account here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

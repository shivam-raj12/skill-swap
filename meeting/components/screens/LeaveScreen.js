'use client';

import React from 'react';
import Link from 'next/link';

export function LeaveScreen({ setIsMeetingLeft }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-gray-900 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full transform transition-all duration-300 ease-in-out scale-100 opacity-100 hover:shadow-3xl">

                {/* Visual Cue */}
                <p className="text-6xl mb-6 animate-pulse text-yellow-400">👋</p>

                <h1 className="text-white text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                    You've Left the Session!
                </h1>
                <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-md mx-auto">
                    Thanks for joining! You have two simple options now.
                </p>

                <div className="flex flex-col space-y-5">
                    <button
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-lg md:text-xl shadow-lg hover:from-purple-700 hover:to-indigo-800 transition transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 active:scale-95"
                        onClick={() => {

                            setIsMeetingLeft(false);
                        }}
                    >
                        🔄 Rejoin Session
                    </button>

                    <Link href="/dashboard" passHref legacyBehavior>
                        <a
                            className="block w-full bg-gray-600 text-white font-semibold py-4 px-8 rounded-xl text-lg md:text-xl shadow-lg hover:bg-gray-700 transition transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50 active:scale-95"
                        >
                            🏠 Go to Dashboard
                        </a>
                    </Link>
                </div>
            </div>
        </div>
    );
}

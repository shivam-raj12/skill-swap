'use client';

import React, {useState, useEffect} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {Client, Functions} from 'appwrite';
import {APPWRITE_CONFIG} from "@/constants";



const JWT_FUNCTION_ID = '690384fe00078b781c5a';

const VIDEO_SDK_ENDPOINT = process.env.NEXT_PUBLIC_VIDEO_SDK_API_ENDPOINT || 'https://api.videosdk.live/v2';


const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const functions = new Functions(client);

interface Recording {
    id: string;
    url?: string;
    duration: number;
    createdAt: string;
    fileFormat: string;
    fileSize: string;
}


const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const RecordingsPage: React.FC = () => {
    const params = useParams();
    const meetingId = params.meetingId as string;

    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const formatDuration = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        const pad = (num: number) => num.toString().padStart(2, '0');
        if (h > 0) {
            return `${pad(h)}:${pad(m)}:${pad(s)}`;
        }
        return `${pad(m)}:${pad(s)}`;
    };



    const getJwtToken = async (): Promise<string | null> => {

        try {
            const execution = await functions.createExecution(
                JWT_FUNCTION_ID,
                '',
                false
            );

            const functionResponse = JSON.parse(execution.responseBody);

            if (execution.status !== 'completed' || functionResponse.error) {
                throw new Error(functionResponse.error || `Appwrite execution failed with status: ${execution.status}`);
            }

            return functionResponse.token;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Appwrite Execution Error:', err);
            setError(`Authentication setup failed (Appwrite SDK): ${err.message}. Check CORS settings and Project ID.`);
            return null;
        }
    };


    const fetchRecordings = async (roomId: string, token: string) => {
        try {
            const recordingsUrl = `${VIDEO_SDK_ENDPOINT}/recordings?roomId=${roomId}`;

            const response = await fetch(recordingsUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`
                },
            });

            const rawData = await response.json();

            if (!response.ok) {
                throw new Error(rawData.message || 'Video SDK request failed. Check your Meeting ID and JWT.');
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const processedRecordings: Recording[] = (rawData.data || []).map((item: any) => ({
                id: item.id,

                url: item.file?.fileUrl,

                duration: item.file?.meta?.duration || (new Date(item.end).getTime() - new Date(item.start).getTime()) / 1000,
                createdAt: item.createdAt,

                fileFormat: item.file?.type === 'video' ? 'MP4' : item.file?.type,
                fileSize: formatBytes(item.file?.size || 0),
            }));


            setRecordings(processedRecordings);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Recording Fetch Error:', err);
            setError(`Failed to load recordings for room ${roomId}. Error: ${err.message}`);
        }
    };

    useEffect(() => {
        if (!meetingId) return;

        const loadData = async () => {
            setIsLoading(true);
            const token = await getJwtToken();

            if (token) {
                await fetchRecordings(meetingId, token);
            }
            setIsLoading(false);
        };

        loadData();
    }, [meetingId]);



    if (isLoading) {
        return (
            <div className="p-10 text-center text-indigo-600">
                <p className="text-xl">
                    <span className="animate-spin inline-block mr-2 text-3xl">⏳</span>
                    Loading recordings for room <strong>{meetingId}</strong>...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6 md:p-10">
                <div className="p-8 bg-red-50 border border-red-400 text-red-800 rounded-xl shadow-xl">
                    <p className="font-bold text-xl">🛑 Error Loading Data:</p>
                    <p className="mt-3 text-base">{error}</p>
                    <p className="mt-4 text-sm text-red-600">
                        Please check your network, Appwrite function ID (
                        <code className="bg-red-200 text-red-800 p-0.5 rounded text-xs">
                            {JWT_FUNCTION_ID}
                        </code>
                        ), and that the room ID (
                        <code className="bg-red-200 text-red-800 p-0.5 rounded text-xs">
                            {meetingId}
                        </code>
                        ) is correct.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8 md:p-16 bg-white min-h-screen">
            <header className="mb-10">
                <h1 className="text-6xl font-extrabold text-gray-900 mb-3 leading-tight">
                    <span className="text-indigo-600">Archived</span> Sessions
                </h1>
                <p className="text-xl text-gray-600 border-l-4 border-indigo-400 pl-4">
                    Viewing <strong>{recordings.length}</strong> recording(s) for Room ID:
                    <code
                        className="bg-indigo-50 text-indigo-700 font-mono text-lg p-1.5 rounded-md ml-2 inline-block shadow-inner select-all">
                        {meetingId}
                    </code>
                </p>
            </header>

            {/* --- Recording List --- */}
            {recordings.length === 0 ? (
                <div
                    className="p-20 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl shadow-2xl mt-12">
                    <span className="text-7xl mb-4 block text-indigo-400">📼</span>
                    <p className="text-3xl font-bold text-gray-700">🎬 No Recordings Yet!</p>
                    <p className="text-lg text-gray-500 mt-3">
                        What are you waiting for? Go ahead — schedule a meeting and start capturing the good stuff!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                    {recordings.map((recording, index) => (
                        <div
                            key={recording.id}
                            className="bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition duration-300 border border-gray-100 flex flex-col justify-between transform hover:-translate-y-1"
                            style={{
                                borderLeft: '6px solid #4f46e5',
                            }}
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                                    <span className="mr-2 text-indigo-500">
                                        {recording.fileFormat === 'MP4' ? '🎥' : '📁'}
                                    </span>
                                    Session {index + 1}
                                </h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Created: <strong>{new Date(recording.createdAt).toLocaleString()}</strong>
                                </p>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                                    <span className="flex flex-col bg-indigo-50 px-3 py-2 rounded-lg">
                                        <span className="text-xs font-medium text-indigo-700">DURATION</span>
                                        <strong className="text-base text-indigo-900">
                                            {formatDuration(recording.duration)}
                                        </strong>
                                    </span>
                                    <span className="flex flex-col bg-indigo-50 px-3 py-2 rounded-lg">
                                        <span className="text-xs font-medium text-indigo-700">FILE TYPE</span>
                                        <strong className="text-base text-indigo-900">
                                            {recording.fileFormat ? recording.fileFormat.toUpperCase() : 'N/A'}
                                        </strong>
                                    </span>
                                    {recording.fileSize !== '0 Bytes' && (
                                        <span className="flex flex-col bg-indigo-50 px-3 py-2 rounded-lg col-span-2">
                                            <span className="text-xs font-medium text-indigo-700">FILE SIZE</span>
                                            <strong className="text-base text-indigo-900">
                                                {recording.fileSize}
                                            </strong>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-4">
                                {recording.url ? (
                                    <button
                                        onClick={() => {

                                            const videoWindow = window.open('', '_blank');
                                            videoWindow?.document.write(`
                                                <!DOCTYPE html>
                                                <html lang="en">
                                                <head>
                                                    <title>Video Playback - ${recording.id}</title>
                                                    <meta name="viewport" content="width=device-width, initial-scale=1">
                                                    <style>
                                                        body { margin: 0; background-color: #0d1117; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
                                                        video { max-width: 95%; max-height: 95%; border-radius: 12px; box-shadow: 0 15px 30px rgba(0,0,0,0.7); outline: none; }
                                                        .loading { color: #fff; }
                                                    </style>
                                                </head>
                                                <body>
                                                    <video controls autoplay>
                                                        <source src="${recording.url}" type="video/mp4">
                                                        <p class="loading">Your browser does not support the video tag. Please ensure the video link is correct.</p>
                                                    </video>
                                                </body>
                                                </html>
                                            `);
                                        }}
                                        className="w-full flex items-center justify-center bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-emerald-600 transition duration-300 text-lg"
                                    >
                                        <span className="mr-2 text-xl">▶️</span> Watch Recording
                                    </button>
                                ) : (
                                    <span
                                        className="w-full flex items-center justify-center bg-yellow-100 text-yellow-800 font-semibold py-3 px-6 rounded-xl shadow-inner text-lg animate-pulse"
                                    >
                                        <span className="mr-2">⏳</span> File Still Processing
                                    </span>
                                )}
                            </div>


                        </div>
                    ))}
                </div>
            )}

            {/* --- Back Link --- */}
            <div className="mt-16 text-center">
                <Link href="/dashboard" passHref legacyBehavior>
                    <a className="text-indigo-600 hover:text-indigo-800 font-bold transition duration-300 text-xl border-b-2 border-transparent hover:border-indigo-600 pb-1 inline-flex items-center">
                        <span className="mr-3 text-2xl">🏠</span> Go Back to Dashboard
                    </a>
                </Link>
            </div>
        </div>
    );
};

export default RecordingsPage;
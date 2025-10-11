'use client';

import React from 'react';

const SettingsContent: React.FC = () => {
    return (
        <div className="p-8 bg-white rounded-xl shadow-lg border-l-4 border-indigo-500">
            <h2 className="text-3xl font-bold text-gray-900">⚙️ Settings & Account</h2>
            <p className="mt-2 text-gray-600">This is where you can manage your personal details, security, and app preferences.</p>
            <div className="mt-6 space-y-3">
                <p className="font-semibold">User ID: ...</p>
                <p className="text-sm text-red-500">Note: The logout button is conveniently located in the sidebar.</p>
            </div>
        </div>
    );
};

export default SettingsContent;

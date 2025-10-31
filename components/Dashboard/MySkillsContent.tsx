'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Client, Databases, Query } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import {
    APPWRITE_CONFIG,
    APPWRITE_DB_ID,
    APPWRITE_PROFILES_COLLECTION_ID
} from '@/constants';
import { SKILL_HIERARCHY } from '@/constants/skills';

interface AppwriteUser { $id: string; name: string; email: string; emailVerification: boolean; }
interface Document { $id: string; }
interface MatchProfile extends Document {
    userId: string; bio: string; skillsToTeach: string[]; skillsToLearn: string[];
    profilePictureUrl: string; name: string;
}

const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const databases = new Databases(client);


const SkillManager: React.FC<{
    skillType: 'skillsToTeach' | 'skillsToLearn',
    profileId: string | null,
    initialSkills: string[],
    onUpdate: (type: 'skillsToTeach' | 'skillsToLearn', newSkills: string[]) => void,
    isSubmitting: boolean,
    setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>,
    setGlobalError: React.Dispatch<React.SetStateAction<string | null>>,
    setGlobalSuccess: React.Dispatch<React.SetStateAction<string | null>>
}> = ({
          skillType,
          profileId,
          initialSkills,
          onUpdate,
          isSubmitting,
          setIsSubmitting,
          setGlobalError,
          setGlobalSuccess
      }) => {

    const [localSkills, setLocalSkills] = useState<string[]>(initialSkills);

    useEffect(() => {
        setLocalSkills(initialSkills);
    }, [initialSkills]);

    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSubsection, setSelectedSubsection] = useState('');
    const [selectedSkillItem, setSelectedSkillItem] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const currentSection = useMemo(() => SKILL_HIERARCHY.find(s => s.id === selectedSection), [selectedSection]);
    const currentSubsection = useMemo(() => currentSection?.subsections?.find(s => s.id === selectedSubsection), [currentSection, selectedSubsection]);

    const colorClassKey = skillType === 'skillsToTeach' ? 'emerald' : 'indigo';

    const colorClasses = useMemo(() => ({
        emerald: {
            ring: 'focus:ring-emerald-500', border: 'focus:border-emerald-500',
            borderDashed: 'border-emerald-200', background: 'bg-emerald-50',
            tagText: 'text-emerald-700', tagBg: 'bg-emerald-200',
            buttonBg: 'bg-emerald-600', buttonHover: 'hover:bg-emerald-700'
        },
        indigo: {
            ring: 'focus:ring-indigo-500', border: 'focus:border-indigo-500',
            borderDashed: 'border-indigo-200', background: 'bg-indigo-50',
            tagText: 'text-indigo-700', tagBg: 'bg-indigo-200',
            buttonBg: 'bg-indigo-600', buttonHover: 'hover:bg-indigo-700'
        }
    }), []);

    const classes = colorClasses[colorClassKey];


    const handleSkillToggle = (skillName: string) => {
        setLocalError(null);
        setGlobalError(null);

        setLocalSkills(prev => {
            const isSelected = prev.includes(skillName);

            if (isSelected) {
                return prev.filter(s => s !== skillName);
            } else if (prev.length < 10) {
                return [...prev, skillName];
            } else {
                setLocalError(`You can only select up to 10 skills.`);
                return prev;
            }
        });

        if (!localSkills.includes(skillName) && localSkills.length < 10) {
            setSelectedSkillItem('');
        }
    };

    const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSection(e.target.value);
        setSelectedSubsection('');
        setSelectedSkillItem('');
    };

    const handleSubsectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSubsectionId = e.target.value;
        setSelectedSubsection(newSubsectionId);
        setSelectedSkillItem('');

        const subsectionNode = currentSection?.subsections?.find(s => s.id === newSubsectionId);

        if (subsectionNode && !subsectionNode.subSubsections && newSubsectionId) {
            handleSkillToggle(subsectionNode.name);
        }
    };

    const handleSkillItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const skillName = e.target.value;
        setSelectedSkillItem(skillName);
        if (skillName && !localSkills.includes(skillName)) {
            handleSkillToggle(skillName);
        }
    };

    const handleSubmitUpdate = async () => {
        if (!profileId) {
            setGlobalError("Profile not found. Cannot save skills.");
            return;
        }
        if (localSkills.length === 0) {
            setGlobalError(`Please choose at least one skill for the ${skillType === 'skillsToTeach' ? 'teaching' : 'learning'} list.`);
            return;
        }

        setIsSubmitting(true);
        setGlobalError(null);
        setGlobalSuccess(null);

        try {
            const dataToUpdate = {
                [skillType]: localSkills,
            };

            await databases.updateDocument(
                APPWRITE_DB_ID,
                APPWRITE_PROFILES_COLLECTION_ID,
                profileId,
                dataToUpdate as any
            );

            onUpdate(skillType, localSkills);
            setGlobalSuccess(`Success! Your ${skillType === 'skillsToTeach' ? 'Teaching' : 'Learning'} Skills have been updated.`);

        } catch (err) {
            console.error("Error updating skills:", err);
            setGlobalError("Sorry, saving skills failed. Please try again.");
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setGlobalSuccess(null), 4000);
        }
    };


    return (
        <div className="space-y-6">

            {/* --- 3-Level Dropdown Selector (Alignment and Spacing Fixed) --- */}
            <div className="p-5 border rounded-xl bg-gray-50 space-y-4">
                {/* FIX: md:items-end ensures the bottom of the select boxes align on desktop */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">

                    {/* 1. Category Dropdown */}
                    <div className="flex-1">
                        {/* FIX: mb-1 ensures correct spacing for the label/instructional text */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">1. Choose Category</label>
                        <select
                            value={selectedSection}
                            onChange={handleSectionChange}
                            className={`w-full border border-gray-300 rounded-lg p-3 ${classes.ring} ${classes.border} bg-white shadow-sm`}
                        >
                            <option value="">--- Select Section ---</option>
                            {SKILL_HIERARCHY.map(section => (
                                <option key={section.id} value={section.id}>
                                    {section.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Focus Area Dropdown */}
                    <div className="flex-1">
                        {/* FIX: mb-1 ensures correct spacing for the label/instructional text */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">2. Choose Focus Area</label>
                        <select
                            value={selectedSubsection}
                            onChange={handleSubsectionChange}
                            disabled={!currentSection}
                            className={`w-full border border-gray-300 rounded-lg p-3 ${classes.ring} ${classes.border} bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-500`}
                        >
                            <option value="">--- Select Subsection ---</option>
                            {currentSection?.subsections?.map(subsection => (
                                <option key={subsection.id} value={subsection.id}>
                                    {subsection.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 3. Skill Item Dropdown */}
                    <div className="flex-1">
                        {/* FIX: mb-1 ensures correct spacing for the label/instructional text */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">3. Select Skill to Add</label>
                        <select
                            value={selectedSkillItem}
                            onChange={handleSkillItemChange}
                            disabled={!currentSubsection || !currentSubsection.subSubsections || localSkills.length >= 10 || isSubmitting}
                            className={`w-full border border-gray-300 rounded-lg p-3 ${classes.ring} ${classes.border} bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-500`}
                        >
                            <option value="">
                                {currentSubsection?.subSubsections ? '--- Select Final Skill ---' : 'N/A (Added in Step 2)'}
                            </option>
                            {currentSubsection?.subSubsections?.map(skill => (
                                <option key={skill} value={skill} disabled={localSkills.includes(skill)}>
                                    {skill} {localSkills.includes(skill) ? '(Added)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {localError && <p className="text-sm text-red-500 font-medium mt-2">{localError}</p>}
            </div>

            {/* --- Selected Skills Summary --- */}
            <div className={`min-h-[70px] p-4 border-2 border-dashed ${classes.borderDashed} rounded-lg ${classes.background} transition-all duration-300`}>
                <h3 className="text-md font-semibold text-gray-800 mb-2">
                    Your Selected Skills ({localSkills.length} / 10)
                </h3>
                {localSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {localSkills.map(skill => (
                            <span key={skill} className={`px-3 py-1 text-sm font-medium ${classes.tagText} ${classes.tagBg} rounded-full flex items-center shadow-sm`}>
                                {skill}
                                <button
                                    type="button"
                                    onClick={() => handleSkillToggle(skill)}
                                    className="ml-2 text-gray-600 hover:text-red-700 transition"
                                >
                                    &times;
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm italic">Use the dropdowns above to add skills to your profile.</p>
                )}
            </div>

            {/* Action Button */}
            <button
                onClick={handleSubmitUpdate}
                disabled={isSubmitting}
                className={`mt-4 w-full text-center py-3 ${classes.buttonBg} text-white font-bold rounded-xl shadow-md ${classes.buttonHover} transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
                {isSubmitting ? 'Saving...' : `Update ${skillType === 'skillsToTeach' ? 'Teaching' : 'Learning'} Skills`} &rarr;
            </button>
        </div>
    );
};

const MySkillsContent: React.FC = () => {

    const { user, isLoading: isAuthLoading } = useAuth() as { user: AppwriteUser | null, isLoading: boolean };

    const [profileId, setProfileId] = useState<string | null>(null);
    const [skillsToTeach, setSkillsToTeach] = useState<string[]>([]);
    const [skillsToLearn, setSkillsToLearn] = useState<string[]>([]);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

    const fetchProfileData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setGlobalError(null);
        setLoading(true);

        try {
            const response = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_PROFILES_COLLECTION_ID,
                [Query.equal('userId', user.$id)]
            );

            const fetchedProfile = response.documents[0] as unknown as MatchProfile | undefined;

            if (fetchedProfile) {
                setProfileId(fetchedProfile.$id);
                setSkillsToTeach(fetchedProfile.skillsToTeach || []);
                setSkillsToLearn(fetchedProfile.skillsToLearn || []);
            } else {
                setGlobalError("Your profile document is missing. Please visit Profile Setup to create one.");
            }

        } catch (err) {
            console.error("Error fetching profile:", err);
            setGlobalError("Sorry, failed to load skills data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchProfileData();
        }
    }, [user, isAuthLoading, fetchProfileData]);

    const handleGlobalSkillUpdate = useCallback((type: 'skillsToTeach' | 'skillsToLearn', newSkills: string[]) => {
        if (type === 'skillsToTeach') {
            setSkillsToTeach(newSkills);
        } else {
            setSkillsToLearn(newSkills);
        }
    }, []);


    if (isAuthLoading || loading) {
        return (
            <div className="text-center py-20">
                <p className="text-xl text-indigo-600 font-semibold">Loading your skill inventory...</p>
                {/* Simple loading bar styling */}
                <div className="mt-4 mx-auto w-1/3 h-1 bg-indigo-200 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-indigo-500 animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (globalError && !profileId) {
        return (
            <div className="p-8 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg max-w-xl mx-auto mt-10 shadow-lg">
                <p className="font-bold">Setup Error</p>
                <p className="mt-2">{globalError}</p>
                <Link href="/dashboard/profile-setup" className="text-sm text-red-500 underline hover:text-red-600 mt-2 inline-block">
                    Go to Profile Setup to create a profile
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-4">

            {/* Header Section */}
            <header className="mb-8 p-6 bg-white rounded-xl shadow-lg border-l-4 border-indigo-500">
                <h1 className="text-4xl font-extrabold text-gray-900">
                    🛠️ My Skills & Offerings
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                    Use the tool below to update the skills you can teach and the skills you want to learn.
                </p>
            </header>

            {/* Status Messages */}
            {globalSuccess && (
                <div className="p-4 mb-6 bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800 rounded-lg shadow-md font-semibold">
                    ✅ {globalSuccess}
                </div>
            )}
            {globalError && (
                <div className="p-4 mb-6 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-lg shadow-md font-semibold">
                    ❌ {globalError}
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Card 1: Skills I Teach */}
                <div className="bg-white p-8 rounded-2xl shadow-xl border-t-8 border-emerald-500">
                    <div className="flex items-center space-x-3 mb-4">
                        <span className="text-4xl text-emerald-600">🧑‍🏫</span>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Skills I Teach
                        </h2>
                    </div>

                    <SkillManager
                        skillType="skillsToTeach"
                        profileId={profileId}
                        initialSkills={skillsToTeach}
                        onUpdate={handleGlobalSkillUpdate}
                        isSubmitting={isSubmitting}
                        setIsSubmitting={setIsSubmitting}
                        setGlobalError={setGlobalError}
                        setGlobalSuccess={setGlobalSuccess}
                    />
                </div>

                {/* Card 2: Skills I Want to Learn */}
                <div className="bg-white p-8 rounded-2xl shadow-xl border-t-8 border-indigo-500">
                    <div className="flex items-center space-x-3 mb-4">
                        <span className="text-4xl text-indigo-600">📚</span>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Skills I Want to Learn
                        </h2>
                    </div>

                    <SkillManager
                        skillType="skillsToLearn"
                        profileId={profileId}
                        initialSkills={skillsToLearn}
                        onUpdate={handleGlobalSkillUpdate}
                        isSubmitting={isSubmitting}
                        setIsSubmitting={setIsSubmitting}
                        setGlobalError={setGlobalError}
                        setGlobalSuccess={setGlobalSuccess}
                    />
                </div>

            </div>
        </div>
    );
};

export default MySkillsContent;
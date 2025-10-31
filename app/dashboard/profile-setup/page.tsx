'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Client, Databases, Storage, Query, ID, Permission, Role, Account } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';

import {
    APPWRITE_CONFIG,
    APPWRITE_DB_ID,
    APPWRITE_PROFILES_COLLECTION_ID,
    APPWRITE_STORAGE_BUCKET_ID
} from '@/constants';
import { SKILL_HIERARCHY } from '@/constants/skills';
import Link from 'next/link';
import Image from "next/image";

const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const databases = new Databases(client);
const storage = new Storage(client);
const account = new Account(client);


interface ProfileData {
    $id?: string;
    name: string;
    bio: string;
    skillsToTeach: string[];
    skillsToLearn: string[];
    profilePictureUrl: string;
}

const STEPS = [
    { id: 1, name: 'Basic Info & Photo' },
    { id: 2, name: 'Skills I Teach' },
    { id: 3, name: 'Skills I Want to Learn' },
];


const SkillPicker: React.FC<{
    skillType: 'skillsToTeach' | 'skillsToLearn',
    formData: ProfileData,
    setFormData: React.Dispatch<React.SetStateAction<ProfileData>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>
}> = ({ skillType, formData, setFormData, setError }) => {
    const selectedSkills = formData[skillType];

    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSubsection, setSelectedSubsection] = useState('');
    const [selectedSkillItem, setSelectedSkillItem] = useState('');

    const currentSection = useMemo(() => SKILL_HIERARCHY.find(s => s.id === selectedSection), [selectedSection]);
    const currentSubsection = useMemo(() => currentSection?.subsections?.find(s => s.id === selectedSubsection), [currentSection, selectedSubsection]);

    const handleSkillToggle = (skillName: string) => {
        setFormData(prev => {
            const currentSkills = prev[skillType];
            const isSelected = currentSkills.includes(skillName);

            if (isSelected) {
                return { ...prev, [skillType]: currentSkills.filter(s => s !== skillName) };
            } else if (currentSkills.length < 10) {
                return { ...prev, [skillType]: [...currentSkills, skillName] };
            }
            return prev;
        });

        setSelectedSkillItem('');
        setError(null);
        if (!selectedSkills.includes(skillName) && selectedSkills.length >= 9) {
            setError(`Maximum of 10 skills reached for this list.`);
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
        if (skillName && !selectedSkills.includes(skillName)) {
            handleSkillToggle(skillName);
        }
    };

    const title = skillType === 'skillsToTeach' ? 'Skills You Offer' : 'Skills You Want to Learn';
    const instruction = skillType === 'skillsToTeach'
        ? 'Use the dropdowns to select up to 10 skills you are confident in teaching.'
        : 'Select up to 10 skills you are actively looking for a teacher in.';

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{title} <span className="text-red-500">*</span></h2>
            <p className="text-gray-500">{instruction}</p>

            {}
            <div className="p-5 border rounded-xl bg-gray-50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">1. Choose Category</label>
                        <select
                            value={selectedSection}
                            onChange={handleSectionChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                        >
                            <option value="">--- Select Section ---</option>
                            {SKILL_HIERARCHY.map(section => (
                                <option key={section.id} value={section.id}>
                                    {section.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">2. Choose Focus Area</label>
                        <select
                            value={selectedSubsection}
                            onChange={handleSubsectionChange}
                            disabled={!currentSection}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value="">--- Select Subsection ---</option>
                            {currentSection?.subsections?.map(subsection => (
                                <option key={subsection.id} value={subsection.id}>
                                    {subsection.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">3. Select Skill to Add</label>
                        <select
                            value={selectedSkillItem}
                            onChange={handleSkillItemChange}
                            disabled={!currentSubsection || !currentSubsection.subSubsections || selectedSkills.length >= 10}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value="">
                                {currentSubsection?.subSubsections ? '--- Select Final Skill ---' : 'N/A (Added in Step 2)'}
                            </option>
                            {currentSubsection?.subSubsections?.map(skill => (
                                <option key={skill} value={skill} disabled={selectedSkills.includes(skill)}>
                                    {skill} {selectedSkills.includes(skill) ? '(Added)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {}
            <div className="min-h-[70px] p-4 border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50 transition-all duration-300">
                <h3 className="text-md font-semibold text-gray-800 mb-2">
                    Your Selected Skills ({selectedSkills.length} / 10)
                </h3>
                {selectedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {selectedSkills.map(skill => (
                            <span key={skill} className="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-200 rounded-full flex items-center shadow-sm">
                                {skill}
                                <button
                                    type="button"
                                    onClick={() => handleSkillToggle(skill)}
                                    className="ml-2 text-indigo-600 hover:text-red-700 transition"
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
        </div>
    );
};

const ProfileSetupContent: React.FC = () => {

    const { user, refreshUser } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [formData, setFormData] = useState<ProfileData>({
        name: '',
        bio: '',
        skillsToTeach: [],
        skillsToLearn: [],
        profilePictureUrl: '',
    });

    const [currentAuthName, setCurrentAuthName] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const response = await databases.listDocuments(
                APPWRITE_DB_ID,
                APPWRITE_PROFILES_COLLECTION_ID,
                [
                    Query.equal('userId', userId)
                ]
            );

            if (response.documents.length > 0) {
                const existingProfile = response.documents[0];
                setProfile(existingProfile as unknown as ProfileData);
                setFormData({
                    $id: existingProfile.$id,
                    name: existingProfile.name || '',
                    bio: existingProfile.bio || '',
                    skillsToTeach: existingProfile.skillsToTeach || [],
                    skillsToLearn: existingProfile.skillsToLearn || [],
                    profilePictureUrl: existingProfile.profilePictureUrl || '',
                });
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError('Failed to load profile data.');
        } finally {
            setLoadingProfile(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchProfile(user.$id);

            setCurrentAuthName(user.name || '');
        }
    }, [user, fetchProfile]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        setError(null);
        setFormData(prev => ({ ...prev, profilePictureUrl: '' }));

        try {
            const uploadedFile = await storage.createFile(
                APPWRITE_STORAGE_BUCKET_ID,
                ID.unique(),
                file,
            );

            const filePreviewUrl = client.config.endpoint
                + `/storage/buckets/${APPWRITE_STORAGE_BUCKET_ID}/files/${uploadedFile.$id}/preview?project=${client.config.project}&width=96&height=96&quality=80`;

            setFormData(prev => ({ ...prev, profilePictureUrl: filePreviewUrl }));
        } catch (err) {
            console.error('File upload failed:', err);
            setError('Image upload failed. Check Appwrite bucket permissions.');
            setFormData(prev => ({ ...prev, profilePictureUrl: '' }));
        } finally {
            setUploading(false);
        }
    };


    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setCurrentAuthName(newName);
        setFormData(prev => ({ ...prev, name: newName }));
    };

    const handleNextStep = () => {
        setError(null);
        if (currentStep === 1) {

            if (!formData.name || formData.name.length < 2) {
                setError('Please provide your full name (at least 2 characters).');
                return;
            }

            if (!formData.bio || formData.bio.length < 10) {
                setError('Please provide a bio of at least 10 characters.');
                return;
            }

            if (!formData.profilePictureUrl) {
                setError('A profile picture is required to continue.');
                return;
            }
        }
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        setError(null);
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);


        if (formData.skillsToTeach.length === 0) {
            setError("You must select at least one skill you can teach.");
            setIsSubmitting(false);
            return;
        }
        if (formData.skillsToLearn.length === 0) {
            setError("You must select at least one skill you want to learn.");
            setIsSubmitting(false);
            return;
        }

        try {

            if (user && user.name !== currentAuthName) {
                await account.updateName(currentAuthName);
                await refreshUser();
            }


            const profileDataToSave = {
                userId: user!.$id,
                name: formData.name,
                bio: formData.bio,
                skillsToTeach: formData.skillsToTeach,
                skillsToLearn: formData.skillsToLearn,
                profilePictureUrl: formData.profilePictureUrl,
            };


            const documentPermissions = [

                Permission.read(Role.user(user!.$id)),
                Permission.update(Role.user(user!.$id)),
                Permission.delete(Role.user(user!.$id)),
            ];

            if (profile && profile.$id) {

                await databases.updateDocument(
                    APPWRITE_DB_ID,
                    APPWRITE_PROFILES_COLLECTION_ID,
                    profile.$id,
                    profileDataToSave
                );
            } else {

                await databases.createDocument(
                    APPWRITE_DB_ID,
                    APPWRITE_PROFILES_COLLECTION_ID,
                    ID.unique(),
                    profileDataToSave,
                    documentPermissions
                );
            }

            setSuccess(true);
            setTimeout(() => router.push('/dashboard'), 1500);

        } catch (err) {
            console.error('Profile submission failed:', err);
            setError('Failed to save profile. Please check your Appwrite setup and ensure the "name" column exists in your profile collection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl font-medium text-gray-700">Loading your profile data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
                Advanced Profile Setup
            </h1>

            {}
            <div className="flex justify-between items-center mb-10 p-4 bg-white rounded-xl shadow-lg border-b-4 border-indigo-500/50">
                {STEPS.map(step => (
                    <div key={step.id} className="text-center flex-1">
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-sm ${
                            currentStep === step.id
                                ? 'bg-indigo-500 text-white shadow-xl ring-4 ring-indigo-300'
                                : currentStep > step.id
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                        }`}>
                            {step.id}
                        </div>
                        <p className={`mt-2 text-xs sm:text-sm font-medium ${currentStep === step.id ? 'text-indigo-600' : 'text-gray-500'}`}>
                            {step.name}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 space-y-6">

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                        <p className="font-bold">Error:</p>
                        <p>{error}</p>
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-100 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-lg">
                        <p className="font-bold">Success!</p>
                        <p>Profile saved successfully. Redirecting to dashboard...</p>
                    </div>
                )}

                {}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">1. Basic Information</h2>

                        {}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Your Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleNameChange}
                                required
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="border-b pb-4 flex items-center space-x-6">
                            <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 border-4 border-indigo-400/50 shadow-lg">
                                {uploading ? (
                                    <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs font-semibold animate-pulse bg-gray-300">
                                        Uploading...
                                    </div>
                                ) : formData.profilePictureUrl ? (
                                    <Image
                                        src={formData.profilePictureUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        fill
                                        sizes="100vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl">👤</div>
                                )}

                            </div>

                            <div>
                                {}
                                <h2 className="text-lg font-semibold text-gray-800">Profile Picture <span className="text-red-500">*</span></h2>
                                <label htmlFor="file-upload" className="cursor-pointer bg-indigo-500 text-white text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-600 transition duration-150 inline-block mt-2">
                                    {uploading ? 'Uploading...' : 'Choose Image'}
                                </label>
                                <input id="file-upload" type="file" onChange={handleFileUpload} className="hidden" accept="image/*" disabled={uploading} />
                                <p className="text-xs text-gray-500 mt-2">A photo is required to complete your profile.</p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                                Your Bio <span className="text-red-500">*</span> (Minimum 10 characters)
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                rows={4}
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                required
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                placeholder="I am a software developer interested in learning piano."
                            />
                        </div>
                    </div>
                )}

                {/* --- STEP 2: Skills I Teach --- */}
                {currentStep === 2 && (
                    <SkillPicker
                        skillType="skillsToTeach"
                        formData={formData}
                        setFormData={setFormData}
                        setError={setError}
                    />
                )}

                {}
                {currentStep === 3 && (
                    <SkillPicker
                        skillType="skillsToLearn"
                        formData={formData}
                        setFormData={setFormData}
                        setError={setError}
                    />
                )}


                {}
                <div className="pt-6 flex justify-between border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handlePrevStep}
                        disabled={currentStep === 1 || isSubmitting}
                        className="py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition duration-150 disabled:opacity-50"
                    >
                        &larr; Previous
                    </button>

                    {currentStep < STEPS.length && (
                        <button
                            type="button"
                            onClick={handleNextStep}
                            disabled={isSubmitting}
                            className="py-2 px-6 rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
                        >
                            Next: {STEPS[currentStep].name} &rarr;
                        </button>
                    )}

                    {currentStep === STEPS.length && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="py-2 px-6 rounded-lg shadow-md text-white bg-emerald-600 hover:bg-emerald-700 transition duration-200 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving Profile...' : (profile ? 'Update & Finish' : 'Save & Finish')}
                        </button>
                    )}
                </div>
            </div>

            <div className="text-center mt-6">
                <Link href="/dashboard" className="text-sm text-indigo-500 hover:text-indigo-600 underline">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
};

const ProfileSetupPage: React.FC = () => (
    <ProtectedRoute>
        <ProfileSetupContent />
    </ProtectedRoute>
);

export default ProfileSetupPage;
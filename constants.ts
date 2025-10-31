export const APPWRITE_CONFIG = {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'YOUR_APPWRITE_ENDPOINT_HERE',

    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'YOUR_APPWRITE_PROJECT_ID_HERE',

    databaseId: '68de2d7c003c475d5c24',
    userSkillsCollectionId: 'userskills',

    messagesCollectionId : "messages",
    conversationsCollectionId : "conversations"

};

export const APPWRITE_DB_ID = '68de2d7c003c475d5c24';
export const APPWRITE_PROFILES_COLLECTION_ID = 'profiles';
export const APPWRITE_STORAGE_BUCKET_ID = 'profile';
export const APPWRITE_CONVERSATIONS_COLLECTION_ID = 'conversations';
export const APPWRITE_MESSAGES_COLLECTION_ID = 'messages';
export const APPWRITE_ACTIVITIES_COLLECTION_ID = 'activity'
export const APPWRITE_MEETINGS_COLLECTION_ID = 'meetings';
export const APPWRITE_FUNCTION_ID="690384fe00078b781c5a"


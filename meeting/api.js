import { Client, Functions } from "appwrite";
import {
    APPWRITE_CONFIG,
    APPWRITE_FUNCTION_ID,
} from "@/constants";

const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const functions = new Functions(client);

export const getToken = async () => {
    try {
        const response = await functions.createExecution(
            APPWRITE_FUNCTION_ID,
            '',
            false
        );

        const data = JSON.parse(response.responseBody);

        if (!data.token) throw new Error("Token not found in function response");

        return data.token;
    } catch (err) {
        console.error("Error fetching token from Appwrite function:", err);
        return null;
    }
};

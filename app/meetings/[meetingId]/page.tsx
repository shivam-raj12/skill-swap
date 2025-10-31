'use client';

import { MeetingProvider } from "@videosdk.live/react-sdk";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { MeetingAppProvider } from "@/meeting/MeetingAppContextDef";
import { MeetingContainer } from "@/meeting/meeting/MeetingContainer";
import { LeaveScreen } from "@/meeting/components/screens/LeaveScreen";
import { JoiningScreen } from "@/meeting/components/screens/JoiningScreen";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@/meeting/index.css";
import { useAuth } from "@/hooks/useAuth";
import { useUserDetails } from "@/hooks/useUserDetails";

export default function MeetingSetupPage() {
    const params = useParams();
    const meetingIdFromUrl = params.meetingId as string;

    const { user} = useAuth();
    const { userDetails, isLoading: isProfileLoading } = useUserDetails(user?.$id || null);

    const [token, setToken] = useState("");
    const [meetingId, setMeetingId] = useState(meetingIdFromUrl || "");
    const [participantName, setParticipantName] = useState("");
    const [micOn, setMicOn] = useState(false);
    const [webcamOn, setWebcamOn] = useState(false);
    const [customAudioStream, setCustomAudioStream] = useState(null);
    const [customVideoStream, setCustomVideoStream] = useState(null);
    const [isMeetingStarted, setMeetingStarted] = useState(false);
    const [isMeetingLeft, setIsMeetingLeft] = useState(false);

    const isMobile = typeof window !== 'undefined' && window.matchMedia(
        "only screen and (max-width: 768px)"
    ).matches;

    useEffect(() => {
        if (meetingIdFromUrl) {
            setMeetingId(meetingIdFromUrl);
        }
    }, [meetingIdFromUrl]);

    useEffect(() => {
        if (userDetails?.name) {
            setParticipantName(userDetails.name);
        }
    }, [userDetails]);

    useEffect(() => {
        if (isMobile && typeof window !== 'undefined') {
            window.onbeforeunload = () => {
                return "Are you sure you want to exit?";
            };
        }
    }, [isMobile]);

    const meetingConfig = useMemo(() => ({
        meetingId,
        micEnabled: micOn,
        webcamEnabled: webcamOn,
        name: participantName ? participantName : "TestUser",
        multiStream: true,
        customCameraVideoTrack: customVideoStream,
        customMicrophoneAudioTrack: customAudioStream,
        debugMode: false,
    }), [meetingId, micOn, webcamOn, participantName, customVideoStream, customAudioStream]);

    return (
        <>
            <ToastContainer />
            <MeetingAppProvider>
                {isMeetingStarted ? (
                    <MeetingProvider
                        // @ts-expect-error I don't know fix
                        config={meetingConfig}
                        token={token}
                        reinitialiseMeetingOnConfigChange={true}
                        joinWithoutUserInteraction={true}
                    >
                        <MeetingContainer
                            onMeetingLeave={() => {
                                setToken("");
                                setMeetingId(meetingIdFromUrl || "");
                                setWebcamOn(false);
                                setMicOn(false);
                                setMeetingStarted(false);
                            }}
                            setIsMeetingLeft={setIsMeetingLeft}
                        />
                    </MeetingProvider>
                ) : isMeetingLeft ? (
                    <LeaveScreen setIsMeetingLeft={setIsMeetingLeft} />
                ) : (
                    <JoiningScreen
                        participantName={participantName}
                        setParticipantName={setParticipantName}
                        setMeetingId={setMeetingId}
                        meetingId={meetingId}
                        setToken={setToken}
                        micOn={micOn}
                        setMicOn={setMicOn}
                        webcamOn={webcamOn}
                        setWebcamOn={setWebcamOn}
                        customAudioStream={customAudioStream}
                        setCustomAudioStream={setCustomAudioStream}
                        // @ts-expect-error unknown issue
                        customVideoStream={customVideoStream}
                        setCustomVideoStream={setCustomVideoStream}
                        onClickStartMeeting={() => {
                            setMeetingStarted(true);
                        }}
                        startMeeting={isMeetingStarted}
                        setIsMeetingLeft={setIsMeetingLeft}
                        hideNameInput={true}
                        isLoadingName={isProfileLoading}
                    />
                )}
            </MeetingAppProvider>
        </>
    );
}
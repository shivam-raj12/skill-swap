import { CheckIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { toast } from "react-toastify";

export function MeetingDetailsScreen({
  onClickJoin,
  _handleOnCreateMeeting,
  participantName,
  setParticipantName,
  onClickStartMeeting,
  meetingId: initialMeetingId,
  hideNameInput = false,
  isLoadingName = false,
}) {
  const [meetingId, setMeetingId] = useState(initialMeetingId || "");
  const [meetingIdError, setMeetingIdError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [iscreateMeetingClicked, setIscreateMeetingClicked] = useState(false);
  const [isJoinMeetingClicked, setIsJoinMeetingClicked] = useState(!!initialMeetingId);

  return (
    <div
      className={`flex flex-1 flex-col justify-center w-full md:p-[6px] sm:p-1 p-1.5`}
    >
      {iscreateMeetingClicked ? (
        <div className="border border-solid border-gray-400 rounded-xl px-4 py-3  flex items-center justify-center">
          <p className="text-white text-base">
            {`Meeting code : ${meetingId}`}
          </p>
          <button
            className="ml-2"
            onClick={() => {
              navigator.clipboard.writeText(meetingId);
              setIsCopied(true);
              setTimeout(() => {
                setIsCopied(false);
              }, 3000);
            }}
          >
            {isCopied ? (
              <CheckIcon className="h-5 w-5 text-green-400" />
            ) : (
              <ClipboardIcon className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      ) : isJoinMeetingClicked && !initialMeetingId ? (
        <>
          <input
            defaultValue={meetingId}
            onChange={(e) => {
              setMeetingId(e.target.value);
            }}
            placeholder={"Enter meeting Id"}
            className="px-4 py-3 bg-gray-650 rounded-xl text-white w-full text-center"
          />
          {meetingIdError && (
            <p className="text-xs text-red-600">{`Please enter valid meetingId`}</p>
          )}
        </>
      ) : null}

      {(iscreateMeetingClicked || isJoinMeetingClicked) && (
        <>
          {!hideNameInput && (
            <input
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter your name"
              className="px-4 py-3 mt-5 bg-gray-650 rounded-xl text-white w-full text-center"
            />
          )}
          {hideNameInput && isLoadingName && (
            <div className="px-4 py-3 mt-5 bg-indigo-600 rounded-xl text-white w-full text-center">
              Loading your profile...
            </div>
          )}
          {hideNameInput && !isLoadingName && participantName && (
            <div className="px-4 py-3 mt-5 bg-indigo-600 rounded-xl text-white w-full text-center font-medium">
              Welcome, {participantName}!
            </div>
          )}
          <button
            disabled={hideNameInput ? !participantName : participantName.length < 3}
            className={`w-full ${
              (hideNameInput && !participantName) || (!hideNameInput && participantName.length < 3) 
                ? "bg-gray-650 cursor-not-allowed" 
                : "bg-indigo-600 hover:bg-indigo-700"
              }  text-white px-2 py-3 rounded-xl mt-5 font-medium transition-all duration-200`}
            onClick={(e) => {
              if (iscreateMeetingClicked) {
                onClickStartMeeting();
              } else {
                if (meetingId.match("\\w{4}\\-\\w{4}\\-\\w{4}")) {
                  onClickJoin(meetingId);
                } else setMeetingIdError(true);
              }
            }}
          >
            {iscreateMeetingClicked ? "Start a meeting" : "Join a meeting"}
          </button>
        </>
      )}

      {!iscreateMeetingClicked && !isJoinMeetingClicked && !initialMeetingId && (
        <div className="w-full md:mt-0 mt-4 flex flex-col">
          <div className="flex items-center justify-center flex-col w-full ">
            <button
              className="w-full bg-gray-650 text-white px-2 py-3 rounded-xl"
              onClick={(e) => {
                setIsJoinMeetingClicked(true);
              }}
            >
              Join a meeting
            </button>
          </div>
        </div>
      )}
      
      {initialMeetingId && !iscreateMeetingClicked && (
        <div className="border border-solid border-gray-400 rounded-xl px-4 py-3 mb-5 flex items-center justify-center">
          <p className="text-white text-base">
            {`Meeting ID: ${initialMeetingId}`}
          </p>
        </div>
      )}
    </div>
  );
}

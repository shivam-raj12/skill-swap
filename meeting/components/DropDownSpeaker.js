import { Popover, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Fragment } from 'react'
import React, { useState } from "react";
import DropSpeaker from '../icons/DropDown/DropSpeaker';
import TestSpeaker from '../icons/DropDown/TestSpeaker';
import { useMeetingAppContext } from '../MeetingAppContextDef';

export default function DropDownSpeaker({ speakers }) {

  const {
    setSelectedSpeaker,
    selectedSpeaker,
    isMicrophonePermissionAllowed
  } = useMeetingAppContext()
  const [audioProgress, setAudioProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false)
  const [isHovered, setIsHovered] = useState(false);

  const testSpeakers = () => {
    const selectedSpeakerDeviceId = selectedSpeaker.id
    if (selectedSpeakerDeviceId) {
      const audio = new Audio("/sounds/test_sound.mp3");
      try {
        audio.setSinkId(selectedSpeakerDeviceId)
          .then(() => {
            audio.play();
            setIsPlaying(true)
            audio.addEventListener('timeupdate', () => {
              const progress = (audio.currentTime / audio.duration) * 100;
              setAudioProgress(progress);
            });
            audio.addEventListener('ended', () => {
              setAudioProgress(0);
              setIsPlaying(false)
            });
          })
      } catch (error) {
        console.log(error);
      };
      audio.play().catch(error => {
        console.error('Failed to set sinkId:', error);
      });
    } else {
      console.error('Selected speaker deviceId not found.');
    }
  };

  return (
    <>
      <Popover className="relative w-full">
        {({ open }) => (
          <>
            <Popover.Button
              onMouseEnter={() => { setIsHovered(true) }}
              onMouseLeave={() => { setIsHovered(false) }}
              disabled={!isMicrophonePermissionAllowed}
              className={`focus:outline-none hover:ring-2 hover:ring-indigo-400 hover:bg-indigo-800 
              ${open
                  ? "text-white ring-2 ring-indigo-400 bg-indigo-800"
                  : "text-gray-200 hover:text-white bg-indigo-900 bg-opacity-60"
                }
              group inline-flex items-center rounded-lg px-3 py-2 w-full text-base font-medium shadow-lg
              ${!isMicrophonePermissionAllowed ? "opacity-50" : ""}`}
            >
              <div>
                <DropSpeaker fillColor={isHovered || open ? "#FFF" : "#B4B4B4"} />

              </div>
              <span className=" overflow-hidden whitespace-nowrap overflow-ellipsis flex-1 ml-3 mr-2">
                {isMicrophonePermissionAllowed ? selectedSpeaker?.label : "Permission Needed"}
              </span>
              <ChevronDownIcon
                className={`${open ? 'text-white' : 'text-gray-300 hover:text-white'}
                ml-auto h-5 w-5 transition duration-150 ease-in-out group-hover:text-indigo-300 flex-shrink-0`}
                aria-hidden="true"
              />
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute bottom-full z-10 mt-3 w-full px-4 sm:px-0 pb-2">
                <div className="rounded-lg shadow-2xl">
                  <div className={"bg-indigo-900 border-2 border-indigo-600 rounded-lg"} >
                    <div>
                      <div className="flex flex-col">
                        {speakers.map(
                          (item, index) => {
                            return (
                              item?.kind === "audiooutput" && (
                                <div
                                  key={`speaker_${index}`}
                                  className={` my-1 pl-4 pr-2 text-white text-left flex `} >
                                  <span className="w-6 mr-2 flex items-center justify-center">
                                    {selectedSpeaker?.label === item?.label && (
                                      <CheckIcon className='h-5 w-5' />
                                    )}
                                  </span>
                                  <button
                                    className={`flex flex-1 w-full text-left `}
                                    value={item?.deviceId}
                                    onClick={() => {
                                      setSelectedSpeaker(
                                        (s) => ({
                                          ...s,
                                          id: item?.deviceId,
                                          label: item?.label
                                        })
                                      );
                                    }}
                                  >
                                    {item?.label ? (
                                      <span>{item?.label}</span>
                                    ) : (
                                      <span >{`Speaker ${index + 1}`}</span>
                                    )}
                                  </button>
                                </div>
                              )
                            );
                          }
                        )}
                        {speakers.length && <> <hr className='border border-gray-50 mt-2 mb-1' />
                          <div className={`my-1 pl-4 pr-2 text-white text-left`} >
                            <button
                              className={`flex flex-1 w-full text-left mb-1 pl-1 focus:outline-none`}
                              onClick={testSpeakers}
                            >
                              <span className="mr-3">
                                <TestSpeaker />
                              </span>
                              {isPlaying ? <div className="w-52 mt-2 bg-gray-450 rounded-full h-2 dark:bg-gray-700">
                                <div className="bg-white opacity-50 h-2 rounded-full" style={{ width: `${audioProgress}%` }}></div>
                              </div>
                                : <span>Test Speakers</span>
                              }
                            </button>
                          </div>
                        </>}
                      </div>
                    </div>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </>
  )
}


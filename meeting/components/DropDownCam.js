import { Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Fragment, useState } from 'react'
import React from "react";
import DropCAM from '../icons/DropDown/DropCAM';
import { useMeetingAppContext } from '../MeetingAppContextDef';

export default function DropDownCam({
  webcams,
  changeWebcam
}) {

  const {
    setSelectedWebcam,
    selectedWebcam,
    isCameraPermissionAllowed
  } = useMeetingAppContext()
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <Popover className="relative w-full">
        {({ open }) => (
          <>
            <Popover.Button
              onMouseEnter={() => { setIsHovered(true) }}
              onMouseLeave={() => { setIsHovered(false) }}
              disabled={!isCameraPermissionAllowed}
              className={`focus:outline-none hover:ring-2 hover:ring-indigo-400 hover:bg-indigo-800 
              ${open
                  ? "text-white ring-2 ring-indigo-400 bg-indigo-800"
                  : "text-gray-200 hover:text-white bg-indigo-900 bg-opacity-60"
                }
              group inline-flex items-center rounded-lg px-3 py-2 w-full text-base font-medium shadow-lg
              ${!isCameraPermissionAllowed ? "opacity-50" : ""}`}
            >
              <div>
                <DropCAM fillColor={isHovered || open ? "#FFF" : "#B4B4B4"} />

              </div>
              <span className=" overflow-hidden whitespace-nowrap overflow-ellipsis flex-1 ml-3 mr-2">
                {isCameraPermissionAllowed ? selectedWebcam?.label : "Permission Needed"}
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
                  <div className="bg-indigo-900 border-2 border-indigo-600 rounded-lg">
                    <div>
                      <div className="flex flex-col">
                        {webcams.map(
                          (item, index) => {
                            return (
                              item?.kind === "videoinput" && (
                                <div
                                  key={`webcams_${index}`}
                                  className={` my-1 pl-4 pr-2 text-white text-left flex`}
                                >
                                  <span className="w-6 mr-2 flex items-center justify-center">
                                    {selectedWebcam?.label === item?.label && (
                                      <CheckIcon className='h-5 w-5' />
                                    )}
                                  </span>
                                  <button
                                    className={`flex flex-1 w-full text-left`}
                                    value={item?.deviceId}
                                    onClick={() => {
                                      setSelectedWebcam(
                                        (s) => ({
                                          ...s,
                                          id: item?.deviceId,
                                          label: item?.label
                                        })
                                      );
                                      changeWebcam(item?.deviceId);
                                    }}
                                  >
                                    {item?.label ? (
                                      <span>{item?.label}</span>
                                    ) : (
                                      <span >{`Webcam ${index + 1}`}</span>
                                    )}
                                  </button>
                                </div>
                              )
                            );
                          }
                        )}
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


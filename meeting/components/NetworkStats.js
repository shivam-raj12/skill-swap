import UploadIcon from "../icons/NetworkStats/UploadIcon";
import DownloadIcon from "../icons/NetworkStats/DownloadIcon";
import RefreshIcon from "../icons/NetworkStats/RefreshIcon";
import RefreshCheck from "../icons/NetworkStats/RefreshCheck";
import { getNetworkStats } from "@videosdk.live/react-sdk";
import WifiOff from "../icons/NetworkStats/WifiOff";
import { useEffect, useState } from "react";
import useIsMobile from "../hooks/useIsMobile";

const NetworkStats = () => {
    const [error, setError] = useState("no-error-loading");
    const [uploadSpeed, setUploadSpeed] = useState(null);
    const [downloadSpeed, setDownloadSpeed] = useState(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        getNetworkStatistics();
    }, []);

    const getNetworkStatistics = async () => {
        setError("no-error-loading");
        try {
            const options = { timeoutDuration: 45000 };
            const networkStats = await getNetworkStats(options);
            if (networkStats) {
                setError("no-error");
                setDownloadSpeed(networkStats["downloadSpeed"]);
                setUploadSpeed(networkStats["uploadSpeed"]);
            }
        } catch (ex) {
            if (ex === "Not able to get NetworkStats due to no Network") {
                setError("no-wifi");
            } else if (ex === "Not able to get NetworkStats due to timeout") {
                setError("timeout");
            }
            console.log("Error in networkStats: ", ex);
        }
    };

    const handleOnClick = () => {
        getNetworkStatistics();
    };

    return (
        <div className="relative z-10"> {/* Added relative for potential absolute positioned tooltips */}
            <div className="flex flex-row items-center border border-gray-700/50 rounded-lg bg-gray-900/70 backdrop-blur-sm shadow-xl h-10 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl">

                {/* Loading State */}
                {error === "no-error-loading" && (
                    <div className="inline-flex items-center space-x-2 text-sm text-indigo-300 font-semibold px-4 py-2 animate-pulse">
                        <RefreshCheck className="h-4 w-4 text-indigo-400 animate-spin" />
                        <span className={`${isMobile ? "hidden sm:block" : ""}`}>Checking Speed...</span>
                    </div>
                )}

                {/* Good Connection State */}
                {error === "no-error" && (
                    <>
                        <div className={`inline-flex items-center space-x-2 text-sm text-emerald-400 font-medium px-3 py-2 ${!isMobile && "min-w-[120px]"}`}>
                            <DownloadIcon className="h-4 w-4 text-emerald-500" />
                            <span className="truncate">{downloadSpeed} MBPS</span>
                        </div>
                        <div className="w-[1px] h-full bg-gray-700/50"></div> {/* Divider */}
                        <div className={`inline-flex items-center space-x-2 text-sm text-blue-400 font-medium px-3 py-2 ${!isMobile && "min-w-[120px]"}`}>
                            <UploadIcon className="h-4 w-4 text-blue-500" />
                            <span className="truncate">{uploadSpeed} MBPS</span>
                        </div>
                        <div className="w-[1px] h-full bg-gray-700/50"></div> {/* Divider */}
                        <button
                            onClick={handleOnClick}
                            className="flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors duration-200 rounded-r-lg group"
                            title="Refresh Network Stats"
                        >
                            <RefreshIcon className="h-5 w-5 group-hover:rotate-180 transition-transform duration-300" />
                        </button>
                    </>
                )}

                {/* No Wi-Fi State */}
                {error === "no-wifi" && (
                    <>
                        <div className="inline-flex items-center space-x-2 text-sm text-red-400 font-semibold px-4 py-2">
                            <WifiOff className="h-5 w-5 text-red-500" />
                            <span className={`${isMobile ? "text-xs" : ""}`}>Offline!</span>
                        </div>
                        <div className="w-[1px] h-full bg-gray-700/50"></div> {/* Divider */}
                        <button
                            onClick={handleOnClick}
                            className="flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors duration-200 rounded-r-lg group"
                            title="Retry Connection"
                        >
                            <RefreshIcon className="h-5 w-5 group-hover:rotate-180 transition-transform duration-300" />
                        </button>
                    </>
                )}

                {/* Timeout State */}
                {error === "timeout" && (
                    <>
                        <div className="inline-flex items-center space-x-2 text-sm text-yellow-400 font-semibold px-4 py-2">
                            <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <span className={`${isMobile ? "text-xs" : ""}`}>Failed to load!</span>
                        </div>
                        <div className="w-[1px] h-full bg-gray-700/50"></div> {/* Divider */}
                        <button
                            onClick={handleOnClick}
                            className="flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors duration-200 rounded-r-lg group"
                            title="Retry Loading"
                        >
                            <RefreshIcon className="h-5 w-5 group-hover:rotate-180 transition-transform duration-300" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default NetworkStats;
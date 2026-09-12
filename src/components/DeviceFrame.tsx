import React from "react";
import { DeviceMode } from "../types";
import { Wifi, Battery, Signal } from "lucide-react";

interface DeviceFrameProps {
  deviceMode: DeviceMode;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ deviceMode, children }) => {
  if (deviceMode === "responsive") {
    return <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</div>;
  }

  if (deviceMode === "ios") {
    return (
      <div className="py-8 flex flex-col items-center justify-center bg-slate-100 min-h-[calc(100vh-8rem)]">
        <div className="text-center mb-3">
          <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
             iOS Preview (iPhone 16 Pro • Flutter Target)
          </span>
        </div>
        <div className="relative w-[390px] h-[820px] bg-black rounded-[52px] p-3 shadow-2xl border-[4px] border-slate-800 ring-1 ring-slate-900/40 flex flex-col overflow-hidden">
          {/* Bezel & Dynamic Island */}
          <div className="relative bg-white w-full h-full rounded-[42px] overflow-hidden flex flex-col">
            {/* Status Bar */}
            <div className="h-12 bg-white flex items-center justify-between px-7 shrink-0 text-slate-900 z-20">
              <span className="text-xs font-semibold">9:41</span>
              {/* Dynamic Island */}
              <div className="w-24 h-6 bg-black rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2" />
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-950" />
              </div>
              <div className="flex items-center gap-1.5 text-slate-900">
                <Signal className="w-3.5 h-3.5" />
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4 fill-slate-900" />
              </div>
            </div>

            {/* Viewport Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 bg-slate-50">
              {children}
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="h-5 bg-white flex items-center justify-center shrink-0">
              <div className="w-32 h-1 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android Pixel 9
  return (
    <div className="py-8 flex flex-col items-center justify-center bg-slate-100 min-h-[calc(100vh-8rem)]">
      <div className="text-center mb-3">
        <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
          🤖 Android Preview (Google Pixel 9 • Flutter Target)
        </span>
      </div>
      <div className="relative w-[392px] h-[830px] bg-slate-900 rounded-[44px] p-2.5 shadow-2xl border-[3px] border-slate-700 flex flex-col overflow-hidden">
        <div className="relative bg-white w-full h-full rounded-[38px] overflow-hidden flex flex-col">
          {/* Android Status Bar */}
          <div className="h-9 bg-white flex items-center justify-between px-6 shrink-0 text-slate-800 z-20">
            <span className="text-xs font-medium">10:00</span>
            {/* Front Camera Hole */}
            <div className="w-3.5 h-3.5 rounded-full bg-black" />
            <div className="flex items-center gap-2 text-slate-700">
              <Wifi className="w-3.5 h-3.5" />
              <Signal className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">85%</span>
            </div>
          </div>

          {/* Viewport Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 bg-slate-50">
            {children}
          </div>

          {/* Android Gesture Navigation Pill */}
          <div className="h-4 bg-white flex items-center justify-center shrink-0">
            <div className="w-24 h-1 bg-slate-400 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { Sparkles, Smartphone, Monitor, Tablet, Code2, Layers } from "lucide-react";
import { DeviceMode, PipelineMode } from "../types";

interface HeaderProps {
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  activeMode: PipelineMode;
  setActiveMode: (mode: PipelineMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  deviceMode,
  setDeviceMode,
  activeMode,
  setActiveMode,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Omni AI Studio
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                Flutter Cross-Platform
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">
              Image • Video • Translation • Q&A Multimodal Suite
            </p>
          </div>
        </div>

        {/* Device Mode Switcher (Web / iOS / Android) */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs">
            <button
              id="device-mode-responsive"
              onClick={() => setDeviceMode("responsive")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                deviceMode === "responsive"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Responsive Web Canvas"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Web Canvas</span>
            </button>
            <button
              id="device-mode-ios"
              onClick={() => setDeviceMode("ios")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                deviceMode === "ios"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="iPhone 16 Pro Mockup"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">iOS</span>
            </button>
            <button
              id="device-mode-android"
              onClick={() => setDeviceMode("android")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                deviceMode === "android"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Pixel 9 Mockup"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Android</span>
            </button>
          </div>

          {/* Flutter Multiplatform Export Button */}
          <button
            id="open-flutter-export"
            onClick={() => setActiveMode("flutter-export")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              activeMode === "flutter-export"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>Flutter Code</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Film,
  Languages,
  MessageSquareText,
  Code2,
  Clapperboard,
} from "lucide-react";
import { PipelineMode } from "../types";

interface NavigationProps {
  activeMode: PipelineMode;
  setActiveMode: (mode: PipelineMode) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeMode,
  setActiveMode,
}) => {
  const tabs = [
    {
      id: "text-to-image" as PipelineMode,
      label: "Text → Image",
      icon: Sparkles,
      badge: "GenAI",
    },
    {
      id: "image-to-image" as PipelineMode,
      label: "Image → Image",
      icon: ImageIcon,
      badge: "Transform",
    },
    {
      id: "image-to-video" as PipelineMode,
      label: "Image → Video",
      icon: Film,
      badge: "Animate",
    },
    {
      id: "video-to-video" as PipelineMode,
      label: "Video → Video",
      icon: Clapperboard,
      badge: "Remix",
    },
    {
      id: "text-to-video" as PipelineMode,
      label: "Text → Video",
      icon: Video,
      badge: "Cinematic",
    },
    {
      id: "translation" as PipelineMode,
      label: "100+ Languages",
      icon: Languages,
      badge: "Google",
    },
    {
      id: "qa" as PipelineMode,
      label: "AI Q&A",
      icon: MessageSquareText,
      badge: "Vision",
    },
    {
      id: "flutter-export" as PipelineMode,
      label: "Flutter App",
      icon: Code2,
      badge: "iOS/And/Web",
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-16 z-30 overflow-x-auto no-scrollbar shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveMode(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 whitespace-nowrap ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  isActive
                    ? "bg-slate-800 text-cyan-300"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

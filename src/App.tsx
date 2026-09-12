import React, { useState } from "react";
import { PipelineMode, DeviceMode } from "./types";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { DeviceFrame } from "./components/DeviceFrame";
import { TextToImageView } from "./components/TextToImageView";
import { ImageToImageView } from "./components/ImageToImageView";
import { VideoStudioView } from "./components/VideoStudioView";
import { TranslationView } from "./components/TranslationView";
import { MultimodalQAView } from "./components/MultimodalQAView";
import { FlutterExportModal } from "./components/FlutterExportModal";

export default function App() {
  const [activeMode, setActiveMode] = useState<PipelineMode>("text-to-image");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("responsive");

  // Cross-pipeline handoff state
  const [videoHandoff, setVideoHandoff] = useState<{
    mode: "text-to-video" | "image-to-video" | "video-to-video";
    image: string | null;
    prompt: string;
  }>({
    mode: "text-to-video",
    image: null,
    prompt: "",
  });

  const [img2imgHandoff, setImg2imgHandoff] = useState<string | null>(null);

  const handleSendToVideo = (imageUrl: string, promptText: string) => {
    setVideoHandoff({
      mode: "image-to-video",
      image: imageUrl,
      prompt: `Animate this scene with cinematic camera movement: ${promptText}`,
    });
    setActiveMode("image-to-video");
  };

  const handleSendToImg2Img = (imageUrl: string) => {
    setImg2imgHandoff(imageUrl);
    setActiveMode("image-to-image");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased">
      {/* Top App Bar with Device Mode & Flutter export */}
      <Header
        deviceMode={deviceMode}
        setDeviceMode={setDeviceMode}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
      />

      {/* Multimodal Pipeline Navigation Bar */}
      <Navigation activeMode={activeMode} setActiveMode={setActiveMode} />

      {/* Main Content framed by chosen device mode (Responsive, iOS, or Android) */}
      <main className="flex-1">
        <DeviceFrame deviceMode={deviceMode}>
          {activeMode === "text-to-image" && (
            <TextToImageView
              onSendToVideo={handleSendToVideo}
              onSendToImg2Img={handleSendToImg2Img}
            />
          )}

          {activeMode === "image-to-image" && (
            <ImageToImageView
              initialImage={img2imgHandoff}
              onSendToVideo={handleSendToVideo}
            />
          )}

          {activeMode === "image-to-video" && (
            <VideoStudioView
              initialMode="image-to-video"
              initialImage={videoHandoff.image}
              initialPrompt={videoHandoff.prompt}
            />
          )}

          {activeMode === "video-to-video" && (
            <VideoStudioView
              initialMode="video-to-video"
              initialPrompt="Re-render this video in high-definition cyberpunk anime style with neon glow"
            />
          )}

          {activeMode === "text-to-video" && (
            <VideoStudioView
              initialMode="text-to-video"
              initialPrompt="A hyper-realistic cinematic tracking shot of an astronaut walking on Mars during a solar flare"
            />
          )}

          {activeMode === "translation" && <TranslationView />}

          {activeMode === "qa" && <MultimodalQAView />}

          {activeMode === "flutter-export" && <FlutterExportModal />}
        </DeviceFrame>
      </main>
    </div>
  );
}

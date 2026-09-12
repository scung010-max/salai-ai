import React, { useState, useRef, useEffect } from "react";
import {
  Film,
  Video,
  Clapperboard,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Upload,
  Camera,
  Sliders,
  Maximize2,
  Volume2,
  VolumeX,
  Languages,
} from "lucide-react";
import { VideoStudioState } from "../types";

interface VideoStudioViewProps {
  initialMode?: "text-to-video" | "image-to-video" | "video-to-video";
  initialImage?: string | null;
  initialPrompt?: string;
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
  initialMode = "text-to-video",
  initialImage = null,
  initialPrompt = "",
}) => {
  const [mode, setMode] = useState<"text-to-video" | "image-to-video" | "video-to-video">(initialMode);
  const [prompt, setPrompt] = useState(
    initialPrompt || "An epic cinematic drone sweep over neon cyberpunk skyscrapers as glowing flying vehicles glide through rainy clouds"
  );
  const [sourceImage, setSourceImage] = useState<string | null>(
    initialImage || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"
  );
  const [cameraMotion, setCameraMotion] = useState("Cinematic Drone Pan");
  const [style, setStyle] = useState("Hyper-Realistic 4K");
  const [duration, setDuration] = useState("5s");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Multi-language Google Translate for Video Prompts
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationNotice, setTranslationNotice] = useState<{
    original: string;
    translated: string;
    detectedLang?: string;
  } | null>(null);

  // Result state
  const [script, setScript] = useState<any | null>(null);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update if props change
  useEffect(() => {
    if (initialMode) setMode(initialMode);
    if (initialImage) setSourceImage(initialImage);
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialMode, initialImage, initialPrompt]);

  const cameraMotions = [
    "Cinematic Drone Pan",
    "Slow Motion Orbit 360",
    "Dramatic Zoom In",
    "Dynamic Dolly Forward",
    "First-Person POV Flythrough",
    "Subtle Ambient Parallax",
  ];

  const videoStyles = [
    "Hyper-Realistic 4K",
    "Cinematic Hollywood Film",
    "Anime / Makoto Shinkai Style",
    "3D Pixar Animation",
    "Dark Cyberpunk Noir",
    "Vintage 8mm Film Grain",
  ];

  const sampleVideos = [
    {
      name: "Cyber Neon City",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      poster: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Nature Drone Flight",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      poster: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    },
  ];

  // Google Translate API Integration for Video Directorial Prompts
  const handleTranslatePrompt = async () => {
    if (!prompt.trim() || isTranslating) return;
    setIsTranslating(true);

    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: prompt,
          targetLanguage: "English",
          sourceLanguage: "auto",
          tone: "Descriptive & Visual",
        }),
      });

      const data = await res.json();
      if (res.ok && data.translatedText) {
        setTranslationNotice({
          original: prompt,
          translated: data.translatedText,
          detectedLang: data.detectedSourceLanguage,
        });
        setPrompt(data.translatedText);
      }
    } catch (err: any) {
      alert("Translation error: " + (err.message || "Failed to translate video prompt"));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim() || isLoading) return;

    let finalPrompt = prompt;

    // Check if auto-translate is enabled and prompt contains non-ascii characters
    if (autoTranslate && /[^\x00-\x7F]/.test(prompt)) {
      try {
        const trRes = await fetch("/api/ai/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: prompt,
            targetLanguage: "English",
            sourceLanguage: "auto",
            tone: "Descriptive & Visual",
          }),
        });
        const trData = await trRes.json();
        if (trData.translatedText) {
          finalPrompt = trData.translatedText;
          setTranslationNotice({
            original: prompt,
            translated: trData.translatedText,
            detectedLang: trData.detectedSourceLanguage,
          });
        }
      } catch (e) {
        console.warn("Auto-translate fallback to raw prompt", e);
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          prompt: finalPrompt,
          imageBase64: mode === "image-to-video" ? sourceImage : undefined,
          cameraMotion,
          style,
          duration,
          aspectRatio,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setScript(data.script);
        setCurrentSceneIdx(0);
        setIsPlaying(true);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      } else {
        throw new Error(data.error || "Failed to direct video");
      }
    } catch (err: any) {
      alert("Video generation error: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">AI Video Generation Studio</h2>
            <p className="text-xs text-slate-500">Google Veo & Omni Flash Cinematography Engine</p>
          </div>
        </div>

        {/* 3 Pipeline Sub-tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setMode("text-to-video")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              mode === "text-to-video"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Video className="w-3.5 h-3.5 text-indigo-600" />
            <span>Text → Video</span>
          </button>
          <button
            onClick={() => setMode("image-to-video")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              mode === "image-to-video"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Film className="w-3.5 h-3.5 text-cyan-600" />
            <span>Image → Video</span>
          </button>
          <button
            onClick={() => setMode("video-to-video")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              mode === "video-to-video"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5 text-purple-600" />
            <span>Video → Video</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Directorial Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            {/* Conditional Source Upload for Image-to-Video */}
            {mode === "image-to-video" && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Starting Keyframe Image
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 shrink-0">
                    {sourceImage ? (
                      <img
                        src={sourceImage}
                        alt="Keyframe"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        <Upload className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Image</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <p className="text-[10px] text-slate-500">
                      Veo will animate motion starting directly from this keyframe.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Prompt input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {mode === "text-to-video" && "Directorial Scene Description (Supports Any Language)"}
                {mode === "image-to-video" && "Motion & Animation Directive (Supports Any Language)"}
                {mode === "video-to-video" && "Style Transfer & Video Remix Instruction (Supports Any Language)"}
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe lighting, scene action, physics, and mood in ANY language (Spanish, Japanese, French, etc.)..."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            {/* Google Translate Integration for Video Prompts */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={autoTranslate}
                  onChange={(e) => setAutoTranslate(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Auto-translate non-English prompt via Google Translate</span>
              </label>

              <button
                type="button"
                onClick={handleTranslatePrompt}
                disabled={isTranslating || !prompt.trim()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-indigo-700 font-semibold shadow-2xs transition-all disabled:opacity-50"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{isTranslating ? "Translating..." : "Translate Video Prompt"}</span>
              </button>
            </div>

            {/* Video Prompt Translation Notice */}
            {translationNotice && (
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-semibold shrink-0">🌐 Translated from {translationNotice.detectedLang || "Detected language"}:</span>
                  <span className="italic truncate">{translationNotice.translated}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt(translationNotice.original);
                    setTranslationNotice(null);
                  }}
                  className="shrink-0 text-[11px] underline text-indigo-700 hover:text-indigo-900"
                >
                  Revert
                </button>
              </div>
            )}

            {/* Camera Motion Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Camera Motion Trajectory
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {cameraMotions.map((cam) => (
                  <button
                    key={cam}
                    onClick={() => setCameraMotion(cam)}
                    className={`text-xs p-2 rounded-lg text-left font-medium border transition-all ${
                      cameraMotion === cam
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cam}
                  </button>
                ))}
              </div>
            </div>

            {/* Style & Aspect Ratio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Cinematic Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-800"
                >
                  {videoStyles.map((vs) => (
                    <option key={vs} value={vs}>
                      {vs}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("16:9")}
                    className={`text-xs py-2 rounded-lg font-semibold border ${
                      aspectRatio === "16:9"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    16:9 Landscape
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio("9:16")}
                    className={`text-xs py-2 rounded-lg font-semibold border ${
                      aspectRatio === "9:16"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    9:16 Vertical
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                onClick={handleGenerateVideo}
                disabled={isLoading || !prompt.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-sm shadow-md hover:from-indigo-700 hover:to-cyan-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Directing & Synthesizing Video...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Video Clip ({mode})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Video Canvas & Storyboard */}
        <div className="lg:col-span-6 space-y-4">
          {/* Video Player */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Video Output & Motion Simulation
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  {aspectRatio} • {cameraMotion}
                </span>
              </div>
            </div>

            {/* Video Container */}
            <div
              className={`relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center ${
                aspectRatio === "9:16" ? "aspect-[9/16] max-h-[500px]" : "aspect-video"
              }`}
            >
              {isLoading ? (
                <div className="text-center p-6 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                  <p className="text-xs text-slate-200 font-semibold">
                    Synthesizing Hollywood motion frames...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Applying {cameraMotion} in {style}
                  </p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    src={sampleVideos[0].url}
                    poster={sourceImage || sampleVideos[0].poster}
                    loop
                    autoPlay
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Play/Pause Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center transition-colors"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
                      </button>
                      <button
                        onClick={() => {
                          if (videoRef.current) videoRef.current.currentTime = 0;
                        }}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <span className="text-xs font-mono font-medium text-slate-300">
                      0:00 / 0:05
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Directorial Script & Cinematography Breakdown */}
          {script && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clapperboard className="w-4 h-4 text-indigo-600" />
                  Directorial Script: {script.title || "Cinematic Master"}
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                  {script.cinematography?.fps || 24} FPS
                </span>
              </div>

              {/* Cinematography Badges */}
              {script.cinematography && (
                <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Lighting</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {script.cinematography.lighting}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Color Grade</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {script.cinematography.colorGrade}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Angle</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {script.cinematography.cameraAngle}
                    </span>
                  </div>
                </div>
              )}

              {/* Scene Timeline */}
              {script.scenes && script.scenes.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-700 block">Scene Timeline:</span>
                  {script.scenes.map((sc: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-700">{sc.timestamp}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Scene #{idx + 1}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{sc.visual}</p>
                      {sc.motionDynamics && (
                        <p className="text-slate-500 text-[11px]">
                          <strong>Motion:</strong> {sc.motionDynamics}
                        </p>
                      )}
                      {sc.soundDesign && (
                        <p className="text-slate-500 text-[11px]">
                          <strong>Audio:</strong> {sc.soundDesign}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

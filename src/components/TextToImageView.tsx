import React, { useState } from "react";
import {
  Sparkles,
  Download,
  Share2,
  Film,
  RefreshCw,
  Sliders,
  History,
  Check,
  Layers,
  Languages,
} from "lucide-react";
import { TextToImageState, PipelineMode } from "../types";

interface TextToImageViewProps {
  onSendToVideo: (imageUrl: string, prompt: string) => void;
  onSendToImg2Img: (imageUrl: string) => void;
}

export const TextToImageView: React.FC<TextToImageViewProps> = ({
  onSendToVideo,
  onSendToImg2Img,
}) => {
  const [state, setState] = useState<TextToImageState>({
    prompt: "A futuristic cyberpunk floating sanctuary above neon clouds, cinematic lighting, ultra-detailed 8k octane render",
    style: "Cinematic Film",
    aspectRatio: "16:9",
    isLoading: false,
    resultUrl: null,
    modelUsed: undefined,
    history: [],
  });

  const [copied, setCopied] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [translationNotice, setTranslationNotice] = useState<{
    original: string;
    translated: string;
    detectedLang?: string;
  } | null>(null);

  const stylePresets = [
    "Cinematic Film",
    "Photorealistic",
    "Anime / Manga",
    "3D Digital Render",
    "Cyberpunk Neon",
    "Oil Painting",
    "Minimalist Vector",
    "Fantasy Concept Art",
  ];

  const aspectRatios: Array<{ id: TextToImageState["aspectRatio"]; label: string; desc: string }> = [
    { id: "16:9", label: "16:9", desc: "Landscape Video" },
    { id: "1:1", label: "1:1", desc: "Square Post" },
    { id: "9:16", label: "9:16", desc: "Mobile Story" },
    { id: "4:3", label: "4:3", desc: "Photo Standard" },
    { id: "3:4", label: "3:4", desc: "Portrait" },
  ];

  const promptIdeas = [
    "Cyberpunk neon street at twilight with reflective rain puddles",
    "Hyper-realistic portrait of an astronaut floating in deep cosmos",
    "Cozy anime coffee shop interior with soft sunlight streaming in",
    "Surreal isometric crystal floating island with waterfalls",
    "Majestic phoenix rising from glowing embers, intricate feathers",
  ];

  // Google Translate API Integration for Prompt
  const handleTranslatePrompt = async () => {
    if (!state.prompt.trim() || isTranslating) return;
    setIsTranslating(true);

    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: state.prompt,
          targetLanguage: "English",
          sourceLanguage: "auto",
          tone: "Descriptive & Visual",
        }),
      });

      const data = await res.json();
      if (res.ok && data.translatedText) {
        setTranslationNotice({
          original: state.prompt,
          translated: data.translatedText,
          detectedLang: data.detectedSourceLanguage,
        });
        setState((prev) => ({ ...prev, prompt: data.translatedText }));
      }
    } catch (err: any) {
      alert("Translation error: " + (err.message || "Failed to translate prompt"));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerate = async () => {
    if (!state.prompt.trim() || state.isLoading) return;

    let finalPrompt = state.prompt;

    // Check if auto-translate is enabled and prompt contains non-ascii or non-English characters
    if (autoTranslate && /[^\x00-\x7F]/.test(state.prompt)) {
      try {
        const trRes = await fetch("/api/ai/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: state.prompt,
            targetLanguage: "English",
            sourceLanguage: "auto",
            tone: "Descriptive & Visual",
          }),
        });
        const trData = await trRes.json();
        if (trData.translatedText) {
          finalPrompt = trData.translatedText;
          setTranslationNotice({
            original: state.prompt,
            translated: trData.translatedText,
            detectedLang: trData.detectedSourceLanguage,
          });
        }
      } catch (e) {
        console.warn("Auto-translate fallback to raw prompt", e);
      }
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch("/api/ai/text-to-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          style: state.style,
          aspectRatio: state.aspectRatio,
        }),
      });

      const data = await response.json();
      if (response.ok && data.imageUrl) {
        const newEntry = {
          id: Math.random().toString(36).substring(2, 9),
          prompt: finalPrompt,
          style: state.style,
          aspectRatio: state.aspectRatio,
          imageUrl: data.imageUrl,
          timestamp: Date.now(),
        };

        setState((prev) => ({
          ...prev,
          isLoading: false,
          resultUrl: data.imageUrl,
          modelUsed: data.modelUsed,
          feedback: data.feedback,
          history: [newEntry, ...prev.history],
        }));
      } else {
        throw new Error(data.error || "Failed to generate image");
      }
    } catch (err: any) {
      alert("Generation error: " + (err.message || "Unknown error occurred"));
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDownload = () => {
    if (!state.resultUrl) return;
    const link = document.createElement("a");
    link.href = state.resultUrl;
    link.download = `omni-gen-${Date.now()}.png`;
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(state.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Pipeline Badge */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">Text → Image Synthesis</h2>
              <span className="text-[11px] font-semibold bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full border border-cyan-200">
                Gemini Nano Banana / Imagen
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Generate ultra-sharp images, concept art, and photorealistic visuals from descriptive natural language.
            </p>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <textarea
              id="text-to-image-prompt"
              rows={3}
              value={state.prompt}
              onChange={(e) => setState((prev) => ({ ...prev, prompt: e.target.value }))}
              placeholder="Describe what you want to create in ANY language (Spanish, Japanese, French, Hindi, etc.)..."
              className="w-full rounded-xl border border-slate-300 p-3.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Google Translate Prompt Integration Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Auto-translate non-English prompts via Google Translate</span>
            </label>

            <button
              type="button"
              onClick={handleTranslatePrompt}
              disabled={isTranslating || !state.prompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-indigo-700 font-semibold shadow-2xs transition-all disabled:opacity-50"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{isTranslating ? "Translating..." : "Translate Prompt to English"}</span>
            </button>
          </div>

          {/* Translation Notification Card */}
          {translationNotice && (
            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold shrink-0">🌐 Translated from {translationNotice.detectedLang || "Detected language"}:</span>
                <span className="italic truncate">{translationNotice.translated}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setState((prev) => ({ ...prev, prompt: translationNotice.original }));
                  setTranslationNotice(null);
                }}
                className="shrink-0 text-[11px] underline text-indigo-700 hover:text-indigo-900"
              >
                Revert
              </button>
            </div>
          )}

          {/* Prompt Inspiration Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Try inspiration:</span>
            {promptIdeas.slice(0, 3).map((idea, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setState((prev) => ({ ...prev, prompt: idea }))}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors truncate max-w-[280px]"
              >
                {idea}
              </button>
            ))}
          </div>

          {/* Style & Aspect Ratio Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Style Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Artistic Style Preset
              </label>
              <div className="flex flex-wrap gap-1.5">
                {stylePresets.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setState((prev) => ({ ...prev, style: s }))}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                      state.style === s
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {aspectRatios.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setState((prev) => ({ ...prev, aspectRatio: ar.id }))}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      state.aspectRatio === ar.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs font-bold">{ar.label}</div>
                    <div className="text-[9px] opacity-75 truncate">{ar.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex justify-end">
            <button
              id="generate-image-btn"
              onClick={handleGenerate}
              disabled={state.isLoading || !state.prompt.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold text-sm shadow-md hover:from-indigo-700 hover:to-cyan-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {state.isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Image</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {state.resultUrl && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Output Image
              </span>
              {state.modelUsed && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                  {state.modelUsed}
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1 font-medium transition-colors"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save</span>
              </button>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1 font-medium transition-colors"
                title="Copy Prompt"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Prompt"}</span>
              </button>
            </div>
          </div>

          {/* Visual Container */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[550px] border border-slate-800">
            <img
              src={state.resultUrl}
              alt={state.prompt}
              referrerPolicy="no-referrer"
              className="max-h-[550px] w-auto max-w-full object-contain"
            />
          </div>

          {/* Pipeline Bridge Buttons */}
          <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-indigo-950 font-medium">
              Take this image further in the multimodal suite:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSendToVideo(state.resultUrl!, state.prompt)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Animate (Image → Video)</span>
              </button>
              <button
                onClick={() => onSendToImg2Img(state.resultUrl!)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Transform (Image → Image)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Grid */}
      {state.history.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">Recent Creations</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {state.history.map((item) => (
              <div
                key={item.id}
                onClick={() => setState((prev) => ({ ...prev, resultUrl: item.imageUrl, prompt: item.prompt }))}
                className="group relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer aspect-video hover:ring-2 hover:ring-indigo-500 transition-all"
              >
                <img
                  src={item.imageUrl}
                  alt={item.prompt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                  <p className="text-[10px] text-white font-medium line-clamp-2">{item.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

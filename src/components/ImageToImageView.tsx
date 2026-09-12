import React, { useState, useRef } from "react";
import {
  Layers,
  Upload,
  Sparkles,
  ArrowRight,
  Download,
  Film,
  RefreshCw,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";
import { ImageToImageState } from "../types";

interface ImageToImageViewProps {
  initialImage?: string | null;
  onSendToVideo: (imageUrl: string, prompt: string) => void;
}

export const ImageToImageView: React.FC<ImageToImageViewProps> = ({
  initialImage,
  onSendToVideo,
}) => {
  const [state, setState] = useState<ImageToImageState>({
    sourceImage: initialImage || "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
    prompt: "Reimagine this landscape in vibrant Studio Ghibli watercolor anime style with glowing lanterns and cherry blossom petals",
    style: "Anime Watercolor",
    intensity: 80,
    isLoading: false,
    resultUrl: null,
    notes: undefined,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sampleImages = [
    {
      name: "Mountain Lake",
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Cyber City",
      url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Portrait",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Cute Pet",
      url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const stylePresets = [
    "Anime Watercolor",
    "Cyberpunk Neon",
    "3D Claymation",
    "Oil Painting / Impasto",
    "Steampunk Vintage",
    "Pencil Sketch & Charcoal",
    "Synthwave 80s Retro",
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setState((prev) => ({
        ...prev,
        sourceImage: reader.result as string,
        resultUrl: null,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleTransform = async () => {
    if (!state.sourceImage || !state.prompt.trim() || state.isLoading) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch("/api/ai/image-to-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: state.sourceImage,
          prompt: state.prompt,
          style: state.style,
        }),
      });

      const data = await response.json();
      if (response.ok && data.imageUrl) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          resultUrl: data.imageUrl,
          notes: data.notes,
          modelUsed: data.modelUsed,
        }));
      } else {
        throw new Error(data.error || "Failed to transform image");
      }
    } catch (err: any) {
      alert("Transformation error: " + (err.message || "Unknown error"));
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDownload = () => {
    if (!state.resultUrl) return;
    const link = document.createElement("a");
    link.href = state.resultUrl;
    link.download = `transformed-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
            <Layers className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">Image → Image Transformation</h2>
          <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
            Multimodal Style Transfer
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Take any starting photo or illustration and instruct Gemini to alter style, re-light, add elements, or completely reimagine it.
        </p>

        {/* Input Form */}
        <div className="mt-4 space-y-4">
          {/* Source Image Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              1. Choose or Upload Source Image
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Upload Card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center aspect-video sm:aspect-auto"
              >
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-700">Upload Photo</span>
                <span className="text-[10px] text-slate-400">PNG, JPG, WebP</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Sample Images */}
              {sampleImages.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => setState((prev) => ({ ...prev, sourceImage: s.url, resultUrl: null }))}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all aspect-video sm:aspect-auto ${
                    state.sourceImage === s.url
                      ? "border-indigo-600 ring-2 ring-indigo-400"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <img
                    src={s.url}
                    alt={s.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-center">
                    <span className="text-[10px] text-white font-medium">{s.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transformation Prompt */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              2. Transformation Instructions & Style
            </label>
            <textarea
              rows={2}
              value={state.prompt}
              onChange={(e) => setState((prev) => ({ ...prev, prompt: e.target.value }))}
              placeholder="e.g. Turn into Studio Ghibli anime, add cyberpunk rain, make it an oil painting..."
              className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800"
            />
          </div>

          {/* Style Presets */}
          <div className="flex flex-wrap gap-1.5">
            {stylePresets.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setState((prev) => ({ ...prev, style: st }))}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  state.style === st
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleTransform}
              disabled={state.isLoading || !state.sourceImage || !state.prompt.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold text-sm shadow-md hover:from-cyan-700 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              {state.isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transforming Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Image Transformation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Image Preview */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Source Input
          </span>
          <div className="relative rounded-xl overflow-hidden bg-slate-900 flex-1 min-h-[280px] flex items-center justify-center">
            {state.sourceImage ? (
              <img
                src={state.sourceImage}
                alt="Source"
                referrerPolicy="no-referrer"
                className="max-h-[380px] w-auto max-w-full object-contain"
              />
            ) : (
              <span className="text-xs text-slate-500">No source selected</span>
            )}
          </div>
        </div>

        {/* Transformed Result */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI Transformed
            </span>
            {state.resultUrl && (
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            )}
          </div>

          <div className="relative rounded-xl overflow-hidden bg-slate-900 flex-1 min-h-[280px] flex items-center justify-center border border-slate-800">
            {state.isLoading ? (
              <div className="text-center p-6 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">
                  Applying "{state.style}" transformation via Gemini...
                </p>
              </div>
            ) : state.resultUrl ? (
              <img
                src={state.resultUrl}
                alt="Transformed"
                referrerPolicy="no-referrer"
                className="max-h-[380px] w-auto max-w-full object-contain"
              />
            ) : (
              <div className="text-center p-6 text-slate-400">
                <Layers className="w-8 h-8 opacity-40 mx-auto mb-2" />
                <p className="text-xs">Select instruction and click Transform to see the outcome.</p>
              </div>
            )}
          </div>

          {/* Action bridge */}
          {state.resultUrl && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Ready to animate?</span>
              <button
                onClick={() => onSendToVideo(state.resultUrl!, state.prompt)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Animate to Video</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transformation Notes if any */}
      {state.notes && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-700 space-y-1">
          <span className="font-bold text-slate-900 block">AI Transformation Insights:</span>
          <p className="whitespace-pre-line leading-relaxed">{state.notes}</p>
        </div>
      )}
    </div>
  );
};

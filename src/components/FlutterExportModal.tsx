import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Download,
  Smartphone,
  Tablet,
  Monitor,
  FolderTree,
  FileCode,
  Sparkles,
  Layers,
  Settings,
} from "lucide-react";
import { FLUTTER_PROJECT_FILES, FlutterFile } from "../data/flutterSourceCode";

export const FlutterExportModal: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FlutterFile>(FLUTTER_PROJECT_FILES[0]);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "service" | "screen" | "config" | "platform">("all");
  const [copied, setCopied] = useState(false);

  const filteredFiles = FLUTTER_PROJECT_FILES.filter(
    (f) => categoryFilter === "all" || f.category === categoryFilter
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    let bundle = `# Omni Multimodal AI - Complete Flutter Project Bundle\n`;
    bundle += `# iOS, Android & Web ready with Gemini GenAI & Google Translate APIs\n\n`;

    for (const file of FLUTTER_PROJECT_FILES) {
      bundle += `\n=========================================\n`;
      bundle += `FILE: ${file.path} [${file.category.toUpperCase()}]\n`;
      bundle += `=========================================\n\n`;
      bundle += file.content;
      bundle += `\n\n`;
    }

    const blob = new Blob([bundle], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flutter_omni_ai_project_bundle.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-xs">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Flutter Multiplatform Source Code (iOS, Android, Web)
                </h2>
                <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Full Codebase
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Includes AI Q&A Module, Google Translate API, and Core Models for Image/Video/Text Transformations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Project Bundle</span>
            </button>
          </div>
        </div>

        {/* Platform Targets Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">iOS (iPhone & iPad)</span>
              <span className="text-[11px] text-slate-500">Info.plist camera & microphone configured</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <Tablet className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Android (Phones & Tablets)</span>
              <span className="text-[11px] text-slate-500">AndroidManifest.xml permissions & camera</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <Monitor className="w-5 h-5 text-cyan-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Web (Chrome, Safari, Edge)</span>
              <span className="text-[11px] text-slate-500">CanvasKit renderer with responsive viewport</span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Explorer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Tree Navigator */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <FolderTree className="w-4 h-4 text-indigo-600" /> Flutter Files ({filteredFiles.length})
            </span>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {(["all", "screen", "service", "platform", "config"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "all" ? "All Files" : `${cat}s`}
              </button>
            ))}
          </div>

          <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
            {filteredFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
                  selectedFile.path === file.path
                    ? "bg-indigo-50 text-indigo-900 font-bold border border-indigo-200"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className={`w-4 h-4 shrink-0 ${selectedFile.path === file.path ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className="font-mono text-[11px] truncate">{file.path}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-100 text-slate-500 shrink-0">
                  {file.category}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Terminal Guide */}
          <div className="mt-2 pt-3 border-t border-slate-100 text-xs space-y-2">
            <span className="font-bold text-slate-900 block">Run Commands:</span>
            <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-1.5 overflow-x-auto">
              <div>
                <span className="text-slate-500"># 1. Install packages</span>
                <p className="text-emerald-400">flutter pub get</p>
              </div>
              <div>
                <span className="text-slate-500"># 2. Run on iOS</span>
                <p className="text-emerald-400">flutter run -d iPhone</p>
              </div>
              <div>
                <span className="text-slate-500"># 3. Run on Android</span>
                <p className="text-emerald-400">flutter run -d emulator</p>
              </div>
              <div>
                <span className="text-slate-500"># 4. Run on Web</span>
                <p className="text-emerald-400">flutter run -d chrome</p>
              </div>
            </div>
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-white">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 font-mono text-xs text-slate-300">{selectedFile.path}</span>
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="flex-1 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed p-2 max-h-[600px] overflow-y-auto">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

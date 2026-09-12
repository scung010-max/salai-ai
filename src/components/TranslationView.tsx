import React, { useState } from "react";
import {
  Languages,
  ArrowRightLeft,
  Volume2,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  BookOpen,
  Search,
  Globe,
  Quote,
} from "lucide-react";
import { GOOGLE_LANGUAGES, GoogleLanguage } from "../data/languages";
import { TranslationState } from "../types";

export const TranslationView: React.FC = () => {
  const [sourceLang, setSourceLang] = useState<string>("auto");
  const [targetLang, setTargetLang] = useState<string>("Spanish");
  const [sourceText, setSourceText] = useState<string>(
    "Hello! Welcome to our multiplatform AI app. Where would you like to travel today?"
  );
  const [tone, setTone] = useState<string>("Natural / Conversational");
  const [isSearchingTarget, setIsSearchingTarget] = useState(false);
  const [targetSearchQuery, setTargetSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [state, setState] = useState<TranslationState>({
    sourceText: "",
    sourceLang: "auto",
    targetLang: "Spanish",
    tone: "Natural / Conversational",
    isLoading: false,
    translatedText: "¡Hola! Bienvenido a nuestra aplicación de inteligencia artificial multiplataforma. ¿A dónde te gustaría viajar hoy?",
    phoneticPronunciation: "¡Oh-lah! Bee-en-veh-NEE-doh ah NWEH-strah ah-plee-kah-SYOHN...",
    romanization: "Hola! Bienvenido a nuestra aplicacion...",
    culturalNuance: "In Spanish, 'bienvenido' adjusts for gender (bienvenida for feminine). For a polite business context, '¿Adónde le gustaría viajar?' with formal 'usted' is favored.",
    grammaticalBreakdown: [
      { segment: "¡Hola!", meaning: "Hello!", partOfSpeech: "Interjection" },
      { segment: "Bienvenido", meaning: "Welcome", partOfSpeech: "Adjective" },
      { segment: "multiplataforma", meaning: "cross-platform", partOfSpeech: "Compound Adjective" },
      { segment: "¿A dónde...?", meaning: "Where to...?", partOfSpeech: "Interrogative phrase" },
    ],
    alternativeExpressions: [
      { tone: "Formal / Business", text: "Buenas tardes. Le damos la bienvenida a nuestra plataforma de IA. ¿Hacia dónde desea viajar?" },
      { tone: "Casual / Everyday", text: "¡Ey, qué tal! Bienvenido a la app de IA. ¿A dónde te vas de viaje hoy?" },
      { tone: "Poetic / Expressive", text: "Sean bienvenidos los pasos hacia este santuario digital. ¿Qué horizontes anhela descubrir hoy?" },
    ],
  });

  const tones = [
    "Natural / Conversational",
    "Formal / Business",
    "Casual / Slang",
    "Poetic / Literary",
    "Academic / Technical",
  ];

  const popularLanguages = GOOGLE_LANGUAGES.filter((l) => l.popular);

  const filteredLanguages = GOOGLE_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(targetSearchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(targetSearchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(targetSearchQuery.toLowerCase())
  );

  const handleTranslate = async () => {
    if (!sourceText.trim() || state.isLoading) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sourceText,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          tone,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          detectedLang: data.detectedSourceLanguage,
          translatedText: data.translatedText,
          phoneticPronunciation: data.phoneticPronunciation,
          romanization: data.romanization,
          culturalNuance: data.culturalNuance,
          grammaticalBreakdown: data.grammaticalBreakdown,
          alternativeExpressions: data.alternativeExpressions,
        }));
      } else {
        throw new Error(data.error || "Translation failed");
      }
    } catch (err: any) {
      alert("Translation error: " + (err.message || "Unknown error"));
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleSwap = () => {
    if (sourceLang === "auto") {
      setSourceLang(targetLang);
      setTargetLang("English");
    } else {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
    }
    if (state.translatedText) {
      const prevTrans = state.translatedText;
      setSourceText(prevTrans);
    }
  };

  const handleCopy = () => {
    if (!state.translatedText) return;
    navigator.clipboard.writeText(state.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetObj = GOOGLE_LANGUAGES.find((l) => l.name === targetLang);
    if (targetObj) {
      utterance.lang = targetObj.code;
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Languages className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                ALL Google Language Universal Translation
              </h2>
              <p className="text-xs text-slate-500">
                Deep linguistic intelligence covering 100+ world languages with phonetics and cultural nuances.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
            100+ Languages Active
          </span>
        </div>

        {/* Translation Bar Controls */}
        <div className="mt-5 space-y-4">
          {/* Language & Tone Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              {/* Source Lang */}
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden"
              >
                <option value="auto">✨ Auto Detect</option>
                {GOOGLE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.name}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>

              {/* Swap Button */}
              <button
                onClick={handleSwap}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                title="Swap Languages"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>

              {/* Target Lang Selector with Modal Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSearchingTarget(!isSearchingTarget)}
                  className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 flex items-center gap-1.5 hover:border-indigo-500 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{targetLang}</span>
                </button>

                {/* Dropdown Search Menu */}
                {isSearchingTarget && (
                  <div className="absolute left-0 top-full mt-1 w-72 max-h-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 overflow-hidden flex flex-col">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search 100+ languages..."
                        value={targetSearchQuery}
                        onChange={(e) => setTargetSearchQuery(e.target.value)}
                        className="w-full text-xs pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 space-y-0.5 max-h-60">
                      {filteredLanguages.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => {
                            setTargetLang(l.name);
                            setIsSearchingTarget(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                            targetLang === l.name
                              ? "bg-indigo-50 text-indigo-700 font-bold"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span>
                            {l.flag} {l.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {l.nativeName}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tone Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Tone:</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
              >
                {tones.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Popular Target Language Quick Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">Popular:</span>
            {popularLanguages.slice(0, 9).map((l) => (
              <button
                key={l.code}
                onClick={() => setTargetLang(l.name)}
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-all ${
                  targetLang === l.name
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {l.flag} {l.name}
              </button>
            ))}
          </div>

          {/* Two-Panel Translation Editor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Panel */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Source Text</span>
                <span className="text-[11px] lowercase font-normal">{sourceText.length} chars</span>
              </div>
              <textarea
                rows={5}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Type or paste any text in any language..."
                className="w-full rounded-xl border border-slate-300 p-3.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 leading-relaxed"
              />
            </div>

            {/* Output Panel */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-700 uppercase">
                <span>{targetLang} Translation</span>
                {state.translatedText && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => speakText(state.translatedText!)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                      title="Listen Pronunciation"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? "text-indigo-600 animate-pulse" : ""}`} />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                      title="Copy"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
              <div className="w-full min-h-[140px] rounded-xl border border-indigo-100 bg-indigo-50/30 p-3.5 text-sm text-slate-900 leading-relaxed relative flex flex-col justify-between">
                {state.isLoading ? (
                  <div className="flex items-center justify-center flex-1 py-8 text-indigo-600 gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-semibold">Translating across 100+ languages...</span>
                  </div>
                ) : (
                  <>
                    <p className="font-medium">{state.translatedText || "Translation will appear here."}</p>
                    {state.phoneticPronunciation && (
                      <div className="mt-3 pt-2 border-t border-indigo-100 text-xs text-indigo-900 font-mono">
                        <span className="text-[10px] text-slate-400 block font-sans">PHONETIC / ROMANIZATION:</span>
                        {state.phoneticPronunciation}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleTranslate}
              disabled={state.isLoading || !sourceText.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold text-sm shadow-md hover:from-indigo-700 hover:to-cyan-700 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              {state.isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Translate to {targetLang}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cultural Nuances, Grammar Breakdown & Tone Variations */}
      {state.translatedText && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cultural Context & Grammar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Linguistic Breakdown & Cultural Context
            </h3>

            {state.culturalNuance && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 leading-relaxed">
                <span className="font-bold block mb-1">Cultural Nuance & Usage Note:</span>
                {state.culturalNuance}
              </div>
            )}

            {/* Word-by-Word Table */}
            {state.grammaticalBreakdown && state.grammaticalBreakdown.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-slate-700 block">Morphology & Vocabulary:</span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {state.grammaticalBreakdown.map((item, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between text-xs bg-slate-50/50">
                      <div>
                        <span className="font-bold text-slate-900">{item.segment}</span>
                        <span className="text-slate-500 ml-2">→ {item.meaning}</span>
                      </div>
                      <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono">
                        {item.partOfSpeech}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tone Variations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Quote className="w-4 h-4 text-cyan-600" />
              Alternative Tone Variations
            </h3>
            <p className="text-xs text-slate-500">
              Select alternative phrasing suited for professional, casual, or poetic settings.
            </p>

            <div className="space-y-2.5">
              {state.alternativeExpressions?.map((alt, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700">{alt.tone}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(alt.text);
                        alert(`Copied "${alt.tone}" translation!`);
                      }}
                      className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-medium">{alt.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

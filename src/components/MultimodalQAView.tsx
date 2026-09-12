import React, { useState, useRef } from "react";
import {
  MessageSquareText,
  Send,
  Upload,
  Image as ImageIcon,
  X,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Volume2,
} from "lucide-react";
import Markdown from "react-markdown";
import { QAState, QAMessage } from "../types";

export const MultimodalQAView: React.FC = () => {
  const [messages, setMessages] = useState<QAMessage[]>([
    {
      id: "intro-1",
      role: "assistant",
      text: `Hello! I am your **Omni Multimodal AI Assistant**. 
You can ask me questions about anything, upload images for visual inspection, diagram analysis, code debugging, or language explanation.

How can I help you today?`,
      timestamp: "Just now",
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    "Explain how to build Flutter apps for iOS, Android & Web",
    "How does Gemini 3.8 Flash compare with multimodal models?",
    "Identify objects and analyze composition of an image",
    "Write a Flutter clean architecture directory structure",
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputQuestion;
    if ((!textToSend.trim() && !selectedImage) || isLoading) return;

    const userMsg: QAMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: "user",
      text: textToSend,
      imageBase64: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    const sentImage = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToSend,
          imageBase64: sentImage,
        }),
      });

      const data = await response.json();
      if (response.ok && data.answer) {
        const assistantMsg: QAMessage = {
          id: Math.random().toString(36).substring(2, 9),
          role: "assistant",
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || "Failed to get answer");
      }
    } catch (err: any) {
      const errorMsg: QAMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: "assistant",
        text: `⚠️ **Error**: ${err.message || "Failed to process request."}`,
        timestamp: "Error",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Multimodal AI Question & Answer</h2>
            <p className="text-xs text-slate-500">Gemini 3.8 Flash Vision & Reasoning Engine</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
          Text + Image Input
        </span>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-slate-900 text-white rounded-tr-xs"
                  : "bg-slate-50 text-slate-900 border border-slate-200 rounded-tl-xs"
              }`}
            >
              {/* Optional attached image */}
              {msg.imageBase64 && (
                <div className="mb-3 rounded-xl overflow-hidden max-h-60 border border-slate-700/30">
                  <img
                    src={msg.imageBase64}
                    alt="Attached"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Message text with Markdown */}
              <div className="markdown-body prose prose-sm max-w-none text-inherit">
                <Markdown>{msg.text}</Markdown>
              </div>

              {/* Message footer with timestamp and actions */}
              <div
                className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] ${
                  msg.role === "user"
                    ? "border-slate-800 text-slate-400"
                    : "border-slate-200 text-slate-400"
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speak(msg.text)}
                      className="hover:text-slate-700 transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="hover:text-slate-700 transition-colors flex items-center gap-1"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>OmniAI is analyzing and reasoning...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp)}
            className="text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs shrink-0 space-y-2">
        {/* Image Attachment Preview */}
        {selectedImage && (
          <div className="relative inline-block rounded-xl overflow-hidden border border-slate-200 bg-slate-100 p-1">
            <img
              src={selectedImage}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="h-16 w-auto rounded-lg object-cover"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Image Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
            title="Attach image for visual analysis"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Text Input */}
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question or explain the attached image..."
            className="flex-1 text-sm bg-transparent border-0 focus:outline-hidden text-slate-900 placeholder:text-slate-400"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={isLoading || (!inputQuestion.trim() && !selectedImage)}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

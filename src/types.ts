export type PipelineMode =
  | "text-to-image"
  | "image-to-image"
  | "image-to-video"
  | "video-to-video"
  | "text-to-video"
  | "translation"
  | "qa"
  | "flutter-export";

export type DeviceMode = "responsive" | "ios" | "android";

export interface TextToImageState {
  prompt: string;
  style: string;
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  isLoading: boolean;
  resultUrl: string | null;
  modelUsed?: string;
  feedback?: string;
  history: Array<{
    id: string;
    prompt: string;
    style: string;
    aspectRatio: string;
    imageUrl: string;
    timestamp: number;
  }>;
}

export interface ImageToImageState {
  sourceImage: string | null;
  prompt: string;
  style: string;
  intensity: number;
  isLoading: boolean;
  resultUrl: string | null;
  notes?: string;
  modelUsed?: string;
}

export interface VideoStudioState {
  mode: "text-to-video" | "image-to-video" | "video-to-video";
  prompt: string;
  sourceImage: string | null;
  sourceVideoUrl: string | null;
  cameraMotion: string;
  style: string;
  duration: string;
  aspectRatio: "16:9" | "9:16";
  isLoading: boolean;
  resultScript: any | null;
  operationName: string | null;
  videoPreviewUrl: string | null;
  statusMessage?: string;
}

export interface TranslationBreakdownItem {
  segment: string;
  meaning: string;
  partOfSpeech: string;
}

export interface TranslationAlternative {
  tone: string;
  text: string;
}

export interface TranslationState {
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  tone: string;
  isLoading: boolean;
  detectedLang?: string;
  translatedText?: string;
  phoneticPronunciation?: string;
  romanization?: string;
  grammaticalBreakdown?: TranslationBreakdownItem[];
  culturalNuance?: string;
  alternativeExpressions?: TranslationAlternative[];
}

export interface QAMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageBase64?: string;
  timestamp: string;
}

export interface QAState {
  inputQuestion: string;
  selectedImage: string | null;
  isLoading: boolean;
  messages: QAMessage[];
}

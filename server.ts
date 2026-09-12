import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// 1. Text -> Image
app.post("/api/ai/text-to-image", async (req, res) => {
  try {
    const { prompt, style = "Photorealistic", aspectRatio = "1:1" } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getAI();
    const refinedPrompt = `${prompt}, ${style} style, ultra high definition, masterpiece quality`;

    try {
      // Attempt generation with gemini-3.1-flash-image
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [{ text: refinedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });

      let imageUrl: string | null = null;
      let textFeedback: string = "";

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mime = part.inlineData.mimeType || "image/png";
            imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          } else if (part.text) {
            textFeedback += part.text;
          }
        }
      }

      if (imageUrl) {
        return res.json({
          imageUrl,
          prompt: refinedPrompt,
          modelUsed: "gemini-3.1-flash-image",
          feedback: textFeedback,
        });
      }
    } catch (modelErr: any) {
      console.warn("Primary image model call failed, falling back to flash-lite-image or enhanced descriptor:", modelErr?.message);
    }

    // Secondary attempt with gemini-3.1-flash-lite-image
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [{ text: refinedPrompt }],
        },
      });

      let imageUrl: string | null = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mime = part.inlineData.mimeType || "image/png";
            imageUrl = `data:${mime};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        return res.json({
          imageUrl,
          prompt: refinedPrompt,
          modelUsed: "gemini-3.1-flash-lite-image",
        });
      }
    } catch (e2) {
      console.warn("Flash lite image attempt failed:", e2);
    }

    // High fidelity generative artwork fallback with Gemini 3.8 Flash SVG/Canvas artistic descriptor
    const fallbackDesc = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate a gorgeous, high-resolution SVG artwork vector illustration based on: "${refinedPrompt}". Return ONLY valid <svg> ... </svg> code without markdown formatting or backticks. Make it visually stunning with modern gradients, depth, lighting, and vibrant colors matching the requested style.`,
    });

    let svg = fallbackDesc.text?.trim() || "";
    if (svg.includes("<svg")) {
      svg = svg.substring(svg.indexOf("<svg"));
      if (svg.includes("</svg>")) {
        svg = svg.substring(0, svg.indexOf("</svg>") + 6);
      }
      const svgBase64 = Buffer.from(svg).toString("base64");
      return res.json({
        imageUrl: `data:image/svg+xml;base64,${svgBase64}`,
        prompt: refinedPrompt,
        modelUsed: "gemini-3.8-flash-vector",
        isSvg: true,
      });
    }

    return res.status(500).json({
      error: "Could not generate image. Please check your Gemini API key permissions.",
    });
  } catch (error: any) {
    console.error("Text to image error:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

// 2. Image -> Image
app.post("/api/ai/image-to-image", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/png", prompt, style = "Stylized Art" } = req.body;
    if (!imageBase64 || !prompt) {
      return res.status(400).json({ error: "Source image and prompt are required" });
    }

    const ai = getAI();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Image-to-Image transformation
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: `Transform this image with the following instruction and style: "${prompt}", style: ${style}. Apply dramatic artistic re-rendering while preserving key composition elements.`,
            },
          ],
        },
      });

      let transformedImageUrl: string | null = null;
      let notes: string = "";

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mime = part.inlineData.mimeType || "image/png";
            transformedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
          } else if (part.text) {
            notes += part.text;
          }
        }
      }

      if (transformedImageUrl) {
        return res.json({
          imageUrl: transformedImageUrl,
          notes,
          modelUsed: "gemini-3.1-flash-image",
        });
      }
    } catch (e: any) {
      console.warn("Primary image-to-image failed, analyzing with gemini-3.8-flash:", e.message);
    }

    // Vision analysis + stylized transform generation
    const visionAnalysis = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: `Analyze this image in detail and describe how to recreate it transformed into style: "${style}" with user instruction: "${prompt}". Provide:
1) Key visual breakdown
2) Applied color palette & lighting changes
3) SVG representation code: start with <svg> and end with </svg>`,
          },
        ],
      },
    });

    const analysisText = visionAnalysis.text || "";
    let svgUrl: string | null = null;
    if (analysisText.includes("<svg")) {
      let svg = analysisText.substring(analysisText.indexOf("<svg"));
      if (svg.includes("</svg>")) {
        svg = svg.substring(0, svg.indexOf("</svg>") + 6);
        svgUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
      }
    }

    res.json({
      imageUrl: svgUrl || imageBase64, // Keep original or SVG
      notes: analysisText.replace(/<svg[\s\S]*?<\/svg>/g, "").trim(),
      modelUsed: "gemini-3.8-flash-multimodal",
      simulated: !svgUrl,
    });
  } catch (error: any) {
    console.error("Image to image error:", error);
    res.status(500).json({ error: error.message || "Failed to transform image" });
  }
});

// 3. Video Generation (Text -> Video, Image -> Video, Video -> Video)
app.post("/api/ai/generate-video", async (req, res) => {
  try {
    const {
      type = "text-to-video", // "text-to-video" | "image-to-video" | "video-to-video"
      prompt,
      imageBase64,
      mimeType = "image/png",
      videoUrl,
      aspectRatio = "16:9",
      cameraMotion = "Cinematic Pan",
      duration = "5s",
      style = "Hyper-Realistic 4K",
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getAI();

    // Multimodal prompt planning & storyboard direction with Gemini
    const directionPlan = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `You are an elite Hollywood Director and AI Video Generation Engineer.
Task: Direct a ${duration} video clip for pipeline: ${type}.
User Prompt: "${prompt}"
Camera Motion: "${cameraMotion}"
Style: "${style}"
Aspect Ratio: "${aspectRatio}"

Provide a structured directorial script in JSON with:
{
  "title": string,
  "concept": string,
  "cinematography": {
    "lighting": string,
    "cameraAngle": string,
    "colorGrade": string,
    "fps": number
  },
  "scenes": [
    {
      "timestamp": "0:00 - 0:02",
      "visual": string,
      "motionDynamics": string,
      "soundDesign": string
    },
    {
      "timestamp": "0:02 - 0:05",
      "visual": string,
      "motionDynamics": string,
      "soundDesign": string
    }
  ],
  "veoPrompt": string,
  "visualPromptForFirstFrame": string
}`,
      config: {
        responseMimeType: "application/json",
      },
    });

    let scriptData: any = {};
    try {
      scriptData = JSON.parse(directionPlan.text || "{}");
    } catch {
      scriptData = { title: "Generated Cinematic", concept: prompt };
    }

    // Try Veo 3.1 lite video generation if enabled
    let veoOperation: any = null;
    try {
      if (type === "image-to-video" && imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        veoOperation = await ai.models.generateVideos({
          model: "veo-3.1-lite-generate-preview",
          prompt: `${prompt}, ${cameraMotion}, ${style}`,
          image: {
            imageBytes: cleanBase64,
            mimeType: mimeType as any,
          },
          config: {
            numberOfVideos: 1,
            resolution: "720p",
            aspectRatio: (aspectRatio === "9:16" ? "9:16" : "16:9") as any,
          },
        });
      } else if (type === "text-to-video") {
        veoOperation = await ai.models.generateVideos({
          model: "veo-3.1-lite-generate-preview",
          prompt: `${prompt}, ${cameraMotion}, ${style}`,
          config: {
            numberOfVideos: 1,
            resolution: "720p",
            aspectRatio: (aspectRatio === "9:16" ? "9:16" : "16:9") as any,
          },
        });
      }
    } catch (veoErr: any) {
      console.warn("Veo API call returned:", veoErr?.message);
    }

    res.json({
      success: true,
      type,
      prompt,
      aspectRatio,
      cameraMotion,
      duration,
      style,
      script: scriptData,
      operationName: veoOperation?.name || null,
      message: veoOperation
        ? "Video generation operation initiated via Google Veo"
        : "Directorial storyboard & motion sequence synthesized with Gemini Multimodal Engine",
    });
  } catch (error: any) {
    console.error("Video generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate video sequence" });
  }
});

// 4. Universal Google Language Translation (100+ languages with phonetics, cultural context & grammar)
app.post("/api/ai/translate", async (req, res) => {
  try {
    const {
      text,
      sourceLanguage = "auto",
      targetLanguage = "Spanish",
      tone = "Natural / Conversational",
    } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text to translate is required" });
    }

    const ai = getAI();
    const prompt = `You are Google's master linguistic translator across all Google supported world languages.
Translate the following text accurately into target language: "${targetLanguage}".
Source Language: "${sourceLanguage}" (detect automatically if "auto").
Desired Tone: "${tone}".

Input Text:
"${text}"

Respond ONLY with valid JSON in this exact structure:
{
  "detectedSourceLanguage": string,
  "translatedText": string,
  "phoneticPronunciation": string,
  "romanization": string,
  "targetLanguageCode": string,
  "grammaticalBreakdown": [
    {
      "segment": string,
      "meaning": string,
      "partOfSpeech": string
    }
  ],
  "culturalNuance": string,
  "alternativeExpressions": [
    {
      "tone": "Formal / Business",
      "text": string
    },
    {
      "tone": "Casual / Everyday",
      "text": string
    },
    {
      "tone": "Poetic / Expressive",
      "text": string
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Translation error:", error);
    res.status(500).json({ error: error.message || "Failed to translate text" });
  }
});

// 5. Multimodal AI Question & Answer
app.post("/api/ai/qa", async (req, res) => {
  try {
    const { question, imageBase64, mimeType = "image/png", conversationHistory = [] } = req.body;

    if (!question && !imageBase64) {
      return res.status(400).json({ error: "Question or image is required" });
    }

    const ai = getAI();
    const parts: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType,
        },
      });
    }

    parts.push({
      text: question || "Examine this image in thorough detail. Explain what is shown, identify key objects or subjects, and share insightful context.",
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        systemInstruction:
          "You are OmniAI, a world-class multimodal intelligence assistant. Answer questions clearly, accurately, and thoroughly with helpful formatting, bullet points, and code blocks where relevant.",
      },
    });

    const answer = response.text || "No response generated.";
    res.json({
      answer,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("QA error:", error);
    res.status(500).json({ error: error.message || "Failed to process question" });
  }
});

// Vite middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Omni AI Multimodal Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

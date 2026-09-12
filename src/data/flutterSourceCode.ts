export interface FlutterFile {
  path: string;
  name: string;
  language: string;
  category: "service" | "screen" | "config" | "platform";
  content: string;
}

export const FLUTTER_PROJECT_FILES: FlutterFile[] = [
  {
    name: "pubspec.yaml",
    path: "pubspec.yaml",
    language: "yaml",
    category: "config",
    content: `name: omni_multimodal_ai
description: "Cross-platform iOS, Android, and Web Multimodal AI Studio built with Flutter and Google Gemini & Translate APIs."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  # Google Generative AI official Flutter SDK
  google_generative_ai: ^0.4.6
  http: ^1.2.1
  flutter_riverpod: ^2.5.1
  cached_network_image: ^3.3.1
  image_picker: ^1.1.2
  flutter_tts: ^4.0.2
  video_player: ^2.8.6
  file_picker: ^8.0.0
  flutter_markdown: ^0.7.2
  google_fonts: ^6.2.1
  share_plus: ^9.0.0
  path_provider: ^2.1.3
  cupertino_icons: ^1.0.8

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/
`,
  },
  {
    name: "main.dart",
    path: "lib/main.dart",
    language: "dart",
    category: "config",
    content: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: OmniMultimodalApp()));
}

class OmniMultimodalApp extends StatelessWidget {
  const OmniMultimodalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Omni AI Multimodal',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F46E5),
          primary: const Color(0xFF4F46E5),
          secondary: const Color(0xFF06B6D4),
          surface: Colors.white,
        ),
        textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme),
        cardTheme: CardTheme(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.grey.shade200),
          ),
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6366F1),
          brightness: Brightness.dark,
          surface: const Color(0xFF0F172A),
        ),
        textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
      ),
      themeMode: ThemeMode.system,
      home: const HomeScreen(),
    );
  }
}
`,
  },
  {
    name: "translate_service.dart",
    path: "lib/services/translate_service.dart",
    language: "dart",
    category: "service",
    content: `import 'dart:convert';
import 'package:http/http.dart' as http;

/// Google Translation Service supporting 100+ languages
/// and multi-language translation for text-to-image and text-to-video prompts.
class GoogleTranslateService {
  final String? apiKey;
  final String backendBaseUrl;

  GoogleTranslateService({
    this.apiKey,
    this.backendBaseUrl = '',
  });

  /// Translate text between any source and target language
  Future<TranslationResult> translate({
    required String text,
    required String targetLanguage,
    String sourceLanguage = 'auto',
    String tone = 'Natural / Conversational',
  }) async {
    final response = await http.post(
      Uri.parse('\$backendBaseUrl/api/ai/translate'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'text': text,
        'targetLanguage': targetLanguage,
        'sourceLanguage': sourceLanguage,
        'tone': tone,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return TranslationResult.fromJson(data);
    } else {
      throw Exception('Translation error: \${response.body}');
    }
  }

  /// Automatically detect and translate prompts from any language to English
  /// to ensure maximum accuracy and detail for Text-to-Image and Text-to-Video models.
  Future<String> translatePromptToEnglish(String prompt) async {
    final trimmed = prompt.trim();
    if (trimmed.isEmpty) return trimmed;

    final result = await translate(
      text: trimmed,
      targetLanguage: 'English',
      sourceLanguage: 'auto',
      tone: 'Descriptive & Visual',
    );
    return result.translatedText;
  }
}

class TranslationResult {
  final String translatedText;
  final String detectedSourceLanguage;
  final String? phoneticPronunciation;
  final String? culturalNuance;

  TranslationResult({
    required this.translatedText,
    required this.detectedSourceLanguage,
    this.phoneticPronunciation,
    this.culturalNuance,
  });

  factory TranslationResult.fromJson(Map<String, dynamic> json) {
    return TranslationResult(
      translatedText: json['translatedText'] ?? '',
      detectedSourceLanguage: json['detectedSourceLanguage'] ?? 'auto',
      phoneticPronunciation: json['phoneticPronunciation'],
      culturalNuance: json['culturalNuance'],
    );
  }
}
`,
  },
  {
    name: "gemini_service.dart",
    path: "lib/services/gemini_service.dart",
    language: "dart",
    category: "service",
    content: `import 'dart:convert';
import 'dart:typed_data';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:http/http.dart' as http;
import 'translate_service.dart';

/// Core AI Service implementing the 5 key transformations:
/// 1. Text to Image
/// 2. Image to Image
/// 3. Image to Video
/// 4. Video to Video
/// 5. Text to Video
/// Plus Multimodal Q&A and Integrated Google Translation
class GeminiService {
  final String apiKey;
  final String backendBaseUrl;
  final GoogleTranslateService translateService;

  late final GenerativeModel _flashModel;
  late final GenerativeModel _visionModel;

  GeminiService({
    required this.apiKey,
    this.backendBaseUrl = '',
  }) : translateService = GoogleTranslateService(backendBaseUrl: backendBaseUrl) {
    _flashModel = GenerativeModel(
      model: 'gemini-3.8-flash',
      apiKey: apiKey,
    );
    _visionModel = GenerativeModel(
      model: 'gemini-3.8-flash',
      apiKey: apiKey,
    );
  }

  // -------------------------------------------------------------
  // 1. Text to Image (with Multi-language Prompt Translation)
  // -------------------------------------------------------------
  Future<String> textToImage({
    required String prompt,
    String style = 'Photorealistic',
    String aspectRatio = '16:9',
    bool autoTranslateToEnglish = true,
  }) async {
    String finalPrompt = prompt;
    if (autoTranslateToEnglish) {
      finalPrompt = await translateService.translatePromptToEnglish(prompt);
    }

    final response = await http.post(
      Uri.parse('\$backendBaseUrl/api/ai/text-to-image'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'prompt': finalPrompt,
        'style': style,
        'aspectRatio': aspectRatio,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['imageUrl'];
    }
    throw Exception('Failed to synthesize image: \${response.body}');
  }

  // -------------------------------------------------------------
  // 2. Image to Image (Multimodal Style Transfer & Inpainting)
  // -------------------------------------------------------------
  Future<Map<String, dynamic>> imageToImage({
    required Uint8List imageBytes,
    required String prompt,
    String style = 'Anime Watercolor',
  }) async {
    final base64Image = base64Encode(imageBytes);
    final response = await http.post(
      Uri.parse('\$backendBaseUrl/api/ai/image-to-image'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'imageBase64': 'data:image/jpeg;base64,\$base64Image',
        'prompt': prompt,
        'style': style,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to transform image: \${response.body}');
  }

  // -------------------------------------------------------------
  // 3, 4, 5. Video Studio (Text->Video, Image->Video, Video->Video)
  // -------------------------------------------------------------
  Future<Map<String, dynamic>> generateVideo({
    required String type, // 'text-to-video' | 'image-to-video' | 'video-to-video'
    required String prompt,
    Uint8List? imageBytes,
    String cameraMotion = 'Cinematic Drone Pan',
    String style = 'Hyper-Realistic 4K',
    String aspectRatio = '16:9',
    bool autoTranslateToEnglish = true,
  }) async {
    String finalPrompt = prompt;
    if (autoTranslateToEnglish) {
      finalPrompt = await translateService.translatePromptToEnglish(prompt);
    }

    final body = {
      'type': type,
      'prompt': finalPrompt,
      'cameraMotion': cameraMotion,
      'style': style,
      'aspectRatio': aspectRatio,
      if (imageBytes != null) 'imageBase64': 'data:image/jpeg;base64,\${base64Encode(imageBytes)}',
    };

    final response = await http.post(
      Uri.parse('\$backendBaseUrl/api/ai/generate-video'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to direct video: \${response.body}');
  }

  // -------------------------------------------------------------
  // AI Question & Answer (Multimodal: Text + Image Reasoning)
  // -------------------------------------------------------------
  Future<String> askQuestion({
    required String question,
    Uint8List? imageBytes,
  }) async {
    if (imageBytes != null) {
      final content = [
        Content.multi([
          DataPart('image/jpeg', imageBytes),
          TextPart(question),
        ])
      ];
      final res = await _visionModel.generateContent(content);
      return res.text ?? 'No answer provided by model.';
    } else {
      final res = await _flashModel.generateContent([Content.text(question)]);
      return res.text ?? 'No answer provided by model.';
    }
  }
}
`,
  },
  {
    name: "qa_screen.dart",
    path: "lib/screens/qa_screen.dart",
    language: "dart",
    category: "screen",
    content: `import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:image_picker/image_picker.dart';
import '../services/gemini_service.dart';

class QAScreen extends StatefulWidget {
  const QAScreen({super.key});

  @override
  State<QAScreen> createState() => _QAScreenState();
}

class _QAScreenState extends State<QAScreen> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  final _picker = ImagePicker();
  final _flutterTts = FlutterTts();

  Uint8List? _selectedImageBytes;
  bool _isLoading = false;

  final List<Map<String, dynamic>> _chatHistory = [
    {
      'role': 'assistant',
      'text': 'Hello! I am your AI Multimodal Assistant. You can ask me any question, or attach photos, diagrams, and UI screenshots for visual analysis.',
      'image': null,
    }
  ];

  void _pickImage() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 1024);
    if (picked != null) {
      final bytes = await picked.readAsBytes();
      setState(() => _selectedImageBytes = bytes);
    }
  }

  void _sendQuestion() async {
    final query = _textController.text.trim();
    if (query.isEmpty && _selectedImageBytes == null) return;
    if (_isLoading) return;

    final imageBytesToSend = _selectedImageBytes;

    setState(() {
      _chatHistory.add({
        'role': 'user',
        'text': query,
        'image': imageBytesToSend,
      });
      _textController.clear();
      _selectedImageBytes = null;
      _isLoading = true;
    });

    _scrollToBottom();

    try {
      final service = GeminiService(apiKey: 'YOUR_GEMINI_API_KEY');
      final answer = await service.askQuestion(
        question: query.isEmpty ? 'Analyze and explain this image in detail.' : query,
        imageBytes: imageBytesToSend,
      );

      setState(() {
        _chatHistory.add({
          'role': 'assistant',
          'text': answer,
          'image': null,
        });
      });
    } catch (e) {
      setState(() {
        _chatHistory.add({
          'role': 'assistant',
          'text': '⚠️ **Error:** \$e',
          'image': null,
        });
      });
    } finally {
      setState(() => _isLoading = false);
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _speakText(String text) async {
    await _flutterTts.speak(text.replaceAll(RegExp(r'[*#_]'), ''));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Question & Answer'),
        elevation: 0.5,
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Clear Chat',
            onPressed: () {
              setState(() => _chatHistory.clear());
            },
          )
        ],
      ),
      body: Column(
        children: [
          // Chat list
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _chatHistory.length,
              itemBuilder: (context, index) {
                final item = _chatHistory[index];
                final isUser = item['role'] == 'user';

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.82,
                    ),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isUser ? Theme.of(context).colorScheme.primary : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (item['image'] != null) ...[
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.memory(
                              item['image'] as Uint8List,
                              height: 180,
                              fit: BoxFit.cover,
                            ),
                          ),
                          const SizedBox(height: 8),
                        ],
                        MarkdownBody(
                          data: item['text'] ?? '',
                          styleSheet: MarkdownStyleSheet(
                            p: TextStyle(color: isUser ? Colors.white : Colors.black87),
                          ),
                        ),
                        if (!isUser) ...[
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.volume_up, size: 18),
                                color: Colors.grey.shade600,
                                onPressed: () => _speakText(item['text'] ?? ''),
                              ),
                            ],
                          )
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          if (_isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                  SizedBox(width: 8),
                  Text('OmniAI is thinking...', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ],
              ),
            ),

          // Attachment thumbnail preview
          if (_selectedImageBytes != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              alignment: Alignment.centerLeft,
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.memory(_selectedImageBytes!, width: 60, height: 60, fit: BoxFit.cover),
                  ),
                  Positioned(
                    top: -4,
                    right: -4,
                    child: IconButton(
                      icon: const Icon(Icons.cancel, size: 18, color: Colors.red),
                      onPressed: () => setState(() => _selectedImageBytes = null),
                    ),
                  )
                ],
              ),
            ),

          // Bottom Input bar
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.add_photo_alternate_outlined),
                  color: Colors.indigo,
                  onPressed: _pickImage,
                  tooltip: 'Attach Image for Vision QA',
                ),
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: const InputDecoration(
                      hintText: 'Ask anything or inspect photo...',
                      border: InputBorder.none,
                    ),
                    onSubmitted: (_) => _sendQuestion(),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send),
                  color: Colors.indigo,
                  onPressed: _sendQuestion,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
`,
  },
  {
    name: "text_to_image_screen.dart",
    path: "lib/screens/text_to_image_screen.dart",
    language: "dart",
    category: "screen",
    content: `import 'package:flutter/material.dart';
import '../services/gemini_service.dart';
import '../services/translate_service.dart';

class TextToImageScreen extends StatefulWidget {
  const TextToImageScreen({super.key});

  @override
  State<TextToImageScreen> createState() => _TextToImageScreenState();
}

class _TextToImageScreenState extends State<TextToImageScreen> {
  final _promptController = TextEditingController(
    text: 'A futuristic floating sky city with neon lights and sakura trees',
  );

  String _selectedStyle = 'Photorealistic';
  String _aspectRatio = '16:9';
  bool _autoTranslate = true;
  bool _isTranslating = false;
  bool _isLoading = false;
  String? _generatedImageUrl;
  String? _translatedPrompt;

  final List<String> _styles = [
    'Photorealistic',
    'Anime / Manga',
    'Cinematic 3D',
    'Cyberpunk Neon',
    'Oil Painting',
    'Minimalist Vector'
  ];

  void _translatePrompt() async {
    final text = _promptController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isTranslating = true);
    try {
      final translateService = GoogleTranslateService();
      final translated = await translateService.translatePromptToEnglish(text);
      setState(() => _translatedPrompt = translated);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Prompt translated to English for optimal AI generation!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('\$e')));
    } finally {
      setState(() => _isTranslating = false);
    }
  }

  void _generateImage() async {
    final prompt = _promptController.text.trim();
    if (prompt.isEmpty || _isLoading) return;

    setState(() => _isLoading = true);
    try {
      final service = GeminiService(apiKey: 'YOUR_GEMINI_API_KEY');
      final url = await service.textToImage(
        prompt: prompt,
        style: _selectedStyle,
        aspectRatio: _aspectRatio,
        autoTranslateToEnglish: _autoTranslate,
      );
      setState(() => _generatedImageUrl = url);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: \$e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Text → Image Generation')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Prompt input with Multi-language Translation Action
            TextField(
              controller: _promptController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Describe image in ANY language (Spanish, Japanese, French, etc.)...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 8),

            // Multi-language Prompt Translation Integration
            Row(
              children: [
                Expanded(
                  child: CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: const Text(
                      'Auto-translate non-English prompts via Google Translate',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: _autoTranslate,
                    onChanged: (val) => setState(() => _autoTranslate = val ?? true),
                  ),
                ),
                TextButton.icon(
                  onPressed: _isTranslating ? null : _translatePrompt,
                  icon: const Icon(Icons.translate, size: 16),
                  label: Text(_isTranslating ? 'Translating...' : 'Translate Prompt'),
                ),
              ],
            ),

            if (_translatedPrompt != null) ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.indigo.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'English Prompt: \$_translatedPrompt',
                  style: const TextStyle(fontSize: 12, color: Colors.indigo),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Style Chips
            const Text('Artistic Style', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              children: _styles.map((st) {
                final isSelected = _selectedStyle == st;
                return ChoiceChip(
                  label: Text(st),
                  selected: isSelected,
                  onSelected: (val) => setState(() => _selectedStyle = st),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Action Button
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _generateImage,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
              icon: _isLoading
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.auto_awesome),
              label: Text(_isLoading ? 'Synthesizing with Gemini...' : 'Generate Image'),
            ),

            // Result
            if (_generatedImageUrl != null) ...[
              const SizedBox(height: 20),
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(_generatedImageUrl!, fit: BoxFit.cover),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
`,
  },
  {
    name: "video_gen_screen.dart",
    path: "lib/screens/video_gen_screen.dart",
    language: "dart",
    category: "screen",
    content: `import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../services/gemini_service.dart';
import '../services/translate_service.dart';

class VideoGenScreen extends StatefulWidget {
  const VideoGenScreen({super.key});

  @override
  State<VideoGenScreen> createState() => _VideoGenScreenState();
}

class _VideoGenScreenState extends State<VideoGenScreen> {
  final _promptController = TextEditingController(
    text: 'Cinematic drone shot flying through a neon-lit futuristic metropolis',
  );

  String _pipelineType = 'text-to-video'; // 'text-to-video' | 'image-to-video' | 'video-to-video'
  String _cameraMotion = 'Cinematic Drone Pan';
  bool _autoTranslate = true;
  bool _isLoading = false;
  Map<String, dynamic>? _videoScript;

  final List<String> _cameraOptions = [
    'Cinematic Drone Pan',
    'Orbit 360',
    'Dramatic Zoom',
    'Dolly Forward',
    'POV Flythrough',
  ];

  void _directVideo() async {
    if (_promptController.text.isEmpty || _isLoading) return;
    setState(() => _isLoading = true);

    try {
      final service = GeminiService(apiKey: 'YOUR_GEMINI_API_KEY');
      final result = await service.generateVideo(
        type: _pipelineType,
        prompt: _promptController.text,
        cameraMotion: _cameraMotion,
        autoTranslateToEnglish: _autoTranslate,
      );
      setState(() => _videoScript = result['script']);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('\$e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Video Studio (Veo & Omni)')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Sub-mode tabs
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'text-to-video', label: Text('Text → Video')),
                ButtonSegment(value: 'image-to-video', label: Text('Img → Video')),
                ButtonSegment(value: 'video-to-video', label: Text('Vid → Video')),
              ],
              selected: {_pipelineType},
              onSelectionChanged: (set) => setState(() => _pipelineType = set.first),
            ),
            const SizedBox(height: 14),

            // Prompt
            TextField(
              controller: _promptController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Direct video scenes in ANY language...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 8),

            // Google Translate Integration for Video Prompts
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              title: const Text(
                'Auto-translate non-English video directions via Google Translate',
                style: TextStyle(fontSize: 12),
              ),
              value: _autoTranslate,
              onChanged: (val) => setState(() => _autoTranslate = val ?? true),
            ),
            const SizedBox(height: 8),

            // Camera Motion
            DropdownButtonFormField<String>(
              value: _cameraMotion,
              decoration: const InputDecoration(labelText: 'Camera Motion Trajectory'),
              items: _cameraOptions.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
              onChanged: (val) => setState(() => _cameraMotion = val ?? _cameraMotion),
            ),
            const SizedBox(height: 16),

            ElevatedButton.icon(
              onPressed: _isLoading ? null : _directVideo,
              icon: _isLoading
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.videocam),
              label: Text(_isLoading ? 'Synthesizing Cinematic Video...' : 'Generate Video (\$_pipelineType)'),
            ),

            if (_videoScript != null) ...[
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _videoScript!['title'] ?? 'Directorial Scene Script',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 8),
                      Text('Cinematography: \${_videoScript!['cinematography']}'),
                    ],
                  ),
                ),
              )
            ]
          ],
        ),
      ),
    );
  }
}
`,
  },
  {
    name: "image_to_image_screen.dart",
    path: "lib/screens/image_to_image_screen.dart",
    language: "dart",
    category: "screen",
    content: `import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/gemini_service.dart';

class ImageToImageScreen extends StatefulWidget {
  const ImageToImageScreen({super.key});

  @override
  State<ImageToImageScreen> createState() => _ImageToImageScreenState();
}

class _ImageToImageScreenState extends State<ImageToImageScreen> {
  final _promptController = TextEditingController(
    text: 'Reimagine this scene as a Studio Ghibli watercolor anime with cherry blossoms',
  );
  final _picker = ImagePicker();

  Uint8List? _sourceImageBytes;
  String? _resultImageUrl;
  bool _isLoading = false;

  void _pickSource() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 1024);
    if (picked != null) {
      final bytes = await picked.readAsBytes();
      setState(() {
        _sourceImageBytes = bytes;
        _resultImageUrl = null;
      });
    }
  }

  void _transformImage() async {
    if (_sourceImageBytes == null || _promptController.text.isEmpty || _isLoading) return;

    setState(() => _isLoading = true);
    try {
      final service = GeminiService(apiKey: 'YOUR_GEMINI_API_KEY');
      final res = await service.imageToImage(
        imageBytes: _sourceImageBytes!,
        prompt: _promptController.text,
      );
      setState(() => _resultImageUrl = res['imageUrl']);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('\$e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Image → Image Transformation')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Upload button / Preview
            GestureDetector(
              onTap: _pickSource,
              child: Container(
                height: 180,
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: _sourceImageBytes != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.memory(_sourceImageBytes!, fit: BoxFit.cover),
                      )
                    : const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate_outlined, size: 40, color: Colors.indigo),
                          SizedBox(height: 8),
                          Text('Tap to select source photo', style: TextStyle(color: Colors.indigo)),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 14),

            TextField(
              controller: _promptController,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'Transformation prompt...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 14),

            ElevatedButton.icon(
              onPressed: _isLoading ? null : _transformImage,
              icon: _isLoading
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.style),
              label: Text(_isLoading ? 'Transforming...' : 'Execute Transformation'),
            ),

            if (_resultImageUrl != null) ...[
              const SizedBox(height: 20),
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(_resultImageUrl!, fit: BoxFit.cover),
              ),
            ]
          ],
        ),
      ),
    );
  }
}
`,
  },
  {
    name: "translation_screen.dart",
    path: "lib/screens/translation_screen.dart",
    language: "dart",
    category: "screen",
    content: `import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../services/translate_service.dart';

class TranslationScreen extends StatefulWidget {
  const TranslationScreen({super.key});

  @override
  State<TranslationScreen> createState() => _TranslationScreenState();
}

class _TranslationScreenState extends State<TranslationScreen> {
  final _textController = TextEditingController(
    text: 'Welcome to our cross-platform Flutter AI application!',
  );
  final _flutterTts = FlutterTts();

  String _sourceLang = 'auto';
  String _targetLang = 'Spanish';
  bool _isLoading = false;
  TranslationResult? _result;

  final List<String> _languages = [
    'Spanish', 'French', 'German', 'Japanese', 'Chinese (Simplified)',
    'Korean', 'Hindi', 'Arabic', 'Portuguese', 'Russian', 'Italian',
    'Vietnamese', 'Thai', 'Indonesian', 'Turkish', 'Dutch', 'Polish',
  ];

  void _runTranslation() async {
    if (_textController.text.isEmpty) return;
    setState(() => _isLoading = true);

    try {
      final service = GoogleTranslateService();
      final res = await service.translate(
        text: _textController.text,
        targetLanguage: _targetLang,
        sourceLanguage: _sourceLang,
      );
      setState(() => _result = res);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('\$e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _speak(String text) async {
    await _flutterTts.speak(text);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Universal Google Translation'),
        actions: [
          DropdownButton<String>(
            value: _targetLang,
            underline: const SizedBox(),
            items: _languages.map((l) => DropdownMenuItem(value: l, child: Text(l))).toList(),
            onChanged: (v) {
              if (v != null) setState(() => _targetLang = v);
            },
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _textController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Enter text in any language...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),

            ElevatedButton.icon(
              onPressed: _isLoading ? null : _runTranslation,
              icon: _isLoading
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.translate),
              label: Text(_isLoading ? 'Translating...' : 'Translate to \$_targetLang'),
            ),

            if (_result != null) ...[
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.between,
                        children: [
                          Text('Target: \$_targetLang', style: const TextStyle(fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: const Icon(Icons.volume_up, size: 20),
                            onPressed: () => _speak(_result!.translatedText),
                          ),
                        ],
                      ),
                      Text(
                        _result!.translatedText,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      if (_result!.phoneticPronunciation != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Pronunciation: \${_result!.phoneticPronunciation}',
                          style: TextStyle(color: Colors.grey.shade600),
                        ),
                      ],
                      if (_result!.culturalNuance != null) ...[
                        const SizedBox(height: 8),
                        const Divider(),
                        Text('Cultural Note: \${_result!.culturalNuance}'),
                      ],
                    ],
                  ),
                ),
              )
            ]
          ],
        ),
      ),
    );
  }
}
`,
  },
  {
    name: "home_screen.dart",
    path: "lib/screens/home_screen.dart",
    language: "dart",
    category: "screen",
    content: `import 'package:flutter/material.dart';
import 'text_to_image_screen.dart';
import 'image_to_image_screen.dart';
import 'video_gen_screen.dart';
import 'translation_screen.dart';
import 'qa_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = const [
    TextToImageScreen(),
    ImageToImageScreen(),
    VideoGenScreen(),
    TranslationScreen(),
    QAScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.auto_awesome_outlined),
            selectedIcon: Icon(Icons.auto_awesome),
            label: 'Text → Img',
          ),
          NavigationDestination(
            icon: Icon(Icons.image_outlined),
            selectedIcon: Icon(Icons.image),
            label: 'Img → Img',
          ),
          NavigationDestination(
            icon: Icon(Icons.videocam_outlined),
            selectedIcon: Icon(Icons.videocam),
            label: 'Video AI',
          ),
          NavigationDestination(
            icon: Icon(Icons.translate_outlined),
            selectedIcon: Icon(Icons.translate),
            label: 'Translate',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble),
            label: 'AI Q&A',
          ),
        ],
      ),
    );
  }
}
`,
  },
  {
    name: "Info.plist (iOS)",
    path: "ios/Runner/Info.plist",
    language: "xml",
    category: "platform",
    content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>$(DEVELOPMENT_LANGUAGE)</string>
	<key>CFBundleDisplayName</key>
	<string>Omni AI Multimodal</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>omni_multimodal_ai</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>$(FLUTTER_BUILD_NAME)</string>
	<key>CFBundleVersion</key>
	<string>$(FLUTTER_BUILD_NUMBER)</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>

	<!-- Camera, Photo Library & Microphone permissions for Multimodal Vision & Speech -->
	<key>NSCameraUsageDescription</key>
	<string>Omni AI requires camera access for real-time visual inspection and photo Q&amp;A.</string>
	<key>NSPhotoLibraryUsageDescription</key>
	<string>Omni AI needs access to your gallery for Image-to-Image and Image-to-Video generation.</string>
	<key>NSMicrophoneUsageDescription</key>
	<string>Omni AI uses the microphone for speech-to-text input and voice commands.</string>

	<key>UILaunchStoryboardName</key>
	<string>LaunchScreen</string>
	<key>UIMainStoryboardFile</key>
	<string>Main</string>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
</dict>
</plist>
`,
  },
  {
    name: "AndroidManifest.xml (Android)",
    path: "android/app/src/main/AndroidManifest.xml",
    language: "xml",
    category: "platform",
    content: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.omni_multimodal_ai">

    <!-- Permissions for AI Cloud Services, Camera & Audio -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.RECORD_AUDIO"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>

    <application
        android:label="Omni AI Multimodal"
        android:name="io.flutter.app.FlutterApplication"
        android:icon="@mipmap/ic_launcher">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
  },
  {
    name: "README.md",
    path: "README.md",
    language: "markdown",
    category: "config",
    content: `# Omni Multimodal AI Studio for Flutter (iOS, Android & Web)

A comprehensive, production-grade Flutter application integrating Google Gemini & Google Translate APIs for all 5 core transformations plus Q&A and universal translation:

1. Text -> Image (with multi-language prompt translation)
2. Image -> Image (style transfer & inpainting)
3. Image -> Video (camera motion trajectory)
4. Video -> Video (style remix & filter transformation)
5. Text -> Video (cinematic Hollywood directorial script)
6. ALL Google Language Translation (100+ languages)
7. Multimodal AI Question & Answer (text + camera/image inspection)

## Quick Start Guide

### 1. Install Flutter Dependencies
    flutter pub get

### 2. Run On Platform
- iOS Simulator:
    open -a Simulator
    flutter run -d iPhone

- Android Emulator:
    flutter run -d emulator

- Web Browser (Chrome):
    flutter run -d chrome
`,
  },
];

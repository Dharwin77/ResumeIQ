import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Debug: confirm key is loaded (shows first 10 chars only)
const loadedKey = process.env.GROQ_API_KEY || '';
console.log(`[ENV] GROQ_API_KEY loaded: ${loadedKey ? loadedKey.substring(0, 14) + '...' : 'NOT SET'}`);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up multer for in-memory PDF uploads (size limit: 10MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported.'));
    }
  }
});

// ATS Analysis Endpoint
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  try {
    const { jd, customApiKey, model: selectedModel } = req.body;
    const uploadedFile = req.file;

    if (!jd) return res.status(400).json({ error: 'Job description is required.' });
    if (!uploadedFile) return res.status(400).json({ error: 'Resume PDF file is required.' });

    // Resolve API Key: custom body key > x-api-key header > GROQ_API_KEY env
    const apiKey = customApiKey || req.headers['x-api-key'] || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'Groq API Key is missing. Please configure it in Settings (gear icon) or add GROQ_API_KEY to your .env file.'
      });
    }

    // Extract text from PDF buffer
    let resumeText = '';
    try {
      const pdfData = await pdfParse(uploadedFile.buffer);
      resumeText = pdfData.text;
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      return res.status(400).json({ error: 'Failed to extract text from the PDF resume.' });
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ error: 'The uploaded PDF appears to be empty or image-only.' });
    }

    // Initialize Groq client
    const groq = new Groq({ apiKey });

    // Model fallback chain — all free tier on Groq
    const requestedModel = selectedModel || 'llama-3.3-70b-versatile';
    const MODEL_FALLBACKS = [
      requestedModel,
      'llama-3.3-70b-versatile',
      'llama3-70b-8192',
      'llama3-8b-8192',
      'gemma2-9b-it',
    ];
    const modelQueue = [...new Set(MODEL_FALLBACKS)];

    const systemPrompt = `You are an expert Application Tracking System (ATS) analyst with deep expertise in software engineering, data science, data analytics, and big data engineering roles.
Your task is to critically evaluate a candidate's resume against a given job description.
You must respond ONLY with a valid JSON object — no markdown, no explanation, no extra text.`;

    const userPrompt = `Evaluate the following resume against the job description.

JOB DESCRIPTION:
${jd}

RESUME TEXT:
${resumeText}

Return a single valid JSON object with exactly these keys:
{
  "JD Match": "<percentage string e.g. 72%>",
  "MissingKeywords": ["<keyword1>", "<keyword2>"],
  "Profile Summary": "<2-4 sentence professional critique of resume alignment with this JD>",
  "Recommendations": [
    "<specific actionable improvement 1>",
    "<specific actionable improvement 2>",
    "<specific actionable improvement 3>"
  ]
}`;

    let responseText = null;
    let usedModel = null;
    let lastError = null;

    for (const modelName of modelQueue) {
      try {
        console.log(`Trying Groq model: ${modelName}`);
        const completion = await groq.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }, // Guaranteed JSON output
          temperature: 0.3,
          max_tokens: 1500,
        });

        responseText = completion.choices[0]?.message?.content;
        usedModel = modelName;
        console.log(`Success with Groq model: ${modelName}`);
        break;
      } catch (err) {
        lastError = err;
        const status = err?.status || err?.error?.status || 0;
        const msg = (err?.message || '').toLowerCase();

        if (status === 429 || msg.includes('rate limit') || msg.includes('quota')) {
          console.warn(`Model ${modelName} rate limited. Trying next...`);
          continue;
        } else if (status === 404 || msg.includes('not found') || msg.includes('does not exist')) {
          console.warn(`Model ${modelName} not available. Trying next...`);
          continue;
        } else {
          throw err;
        }
      }
    }

    if (!responseText) {
      const isRateLimit = (lastError?.status === 429) || (lastError?.message || '').includes('rate');
      return res.status(429).json({
        error: 'QUOTA_EXCEEDED',
        message: isRateLimit
          ? 'Groq API rate limit reached. Please wait a moment and try again — Groq free tier resets per minute.'
          : 'All Groq models failed. Please check your API key at console.groq.com.',
        details: [
          'Groq free tier resets every minute — just wait ~60 seconds and retry.',
          'Verify your API key is correct at console.groq.com/keys.',
          'Your key should start with "gsk_..."'
        ]
      });
    }

    // Parse JSON (should already be clean due to response_format: json_object)
    let analysisResult;
    try {
      analysisResult = JSON.parse(responseText);
    } catch (jsonError) {
      console.warn('JSON parse failed, raw:', responseText);
      // Try extracting JSON from the text
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          analysisResult = JSON.parse(responseText.substring(firstBrace, lastBrace + 1));
        } catch {
          analysisResult = {
            'JD Match': '0%',
            'MissingKeywords': ['Parse Error'],
            'Profile Summary': 'Could not parse AI response. Raw: ' + responseText.substring(0, 400),
            'Recommendations': ['Try running the scan again.']
          };
        }
      }
    }

    analysisResult._modelUsed = usedModel;
    return res.json(analysisResult);

  } catch (error) {
    console.error('Server Error:', error);
    const isAuth = (error?.status === 401) || (error?.message || '').includes('401') || (error?.message || '').toLowerCase().includes('invalid api key');
    if (isAuth) {
      return res.status(401).json({
        error: 'Invalid Groq API Key. Please generate a valid key at https://console.groq.com/keys — it should start with "gsk_".'
      });
    }
    return res.status(500).json({ error: error.message || 'An error occurred during analysis.' });
  }
});

// Serve frontend in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  app.get('/', (req, res) => res.send('Groq ATS API running. Start Vite with npm run dev:frontend.'));
}

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
  }
  return res.status(400).json({ error: err.message || 'Unexpected error.' });
});

// Only listen when not running in serverless environment (like Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Groq ATS Server running on port ${PORT}`));
}

export default app;

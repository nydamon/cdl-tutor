const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { OpenAI } = require('openai');
require('dotenv').config();

const upload = multer({ dest: 'uploads/' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { 
  initDB, getDB, createSession, getLatestSession, getSessionMessages, 
  addMessage, getProgressSummary, getWeakTopics, recordTopicExposure 
} = require('./database');
const { CDL_TUTOR_PROMPT } = require('./prompts/system');

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3947;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize DB (async for PostgreSQL) - with error handling
let db;
(async () => {
  try {
    db = await initDB();
    console.log('Database initialized');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.log('Continuing without database...');
  }
})();

// --- NEW: Realtime Token Endpoint ---
app.get('/api/realtime-token', async (req, res) => {
  try {
    // Get weak areas to prime the voice session (skip if DB unavailable)
    let context = "";
    if (db) {
      try {
        const weakTopics = await getWeakTopics(db, 3);
        context = weakTopics.length > 0 
          ? `\n\n[ Joey's current weak spots: ${weakTopics.map(t => t.topic_name).join(', ')}. Focus on these naturally in conversation. ]`
          : "";
      } catch (e) {
        console.log('Could not fetch weak topics:', e.message);
      }
    }

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        modalities: ['audio', 'text'],
        instructions: CDL_TUTOR_PROMPT + context,
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Save transcript from voice session
app.post('/api/save-voice-transcript', async (req, res) => {
  try {
    const { transcript, role } = req.body;
    let sessionId = await getLatestSession(db).then(s => s?.id);
    if (!sessionId) sessionId = await createSession(db);
    
    await addMessage(db, sessionId, role === 'assistant' ? 'assistant' : 'user', transcript);
    
    // Update topic scores based on what was discussed
    const topics = detectTopics(transcript);
    for (const topic of topics) {
      // For voice, we assume positive exposure unless specifically corrected (logic can be tuned)
      await recordTopicExposure(db, topic, true);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Extract topics from conversation
function detectTopics(text) {
  const found = [];
  const lower = text.toLowerCase();
  if (lower.includes('air brake')) found.push('air_brakes');
  if (lower.includes('hazmat')) found.push('hazmat_basics');
  return [...new Set(found)];
}

// Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    let session;
    if (sessionId) {
      const result = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
      session = result.rows[0];
    }
    if (!session) {
      const newId = await createSession(db);
      session = { id: newId };
    }
    const history = await getSessionMessages(db, session.id);
    const messages = history.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: CDL_TUTOR_PROMPT }] },
        { role: 'model', parts: [{ text: "Ready." }] },
        ...messages
      ]
    });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();
    await addMessage(db, session.id, 'user', message);
    await addMessage(db, session.id, 'assistant', responseText);
    res.json({ response: responseText, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
    });
    fs.unlinkSync(req.file.path);
    res.json({ text: transcription.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/progress', async (req, res) => {
  const summary = await getProgressSummary(db);
  res.json(summary);
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));

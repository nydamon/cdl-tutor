let currentSessionId = null;
let voiceMode = false;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let currentUtterance = null;

const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const voiceBtn = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const typingIndicator = document.getElementById('typingIndicator');
const progressFill = document.getElementById('progressFill');
const topicContainer = document.getElementById('topicContainer');

const resumeBtn = document.getElementById('resumeBtn');
const newSessionBtn = document.getElementById('newSessionBtn');
const progressBtn = document.getElementById('progressBtn');

const progressModal = document.getElementById('progressModal');
const progressContent = document.getElementById('progressContent');
const closeModal = document.querySelector('.close');

// ---------- Progress Tracking ----------
async function refreshProgressBar() {
  try {
    const res = await fetch('/cdl/api/progress');
    const data = await res.json();
    const pct = Math.max(0, Math.min(100, data.averageConfidence || 0));
    progressFill.style.width = pct + '%';
    const masteryLabel = document.getElementById('masteryPct');
    if (masteryLabel) masteryLabel.textContent = pct;

    // Refresh topic chips
    refreshTopicChips();
  } catch (e) {
    console.error("Progress fetch failed:", e);
  }
}

async function refreshTopicChips() {
    try {
        const res = await fetch('/cdl/api/progress');
        const data = await res.json();
        
        // We need all topics to show progress
        const topicsRes = await fetch('/cdl/api/recommendations'); // This returns topics sorted by confidence
        const topics = await topicsRes.json();
        
        topicContainer.innerHTML = '';
        topics.forEach(t => {
            const chip = document.createElement('div');
            chip.className = 'topic-chip';
            if (t.confidence_score >= 80) chip.classList.add('mastered');
            else if (t.exposure_count > 0) chip.classList.add('discussed');
            
            const name = t.topic_name.replace(/_/g, ' ');
            chip.textContent = name.charAt(0).toUpperCase() + name.slice(1);
            topicContainer.appendChild(chip);
        });
    } catch (e) {
        console.error("Topic chips refresh failed:", e);
    }
}

// ---------- Robust Audio Recording (Whisper Fallback) ----------
async function initAudio() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioChunks = [];
      await handleAudioUpload(audioBlob);
    };
  } catch (err) {
    console.error('Audio initialization failed:', err);
  }
}

async function handleAudioUpload(blob) {
  setTyping(true);
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');

  try {
    const res = await fetch('/cdl/api/transcribe', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.text) {
      sendMessage(data.text);
    }
  } catch (err) {
    console.error('Transcription failed:', err);
  } finally {
    setTyping(false);
  }
}

function startRecording() {
  if (!mediaRecorder || isRecording) return;
  stopSpeaking();
  audioChunks = [];
  mediaRecorder.start();
  isRecording = true;
  micBtn.classList.add('recording');
}

function stopRecording() {
  if (!mediaRecorder || !isRecording) return;
  mediaRecorder.stop();
  isRecording = false;
  micBtn.classList.remove('recording');
}

function speak(text) {
  if (!voiceMode) return;
  if (!('speechSynthesis' in window)) return;

  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices[0];
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

// ---------- UI Helpers ----------
function addMessage(role, content) {
  const el = document.createElement('div');
  el.className = `message ${role}`;
  const header = document.createElement('div');
  header.className = 'message-header';
  header.textContent = role === 'user' ? 'You' : 'Red';
  
  const body = document.createElement('div');
  body.className = 'message-body';
  body.textContent = content;

  if (role === 'assistant') {
    const speaker = document.createElement('button');
    speaker.className = 'speaker-btn';
    speaker.textContent = '🔈';
    speaker.onclick = () => speak(content);
    header.appendChild(speaker);
  }

  el.appendChild(header);
  el.appendChild(body);
  chatContainer.appendChild(el);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function setTyping(on) {
  typingIndicator.classList.toggle('active', on);
}

async function sendMessage(text) {
  if (!text.trim()) return;
  addMessage('user', text);
  messageInput.value = '';
  setTyping(true);

  try {
    const res = await fetch('/cdl/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId: currentSessionId })
    });
    const data = await res.json();
    currentSessionId = data.sessionId;
    addMessage('assistant', data.response);
    speak(data.response);
    refreshProgressBar();
  } catch (err) {
    console.error("Chat failed:", err);
  } finally {
    setTyping(false);
  }
}

async function showProgress() {
  const res = await fetch('/cdl/api/progress');
  const data = await res.json();

  progressContent.innerHTML = `
    <div class="progress-stats">
      <div class="stat-row"><span>Sessions</span><span>${data.sessions}</span></div>
      <div class="stat-row"><span>Total messages</span><span>${data.totalMessages}</span></div>
      <div class="stat-row"><span>Average confidence</span><span>${data.averageConfidence}%</span></div>
    </div>
    <div class="topic-list">
      <h3>Areas you're working on:</h3>
      ${(data.weakTopics || []).map(t => `<span class="topic-tag weak">${t.replace('_', ' ')}</span>`).join('') || 'None yet'}
    </div>
  `;
  progressModal.classList.add('active');
}

// ---------- Controls ----------
micBtn.addEventListener('mousedown', startRecording);
micBtn.addEventListener('mouseup', stopRecording);
micBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRecording(); });
micBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopRecording(); });
sendBtn.addEventListener('click', () => sendMessage(messageInput.value));
messageInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(messageInput.value); });
voiceBtn.addEventListener('click', () => {
  voiceMode = !voiceMode;
  voiceBtn.classList.toggle('active', voiceMode);
  voiceStatus.textContent = voiceMode ? 'ON' : 'OFF';
  if (!voiceMode) stopSpeaking();
});
progressBtn.addEventListener('click', showProgress);
closeModal.addEventListener('click', () => progressModal.classList.remove('active'));

// Boot
initAudio();
refreshProgressBar();

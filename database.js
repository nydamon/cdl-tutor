const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connect_timeout: 10,
});

async function initDB() {
  // Test connection first
  const client = await pool.connect();
  try {
    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        topics_covered TEXT DEFAULT '[]',
        weak_areas TEXT DEFAULT '[]',
        overall_progress_pct INTEGER DEFAULT 0,
        session_summary TEXT
      )
    `);

    // Messages within sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
        role TEXT CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Topic mastery tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS topic_mastery (
        topic_name TEXT PRIMARY KEY,
        confidence_score INTEGER CHECK(confidence_score BETWEEN 0 AND 100),
        exposure_count INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        last_reviewed TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  } finally {
    client.release();
  }
}

function getDB() {
  return pool;
}

// Session methods
async function createSession(db) {
  const result = await db.query(
    'INSERT INTO sessions (topics_covered, weak_areas) VALUES ($1, $2) RETURNING id',
    ['[]', '[]']
  );
  return result.rows[0].id;
}

async function getLatestSession(db) {
  const result = await db.query(
    'SELECT * FROM sessions ORDER BY updated_at DESC LIMIT 1'
  );
  return result.rows[0];
}

async function getSessionMessages(db, sessionId) {
  const result = await db.query(
    'SELECT * FROM messages WHERE session_id = $1 ORDER BY timestamp ASC',
    [sessionId]
  );
  return result.rows;
}

async function addMessage(db, sessionId, role, content) {
  const result = await db.query(
    'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3) RETURNING id',
    [sessionId, role, content]
  );
  // Update session timestamp
  await db.query('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);
  return result.rows[0].id;
}

async function updateSessionProgress(db, sessionId, progress) {
  const { topics, weakAreas, summary } = progress;
  await db.query(
    'UPDATE sessions SET topics_covered = $1, weak_areas = $2, overall_progress_pct = $3, session_summary = $4 WHERE id = $5',
    [JSON.stringify(topics), JSON.stringify(weakAreas), progress.percent || 0, summary, sessionId]
  );
}

// Topic mastery methods
async function recordTopicExposure(db, topic, wasCorrect) {
  const existing = await db.query('SELECT * FROM topic_mastery WHERE topic_name = $1', [topic]);
  
  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    const newCount = row.exposure_count + 1;
    const newCorrect = row.correct_count + (wasCorrect ? 1 : 0);
    const newConf = Math.round((newCorrect / newCount) * 100);
    
    await db.query(
      'UPDATE topic_mastery SET confidence_score = $1, exposure_count = $2, correct_count = $3, last_reviewed = CURRENT_TIMESTAMP WHERE topic_name = $4',
      [newConf, newCount, newCorrect, topic]
    );
  } else {
    await db.query(
      'INSERT INTO topic_mastery (topic_name, confidence_score, exposure_count, correct_count) VALUES ($1, $2, $3, $4)',
      [topic, wasCorrect ? 100 : 0, 1, wasCorrect ? 1 : 0]
    );
  }
}

async function getWeakTopics(db, limit = 5) {
  const result = await db.query(
    'SELECT topic_name, confidence_score, exposure_count FROM topic_mastery ORDER BY confidence_score ASC, exposure_count DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

async function getProgressSummary(db) {
  const topics = await db.query('SELECT * FROM topic_mastery ORDER BY confidence_score ASC');
  const sessions = await db.query('SELECT COUNT(*) as total FROM sessions');
  const messages = await db.query("SELECT COUNT(*) as total FROM messages WHERE role = 'user'");
  
  const avgConf = topics.rows.length > 0 
    ? Math.round(topics.rows.reduce((a, b) => a + (b.exposure_count > 0 ? b.confidence_score : 0), 0) / topics.rows.length)
    : 0;
    
  return {
    sessions: parseInt(sessions.rows[0].total),
    totalMessages: parseInt(messages.rows[0].total),
    topicsCovered: topics.rows.length,
    averageConfidence: avgConf,
    weakTopics: topics.rows.filter(t => t.confidence_score < 60).map(t => t.topic_name),
    strongTopics: topics.rows.filter(t => t.confidence_score >= 80).map(t => t.topic_name)
  };
}

module.exports = {
  initDB,
  getDB,
  createSession,
  getLatestSession,
  getSessionMessages,
  addMessage,
  updateSessionProgress,
  recordTopicExposure,
  getWeakTopics,
  getProgressSummary
};

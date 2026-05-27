/**
 * SQLite 数据库层
 * 存储投资人偏好、Deal 记录、评分历史
 */

import Database from 'better-sqlite3';
import path from 'path';
import { DealCandidate, DealScore, InvestorPreferences } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'dealflow.db');

let db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initTables();
  }
  return db;
}

// ============ Row Types ============
interface PreferencesRow {
  id: string;
  sectors: string;
  stage: string;
  geography: string;
  signals: string;
  thesis: string | null;
  updated_at: string;
}

interface DealRow {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  source: string;
  url: string;
  metrics: string | null;
  timestamp: string;
  created_at: string;
  score: number | null;
  verdict: string | null;
  one_liner: string | null;
  strengths: string | null;
  risks: string | null;
  suggested_action: string | null;
}

interface BriefRow {
  id: number;
  content: string;
  deal_count: number;
  top_score: number;
  generated_at: string;
}

interface FeedbackRow {
  id: number;
  deal_id: string;
  signal: 'interested' | 'pass';
  created_at: string;
}

interface EventRow {
  id: number;
  event_type: string;
  event_data: string | null;
  page: string | null;
  created_at: string;
}

// ============ Schema ============
function initTables() {
  const database = getDB();

  database.exec(`
    CREATE TABLE IF NOT EXISTS investor_preferences (
      id TEXT PRIMARY KEY DEFAULT 'default',
      sectors TEXT NOT NULL DEFAULT '[]',
      stage TEXT NOT NULL DEFAULT 'Seed',
      geography TEXT NOT NULL DEFAULT 'Global',
      signals TEXT NOT NULL DEFAULT '[]',
      thesis TEXT DEFAULT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT,
      description TEXT,
      category TEXT,
      source TEXT NOT NULL,
      url TEXT,
      metrics TEXT,
      timestamp TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deal_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      verdict TEXT NOT NULL,
      one_liner TEXT,
      strengths TEXT DEFAULT '[]',
      risks TEXT DEFAULT '[]',
      suggested_action TEXT,
      scored_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id)
    );

    CREATE TABLE IF NOT EXISTS daily_briefs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      deal_count INTEGER,
      top_score INTEGER,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deal_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id TEXT NOT NULL,
      signal TEXT NOT NULL CHECK(signal IN ('interested', 'pass')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      event_data TEXT,
      page TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: add thesis column if missing (for existing DBs)
  try {
    database.prepare('SELECT thesis FROM investor_preferences LIMIT 1').get();
  } catch {
    database.exec('ALTER TABLE investor_preferences ADD COLUMN thesis TEXT DEFAULT NULL');
  }

  // Insert default preferences if not exists
  const existing = database.prepare('SELECT id FROM investor_preferences WHERE id = ?').get('default');
  if (!existing) {
    database.prepare(`
      INSERT INTO investor_preferences (id, sectors, stage, geography, signals)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'default',
      JSON.stringify(['AI/ML', 'Developer Tools', 'SaaS', 'Fintech']),
      'Pre-Seed / Seed',
      'Global',
      JSON.stringify(['Strong GitHub traction', 'Product Hunt #1', 'Repeat founders', 'Growing waitlist'])
    );
  }
}

// ============ Preferences CRUD ============
export function getPreferences(): InvestorPreferences | null {
  const row = getDB().prepare('SELECT * FROM investor_preferences WHERE id = ?').get('default') as PreferencesRow | undefined;
  if (!row) return null;
  return {
    sectors: JSON.parse(row.sectors),
    stage: row.stage,
    geography: row.geography,
    signals: JSON.parse(row.signals),
    thesis: row.thesis || undefined,
  };
}

export function updatePreferences(prefs: Partial<InvestorPreferences>): InvestorPreferences {
  const current = getPreferences();
  const updated: InvestorPreferences = {
    sectors: prefs.sectors ?? current?.sectors ?? [],
    stage: prefs.stage ?? current?.stage ?? 'Seed',
    geography: prefs.geography ?? current?.geography ?? 'Global',
    signals: prefs.signals ?? current?.signals ?? [],
    thesis: prefs.thesis ?? current?.thesis ?? undefined,
  };
  
  getDB().prepare(`
    UPDATE investor_preferences 
    SET sectors = ?, stage = ?, geography = ?, signals = ?, thesis = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    JSON.stringify(updated.sectors),
    updated.stage,
    updated.geography,
    JSON.stringify(updated.signals),
    updated.thesis || null,
    'default'
  );
  
  return updated;
}

// ============ Deals CRUD ============
export function saveDeal(deal: DealCandidate): void {
  getDB().prepare(`
    INSERT OR REPLACE INTO deals (id, name, tagline, description, category, source, url, metrics, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(deal.id, deal.name, deal.tagline, deal.description, deal.category, deal.source, deal.url, deal.metrics || null, deal.timestamp);
}

export function saveDealScore(dealId: string, score: DealScore): void {
  getDB().prepare(`
    INSERT INTO deal_scores (deal_id, score, verdict, one_liner, strengths, risks, suggested_action)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    dealId,
    score.score,
    score.verdict,
    score.oneLiner,
    JSON.stringify(score.strengths),
    JSON.stringify(score.risks),
    score.suggestedAction
  );
}

export function getRecentDeals(limit = 20): DealRow[] {
  return getDB().prepare(`
    SELECT d.*, ds.score, ds.verdict, ds.one_liner, ds.strengths, ds.risks, ds.suggested_action
    FROM deals d
    LEFT JOIN deal_scores ds ON d.id = ds.deal_id
    ORDER BY ds.score DESC, d.created_at DESC
    LIMIT ?
  `).all(limit) as DealRow[];
}

export function saveBrief(content: string, dealCount: number, topScore: number): void {
  getDB().prepare(`
    INSERT INTO daily_briefs (content, deal_count, top_score)
    VALUES (?, ?, ?)
  `).run(content, dealCount, topScore);
}

export function getLatestBrief(): BriefRow | undefined {
  return getDB().prepare(`
    SELECT * FROM daily_briefs ORDER BY generated_at DESC LIMIT 1
  `).get() as BriefRow | undefined;
}

export function getBriefById(id: number): BriefRow | undefined {
  return getDB().prepare(`
    SELECT * FROM daily_briefs WHERE id = ?
  `).get(id) as BriefRow | undefined;
}

export function listBriefs(limit = 30): { id: number; deal_count: number; top_score: number; generated_at: string }[] {
  return getDB().prepare(`
    SELECT id, deal_count, top_score, generated_at FROM daily_briefs ORDER BY generated_at DESC LIMIT ?
  `).all(limit) as { id: number; deal_count: number; top_score: number; generated_at: string }[];
}

// ============ Deal Feedback (飞轮入口) ============
export function saveFeedback(dealId: string, signal: 'interested' | 'pass'): void {
  // 先删除旧反馈（同一个 deal 只保留最新一条）
  getDB().prepare('DELETE FROM deal_feedback WHERE deal_id = ?').run(dealId);
  getDB().prepare(`
    INSERT INTO deal_feedback (deal_id, signal) VALUES (?, ?)
  `).run(dealId, signal);
}

export function deleteFeedback(dealId: string): void {
  getDB().prepare('DELETE FROM deal_feedback WHERE deal_id = ?').run(dealId);
}

export function getFeedback(dealId: string): FeedbackRow | undefined {
  return getDB().prepare(
    'SELECT * FROM deal_feedback WHERE deal_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(dealId) as FeedbackRow | undefined;
}

export function getFeedbackStats(): { interested: number; passed: number } {
  const interested = getDB().prepare(
    "SELECT COUNT(*) as count FROM deal_feedback WHERE signal = 'interested'"
  ).get() as { count: number };
  const passed = getDB().prepare(
    "SELECT COUNT(*) as count FROM deal_feedback WHERE signal = 'pass'"
  ).get() as { count: number };
  return { interested: interested.count, passed: passed.count };
}

export function getAllFeedback(): Record<string, 'interested' | 'pass'> {
  const rows = getDB().prepare(
    'SELECT deal_id, signal FROM deal_feedback'
  ).all() as { deal_id: string; signal: 'interested' | 'pass' }[];
  const result: Record<string, 'interested' | 'pass'> = {};
  for (const row of rows) {
    result[row.deal_id] = row.signal;
  }
  return result;
}

// ============ Feedback Patterns (飞轮闭环) ============
/**
 * 从历史反馈中提取投资人偏好模式，注入 scoring prompt
 * 例如："用户对 AI/ML 赛道的项目倾向于 interested（5/6 次）"
 */
export function getFeedbackPatterns(): string[] {
  const rows = getDB().prepare(`
    SELECT d.category, d.source, ds.verdict, df.signal, d.name
    FROM deal_feedback df
    JOIN deals d ON df.deal_id = d.id
    LEFT JOIN deal_scores ds ON d.id = ds.deal_id
    ORDER BY df.created_at DESC
    LIMIT 50
  `).all() as { category: string; source: string; verdict: string | null; signal: string; name: string }[];

  if (rows.length < 3) return []; // 数据不足，不生成模式

  const patterns: string[] = [];

  // 按赛道统计偏好
  const categoryStats: Record<string, { interested: number; pass: number }> = {};
  for (const row of rows) {
    if (!row.category) continue;
    if (!categoryStats[row.category]) categoryStats[row.category] = { interested: 0, pass: 0 };
    categoryStats[row.category][row.signal as 'interested' | 'pass']++;
  }
  for (const [cat, stats] of Object.entries(categoryStats)) {
    const total = stats.interested + stats.pass;
    if (total >= 2) {
      if (stats.interested > stats.pass) {
        patterns.push(`用户对「${cat}」赛道偏好明显（${stats.interested}/${total} 标记为感兴趣）`);
      } else if (stats.pass > stats.interested) {
        patterns.push(`用户对「${cat}」赛道兴趣较低（${stats.pass}/${total} 标记为跳过）`);
      }
    }
  }

  // 按来源统计
  const sourceStats: Record<string, { interested: number; pass: number }> = {};
  for (const row of rows) {
    if (!row.source) continue;
    if (!sourceStats[row.source]) sourceStats[row.source] = { interested: 0, pass: 0 };
    sourceStats[row.source][row.signal as 'interested' | 'pass']++;
  }
  for (const [src, stats] of Object.entries(sourceStats)) {
    const total = stats.interested + stats.pass;
    if (total >= 2 && stats.interested > stats.pass) {
      patterns.push(`来自「${src}」的项目更受用户青睐（${stats.interested}/${total}）`);
    }
  }

  // 评分校准：用户标记 interested 但系统评分低的情况
  const miscalibrated = rows.filter(r => r.signal === 'interested' && r.verdict === 'PASS');
  if (miscalibrated.length >= 2) {
    patterns.push(`注意：用户对 ${miscalibrated.length} 个被系统评为 PASS 的项目表示了兴趣，请适当放宽评分标准`);
  }

  return patterns;
}

// ============ Event Tracking (极简埋点) ============
export function trackEvent(eventType: string, eventData?: Record<string, unknown>, page?: string): void {
  getDB().prepare(`
    INSERT INTO events (event_type, event_data, page) VALUES (?, ?, ?)
  `).run(eventType, eventData ? JSON.stringify(eventData) : null, page || null);
}

export function getEventCounts(): Record<string, number> {
  const rows = getDB().prepare(`
    SELECT event_type, COUNT(*) as count FROM events GROUP BY event_type
  `).all() as { event_type: string; count: number }[];
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.event_type] = row.count;
  }
  return result;
}

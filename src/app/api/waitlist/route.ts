/**
 * /api/waitlist - Waitlist 收集
 * POST: 提交邮箱 + 痛点
 * GET: 获取 waitlist 统计
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// 确保 waitlist 表存在
function ensureWaitlistTable() {
  getDB().exec(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      role TEXT,
      pain_point TEXT,
      price_willing TEXT,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // 兼容旧表：如果 price_willing 列不存在则添加
  try {
    getDB().exec('ALTER TABLE waitlist ADD COLUMN price_willing TEXT');
  } catch {
    // 列已存在，忽略
  }
}

export async function POST(request: Request) {
  try {
    ensureWaitlistTable();
    const body = await request.json();
    const { email, role, painPoint, priceWilling, source } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = getDB().prepare('SELECT id FROM waitlist WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({
        success: true,
        message: '你已经在等待列表中了！我们会尽快联系你。',
        alreadyExists: true,
      });
    }

    getDB().prepare(`
      INSERT INTO waitlist (email, role, pain_point, price_willing, source)
      VALUES (?, ?, ?, ?, ?)
    `).run(email, role || null, painPoint || null, priceWilling || null, source || 'landing_page');

    const count = getDB().prepare('SELECT COUNT(*) as count FROM waitlist').get() as { count: number };

    return NextResponse.json({
      success: true,
      message: '已加入等待列表！',
      position: count.count,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    ensureWaitlistTable();
    const count = getDB().prepare('SELECT COUNT(*) as count FROM waitlist').get() as { count: number };
    return NextResponse.json({ success: true, count: count.count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

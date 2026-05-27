/**
 * /api/events - 极简事件追踪 API
 * POST: 记录事件
 * GET: 获取事件统计
 * 
 * 替代 PostHog/Mixpanel 的极简方案：
 * 先用 SQLite 自建，验证哪些指标重要后再迁移到专业工具
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { trackEvent, getEventCounts } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, eventData, page } = body;

    if (!eventType) {
      return NextResponse.json(
        { success: false, error: '缺少 eventType' },
        { status: 400 }
      );
    }

    trackEvent(eventType, eventData, page);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const counts = getEventCounts();
    return NextResponse.json({ success: true, counts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

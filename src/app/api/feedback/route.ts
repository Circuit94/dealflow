/**
 * /api/feedback - Deal 反馈 API（飞轮核心入口）
 * POST: 提交 interested/pass 反馈
 * GET: 获取反馈统计
 * 
 * 这是产品飞轮的关键入口：用户反馈 → 优化推荐 → 推荐更准 → 用户更依赖
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { saveFeedback, getFeedbackStats, getAllFeedback, trackEvent } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId, signal } = body;

    if (!dealId || !['interested', 'pass'].includes(signal)) {
      return NextResponse.json(
        { success: false, error: '参数错误：需要 dealId 和 signal (interested/pass)' },
        { status: 400 }
      );
    }

    saveFeedback(dealId, signal);

    // 同时记录事件用于分析
    trackEvent('deal_feedback', { dealId, signal }, 'dashboard');

    const stats = getFeedbackStats();

    return NextResponse.json({
      success: true,
      message: signal === 'interested' ? '已标记为感兴趣' : '已标记为跳过',
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = getFeedbackStats();
    const feedbackMap = getAllFeedback();
    return NextResponse.json({ success: true, stats, feedbackMap });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

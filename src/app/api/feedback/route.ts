/**
 * /api/feedback - Deal 反馈 API（飞轮核心入口）
 * POST: 提交 interested/pass 反馈（signal=null 时删除反馈）
 * GET: 获取反馈统计 + 全量反馈映射
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { saveFeedback, deleteFeedback, getFeedbackStats, getAllFeedback, trackEvent } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId, signal } = body;

    if (!dealId) {
      return NextResponse.json(
        { success: false, error: '参数错误：需要 dealId' },
        { status: 400 }
      );
    }

    // signal = null means "cancel feedback"
    if (signal === null) {
      deleteFeedback(dealId);
      trackEvent('deal_feedback_cancelled', { dealId }, 'dashboard');
      const stats = getFeedbackStats();
      return NextResponse.json({ success: true, message: '已取消反馈', stats });
    }

    if (!['interested', 'pass'].includes(signal)) {
      return NextResponse.json(
        { success: false, error: '参数错误：signal 必须是 interested/pass/null' },
        { status: 400 }
      );
    }

    saveFeedback(dealId, signal);
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

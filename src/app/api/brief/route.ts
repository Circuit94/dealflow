/**
 * /api/brief - 每日 Deal Brief 生成
 * GET: 获取最新 brief
 * POST: 生成新的 daily brief
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { generateDailyBrief, ScoredDeal } from '@/lib/deepseek';
import { getPreferences, getRecentDeals, saveBrief, getLatestBrief } from '@/lib/db';

export async function GET() {
  try {
    const brief = getLatestBrief();
    if (!brief) {
      return NextResponse.json({
        success: true,
        brief: null,
        message: 'No brief generated yet. Trigger a POST to generate one.',
      });
    }

    return NextResponse.json({
      success: true,
      brief: {
        content: brief.content,
        dealCount: brief.deal_count,
        topScore: brief.top_score,
        generatedAt: brief.generated_at,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const preferences = getPreferences();
    if (!preferences) {
      return NextResponse.json(
        { success: false, error: 'No investor preferences set' },
        { status: 400 }
      );
    }

    // Get recently scored deals
    const recentDeals = getRecentDeals(20);
    
    if (recentDeals.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No scored deals found. Run /api/deals POST first.' },
        { status: 400 }
      );
    }

    // Convert to ScoredDeal format
    const scoredDeals: ScoredDeal[] = recentDeals
      .filter(d => d.score !== null)
      .map(d => ({
        deal: {
          id: d.id,
          name: d.name,
          tagline: d.tagline,
          description: d.description,
          category: d.category,
          source: d.source as ScoredDeal['deal']['source'],
          url: d.url,
          metrics: d.metrics || undefined,
          timestamp: d.timestamp,
        },
        score: {
          score: d.score!,
          verdict: d.verdict as ScoredDeal['score']['verdict'],
          oneLiner: d.one_liner || '',
          strengths: d.strengths ? JSON.parse(d.strengths) : [],
          risks: d.risks ? JSON.parse(d.risks) : [],
          suggestedAction: d.suggested_action || '',
        },
      }));

    // Generate brief via DeepSeek
    const briefContent = await generateDailyBrief(scoredDeals, preferences);
    const topScore = Math.max(...scoredDeals.map(d => d.score.score));

    // Persist
    saveBrief(briefContent, scoredDeals.length, topScore);

    return NextResponse.json({
      success: true,
      brief: {
        content: briefContent,
        dealCount: scoredDeals.length,
        topScore,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

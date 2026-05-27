/**
 * /api/brief - 每日 Deal Brief 生成
 * GET: 获取最新 brief（?id=N 获取指定 brief，?list=true 获取历史列表）
 * POST: 生成新的 daily brief
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { generateDailyBrief, ScoredDeal } from '@/lib/deepseek';
import { getPreferences, getRecentDeals, saveBrief, getLatestBrief, getBriefById, listBriefs } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // List all briefs (metadata only)
    if (searchParams.get('list') === 'true') {
      const briefs = listBriefs(30);
      return NextResponse.json({
        success: true,
        briefs: briefs.map(b => ({
          id: b.id,
          dealCount: b.deal_count,
          topScore: b.top_score,
          generatedAt: b.generated_at,
        })),
      });
    }

    // Get specific brief by ID
    const idParam = searchParams.get('id');
    if (idParam) {
      const brief = getBriefById(Number(idParam));
      if (!brief) {
        return NextResponse.json({ success: false, error: 'Brief not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        brief: {
          id: brief.id,
          content: brief.content,
          dealCount: brief.deal_count,
          topScore: brief.top_score,
          generatedAt: brief.generated_at,
        },
      });
    }

    // Default: get latest brief
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
        id: brief.id,
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

    const recentDeals = getRecentDeals(20);
    
    if (recentDeals.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No scored deals found. Run /api/deals POST first.' },
        { status: 400 }
      );
    }

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

    const briefContent = await generateDailyBrief(scoredDeals, preferences);
    const topScore = Math.max(...scoredDeals.map(d => d.score.score));

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

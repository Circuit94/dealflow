/**
 * /api/deals - Deal 抓取 + AI 评分 API
 * GET: 获取已评分的 deals
 * POST: 触发新一轮抓取和评分
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { fetchAllDeals } from '@/lib/sources';
import { scoreDeal, ScoredDeal } from '@/lib/deepseek';
import { getPreferences, saveDeal, saveDealScore, getRecentDeals } from '@/lib/db';

export async function GET() {
  try {
    const deals = getRecentDeals(20);
    return NextResponse.json({
      success: true,
      deals: deals.map((d) => ({
        ...d,
        strengths: d.strengths ? JSON.parse(d.strengths) : [],
        risks: d.risks ? JSON.parse(d.risks) : [],
      })),
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

    // 1. Fetch from all data sources
    const rawDeals = await fetchAllDeals();

    // 2. AI scoring (batched to avoid rate limits)
    const scoredDeals: ScoredDeal[] = [];
    const batchSize = 3;

    for (let i = 0; i < rawDeals.length; i += batchSize) {
      const batch = rawDeals.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (deal) => {
          const score = await scoreDeal(deal, preferences);
          return { deal, score };
        })
      );
      scoredDeals.push(...results);
    }

    // 3. Persist results
    for (const { deal, score } of scoredDeals) {
      saveDeal(deal);
      saveDealScore(deal.id, score);
    }

    // 4. Return sorted results
    const sorted = scoredDeals.sort((a, b) => b.score.score - a.score.score);

    return NextResponse.json({
      success: true,
      total: sorted.length,
      strongMatches: sorted.filter(d => d.score.verdict === 'STRONG_MATCH').length,
      deals: sorted.slice(0, 10),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

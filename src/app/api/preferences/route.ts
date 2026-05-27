/**
 * /api/preferences - 投资人偏好管理
 * GET: 获取当前偏好
 * PUT: 更新偏好
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPreferences, updatePreferences } from '@/lib/db';

export async function GET() {
  try {
    const prefs = getPreferences();
    return NextResponse.json({ success: true, preferences: prefs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = updatePreferences(body);
    return NextResponse.json({ success: true, preferences: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

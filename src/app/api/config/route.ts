/**
 * /api/config - API 配置管理
 * GET: 获取当前配置状态（不返回完整 key，只返回是否已配置）
 * PUT: 更新 API 配置
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getConfig, updateConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = getConfig();
    return NextResponse.json({
      success: true,
      config: {
        deepseekConfigured: !!config.deepseekApiKey && config.deepseekApiKey !== 'your_deepseek_api_key_here',
        deepseekKeyPreview: config.deepseekApiKey
          ? config.deepseekApiKey.slice(0, 6) + '***' + config.deepseekApiKey.slice(-4)
          : '',
        deepseekBaseUrl: config.deepseekBaseUrl,
        deepseekModel: config.deepseekModel,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    updateConfig(body);
    const config = getConfig();
    return NextResponse.json({
      success: true,
      config: {
        deepseekConfigured: !!config.deepseekApiKey && config.deepseekApiKey !== 'your_deepseek_api_key_here',
        deepseekKeyPreview: config.deepseekApiKey
          ? config.deepseekApiKey.slice(0, 6) + '***' + config.deepseekApiKey.slice(-4)
          : '',
        deepseekBaseUrl: config.deepseekBaseUrl,
        deepseekModel: config.deepseekModel,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

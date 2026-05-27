/**
 * DeepSeek API Client
 * 用于 Deal 筛选和 Brief 生成
 */

import { getFeedbackPatterns } from './db';
export type { DealCandidate, InvestorPreferences, DealScore, ScoredDeal } from './types';
import type { DealCandidate, InvestorPreferences, DealScore, ScoredDeal } from './types';

// ============ Config ============
import { getConfig, isApiConfigured } from './config';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// ============ Core API ============
export async function chat(messages: Message[], temperature = 0.7): Promise<string> {
  if (!isApiConfigured()) {
    throw new Error(
      '请先配置 DeepSeek API Key。前往「设置」页面填写，或在 .env.local 中设置 DEEPSEEK_API_KEY。' +
      '获取地址：https://platform.deepseek.com/api_keys'
    );
  }

  const config = getConfig();

  const response = await fetch(`${config.deepseekBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: config.deepseekModel,
      messages,
      temperature,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`DeepSeek API 调用失败 (${response.status}): ${errorText}`);
  }

  const data: DeepSeekResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

// ============ Deal Scoring ============

export async function scoreDeal(deal: DealCandidate, preferences: InvestorPreferences): Promise<DealScore> {
  // Feedback loop: inject learned patterns from user's past 👍/👎
  const patterns = getFeedbackPatterns();
  const feedbackContext = patterns.length > 0
    ? `\n\n投资人历史反馈模式（请据此调整评分权重）：\n${patterns.map(p => `- ${p}`).join('\n')}`
    : '';

  const prompt = `你是一位经验丰富的 VC 分析师。请根据投资人的偏好，对以下项目进行评分和分析。

投资人偏好：
- 关注赛道：${preferences.sectors.join(', ')}
- 投资阶段：${preferences.stage}
- 地域偏好：${preferences.geography}
- 关注信号：${preferences.signals.join(', ')}${feedbackContext}

项目信息：
- 名称：${deal.name}
- 一句话描述：${deal.tagline}
- 来源：${deal.source}
- 赛道：${deal.category}
- 详细描述：${deal.description}
${deal.metrics ? `- 关键指标：${deal.metrics}` : ''}

请输出 JSON 格式（不要 markdown 代码块）：
{
  "score": 0-100的匹配分数,
  "verdict": "STRONG_MATCH" | "MODERATE_MATCH" | "WEAK_MATCH" | "PASS",
  "oneLiner": "一句话总结为什么值得/不值得关注",
  "strengths": ["优势1", "优势2"],
  "risks": ["风险1", "风险2"],
  "suggestedAction": "建议的下一步动作"
}`;

  const result = await chat([
    { role: 'system', content: '你是一位专业的 VC 投资分析师，擅长快速评估早期项目。输出严格 JSON 格式。' },
    { role: 'user', content: prompt },
  ], 0.3);

  try {
    const parsed = JSON.parse(result) as DealScore;
    // Validate required fields
    if (typeof parsed.score !== 'number' || !parsed.verdict) {
      throw new Error('Invalid response structure');
    }
    return {
      score: Math.min(100, Math.max(0, parsed.score)),
      verdict: parsed.verdict,
      oneLiner: parsed.oneLiner || '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      suggestedAction: parsed.suggestedAction || '',
    };
  } catch {
    return {
      score: 50,
      verdict: 'MODERATE_MATCH',
      oneLiner: '无法完成自动分析，建议人工查看',
      strengths: [],
      risks: [],
      suggestedAction: '手动查看项目详情',
    };
  }
}

// ============ Daily Brief Generation ============
const SCORE_THRESHOLD = parseInt(process.env.DEAL_SCORE_THRESHOLD || '60', 10);

export async function generateDailyBrief(deals: ScoredDeal[], preferences: InvestorPreferences): Promise<string> {
  const topDeals = deals
    .filter(d => d.score.score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score.score - a.score.score)
    .slice(0, 5);

  if (topDeals.length === 0) {
    return '今日暂无高匹配度项目。建议调整偏好设置或等待明日更新。';
  }

  const dealsText = topDeals.map((d, i) => 
    `${i + 1}. ${d.deal.name} (${d.score.score}分/${d.score.verdict})
   描述：${d.deal.tagline}
   亮点：${d.score.oneLiner}
   来源：${d.deal.source}`
  ).join('\n\n');

  const prompt = `请为投资人生成今日的 Deal Brief 摘要邮件。要求：
1. 开头用一句话总结今天的市场信号
2. 按优先级列出值得关注的项目
3. 每个项目给出"为什么现在值得看"的理由
4. 结尾给出一个市场趋势观察

投资人关注：${preferences.sectors.join(', ')}
今日筛选结果：
${dealsText}`;

  return await chat([
    { role: 'system', content: '你是一位顶级 VC 的投资助理，擅长写简洁有洞察力的 deal brief。语言风格：专业但不啰嗦，有观点，像给合伙人写的内部 memo。' },
    { role: 'user', content: prompt },
  ]);
}

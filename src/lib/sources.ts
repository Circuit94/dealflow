/**
 * 数据源抓取模块
 * MVP 阶段：Product Hunt API + GitHub Trending 页面解析
 * 后续可扩展：Crunchbase, Twitter/X, HackerNews
 */

import { DealCandidate } from './deepseek';

// ============ Types for external APIs ============
interface ProductHuntNode {
  id: string;
  name: string;
  tagline: string;
  description: string | null;
  url: string;
  votesCount: number;
  topics: { edges: Array<{ node: { name: string } }> } | null;
  createdAt: string;
}

interface GitHubTrendingRepo {
  author: string;
  name: string;
  description: string | null;
  language: string | null;
  url: string | null;
  stars: number;
  currentPeriodStars: number;
}

// ============ Product Hunt ============
export async function fetchProductHuntDeals(): Promise<DealCandidate[]> {
  const apiKey = process.env.PRODUCTHUNT_API_KEY;

  // If no API key, use sample data (great for demos)
  if (!apiKey) {
    return getSampleProductHuntDeals();
  }

  try {
    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `{
          posts(order: VOTES, first: 20) {
            edges {
              node {
                id
                name
                tagline
                description
                url
                votesCount
                topics { edges { node { name } } }
                createdAt
              }
            }
          }
        }`,
      }),
    });

    if (!response.ok) {
      console.warn('[DealFlow] Product Hunt API returned', response.status, '— using sample data');
      return getSampleProductHuntDeals();
    }

    const data = await response.json();
    const edges: Array<{ node: ProductHuntNode }> = data?.data?.posts?.edges || [];

    return edges.map((edge) => ({
      id: `ph_${edge.node.id}`,
      name: edge.node.name,
      tagline: edge.node.tagline,
      description: edge.node.description || edge.node.tagline,
      category: edge.node.topics?.edges?.[0]?.node?.name || 'General',
      source: 'product_hunt' as const,
      url: edge.node.url,
      metrics: `${edge.node.votesCount} upvotes`,
      timestamp: edge.node.createdAt,
    }));
  } catch (error) {
    console.warn('[DealFlow] Product Hunt fetch failed:', error instanceof Error ? error.message : error);
    return getSampleProductHuntDeals();
  }
}

// ============ GitHub Trending ============
export async function fetchGitHubTrending(): Promise<DealCandidate[]> {
  try {
    const response = await fetch(
      'https://api.gitterapp.com/repositories?language=&since=daily'
    );

    if (!response.ok) {
      console.warn('[DealFlow] GitHub trending API returned', response.status, '— using sample data');
      return getSampleGitHubDeals();
    }

    const repos: GitHubTrendingRepo[] = await response.json();

    return repos.slice(0, 15).map((repo) => ({
      id: `gh_${repo.author}_${repo.name}`,
      name: `${repo.author}/${repo.name}`,
      tagline: repo.description || 'No description',
      description: repo.description || '',
      category: repo.language || 'General',
      source: 'github' as const,
      url: repo.url || `https://github.com/${repo.author}/${repo.name}`,
      metrics: `⭐ ${repo.stars} stars, +${repo.currentPeriodStars} today`,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.warn('[DealFlow] GitHub trending fetch failed:', error instanceof Error ? error.message : error);
    return getSampleGitHubDeals();
  }
}

// ============ Aggregate All Sources ============
export async function fetchAllDeals(): Promise<DealCandidate[]> {
  const [phDeals, ghDeals] = await Promise.all([
    fetchProductHuntDeals(),
    fetchGitHubTrending(),
  ]);

  return [...phDeals, ...ghDeals];
}

// ============ Sample Data for MVP Demo ============
function getSampleProductHuntDeals(): DealCandidate[] {
  return [
    {
      id: 'ph_demo_1',
      name: 'Granola 2.0',
      tagline: 'AI notepad for meetings that actually works',
      description: 'Granola enhances your meeting notes with AI. It listens to your meetings, understands context, and helps you capture everything important without typing during the call.',
      category: 'Productivity',
      source: 'product_hunt',
      url: 'https://www.producthunt.com/posts/granola-2-0',
      metrics: '1,247 upvotes',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'ph_demo_2',
      name: 'Lovable',
      tagline: 'Build full-stack web apps from a single prompt',
      description: 'Lovable is the AI-powered full-stack engineer. Describe what you want to build in plain English and get a production-ready web app with frontend, backend, database, and auth.',
      category: 'Developer Tools',
      source: 'product_hunt',
      url: 'https://www.producthunt.com/posts/lovable',
      metrics: '2,891 upvotes',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'ph_demo_3',
      name: 'Pika 2.0',
      tagline: 'Turn any idea into a video with AI',
      description: 'Pika 2.0 introduces scene-level editing, lip sync, and cinematic camera controls. Create professional videos from text, images, or existing clips.',
      category: 'AI / Video',
      source: 'product_hunt',
      url: 'https://www.producthunt.com/posts/pika-2-0',
      metrics: '1,856 upvotes',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'ph_demo_4',
      name: 'Cal.com v4',
      tagline: 'Open-source scheduling infrastructure',
      description: 'Cal.com is the scheduling infrastructure for everyone. Self-hosted or cloud, white-label ready. Now with AI-powered scheduling that understands your preferences.',
      category: 'SaaS / Scheduling',
      source: 'product_hunt',
      url: 'https://www.producthunt.com/posts/cal-com-v4',
      metrics: '987 upvotes',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'ph_demo_5',
      name: 'Fleeting Notes',
      tagline: 'Voice-first note taking that syncs to Obsidian',
      description: 'Capture thoughts on the go with voice. AI transcribes and organizes your notes, then syncs directly to your Obsidian vault with proper linking.',
      category: 'Productivity / PKM',
      source: 'product_hunt',
      url: 'https://www.producthunt.com/posts/fleeting-notes',
      metrics: '634 upvotes',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'ph_demo_6',
      name: 'Stripe Agent Toolkit',
      tagline: 'Let AI agents handle payments and billing',
      description: 'Official Stripe SDK for AI agents. Enable your AI to create payment links, manage subscriptions, issue refunds, and handle complex billing logic autonomously.',
      category: 'Fintech / Developer Tools',
      source: 'product_hunt',
      url: 'https://www.producthunt.com/posts/stripe-agent-toolkit',
      metrics: '1,123 upvotes',
      timestamp: new Date().toISOString(),
    },
  ];
}

function getSampleGitHubDeals(): DealCandidate[] {
  return [
    {
      id: 'gh_demo_1',
      name: 'browser-use/browser-use',
      tagline: 'Make websites accessible for AI agents',
      description: 'Browser Use is a Python library that enables AI agents to interact with websites. It provides a simple API for navigating, clicking, typing, and extracting data from web pages.',
      category: 'Python / AI Agent',
      source: 'github',
      url: 'https://github.com/browser-use/browser-use',
      metrics: '⭐ 28,400 stars, +1,200 today',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'gh_demo_2',
      name: 'Lum1104/Understand-Anything',
      tagline: 'Turn any code into an interactive knowledge graph',
      description: 'Graphs that teach > graphs that impress. Turn any code into an interactive knowledge graph you can explore, search, and ask questions about.',
      category: 'TypeScript / Developer Tools',
      source: 'github',
      url: 'https://github.com/Lum1104/Understand-Anything',
      metrics: '⭐ 21,800 stars, +890 today',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'gh_demo_3',
      name: 'anthropics/claude-code',
      tagline: 'An agentic coding tool by Anthropic',
      description: 'Claude Code is an agentic coding tool that lives in your terminal. It understands your codebase, can edit files, run commands, and help you code faster.',
      category: 'TypeScript / AI Coding',
      source: 'github',
      url: 'https://github.com/anthropics/claude-code',
      metrics: '⭐ 45,200 stars, +2,100 today',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'gh_demo_4',
      name: 'n8n-io/n8n',
      tagline: 'Fair-code workflow automation platform',
      description: 'n8n is a free and source-available workflow automation tool. Easily automate tasks across different services with a visual builder and AI capabilities.',
      category: 'TypeScript / Automation',
      source: 'github',
      url: 'https://github.com/n8n-io/n8n',
      metrics: '⭐ 52,100 stars, +450 today',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'gh_demo_5',
      name: 'jina-ai/reader',
      tagline: 'Convert any URL to LLM-friendly input',
      description: 'Reader converts any URL to an LLM-friendly input with a simple prefix. It handles JavaScript rendering, removes clutter, and outputs clean markdown.',
      category: 'TypeScript / AI Infrastructure',
      source: 'github',
      url: 'https://github.com/jina-ai/reader',
      metrics: '⭐ 18,900 stars, +320 today',
      timestamp: new Date().toISOString(),
    },
  ];
}

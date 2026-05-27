/**
 * 运行时配置管理
 * 支持通过界面动态设置 API key，无需重启服务
 */

interface AppConfig {
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
}

// 运行时配置（内存中，优先级高于 env）
let runtimeConfig: Partial<AppConfig> = {};

export function getConfig(): AppConfig {
  return {
    deepseekApiKey: runtimeConfig.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '',
    deepseekBaseUrl: runtimeConfig.deepseekBaseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    deepseekModel: runtimeConfig.deepseekModel || process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  };
}

export function updateConfig(updates: Partial<AppConfig>): void {
  if (updates.deepseekApiKey !== undefined) {
    runtimeConfig.deepseekApiKey = updates.deepseekApiKey;
  }
  if (updates.deepseekBaseUrl !== undefined) {
    runtimeConfig.deepseekBaseUrl = updates.deepseekBaseUrl;
  }
  if (updates.deepseekModel !== undefined) {
    runtimeConfig.deepseekModel = updates.deepseekModel;
  }
}

export function isApiConfigured(): boolean {
  const config = getConfig();
  return !!config.deepseekApiKey && config.deepseekApiKey !== 'your_deepseek_api_key_here';
}

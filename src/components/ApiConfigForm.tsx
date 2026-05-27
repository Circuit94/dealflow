'use client';

import { useState, useEffect } from 'react';

interface ApiConfig {
  deepseekConfigured: boolean;
  deepseekKeyPreview: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
}

interface ApiConfigFormProps {
  config: ApiConfig | null;
  onSaved: (config: ApiConfig) => void;
}

export function ApiConfigForm({ config, onSaved }: ApiConfigFormProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('https://api.deepseek.com');
  const [modelInput, setModelInput] = useState('deepseek-chat');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (config) {
      setBaseUrlInput(config.deepseekBaseUrl);
      setModelInput(config.deepseekModel);
    }
  }, [config]);

  useEffect(() => {
    if (msg && msg.includes('成功')) {
      const timer = setTimeout(() => setMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deepseekApiKey: apiKeyInput || undefined,
          deepseekBaseUrl: baseUrlInput || undefined,
          deepseekModel: modelInput || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved(data.config);
        setMsg('✅ 配置保存成功！');
        setApiKeyInput('');
      } else {
        setMsg(`❌ 保存失败：${data.error}`);
      }
    } catch {
      setMsg('❌ 保存失败，请检查网络');
    }
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">API 配置</h2>
      <p className="text-sm text-gray-500 mb-6">
        配置 DeepSeek API 以启用 AI 评分和简报生成功能。
        <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline ml-1">
          获取 API Key →
        </a>
      </p>

      {/* Status */}
      <div className={`p-4 rounded-lg mb-6 ${config?.deepseekConfigured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-center gap-2">
          <span>{config?.deepseekConfigured ? '✅' : '⚠️'}</span>
          <span className={`text-sm font-medium ${config?.deepseekConfigured ? 'text-green-700' : 'text-yellow-700'}`}>
            {config?.deepseekConfigured
              ? `已配置 (${config.deepseekKeyPreview})`
              : '未配置 — 请填写 API Key 后保存'}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DeepSeek API Key</label>
          <input
            type="password"
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            placeholder={config?.deepseekConfigured ? '已配置，留空则不修改' : '请输入 sk-...'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API 地址</label>
          <input
            type="text"
            value={baseUrlInput}
            onChange={e => setBaseUrlInput(e.target.value)}
            placeholder="https://api.deepseek.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">支持兼容 OpenAI 格式的第三方 API 地址</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
          <input
            type="text"
            value={modelInput}
            onChange={e => setModelInput(e.target.value)}
            placeholder="deepseek-chat"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">可选：deepseek-chat、deepseek-reasoner 等</p>
        </div>

        {msg && (
          <div className={`text-sm px-4 py-3 rounded-lg transition-opacity ${msg.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg}
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
}

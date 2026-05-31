'use client';

import { useState, useEffect } from 'react';

interface Preferences {
  sectors: string[];
  stage: string;
  geography: string;
  signals: string[];
  thesis?: string;
}

interface PreferencesFormProps {
  preferences: Preferences | null;
  onSaved: (prefs: Preferences) => void;
  onTrack: (event: string, data?: Record<string, unknown>) => void;
}

export function PreferencesForm({ preferences, onSaved, onTrack }: PreferencesFormProps) {
  const [editSectors, setEditSectors] = useState('');
  const [editStage, setEditStage] = useState('');
  const [editGeo, setEditGeo] = useState('');
  const [editSignals, setEditSignals] = useState('');
  const [editThesis, setEditThesis] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (preferences) {
      setEditSectors(preferences.sectors?.join(', ') || '');
      setEditStage(preferences.stage || '');
      setEditGeo(preferences.geography || '');
      setEditSignals(preferences.signals?.join(', ') || '');
      setEditThesis(preferences.thesis || '');
    }
  }, [preferences]);

  // Auto-dismiss success message
  useEffect(() => {
    if (msg && msg.includes('已保存')) {
      const timer = setTimeout(() => setMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        sectors: editSectors.split(',').map(s => s.trim()).filter(Boolean),
        stage: editStage.trim(),
        geography: editGeo.trim(),
        signals: editSignals.split(',').map(s => s.trim()).filter(Boolean),
        thesis: editThesis.trim(),
      };
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        onSaved(data.preferences);
        setMsg('✅ 已保存！下次扫描将使用你更新后的偏好设置。');
        onTrack('preferences_updated', payload);
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
      <h2 className="text-lg font-semibold text-gray-900 mb-2">投资偏好设置</h2>
      <p className="text-sm text-gray-500 mb-6">你的选择直接影响 AI 评分权重 — 越精确，推荐越准。</p>

      <div className="space-y-6">
        {/* Thesis free-text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">投资论点（自由描述）</label>
          <p className="text-xs text-gray-400 mb-2">用你自己的话描述你的投资偏好。这段文字会直接注入 AI 评分提示词，实现最大程度的个性化。</p>
          <textarea
            value={editThesis}
            onChange={e => setEditThesis(e.target.value)}
            placeholder="例如：我关注有 PLG 模式的 B2B SaaS，偏好技术背景强的创始人，有早期收入。喜欢解决中小企业工作流问题的公司。"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
          />
        </div>

        {/* Sectors */}
        <TagField
          label="关注赛道"
          tags={['AI/ML', '开发者工具', 'SaaS', '金融科技', '健康科技', '教育科技', 'Web3/加密', '电商', '气候科技', '消费', '企业服务', '平台/市场']}
          value={editSectors}
          onChange={setEditSectors}
          multi
          color="indigo"
          placeholder="也可手动输入，逗号分隔"
        />

        {/* Stage */}
        <TagField
          label="投资阶段"
          tags={['天使轮', '种子轮', 'A 轮', 'B 轮', '成长期']}
          value={editStage}
          onChange={setEditStage}
          multi={false}
          color="indigo"
          placeholder="也可手动输入"
        />

        {/* Geography */}
        <TagField
          label="地域偏好"
          tags={['全球', '北美', '欧洲', '亚洲', '中国', '东南亚', '印度', '拉美']}
          value={editGeo}
          onChange={setEditGeo}
          multi={false}
          color="indigo"
          placeholder="也可手动输入"
        />

        {/* Signals */}
        <TagField
          label="关注信号"
          tags={['GitHub 高增长', 'Product Hunt #1', '连续创业者', '等候名单增长快', '已有收入', '顶级加速器校友', '病毒式增长', '技术团队强']}
          value={editSignals}
          onChange={setEditSignals}
          multi
          color="green"
          placeholder="也可手动输入，逗号分隔"
        />

        {msg && (
          <div className={`text-sm px-4 py-3 rounded-lg transition-opacity ${msg.includes('已保存') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg}
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存偏好设置'}
        </button>
      </div>
    </div>
  );
}

// ============ Reusable Tag Field ============
function TagField({
  label,
  tags,
  value,
  onChange,
  multi,
  color,
  placeholder,
}: {
  label: string;
  tags: string[];
  value: string;
  onChange: (v: string) => void;
  multi: boolean;
  color: 'indigo' | 'green';
  placeholder: string;
}) {
  const selectedColor = color === 'indigo'
    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
    : 'bg-green-100 text-green-700 border-green-300';
  const hoverColor = color === 'indigo'
    ? 'hover:border-indigo-300 hover:text-indigo-600'
    : 'hover:border-green-300 hover:text-green-600';

  if (multi) {
    const selected = value.split(',').map(s => s.trim()).filter(Boolean);
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => {
            const isSelected = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    onChange(selected.filter(s => s !== tag).join(', '));
                  } else {
                    onChange([...selected, tag].join(', '));
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isSelected ? selectedColor : `bg-gray-50 text-gray-600 border-gray-200 ${hoverColor}`
                }`}
              >
                {isSelected ? '✓ ' : ''}{tag}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
      </div>
    );
  }

  // Single select
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              value === tag ? selectedColor : `bg-gray-50 text-gray-600 border-gray-200 ${hoverColor}`
            }`}
          >
            {value === tag ? '✓ ' : ''}{tag}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />
    </div>
  );
}

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
    if (msg && msg.includes('Saved')) {
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
        setMsg('✅ Saved! Next scan will use your updated preferences.');
        onTrack('preferences_updated', payload);
      } else {
        setMsg(`❌ Save failed: ${data.error}`);
      }
    } catch {
      setMsg('❌ Save failed, check network');
    }
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Investment Preferences</h2>
      <p className="text-sm text-gray-500 mb-6">Your choices directly influence AI scoring weights — the more precise, the better the recommendations.</p>

      <div className="space-y-6">
        {/* Thesis free-text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Investment Thesis (free-text)</label>
          <p className="text-xs text-gray-400 mb-2">Describe your unique thesis in your own words. This is injected directly into the AI scoring prompt for maximum personalization.</p>
          <textarea
            value={editThesis}
            onChange={e => setEditThesis(e.target.value)}
            placeholder="e.g. I look for B2B SaaS with PLG motion, strong technical founders, and early revenue. Prefer companies solving workflow problems for SMBs."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
          />
        </div>

        {/* Sectors */}
        <TagField
          label="Sectors"
          tags={['AI/ML', 'Developer Tools', 'SaaS', 'Fintech', 'Health Tech', 'EdTech', 'Web3/Crypto', 'E-commerce', 'Climate Tech', 'Consumer', 'Enterprise', 'Marketplace']}
          value={editSectors}
          onChange={setEditSectors}
          multi
          color="indigo"
          placeholder="Or type custom, comma-separated"
        />

        {/* Stage */}
        <TagField
          label="Stage"
          tags={['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth']}
          value={editStage}
          onChange={setEditStage}
          multi={false}
          color="indigo"
          placeholder="Or type custom stage"
        />

        {/* Geography */}
        <TagField
          label="Geography"
          tags={['Global', 'North America', 'Europe', 'Asia', 'China', 'Southeast Asia', 'India', 'LATAM']}
          value={editGeo}
          onChange={setEditGeo}
          multi={false}
          color="indigo"
          placeholder="Or type custom geography"
        />

        {/* Signals */}
        <TagField
          label="Signals to watch"
          tags={['Strong GitHub traction', 'Product Hunt #1', 'Repeat founders', 'Growing waitlist', 'Revenue generating', 'Top accelerator alumni', 'Viral growth', 'Strong technical team']}
          value={editSignals}
          onChange={setEditSignals}
          multi
          color="green"
          placeholder="Or type custom, comma-separated"
        />

        {msg && (
          <div className={`text-sm px-4 py-3 rounded-lg transition-opacity ${msg.includes('Saved') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg}
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
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

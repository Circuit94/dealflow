'use client';

import DOMPurify from 'dompurify';

interface BriefSectionProps {
  content: string;
  dealNames?: string[];
  onDealClick?: (dealName: string) => void;
}

export function BriefSection({ content, dealNames = [], onDealClick }: BriefSectionProps) {
  const sections = parseBriefSections(content);

  // Event delegation for deal-link clicks
  function handleClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('deal-link') && target.dataset.deal && onDealClick) {
      e.preventDefault();
      onDealClick(target.dataset.deal);
    }
  }

  if (sections.length === 0) {
    return (
      <div
        onClick={handleClick}
        className="prose prose-sm max-w-none text-gray-700 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_hr]:my-4 [&_hr]:border-gray-200 [&_.deal-link]:text-indigo-600 [&_.deal-link]:cursor-pointer [&_.deal-link]:underline [&_.deal-link:hover]:text-indigo-800"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content, dealNames, onDealClick) }}
      />
    );
  }

  return (
    <div className="space-y-4" onClick={handleClick}>
      {sections.map((section, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          {section.title && (
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{section.title}</h3>
          )}
          <div
            className="text-sm text-gray-700 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_.deal-link]:text-indigo-600 [&_.deal-link]:cursor-pointer [&_.deal-link]:underline [&_.deal-link:hover]:text-indigo-800"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(section.body, dealNames, onDealClick) }}
          />
        </div>
      ))}
    </div>
  );
}

function parseBriefSections(content: string): { title: string; body: string }[] {
  const lines = content.split('\n');
  const sections: { title: string; body: string }[] = [];
  let currentTitle = '';
  let currentBody: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);

    if (headingMatch) {
      if (currentTitle || currentBody.length > 0) {
        sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
      }
      currentTitle = headingMatch[1];
      currentBody = [];
    } else if (line.match(/^---$/)) {
      if (currentTitle || currentBody.length > 0) {
        sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
      }
      currentTitle = '';
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  if (currentTitle || currentBody.length > 0) {
    sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
  }

  return sections.filter(s => s.title || s.body.trim());
}

function renderMarkdown(text: string, dealNames: string[], onDealClick?: (name: string) => void): string {
  let html = text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-4 border-gray-200" />')
    // Headings
    .replace(/^## (.+)$/gm, '<h3 class="text-base font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
    // Bullet lists
    .replace(/^[-•] (.+)$/gm, '<div class="flex items-start gap-2 mt-1"><span class="text-gray-400 shrink-0">•</span><span>$1</span></div>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<div class="mt-2"><span class="font-medium text-gray-900">$1. $2</span></div>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">$1</a>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    // Newlines
    .replace(/\n/g, '<br />');

  // Make deal names clickable (link to deals tab)
  if (onDealClick && dealNames.length > 0) {
    // Sort by length descending to avoid partial matches
    const sorted = [...dealNames].sort((a, b) => b.length - a.length);
    for (const name of sorted) {
      // Escape special regex chars in name
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Only replace if not already inside an HTML tag
      const regex = new RegExp(`(?<![">])\\b(${escaped})\\b(?![<"])`, 'g');
      html = html.replace(regex, `<span class="deal-link" data-deal="$1">$1</span>`);
    }
  }

  // Sanitize with DOMPurify
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'em', 'hr', 'h3', 'div', 'span', 'a', 'code', 'br'],
    ALLOWED_ATTR: ['class', 'href', 'target', 'rel', 'data-deal'],
  });
}

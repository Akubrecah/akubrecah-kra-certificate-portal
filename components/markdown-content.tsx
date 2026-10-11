import React from 'react';
import { marked } from 'marked';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

// Configure marked options for optimal GitHub-flavored output
marked.setOptions({
  gfm: true,
  breaks: true,
});

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  if (!content) return null;

  // Pre-process any GitHub specific callouts e.g. > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING]
  const enhanced = content
    .replace(
      /> \[!NOTE\]\s*\n((?:> .*\n?)*)/gi,
      '<div class="github-alert alert-note"><div class="alert-title">📘 Note</div>$1</div>'
    )
    .replace(
      /> \[!TIP\]\s*\n((?:> .*\n?)*)/gi,
      '<div class="github-alert alert-tip"><div class="alert-title">💡 Tip</div>$1</div>'
    )
    .replace(
      /> \[!IMPORTANT\]\s*\n((?:> .*\n?)*)/gi,
      '<div class="github-alert alert-important"><div class="alert-title">⚠️ Important</div>$1</div>'
    )
    .replace(
      /> \[!WARNING\]\s*\n((?:> .*\n?)*)/gi,
      '<div class="github-alert alert-warning"><div class="alert-title">🚨 Warning</div>$1</div>'
    );

  // Convert to HTML
  const rawHtml = marked.parse(enhanced) as string;

  return (
    <div
      className={`markdown-reader ${className}`}
      dangerouslySetInnerHTML={{ __html: rawHtml }}
    />
  );
}

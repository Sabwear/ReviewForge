import React from 'react';
import { ExportFormat } from '../types/reviews';

/**
 * Pure React, XSS-safe syntax highlighter tailored for ReviewForge's 6 export formats:
 * Judge.me CSV, Standard CSV, Markdown, JSON, HTML, and Plain Text.
 * Returns an array of highlighted line nodes for paired tabular line-number rendering.
 */

function highlightStarsAndText(text: string, baseClass = 'text-slate-200', keyPrefix = 't'): React.ReactNode {
  if (!text.includes('★') && !text.includes('☆')) {
    return <span className={baseClass}>{text}</span>;
  }
  const parts = text.split(/([★☆]+)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (/^[★☆]+$/.test(part)) {
      return (
        <span key={`${keyPrefix}-s-${i}`} className="text-amber-300">
          {part}
        </span>
      );
    }
    return (
      <span key={`${keyPrefix}-t-${i}`} className={baseClass}>
        {part}
      </span>
    );
  });
}

function highlightJsonLine(line: string, lineIdx: number): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  const regex =
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tok = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(line.slice(lastIndex, match.index));
    }

    const full = match[0];
    const strLiteral = match[1];
    const colonPart = match[2];
    const keyword = match[3];

    if (strLiteral !== undefined) {
      if (colonPart !== undefined) {
        tokens.push(
          <span key={`${lineIdx}-${tok++}`} className="text-sky-300">
            {strLiteral}
          </span>
        );
        tokens.push(
          <span key={`${lineIdx}-${tok++}`} className="text-slate-500">
            {colonPart}
          </span>
        );
      } else {
        tokens.push(
          <span key={`${lineIdx}-${tok++}`} className="text-emerald-300">
            {strLiteral}
          </span>
        );
      }
    } else if (keyword !== undefined) {
      tokens.push(
        <span key={`${lineIdx}-${tok++}`} className="text-violet-300 font-medium">
          {keyword}
        </span>
      );
    } else if (/^[{}[\],:]$/.test(full)) {
      tokens.push(
        <span key={`${lineIdx}-${tok++}`} className="text-slate-500">
          {full}
        </span>
      );
    } else {
      tokens.push(
        <span key={`${lineIdx}-${tok++}`} className="text-amber-300">
          {full}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push(line.slice(lastIndex));
  }

  return tokens.length > 0 ? tokens : '\u00A0';
}

function tokenizeCsvLine(line: string): Array<{ type: 'field' | 'comma'; value: string }> {
  const result: Array<{ type: 'field' | 'comma'; value: string }> = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      current += ch;
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push({ type: 'field', value: current });
      result.push({ type: 'comma', value: ',' });
      current = '';
    } else {
      current += ch;
    }
  }
  result.push({ type: 'field', value: current });
  return result;
}

function classifyCsvField(raw: string): string {
  const unquoted =
    raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1).trim() : raw.trim();
  if (!unquoted) return 'text-slate-600';
  if (/^[1-5]$/.test(unquoted) || /^\d+$/.test(unquoted)) return 'text-amber-300';
  if (/^\d{4}-\d{2}-\d{2}/.test(unquoted)) return 'text-violet-300';
  if (/^https?:\/\//i.test(unquoted) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(unquoted)) {
    return 'text-cyan-300';
  }
  if (raw.startsWith('"') && raw.endsWith('"')) return 'text-emerald-300';
  return 'text-slate-200';
}

function highlightCsvLine(line: string, lineIdx: number): React.ReactNode {
  const parts = tokenizeCsvLine(line);
  const isHeader = lineIdx === 0;

  return parts.map((part, idx) => {
    if (part.type === 'comma') {
      return (
        <span key={`${lineIdx}-c-${idx}`} className="text-slate-600">
          ,
        </span>
      );
    }
    if (isHeader) {
      return (
        <span key={`${lineIdx}-h-${idx}`} className="text-sky-300 font-semibold">
          {part.value}
        </span>
      );
    }
    return (
      <span key={`${lineIdx}-f-${idx}`} className={classifyCsvField(part.value)}>
        {part.value}
      </span>
    );
  });
}

function highlightInlineMarkdown(text: string, lineIdx: number): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tok = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <React.Fragment key={`${lineIdx}-m-pre-${tok++}`}>
          {highlightStarsAndText(text.slice(lastIndex, match.index), 'text-slate-300', `${lineIdx}-${tok}`)}
        </React.Fragment>
      );
    }

    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(
        <span key={`${lineIdx}-m-b-${tok++}`} className="text-amber-200 font-semibold">
          {token}
        </span>
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <span
          key={`${lineIdx}-m-c-${tok++}`}
          className="text-emerald-300 bg-slate-800/80 px-1 rounded"
        >
          {token}
        </span>
      );
    } else if (token.startsWith('*')) {
      nodes.push(
        <span key={`${lineIdx}-m-i-${tok++}`} className="text-violet-300 italic">
          {token}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <React.Fragment key={`${lineIdx}-m-end`}>
        {highlightStarsAndText(text.slice(lastIndex), 'text-slate-300', `${lineIdx}-e`)}
      </React.Fragment>
    );
  }

  return nodes.length > 0 ? nodes : '\u00A0';
}

function highlightMarkdownLine(line: string, lineIdx: number): React.ReactNode {
  if (!line.trim()) return '\u00A0';

  if (/^---+$/.test(line.trim())) {
    return <span className="text-slate-600">{line}</span>;
  }

  const headingMatch = /^(#{1,6})(\s+)(.*)$/.exec(line);
  if (headingMatch) {
    const hashes = headingMatch[1];
    const space = headingMatch[2];
    const rest = headingMatch[3];
    const headingColor =
      hashes.length === 1
        ? 'text-sky-200 font-semibold'
        : hashes.length === 2
          ? 'text-sky-300 font-semibold'
          : 'text-cyan-200 font-medium';
    return (
      <>
        <span className="text-slate-500 font-semibold">{hashes}</span>
        {space}
        {highlightStarsAndText(rest, headingColor, `${lineIdx}-h`)}
      </>
    );
  }

  const quoteMatch = /^(>\s?)(.*)$/.exec(line);
  if (quoteMatch) {
    return (
      <>
        <span className="text-sky-400 font-semibold">{quoteMatch[1]}</span>
        <span className="text-slate-200 italic">{quoteMatch[2]}</span>
      </>
    );
  }

  const listMatch = /^(\s*-\s+)(.*)$/.exec(line);
  if (listMatch) {
    return (
      <>
        <span className="text-sky-400">{listMatch[1]}</span>
        {highlightInlineMarkdown(listMatch[2], lineIdx)}
      </>
    );
  }

  return highlightInlineMarkdown(line, lineIdx);
}

function highlightHtmlTag(rawTag: string, keyBase: string): React.ReactNode {
  const match = /^(<\/?)([a-zA-Z0-9-]+)([\s\S]*?)(\/?>)$/.exec(rawTag);
  if (!match) {
    return <span className="text-sky-300">{rawTag}</span>;
  }

  const [, open, tagName, attrRaw, close] = match;
  const attrNodes: React.ReactNode[] = [];
  const attrRegex = /(\s+)([a-zA-Z0-9:-]+)(=)("[^"]*"|'[^']*')/g;
  let lastIdx = 0;
  let aMatch: RegExpExecArray | null;
  let idx = 0;

  while ((aMatch = attrRegex.exec(attrRaw)) !== null) {
    if (aMatch.index > lastIdx) {
      attrNodes.push(attrRaw.slice(lastIdx, aMatch.index));
    }
    attrNodes.push(aMatch[1]);
    attrNodes.push(
      <span key={`${keyBase}-an-${idx}`} className="text-violet-300">
        {aMatch[2]}
      </span>
    );
    attrNodes.push(
      <span key={`${keyBase}-eq-${idx}`} className="text-slate-500">
        {aMatch[3]}
      </span>
    );
    attrNodes.push(
      <span key={`${keyBase}-av-${idx}`} className="text-emerald-300">
        {aMatch[4]}
      </span>
    );
    idx++;
    lastIdx = attrRegex.lastIndex;
  }

  if (lastIdx < attrRaw.length) {
    attrNodes.push(attrRaw.slice(lastIdx));
  }

  return (
    <>
      <span className="text-slate-500">{open}</span>
      <span className="text-sky-300">{tagName}</span>
      {attrNodes}
      <span className="text-slate-500">{close}</span>
    </>
  );
}

function highlightHtmlLine(line: string, lineIdx: number): React.ReactNode {
  if (!line.trim()) return '\u00A0';

  const tokens: React.ReactNode[] = [];
  const regex = /(<\/?[a-zA-Z0-9-]+(?:\s+[^>]*)?\/?>)|(&[a-zA-Z0-9#]+;)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tok = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(
        <React.Fragment key={`${lineIdx}-ht-${tok++}`}>
          {highlightStarsAndText(line.slice(lastIndex, match.index), 'text-slate-200', `${lineIdx}-${tok}`)}
        </React.Fragment>
      );
    }

    if (match[1]) {
      tokens.push(
        <React.Fragment key={`${lineIdx}-tag-${tok++}`}>
          {highlightHtmlTag(match[1], `${lineIdx}-${tok}`)}
        </React.Fragment>
      );
    } else if (match[2]) {
      tokens.push(
        <span key={`${lineIdx}-ent-${tok++}`} className="text-amber-300">
          {match[2]}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push(
      <React.Fragment key={`${lineIdx}-hend`}>
        {highlightStarsAndText(line.slice(lastIndex), 'text-slate-200', `${lineIdx}-e`)}
      </React.Fragment>
    );
  }

  return tokens.length > 0 ? tokens : '\u00A0';
}

function highlightPlainTextLine(line: string, lineIdx: number): React.ReactNode {
  if (!line.trim()) return '\u00A0';
  if (/^-{8,}$/.test(line.trim())) {
    return <span className="text-slate-600">{line}</span>;
  }

  const starHeaderMatch = /^(\[\d\/5\s+[★☆]+\])(\s+)(.*)$/.exec(line);
  if (starHeaderMatch) {
    return (
      <>
        <span className="text-amber-300 font-semibold">{starHeaderMatch[1]}</span>
        {starHeaderMatch[2]}
        <span className="text-sky-300 font-semibold">{starHeaderMatch[3]}</span>
      </>
    );
  }

  const metaMatch = /^(Offering:|Reviewer:)(.*)$/.exec(line);
  if (metaMatch) {
    const rest = metaMatch[2];
    const segments = rest.split(/(<[^>]+>|\|\s*(?:Date|Lang):)/g);
    return (
      <>
        <span className="text-violet-300 font-medium">{metaMatch[1]}</span>
        {segments.map((seg, i) => {
          if (seg.startsWith('<') && seg.endsWith('>')) {
            return (
              <span key={`${lineIdx}-em-${i}`} className="text-cyan-300">
                {seg}
              </span>
            );
          }
          if (/^\|\s*(?:Date|Lang):$/.test(seg)) {
            return (
              <span key={`${lineIdx}-lbl-${i}`} className="text-violet-300">
                {seg}
              </span>
            );
          }
          return (
            <span key={`${lineIdx}-val-${i}`} className="text-slate-200">
              {seg}
            </span>
          );
        })}
      </>
    );
  }

  return <span className="text-slate-300">{line}</span>;
}

export function highlightExportCode(code: string, format: ExportFormat): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, idx) => {
    switch (format) {
      case 'json':
        return highlightJsonLine(line, idx);
      case 'judge_me':
      case 'standard':
        return highlightCsvLine(line, idx);
      case 'markdown':
        return highlightMarkdownLine(line, idx);
      case 'html':
        return highlightHtmlLine(line, idx);
      case 'txt':
      default:
        return highlightPlainTextLine(line, idx);
    }
  });
}

interface SyntaxHighlightedCodeProps {
  code: string;
  format: ExportFormat;
  wrapLines?: boolean;
  className?: string;
}

export function SyntaxHighlightedCode({
  code,
  format,
  wrapLines = false,
  className = '',
}: SyntaxHighlightedCodeProps) {
  const highlightedLines = React.useMemo(
    () => highlightExportCode(code, format),
    [code, format]
  );

  const gutterDigits = Math.max(2, String(highlightedLines.length).length);

  return (
    <div
      className={`font-mono text-[12px] leading-[1.6] text-slate-200 ${
        wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
      } ${className}`}
    >
      {highlightedLines.map((lineNode, idx) => (
        <div
          key={idx}
          className="flex items-start hover:bg-slate-800/60 transition-colors px-3"
        >
          <span
            aria-hidden="true"
            style={{ minWidth: `${gutterDigits + 1.25}ch` }}
            className="select-none text-right pr-3 text-slate-600 tabular-nums shrink-0"
          >
            {idx + 1}
          </span>
          <span className="flex-1 min-w-0">{lineNode}</span>
        </div>
      ))}
    </div>
  );
}

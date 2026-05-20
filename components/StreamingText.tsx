'use client';

import { useEffect, useRef } from 'react';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export default function StreamingText({ text, isStreaming, className = '' }: StreamingTextProps) {
  const endRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isStreaming && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [text, isStreaming]);

  // 每个段落（双换行）单独渲染，段落间保留视觉间距
  const paragraphs = text.split(/\n\n+/);

  return (
    <span className={className}>
      {paragraphs.map((para, i) => {
        const lines = para.split('\n');
        return (
          <span
            key={i}
            style={{
              display: 'block',
              marginBottom: i < paragraphs.length - 1 ? '1.4em' : 0,
            }}
          >
            {lines.map((line, j) => (
              <span key={j}>
                {line}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      })}
      {isStreaming && <span className="cursor-blink" />}
      <span ref={endRef} />
    </span>
  );
}

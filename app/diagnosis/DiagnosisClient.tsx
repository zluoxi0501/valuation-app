'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '@/components/PageWrapper';
import StreamingText from '@/components/StreamingText';
import ContinueButton from '@/components/ContinueButton';
import { getJourney, saveJourney, KeyInfo } from '@/lib/journey';

async function readStreamWithBreath(
  body: ReadableStream<Uint8Array>,
  onChunk: (acc: string) => void
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let lastParagraphEnd = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    accumulated += chunk;
    onChunk(accumulated);

    const newParagraphEnd = accumulated.lastIndexOf('\n\n');
    if (newParagraphEnd > lastParagraphEnd) {
      lastParagraphEnd = newParagraphEnd;
      await new Promise((r) => setTimeout(r, 480));
    }
  }

  return accumulated;
}

const DEFAULT_BUTTONS = ['有，但一直没说清楚', '没有，现在才想明白', '好像有一点感觉'];

export default function DiagnosisClient() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [preText, setPreText] = useState('');
  const [result, setResult] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [microAnswer, setMicroAnswer] = useState('');
  const [microButtons, setMicroButtons] = useState<string[]>(DEFAULT_BUTTONS);

  useEffect(() => {
    const journey = getJourney();
    if (!journey?.input) {
      router.replace('/');
      return;
    }
    setInput(journey.input);

    if (journey.diagnosisResult) {
      setResult(journey.diagnosisResult);
      setMicroAnswer(journey.microAnswer ?? '');
      setKeyInfo(journey.keyInfo ?? null);
      if (journey.keyInfo?.microButtons?.length) {
        setMicroButtons(journey.keyInfo.microButtons);
      }
      setDone(true);
      return;
    }

    startFlow(journey.input);
  }, []);

  const startFlow = async (userInput: string) => {
    // 第一步：并行提取关键信息，同时显示前置语
    setPreText('我先整理一下你刚刚提到的东西…');

    let extractedInfo: KeyInfo | null = null;
    try {
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: userInput }),
      });
      if (extractRes.ok) {
        extractedInfo = await extractRes.json();
        setKeyInfo(extractedInfo);
        if (extractedInfo?.microButtons?.length) {
          setMicroButtons(extractedInfo.microButtons);
        }
        saveJourney({ keyInfo: extractedInfo ?? undefined });
      }
    } catch {
      // extract 失败不影响主流程
    }

    // 至少等 1.2s 让前置语显示完
    await new Promise((r) => setTimeout(r, 1200));
    setPreText('');
    setIsStreaming(true);
    setResult('');

    try {
      const res = await fetch('/api/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: userInput, keyInfo: extractedInfo }),
      });

      if (!res.ok) throw new Error('request failed');

      const accumulated = await readStreamWithBreath(res.body!, (acc) =>
        setResult(acc)
      );

      saveJourney({ diagnosisResult: accumulated });
      setDone(true);
    } catch {
      setResult('出了点问题，请刷新页面重试。');
      setDone(true);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleMicroSelect = (option: string) => {
    setMicroAnswer(option);
    saveJourney({ microAnswer: option });
  };

  return (
    <PageWrapper step={2}>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '80px 24px 100px',
          maxWidth: '640px',
          margin: '0 auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%' }}
        >
          <div
            style={{
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              marginBottom: '56px',
              textTransform: 'uppercase',
            }}
          >
            第一步
          </div>

          <AnimatePresence>
            {preText && (
              <motion.p
                key="pre"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  fontSize: '15px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  marginBottom: '32px',
                  fontStyle: 'italic',
                }}
              >
                {preText}
              </motion.p>
            )}
          </AnimatePresence>

          <div
            style={{
              fontSize: '17px',
              lineHeight: 2,
              color: 'var(--text-primary)',
              minHeight: '80px',
              letterSpacing: '0.01em',
            }}
          >
            <StreamingText text={result} isStreaming={isStreaming} />
          </div>

          {/* 微追问 */}
          <AnimatePresence>
            {done && !microAnswer && (
              <motion.div
                key="micro"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{ marginTop: '52px' }}
              >
                <p
                  style={{
                    fontSize: '15px',
                    color: 'var(--text-secondary)',
                    marginBottom: '20px',
                    lineHeight: 1.7,
                  }}
                >
                  你以前有认真意识到这一点吗？
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {microButtons.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleMicroSelect(opt)}
                      style={{
                        textAlign: 'left',
                        padding: '13px 18px',
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        backgroundColor: '#fff',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        transition: 'border-color 0.15s, color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        const t = e.currentTarget;
                        t.style.borderColor = 'var(--accent)';
                        t.style.color = 'var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        const t = e.currentTarget;
                        t.style.borderColor = 'var(--border)';
                        t.style.color = 'var(--text-secondary)';
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 选完后继续 */}
          <AnimatePresence>
            {done && microAnswer && (
              <motion.div
                key="continue"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ marginTop: '52px' }}
              >
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    marginBottom: '24px',
                    lineHeight: 1.6,
                  }}
                >
                  "{microAnswer}"
                </p>
                <p
                  style={{
                    fontSize: '15px',
                    color: 'var(--text-secondary)',
                    marginBottom: '24px',
                    lineHeight: 1.7,
                  }}
                >
                  那接着来看看，这种感觉为什么会出现。
                </p>
                <ContinueButton onClick={() => router.push('/analysis')} label="继续" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

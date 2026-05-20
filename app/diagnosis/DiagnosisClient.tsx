'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '@/components/PageWrapper';
import StreamingText from '@/components/StreamingText';
import ContinueButton from '@/components/ContinueButton';
import CorrectBlock from '@/components/CorrectBlock';
import { getJourney, saveJourney, KeyInfo } from '@/lib/journey';
import { track } from '@/lib/tracking';

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
  const [confirmed, setConfirmed] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    const journey = getJourney();
    if (!journey?.input) {
      router.replace('/');
      return;
    }
    setInput(journey.input);

    if (journey.diagnosisResult) {
      setResult(journey.diagnosisResult);
      setKeyInfo(journey.keyInfo ?? null);
      setDone(true);
      setConfirmed(true);
      return;
    }

    startFlow(journey.input);
  }, []);

  const startFlow = async (userInput: string) => {
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
        saveJourney({ keyInfo: extractedInfo ?? undefined });
      }
    } catch {}

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

  const handleConfirm = () => {
    setConfirmed(true);
    track('diagnosis_confirmed', { current_step: 'diagnosis' });
  };

  const handleRefine = async (correction: string) => {
    setIsRefining(true);
    setIsStreaming(true);
    setResult('');

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'diagnosis',
          previousResult: result,
          userCorrection: correction,
          fullContext: input,
        }),
      });

      if (!res.ok) throw new Error('refine failed');

      const accumulated = await readStreamWithBreath(res.body!, (acc) =>
        setResult(acc)
      );

      saveJourney({ diagnosisResult: accumulated });
      setDone(true);
      setConfirmed(true);
    } catch {
      setResult('出了点问题，请刷新页面重试。');
      setDone(true);
    } finally {
      setIsStreaming(false);
      setIsRefining(false);
    }
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

          {/* 确认 / 纠偏 */}
          {done && !confirmed && !isRefining && (
            <CorrectBlock
              step="diagnosis"
              onConfirm={handleConfirm}
              onRefine={handleRefine}
            />
          )}

          {/* 确认后继续 */}
          <AnimatePresence>
            {done && confirmed && !isStreaming && (
              <motion.div
                key="continue"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ marginTop: '48px' }}
              >
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

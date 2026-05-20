'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '@/components/PageWrapper';
import StreamingText from '@/components/StreamingText';
import ContinueButton from '@/components/ContinueButton';
import CorrectBlock from '@/components/CorrectBlock';
import { getJourney, saveJourney } from '@/lib/journey';
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

export default function AnalysisClient() {
  const router = useRouter();
  const [preText, setPreText] = useState('');
  const [result, setResult] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    const journey = getJourney();
    if (!journey?.input || !journey?.diagnosisResult) {
      router.replace('/');
      return;
    }

    if (journey.analysisResult) {
      setResult(journey.analysisResult);
      setDone(true);
      setConfirmed(true);
      return;
    }

    startAnalysis(journey.input, journey.diagnosisResult, journey.microAnswer);
  }, []);

  const startAnalysis = async (
    input: string,
    diagnosisResult: string,
    microAnswer?: string
  ) => {
    const journey = getJourney();
    setPreText('你刚刚说的这种感觉，其实很多人都有…');
    await new Promise((r) => setTimeout(r, 1200));
    setPreText('');
    setIsStreaming(true);
    setResult('');

    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, diagnosisResult, microAnswer, keyInfo: journey?.keyInfo }),
      });

      if (!res.ok) throw new Error('request failed');

      const accumulated = await readStreamWithBreath(res.body!, (acc) =>
        setResult(acc)
      );

      saveJourney({ analysisResult: accumulated });
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
    track('analysis_confirmed', { current_step: 'analysis' });
  };

  const handleRefine = async (correction: string) => {
    const journey = getJourney();
    setIsRefining(true);
    setIsStreaming(true);
    setResult('');

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'analysis',
          previousResult: result,
          userCorrection: correction,
          fullContext: `${journey?.input}\n\n${journey?.diagnosisResult}`,
        }),
      });

      if (!res.ok) throw new Error('refine failed');

      const accumulated = await readStreamWithBreath(res.body!, (acc) =>
        setResult(acc)
      );

      saveJourney({ analysisResult: accumulated });
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
    <PageWrapper step={3}>
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
            第二步
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

          {done && !confirmed && !isRefining && (
            <CorrectBlock
              step="analysis"
              onConfirm={handleConfirm}
              onRefine={handleRefine}
            />
          )}

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
                  那接下来，我们来看看你可以往哪里走。
                </p>
                <ContinueButton
                  onClick={() => router.push('/direction')}
                  label="继续"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

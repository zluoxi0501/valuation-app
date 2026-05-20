'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '@/components/PageWrapper';
import StreamingText from '@/components/StreamingText';
import { getJourney, saveJourney, clearJourney } from '@/lib/journey';

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

export default function PlanClient() {
  const router = useRouter();
  const [preText, setPreText] = useState('');
  const [result, setResult] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const journey = getJourney();
    if (!journey?.input || !journey?.directionResult) {
      router.replace('/');
      return;
    }

    if (journey.planResult) {
      setResult(journey.planResult);
      setDone(true);
      return;
    }

    startPlan(journey);
  }, []);

  const startPlan = async (journey: {
    input: string;
    diagnosisResult: string;
    analysisResult: string;
    directionResult: string;
    chosenDirection?: string;
  }) => {
    setPreText('好，我把这些整理成一个草图…');
    await new Promise((r) => setTimeout(r, 1200));
    setPreText('');
    setIsStreaming(true);
    setResult('');

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: journey.input,
          diagnosisResult: journey.diagnosisResult,
          analysisResult: journey.analysisResult,
          directionResult: journey.directionResult,
          chosenDirection: journey.chosenDirection,
        }),
      });

      if (!res.ok) throw new Error('request failed');

      const accumulated = await readStreamWithBreath(res.body!, (acc) =>
        setResult(acc)
      );

      saveJourney({ planResult: accumulated });
      setDone(true);
    } catch {
      setResult('出了点问题，请刷新页面重试。');
      setDone(true);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleRestart = () => {
    clearJourney();
    router.push('/');
  };

  return (
    <PageWrapper step={5}>
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
            第四步
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

          <AnimatePresence>
            {done && (
              <motion.div
                key="end"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{ marginTop: '64px' }}
              >
                <div
                  style={{
                    borderLeft: '2px solid var(--accent)',
                    paddingLeft: '20px',
                    marginBottom: '40px',
                  }}
                >
                  <p
                    className="font-serif-cn"
                    style={{
                      fontSize: '16px',
                      color: 'var(--text-primary)',
                      lineHeight: 1.8,
                      margin: 0,
                      fontWeight: 400,
                    }}
                  >
                    今天你做了一件很多人不会做的事：
                    <br />
                    认真想了一遍，自己到底卡在哪里。
                  </p>
                </div>

                <button
                  onClick={handleRestart}
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    background: 'none',
                    border: 'none',
                    padding: '0',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textDecoration: 'underline',
                    textDecorationColor: 'var(--border)',
                    textUnderlineOffset: '3px',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget).style.color = 'var(--text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget).style.color = 'var(--text-muted)';
                  }}
                >
                  重新开始
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

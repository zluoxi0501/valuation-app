'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '@/components/PageWrapper';
import StreamingText from '@/components/StreamingText';
import ContinueButton from '@/components/ContinueButton';
import { getJourney, saveJourney } from '@/lib/journey';

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

export default function DirectionClient() {
  const router = useRouter();
  const [preText, setPreText] = useState('');
  const [result, setResult] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [chosenDirection, setChosenDirection] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    const journey = getJourney();
    if (!journey?.input || !journey?.diagnosisResult || !journey?.analysisResult) {
      router.replace('/');
      return;
    }

    if (journey.directionResult) {
      setResult(journey.directionResult);
      setChosenDirection(journey.chosenDirection ?? '');
      setDone(true);
      return;
    }

    startDirection(journey.input, journey.diagnosisResult, journey.analysisResult);
  }, []);

  const startDirection = async (
    input: string,
    diagnosisResult: string,
    analysisResult: string
  ) => {
    const journey = getJourney();
    setPreText('我先说说我看到的一些可能…');
    await new Promise((r) => setTimeout(r, 1200));
    setPreText('');
    setIsStreaming(true);
    setResult('');

    try {
      const res = await fetch('/api/direction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, diagnosisResult, analysisResult, keyInfo: journey?.keyInfo }),
      });

      if (!res.ok) throw new Error('request failed');

      const accumulated = await readStreamWithBreath(res.body!, (acc) =>
        setResult(acc)
      );

      saveJourney({ directionResult: accumulated });
      setDone(true);
    } catch {
      setResult('出了点问题，请刷新页面重试。');
      setDone(true);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleContinue = () => {
    if (!showInput) {
      setShowInput(true);
      return;
    }
    saveJourney({ chosenDirection });
    router.push('/plan');
  };

  return (
    <PageWrapper step={4}>
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
            第三步
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
            {done && !showInput && (
              <motion.div
                key="ask"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{ marginTop: '56px' }}
              >
                <p
                  style={{
                    fontSize: '15px',
                    color: 'var(--text-secondary)',
                    marginBottom: '24px',
                    lineHeight: 1.7,
                  }}
                >
                  看完这两个方向，有没有哪个让你觉得"这个我想多想想"？
                </p>
                <ContinueButton onClick={handleContinue} label="有，继续" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showInput && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ marginTop: '48px' }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '15px',
                    color: 'var(--text-secondary)',
                    marginBottom: '14px',
                    lineHeight: 1.7,
                  }}
                >
                  你现在更想从哪个方向开始？（写几个字就行，或者留空也可以）
                </label>
                <textarea
                  value={chosenDirection}
                  onChange={(e) => setChosenDirection(e.target.value)}
                  rows={2}
                  placeholder="比如：先从第一个方向试试"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '15px',
                    lineHeight: 1.7,
                    color: 'var(--text-primary)',
                    backgroundColor: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    marginBottom: '20px',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                />
                <ContinueButton onClick={handleContinue} label="生成90天草图" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

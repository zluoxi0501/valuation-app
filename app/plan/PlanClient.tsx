'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '@/components/PageWrapper';
import StreamingText from '@/components/StreamingText';
import { getJourney, saveJourney, clearJourney } from '@/lib/journey';
import { track } from '@/lib/tracking';

const HIT_OPTIONS = ['很说中', '有一点', '没太说中'];

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
      await new Promise((r) => setTimeout(r, 300));
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
  const [hitScore, setHitScore] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    track('page_view', { current_step: 'plan' });

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
    await new Promise((r) => setTimeout(r, 600));
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
      track('plan_complete', { current_step: 'plan' });
    } catch {
      setResult('出了点问题，请刷新页面重试。');
      setDone(true);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleHitSelect = (score: string) => {
    setHitScore(score);
    const journey = getJourney();
    track('hit_score', {
      current_step: 'plan',
      hit_score: score,
      user_input: journey?.input ?? '',
    });
  };

  const handleFeedbackSubmit = () => {
    const journey = getJourney();
    track('feedback', {
      current_step: 'plan',
      hit_score: hitScore,
      feedback_text: feedbackText,
      user_input: journey?.input ?? '',
    });
    setFeedbackSent(true);
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
            {isStreaming && !result && (
              <span style={{ color: 'var(--text-muted)', fontSize: '15px', fontStyle: 'italic' }}>
                正在想<span className="cursor-blink" />
              </span>
            )}
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
                {/* 结语 */}
                <div
                  style={{
                    borderLeft: '2px solid var(--accent)',
                    paddingLeft: '20px',
                    marginBottom: '48px',
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

                {/* 反馈区 — 极简，自然出现 */}
                {!feedbackSent ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    style={{ marginBottom: '40px' }}
                  >
                    {/* 命中评分 */}
                    {!hitScore ? (
                      <div>
                        <p
                          style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            marginBottom: '14px',
                            lineHeight: 1.6,
                          }}
                        >
                          这次分析有没有说中你？
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {HIT_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleHitSelect(opt)}
                              style={{
                                padding: '10px 18px',
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                backgroundColor: '#fff',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'border-color 0.15s, color 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent)';
                                e.currentTarget.style.color = 'var(--accent)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* 开放反馈 */
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <p
                          style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            marginBottom: '12px',
                            lineHeight: 1.6,
                          }}
                        >
                          哪句话最打动你？哪句话不准？
                        </p>
                        <textarea
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          rows={3}
                          placeholder="随便说几句，也可以留空"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: '14px',
                            lineHeight: 1.6,
                            color: 'var(--text-primary)',
                            backgroundColor: '#fff',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            resize: 'none',
                            outline: 'none',
                            fontFamily: 'inherit',
                            marginBottom: '14px',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                        />
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <button
                            onClick={handleFeedbackSubmit}
                            style={{
                              padding: '10px 22px',
                              fontSize: '13px',
                              color: '#fff',
                              backgroundColor: 'var(--accent)',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            提交
                          </button>
                          <button
                            onClick={() => { setFeedbackSent(true); track('feedback_skip', { current_step: 'plan', hit_score: hitScore }); }}
                            style={{
                              padding: '10px',
                              fontSize: '13px',
                              color: 'var(--text-muted)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            跳过
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      marginBottom: '40px',
                      lineHeight: 1.6,
                    }}
                  >
                    谢谢你的反馈。
                  </motion.p>
                )}

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
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
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

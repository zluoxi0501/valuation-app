'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '@/components/PageWrapper';
import ContinueButton from '@/components/ContinueButton';
import { clearJourney, saveJourney } from '@/lib/journey';
import { track } from '@/lib/tracking';

const EXAMPLES = [
  '我越来越不知道现在学的东西以后有没有用',
  '我不知道该继续考研还是早点进入社会',
  '我用了AI，但感觉自己还是没什么变化',
  '我不知道未来到底该往哪里积累',
  '我感觉每天很忙，但不知道在成长什么',
];

const FEELINGS = [
  '学了很多，却不知道未来有什么用',
  '很努力，却越来越没有方向',
  '用过AI，但人生没有变化',
  '不知道未来什么能力真正重要',
];

export default function HomeClient() {
  const [input, setInput] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    track('page_view', { current_step: 'home' });
    const timer = setInterval(() => {
      setExampleIndex((i) => (i + 1) % EXAMPLES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleStart = () => {
    if (!input.trim()) return;
    track('start_diagnosis', { current_step: 'home', user_input: input.trim() });
    clearJourney();
    saveJourney({ input: input.trim(), createdAt: Date.now() });
    router.push('/diagnosis');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleStart();
    }
  };

  const fillExample = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  return (
    <PageWrapper step={1}>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          maxWidth: '680px',
          margin: '0 auto',
        }}
      >
        {/* 品牌标 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          style={{
            fontSize: '13px',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            marginBottom: '56px',
            textTransform: 'uppercase',
          }}
        >
          未来方向实验室
        </motion.div>

        {/* 主标题 */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="font-serif-cn"
          style={{
            fontSize: 'clamp(26px, 5vw, 38px)',
            fontWeight: 400,
            lineHeight: 1.55,
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          你不是不努力。
          <br />
          只是越来越不知道：
          <br />
          现在努力还有没有意义。
        </motion.h1>

        {/* 副说明 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{
            marginBottom: '48px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '20px',
            }}
          >
            很多大学生真正焦虑的不是 AI。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            {FEELINGS.map((f, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                }}
              >
                — {f}
              </motion.span>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginTop: '20px',
            }}
          >
            这里不是教你"怎么成功"。
            <br />
            而是帮你重新找到：未来到底该往哪里努力。
          </motion.p>
        </motion.div>

        {/* 输入区 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{ width: '100%' }}
        >
          <label
            style={{
              display: 'block',
              fontSize: '17px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginBottom: '16px',
              lineHeight: 1.5,
            }}
          >
            你最近最想不明白的一件事是什么？
          </label>

          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              style={{
                width: '100%',
                padding: '16px 18px',
                fontSize: '15px',
                lineHeight: 1.7,
                color: 'var(--text-primary)',
                backgroundColor: '#fff',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
              }}
            />

            {/* 旋转示例 placeholder 提示 */}
            {!input && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '18px',
                  pointerEvents: 'none',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={exampleIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      fontSize: '15px',
                      color: 'var(--text-muted)',
                      lineHeight: 1.7,
                    }}
                  >
                    {EXAMPLES[exampleIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* 快速填入示例 */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '32px',
            }}
          >
            {EXAMPLES.slice(0, 3).map((e, i) => (
              <button
                key={i}
                onClick={() => fillExample(e)}
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'color 0.2s, border-color 0.2s',
                  lineHeight: 1.4,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  (e.target as HTMLButtonElement).style.borderColor = 'var(--text-muted)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.color = 'var(--text-muted)';
                  (e.target as HTMLButtonElement).style.borderColor = 'var(--border)';
                }}
              >
                {e.length > 20 ? e.slice(0, 20) + '…' : e}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ContinueButton
              onClick={handleStart}
              disabled={!input.trim()}
              label="开始看看我现在到底卡在哪里"
            />
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              ⌘ + Enter
            </span>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

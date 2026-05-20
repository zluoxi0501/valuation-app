'use client';

import { motion } from 'framer-motion';

const STEPS = ['首页', '诊断', '分析', '方向', '计划'];

interface PageWrapperProps {
  children: React.ReactNode;
  step: number; // 1-5
}

export default function PageWrapper({ children, step }: PageWrapperProps) {
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <>
      <div
        className="progress-bar"
        style={{ width: `${progress}%` }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {children}
      </motion.div>
    </>
  );
}

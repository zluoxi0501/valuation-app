const WEBHOOK_URL = process.env.NEXT_PUBLIC_TRACKING_WEBHOOK || '';

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getBasePayload() {
  if (typeof window === 'undefined') return {};
  return {
    timestamp: new Date().toISOString(),
    device_type: getDeviceType(),
    page_url: window.location.pathname,
    referrer: document.referrer || '',
  };
}

export function track(event: string, data: Record<string, string> = {}) {
  if (!WEBHOOK_URL) return;

  const payload = {
    ...getBasePayload(),
    event,
    ...data,
  };

  // fire-and-forget, 不阻塞用户体验
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(WEBHOOK_URL, JSON.stringify(payload));
    } else {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch {
    // 静默失败，不影响用户
  }
}

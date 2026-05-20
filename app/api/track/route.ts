export async function POST(request: Request) {
  const webhookUrl = process.env.TRACKING_WEBHOOK_URL || '';
  if (!webhookUrl) {
    return Response.json({ status: 'no_webhook' });
  }

  try {
    const body = await request.text();

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    // Google Apps Script 302 重定向后返回内容
    return Response.json({ status: 'ok', upstream: res.status });
  } catch {
    return Response.json({ status: 'error' }, { status: 500 });
  }
}

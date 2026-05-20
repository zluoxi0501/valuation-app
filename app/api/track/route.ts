export async function POST(request: Request) {
  const webhookUrl = process.env.TRACKING_WEBHOOK_URL || '';
  if (!webhookUrl) {
    return Response.json({ status: 'no_webhook' });
  }

  try {
    const body = await request.text();

    // Google Apps Script 返回 302，需要手动跟随并保持 POST
    let res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body,
      redirect: 'manual',
    });

    // 跟随重定向（GET 即可，Apps Script 重定向后的 URL 用 GET 返回结果）
    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get('location');
      if (location) {
        res = await fetch(location);
      }
    }

    return Response.json({ status: 'ok', upstream: res.status });
  } catch (e) {
    return Response.json({ status: 'error', message: String(e) }, { status: 500 });
  }
}

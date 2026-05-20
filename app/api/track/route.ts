export async function POST(request: Request) {
  const webhookUrl = process.env.TRACKING_WEBHOOK_URL || '';
  if (!webhookUrl) {
    return Response.json({ status: 'no_webhook' });
  }

  try {
    const body = await request.text();

    // Google Apps Script: POST → 302 → GET 拿结果
    // 第一步：POST 数据，不跟随重定向
    const postRes = await fetch(webhookUrl, {
      method: 'POST',
      body,
      redirect: 'follow',
    });

    const responseText = await postRes.text().catch(() => '');

    return Response.json({
      status: postRes.ok ? 'ok' : 'upstream_error',
      upstream: postRes.status,
      body: responseText.slice(0, 200),
    });
  } catch (e) {
    return Response.json({ status: 'error', message: String(e) }, { status: 500 });
  }
}

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { step, previousResult, userCorrection, fullContext } = await request.json();

  if (!previousResult?.trim() || !userCorrection?.trim()) {
    return new Response('Missing data', { status: 400 });
  }

  const stepLabel: Record<string, string> = {
    diagnosis: '卡在哪里',
    analysis: '为什么会这样',
    direction: '可以往哪里走',
  };

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    stream: true,
    system: `你是一个真诚的朋友，正在和一个人聊天。

刚才你说了一些关于"${stepLabel[step] ?? '他的情况'}"的理解，但他说不完全对，并补充了新信息。

你要做的：
- 先用一句话承认之前理解的偏差，语气自然，比如"好，我之前说的确实不太准"
- 然后根据他的补充，重新说你的理解
- 不要重复之前说过的对的部分，只说修正后的新理解
- 最多4句话，每句单独一行，句与句之间空一行
- 语气像聊天，不像重新生成报告
- 不说"AI"、"工具"、"赋能"、"认知"`,
    messages: [
      {
        role: 'user',
        content: `${fullContext ? `我之前说的是：${fullContext}\n\n` : ''}你之前的理解是：\n${previousResult}\n\n但我觉得不完全对。我补充一下：${userCorrection}`,
      },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}

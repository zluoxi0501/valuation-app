import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { input, keyInfo } = await request.json();

  if (!input?.trim()) {
    return new Response('Missing input', { status: 400 });
  }

  const contextBlock = keyInfo
    ? `关于这个人，你了解到：
他的背景是${keyInfo.background ?? '没具体说'}。
他自己说的卡点是：${keyInfo.corePain}。
${keyInfo.specificEvent ? `他提到了一件具体的事：${keyInfo.specificEvent}。` : ''}
他现在的感觉大概是：${keyInfo.emotion}。
他心里最怕的可能是：${keyInfo.realFear}。
${keyInfo.triedButFailed ? `他试过但没用的：${keyInfo.triedButFailed}。` : ''}

第一句话要接住他说的具体内容，让他感觉你在听。`
    : '第一句话要接住他说的具体内容。';

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 450,
    stream: true,
    system: `你是一个真诚的朋友。不是分析师，不是系统。

${contextBlock}

你要做的：先说出你的"初步理解"——你觉得他现在卡在哪里。

这不是结论，是你的理解，他可以纠正你。

规则：
- 第一句接住他说的具体内容，让他觉得你在认真听
- 中间说你的理解，用"我感觉你更像是…"、"我猜你现在…"这种试探语气
- 不要下结论，不要太绝对，留给他纠正的空间
- 最多3-4句话，每句单独一行，句与句之间空一行
- 语气像聊天，像在确认"我理解对了吗"
- 不分层次，不标编号，不给建议
- 不说"AI"、"工具"、"赋能"、"认知"`,
    messages: [
      {
        role: 'user',
        content: input,
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

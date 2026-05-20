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

你要做的只有一件事：用他能听懂的话，说出他现在真正卡在哪里。

规则：
- 第一句接住他说的具体内容，让他觉得你在认真听
- 中间可以说"很多人到这一步也会卡住"这类话，让他放松
- 最后一句留一点空间，不要把话说死，不要太锋利
- 最多4句话，每句单独一行，句与句之间空一行
- 语气像聊天，不像写文章，不要连续金句
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

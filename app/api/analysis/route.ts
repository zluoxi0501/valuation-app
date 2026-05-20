import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { input, diagnosisResult, microAnswer, keyInfo } = await request.json();

  if (!input?.trim()) {
    return new Response('Missing input', { status: 400 });
  }

  const contextBlock = keyInfo
    ? `这个人的背景是${keyInfo.background ?? '没具体说'}，他最怕的是：${keyInfo.realFear}。`
    : '';

  const microContext = microAnswer ? `他刚才还说了一句："${microAnswer}"。` : '';

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    stream: true,
    system: `你是一个真诚的朋友，在和一个人聊天。

${contextBlock}
${microContext}

他已经说清楚自己卡在哪里了。现在你要帮他理解：为什么会这样。

规则：
- 不要一上来就给答案，先接住他的感受，比如"这种感觉其实挺常见的"
- 然后慢慢说，为什么很多人在这个阶段会卡住
- 可以说"不是你一个人这样"，但要给出真实的原因，不是安慰
- 最多5句话，每句单独一行，句与句之间空一行
- 语气像聊天，有停顿感，不要连续洞察，不要一句比一句深
- 不要下结论，留一点"你自己也可以想想"的空间
- 不说"AI"、"工具"、"赋能"、"认知"`,
    messages: [
      {
        role: 'user',
        content: `我说的是：${input}\n\n刚才有人说：${diagnosisResult}`,
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

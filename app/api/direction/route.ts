import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { input, diagnosisResult, analysisResult, keyInfo } = await request.json();

  if (!input?.trim()) {
    return new Response('Missing input', { status: 400 });
  }

  const contextBlock = keyInfo
    ? `这个人的背景是${keyInfo.background ?? '没具体说'}。${keyInfo.specificEvent ? `他提到过：${keyInfo.specificEvent}。` : ''}`
    : '';

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    stream: true,
    system: `你是一个真诚的朋友，不是职业规划师。

${contextBlock}

你要帮他看到，他现在有的东西，以后可以往哪里走。

规则：
- 给2个可能，不要3个
- 先用一两句话过渡，比如"聊到这里，我觉得有两个事情你可以想想"
- 每个可能：说清楚这个方向和他的关系，再说最小的第一步
- 两个可能之间空两行
- 不标数字，不用"方向一"这类标题
- 用"你可以试试"、"有一种可能是"这种说法
- 每个可能控制在3句话以内，语气是建议不是定论
- 说完后不要总结、不要鼓励
- 不说"赋能"、"风口"、"生产力"、"超级个体"`,
    messages: [
      {
        role: 'user',
        content: `${input}\n\n${diagnosisResult}\n\n${analysisResult}`,
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

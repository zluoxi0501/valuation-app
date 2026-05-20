import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { input, diagnosisResult, analysisResult, directionResult, chosenDirection } = await request.json();

  if (!input?.trim()) {
    return new Response('Missing input', { status: 400 });
  }

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 900,
    stream: true,
    system: `你是一个真诚的朋友，在帮一个人想接下来怎么走。

给他一个90天的行动草图。不是计划，是草图。

规则：
- 开头先用一句话接住他的情况，比如"你现在大概处在XX阶段，接下来可以这样试试"
- 分三个阶段，每阶段2件小事
- 每件事一句话，具体到"做什么"，让人觉得"明天就能开始"
- 阶段之间空两行
- 用"第1-30天"这样的时间段，不用"第一阶段"
- 语气轻松，像在聊"接下来你可以先这样"
- 不要目标总结，不要鸡汤，不要"相信自己"
- 最后一句：说个真实的预期，不是激励。比如"90天不会改变人生，但你大概会比现在清楚一些"
- 不说"赋能"、"认知"、"突破"、"成长体系"`,
    messages: [
      {
        role: 'user',
        content: `${input}\n\n${diagnosisResult}\n\n${analysisResult}\n\n${directionResult}${chosenDirection ? `\n\n我想从这个方向开始：${chosenDirection}` : ''}`,
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

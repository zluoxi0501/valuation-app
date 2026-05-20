import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { input } = await request.json();

  if (!input?.trim()) {
    return new Response('Missing input', { status: 400 });
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: `从用户输入中提取关键信息，输出严格的 JSON，不加任何解释。

输出格式：
{
  "background": "用户的专业/背景/身份，没有就写null",
  "corePain": "用这个人自己的话说，他最卡的地方是什么，一句话",
  "specificEvent": "用户提到的具体事件或经历，没有就写null",
  "emotion": "他现在大概是什么感觉，用日常口语描述，一个短句",
  "realFear": "如果他不说出来，心里最怕的事情是什么，一句话",
  "triedButFailed": "用户尝试过但没用的事，没有就写null",
  "pathType": "选一个最接近的：考研焦虑|AI无效感|专业无意义感|不知道喜欢什么|想转型不敢|努力但无方向|其他",
  "microButtons": ["根据这个人说的话，生成3个按钮选项，每个不超过10字，用来回应'你以前有认真意识到这一点吗'这个问题。选项应该像真实的人在回答，不要太工整"]
}`,
    messages: [{ role: 'user', content: input }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  const raw = textBlock?.type === 'text' ? textBlock.text : '';

  // 提取 JSON
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return Response.json({ error: 'parse failed', raw }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(match[0]);
    return Response.json(parsed);
  } catch {
    return Response.json({ error: 'invalid json', raw }, { status: 500 });
  }
}

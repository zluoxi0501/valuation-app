module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/api/diagnosis/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@anthropic-ai/sdk/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Anthropic__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/@anthropic-ai/sdk/client.mjs [app-route] (ecmascript) <export Anthropic as default>");
;
const client = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Anthropic__as__default$3e$__["default"]({
    apiKey: process.env.ANTHROPIC_API_KEY
});
async function POST(request) {
    const { input, keyInfo } = await request.json();
    if (!input?.trim()) {
        return new Response('Missing input', {
            status: 400
        });
    }
    const contextBlock = keyInfo ? `关于这个人，你了解到：
他的背景是${keyInfo.background ?? '没具体说'}。
他自己说的卡点是：${keyInfo.corePain}。
${keyInfo.specificEvent ? `他提到了一件具体的事：${keyInfo.specificEvent}。` : ''}
他现在的感觉大概是：${keyInfo.emotion}。
他心里最怕的可能是：${keyInfo.realFear}。
${keyInfo.triedButFailed ? `他试过但没用的：${keyInfo.triedButFailed}。` : ''}

第一句话要接住他说的具体内容，让他感觉你在听。` : '第一句话要接住他说的具体内容。';
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
                content: input
            }
        ]
    });
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
        async start (controller) {
            for await (const event of stream){
                if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                    controller.enqueue(encoder.encode(event.delta.text));
                }
            }
            controller.close();
        }
    });
    return new Response(readable, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache'
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__08egd~1._.js.map
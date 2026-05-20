# 数据追踪 — 配置说明

## 快速上线步骤

### 1. 创建 Google Sheet

新建一个 Google Sheet，第一行填写表头：

```
timestamp | event | current_step | user_input | selected_feeling | hit_score | feedback_text | device_type | page_url | referrer
```

### 2. 部署 Google Apps Script

在 Sheet 中点 **扩展程序 → Apps Script**，粘贴以下代码：

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    data.timestamp || '',
    data.event || '',
    data.current_step || '',
    data.user_input || '',
    data.selected_feeling || '',
    data.hit_score || '',
    data.feedback_text || '',
    data.device_type || '',
    data.page_url || '',
    data.referrer || ''
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

点 **部署 → 新建部署**：
- 类型：Web 应用
- 执行身份：我
- 谁可以访问：任何人

复制生成的 URL。

### 3. 配置环境变量

#### 本地开发

在 `.env.local` 中加一行：

```
NEXT_PUBLIC_TRACKING_WEBHOOK=https://script.google.com/macros/s/你的ID/exec
```

#### Netlify 生产

```bash
netlify env:set NEXT_PUBLIC_TRACKING_WEBHOOK "https://script.google.com/macros/s/你的ID/exec"
```

然后重新部署：

```bash
netlify deploy --prod
```

## 数据字段说明

| 字段 | 说明 |
|------|------|
| timestamp | ISO 时间戳 |
| event | 事件类型：page_view / start_diagnosis / micro_answer / analysis_confirm / plan_complete / hit_score / feedback / feedback_skip |
| current_step | 当前页面：home / diagnosis / analysis / plan |
| user_input | 用户原始输入 |
| selected_feeling | 用户选择的感受选项 |
| hit_score | 命中评分：很说中 / 有一点 / 没太说中 |
| feedback_text | 开放反馈内容 |
| device_type | mobile / tablet / desktop |
| page_url | 当前路径 |
| referrer | 来源页面 |

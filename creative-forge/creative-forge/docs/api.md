# Creative Forge API 文档

本文档描述前端接入所需的核心接口。

**Base URL**: `http://localhost:8000`

---

## 目录

- [1. 用户认证](#1-用户认证)
- [2. 模型列表](#2-模型列表)
- [3. 节点执行](#3-节点执行)
  - [3.1 图片生成](#31-图片生成)
  - [3.2 视频生成](#32-视频生成)
  - [3.3 文本/剧本生成](#33-文本剧本生成)
- [4. 已注册模型](#4-已注册模型)

---

## 1. 用户认证

### POST /user/auth

用户认证接口，获取访问令牌和已授权模型列表。

#### 请求

**Headers**

| 名称 | 类型 | 必填 | 说明 |
|------|------|------|------|
| Content-Type | string | 是 | application/json |

**Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户 ID |

**示例**

POC阶段只需要输入用户ID即可获取访问令牌和授权模型列表，后续会增加更多认证方式。
支持的用户Id:testuser1
```json
{
  "userId": "testuser1"
}
```

#### 响应

**成功 (200)**

| 字段 | 类型 | 说明 |
|------|------|------|
| ak | string | 访问令牌，用于后续接口认证 |
| authedModels | object | 用户已授权的模型映射，key 为模型名称，value 为对应的端点列表 |

**示例**

```json
{
  "ak": "eyJ************IsInR",
  "authedModels": {
    "MaaS_Seedance_1.5_pro":["TkYYmWeEnFUzNMIq"],
    "MaaS_Seedream_4.0":["YkaQjzeAOhCOycba"],
    "MaaS_Seedance_1.0_pro":["ExampleEndPoint1","ExampleEndpoint2"],
    "GLM5":["hQWKGFyhYUzDRWAD"]
  }
}
```

---

## 2. 模型列表

### GET /model/list

获取可用模型列表。需要认证。

#### 请求

**Headers**

| 名称 | 类型 | 必填 | 说明 |
|------|------|------|------|
| Authorization | string | 是 | Bearer {ak} |

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ability | string | 否 | 按能力类型过滤：`text2img`, `text2video`, `chat_completion` |

**示例**

```
GET /model/list?ability=chat_completion
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 响应

**成功 (200)**

| 字段 | 类型 | 说明 |
|------|------|------|
| models | array | 模型列表 |
| total | number | 模型总数 |

**models 数组元素**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 模型配置 ID |
| name | string | 模型名称，用于 API 调用 |
| ability | string | 模型能力：`text2img`, `text2video`, `chat_completion` |
| provider | string | 模型供应商（如 volcengine, zhipu） |
| description | string | 模型描述 |
| weight | number | 排序权重，值越大优先级越高 |
| costRate | number | 成本费率系数 |

**示例**

```json
{
  "models": [
    {
      "id": "MaaS_Seedream_4.0",
      "name": "MaaS_Seedream_4.0",
      "ability": "text2img",
      "provider": "volcengine",
      "description": "Seedream 4.0 (MaaS) - High quality image generation model",
      "weight": 90,
      "costRate": 1.0
    },
    {
      "id": "MaaS_Seedance_1.5_pro",
      "name": "MaaS_Seedance_1.5_pro",
      "ability": "text2video",
      "provider": "volcengine",
      "description": "Seedance 1.5 Pro (MaaS) - Latest video generation model",
      "weight": 98,
      "costRate": 2.5
    },
    {
      "id": "GLM5",
      "name": "GLM5",
      "ability": "chat_completion",
      "provider": "zhipu",
      "description": "GLM5 - 智谱大模型，用于剧本生成和文本创作",
      "weight": 85,
      "costRate": 1.0
    }
  ],
  "total": 3
}
```

**错误 (401)**

```json
{
  "detail": "Missing or invalid authorization header"
}
```

---

## 3. 节点执行

### POST /nodes/run

执行节点生成任务（文本/图片/视频）。需要认证。

#### 请求

**Headers**

| 名称 | 类型 | 必填 | 说明 |
|------|------|------|------|
| Content-Type | string | 是 | application/json |
| Authorization | string | 是 | Bearer {ak} |

**Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 节点类型：`text`, `image`, `video`, `audio` |
| prompt | string | 是 | 生成提示词 |
| model | string | 是 | AI 模型名称 |
| name | string | 否 | 节点别名 |
| size | string | 否 | 输出尺寸，如 `2K`, `1024x768`（仅图片/视频） |
| length | number | 否 | 音视频时长（秒）（仅视频/音频） |
| watermark | boolean | 否 | 是否添加水印（仅图片/视频） |
| response_format | string | 否 | 返回格式：`url`（默认）或 `b64_json`（仅图片） |

#### 响应

**成功 (200)**

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 执行状态：`success`, `failed` |
| outputs | object | 输出数据 |
| error | string | 错误信息（仅失败时） |

**outputs 对象**

| 字段 | 类型 | 说明 |
|------|------|------|
| content_url | string | 生成内容的 URL（图片/视频，response_format 为 url 时） |
| content_b64 | string | Base64 编码的内容（图片，response_format 为 b64_json 时） |
| text | string | 生成的文本内容（文本/剧本生成时） |
| size | string | 生成内容的尺寸信息 |

---

### 3.1 图片生成

使用 `text2img` 类型模型生成图片。

**请求示例**

```json
{
  "type": "image",
  "prompt": "一位气质优雅的年轻女性站在壮丽的雪山之巅，长发随寒风飘扬",
  "model": "MaaS_Seedream_4.0",
  "size": "2K",
  "response_format": "url"
}
```

**成功响应**

```json
{
  "status": "success",
  "outputs": {
    "content_url": "https://cdn.example.com/generated/abc123.png",
    "size": "2048x2048"
  },
  "error": null
}
```

---

### 3.2 视频生成

使用 `text2video` 类型模型生成视频。视频生成为异步任务，后端会自动轮询直到完成。

**请求示例**

```json
{
  "type": "video",
  "prompt": "一只金毛犬在海边奔跑，阳光洒在金色毛发上",
  "model": "MaaS_Seedance_1.5_pro",
  "length": 5
}
```

**成功响应**

```json
{
  "status": "success",
  "outputs": {
    "content_url": "https://cdn.example.com/generated/video456.mp4"
  },
  "error": null
}
```

---

### 3.3 文本/剧本生成

使用 `chat_completion` 类型模型生成文本内容（如剧本、对话等）。

**请求示例**

```json
{
  "type": "text",
  "prompt": "创作一个关于时间旅行的短篇漫剧剧本，包含3个角色，5个场景",
  "model": "GLM5"
}
```

**成功响应**

```json
{
  "status": "success",
  "outputs": {
    "text": "# 时间旅行者\n\n## 角色\n- 李明：物理学教授...\n\n## 场景一：实验室\n..."
  },
  "error": null
}
```

**说明**

- 文本生成使用 OpenAI 兼容的 Chat Completion API 格式
- 模型内置剧本创作 system prompt，会自动输出结构化的剧本内容
- 返回的 `text` 字段包含模型生成的完整文本

---

**失败示例**

```json
{
  "status": "failed",
  "outputs": {},
  "error": "Model 'unknown_model' is not authorized for this user"
}
```

**错误 (401)**

```json
{
  "detail": "Missing or invalid authorization header"
}
```

---

## 4. 已注册模型

当前系统已注册以下模型：

| 模型名称 | 能力 | 供应商 | 执行器 | 说明 |
|---------|------|--------|--------|------|
| MaaS_Seedream_4.0 | text2img | volcengine | SyncHttpExecutor | Seedream 4.0 图片生成 |
| MaaS_Seedance_1.0_pro | text2video | volcengine | AsyncPollingExecutor | Seedance 1.0 Pro 视频生成 |
| MaaS_Seedance_1.5_pro | text2video | volcengine | AsyncPollingExecutor | Seedance 1.5 Pro 视频生成（最新） |
| GLM5 | chat_completion | zhipu | ChatCompletionExecutor | GLM5 智谱大模型，剧本/文本生成 |

### 执行器说明

| 执行器 | 类型 | 适用场景 |
|--------|------|---------|
| SyncHttpExecutor | 同步 HTTP | 直接返回结果的模型（如图片生成） |
| AsyncPollingExecutor | 异步轮询 | 任务制模型（如视频生成），POST 创建任务 → GET 轮询状态 |
| ChatCompletionExecutor | Chat Completion | OpenAI 兼容的对话模型（如文本/剧本生成） |

---

## 错误码说明

| HTTP 状态码 | 说明 |
|------------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失效 |
| 403 | 无权限访问该资源 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 调用流程

```
1. 调用 /user/auth 获取 ak 和 authedModels
            ↓
2. 调用 /model/list 获取可用模型（可选，用于展示选项）
            ↓
3. 调用 /nodes/run 执行生成任务
   - type=text + model=GLM5 → 文本/剧本生成
   - type=image + model=MaaS_Seedream_4.0 → 图片生成
   - type=video + model=MaaS_Seedance_1.5_pro → 视频生成
```

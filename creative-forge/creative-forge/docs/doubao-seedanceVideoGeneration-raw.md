# MaaS Seedance Video Generation API

> **Provider**: DouBao (ByteDance / Volcano Engine Ark)
> **API Name**: Seedance Video Generation
> **Source**: Internal gateway docs (genaiapi.cloudsway.net)

---

## Overview

Seedance supports three video generation modes:
- **Text-to-Video (t2v)**: Generate video from text prompt only
- **Image-to-Video (i2v)**: Generate video from image(s) + text prompt
  - First-frame image-to-video
  - First + Last frame (start-end frame) image-to-video
  - Reference image(s)-to-video
- **Draft Mode**: Generate a low-cost preview (样片) then convert to full video

---

## Authentication

```
Authorization: Bearer {API_KEY}
```

---

## API Endpoints

| Operation | Method | Path |
|-----------|--------|------|
| Create Task | POST | `/seedance/contents/generations/tasks` |
| Query Task (single) | GET | `/seedance/contents/generations/tasks/{id}` |
| List Tasks | GET | `/seedance/contents/generations/tasks` |
| Cancel / Delete Task | DELETE | `/seedance/contents/generations/tasks/{id}` |

**Base URL**: `https://genaiapi.cloudsway.net/v1/ai/{Your EndpointPath}`

---

## Supported Models

| Model ID | Internal Name | Notes |
|----------|---------------|-------|
| `doubao-seedance-1-5-pro-251215` | MaaS_Seedance_1.5_pro | Latest, supports audio gen, 首尾帧 not supported |
| `doubao-seedance-1-0-pro-250528` | MaaS_Seedance_1.0_pro | Supports first-frame + 首尾帧 |
| `doubao-seedance-1-0-pro-fast-250528` | MaaS_Seedance_1.0_pro_fast | Fast variant, supports first-frame + 首尾帧 |
| `doubao-seedance-1-0-lite-i2v-250428` | MaaS_Seedance_1.0_lite_i2v | Supports first-frame, 首尾帧, and reference images |

---

## Create Task — POST

### Request Body

```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [
    {
      "type": "text",
      "text": "A detective enters a dimly lit room... --ratio 16:9"
    },
    {
      "type": "image_url",
      "image_url": {
        "url": "https://example.com/first_frame.png"
      },
      "role": "first_frame"
    }
  ],
  "seed": 42,
  "duration": 5,
  "resolution": "720p",
  "watermark": false,
  "return_last_frame": false,
  "generate_audio": true,
  "draft": false,
  "callback_url": "https://example.com/callback",
  "service_tier": "default",
  "execution_expires_after": 172800
}
```

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | Yes | - | Model ID |
| `content` | array | Yes | - | Array of content objects (see below) |
| `seed` | integer | No | random | Random seed for reproducibility |
| `duration` | integer | No | - | Duration in seconds. Mutually exclusive with `frames` |
| `frames` | integer | No | - | Frame count. Mutually exclusive with `duration`. **Not supported by MaaS_Seedance_1.5_pro** |
| `resolution` | string | No | - | Output resolution. E.g., `"720p"`, `"1080p"` |
| `watermark` | boolean | No | - | Add watermark to output |
| `return_last_frame` | boolean | No | `false` | Return last frame image (PNG, same resolution as video, no watermark) |
| `generate_audio` | boolean | No | `true` | Generate synchronized audio. **MaaS_Seedance_1.5_pro only**: set to `false` for silent video |
| `draft` | boolean | No | `false` | Enable draft mode (样片). Lower cost preview. 480p only, no last_frame, no flex tier |
| `callback_url` | string | No | - | Webhook for task status updates (POST) |
| `service_tier` | string | No | - | `"default"` (online, low RPM) or `"flex"` (offline, 50% price). **Platform currently does not support `flex`** |
| `execution_expires_after` | integer | No | `172800` | Task expiry in seconds. Range: [3600, 259200] (1h–72h) |

### Content Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `"text"`, `"image_url"`, or `"draft_task"` |
| `text` | string | Conditional | Text prompt. Required when `type="text"`. May include inline params (see below) |
| `image_url` | object | Conditional | Required when `type="image_url"`. Contains `{"url": "..."}` |
| `image_url.url` | string | Conditional | Image URL or Base64 (`data:image/<fmt>;base64,<data>`) |
| `role` | string | Conditional | Image role: `"first_frame"`, `"last_frame"`, `"reference_image"` |
| `draft_task` | object | Conditional | Required when `type="draft_task"`. Contains `{"id": "..."}` (draft task ID) |

### Inline Text Parameters (appended to prompt text)

| Parameter | Example | Description |
|-----------|---------|-------------|
| `--ratio` / `--rt` | `--ratio 16:9` | Aspect ratio (e.g., `16:9`, `9:16`, `1:1`, `adaptive`) |
| `--dur` | `--dur 5` | Duration in seconds |
| `--rs` | `--rs 720p` | Resolution |
| `--cf` | `--cf false` | Camera follow |
| `--seed` | `--seed 12345` | Random seed |
| `--wm` | `--wm true` | Watermark |

### Image-to-Video Modes & Roles

| Mode | Supported Models | Image Count | `role` Value |
|------|-----------------|-------------|--------------|
| First-frame i2v | All i2v models | 1 | `"first_frame"` (or omit) |
| First+Last frame i2v | 1.5_pro, 1.0_pro, 1.0_pro_fast, 1.0_lite_i2v | 2 | `"first_frame"` + `"last_frame"` (both required) |
| Reference image i2v | 1.0_lite_i2v | 1–4 | All `"reference_image"` |

### Response (Create Task)

```json
{
  "id": "cgt-2025xxxxxx-xxxx"
}
```

---

## Query Single Task — GET

**URL**: `/seedance/contents/generations/tasks/{id}`

### Response (Success)

```json
{
  "id": "cgt-2025xxxxxx-xxxx",
  "model": "doubao-seedance-1-0-pro-250528",
  "status": "succeeded",
  "content": {
    "video_url": "https://ark-content-generation-cn-beijing.tos-cn-beijing.volces.com/...mp4?..."
  },
  "seed": 10,
  "resolution": "720p",
  "duration": 5,
  "ratio": "16:9",
  "framespersecond": 24,
  "usage": {
    "completion_tokens": 108900,
    "total_tokens": 108900
  },
  "created_at": 1743414619,
  "updated_at": 1743414673
}
```

### Task Status Values

| Status | Description |
|--------|-------------|
| `pending` / `running` | In progress |
| `succeeded` | Completed successfully |
| `failed` | Generation failed |

---

## List Tasks — GET

**URL**: `/seedance/contents/generations/tasks`

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page_num` | integer | Page number |
| `page_size` | integer | Page size |
| `filter.status` | string | Filter by status |
| `filter.task_ids` | string | Filter by task ID(s) |
| `filter.model` | string | Filter by model |

### Response

```json
{
  "total": 3,
  "items": [
    {
      "id": "cgt-2025xxxxxx-xxxx",
      "model": "doubao-seedance-1-0-pro-250528",
      "status": "succeeded",
      "content": {
        "video_url": "https://..."
      },
      "seed": 10,
      "resolution": "720p",
      "duration": 5,
      "ratio": "16:9",
      "framespersecond": 24,
      "usage": {
        "completion_tokens": 108900,
        "total_tokens": 108900
      },
      "created_at": 1743414619,
      "updated_at": 1743414673
    }
  ]
}
```

---

## Cancel / Delete Task — DELETE

**URL**: `/seedance/contents/generations/tasks/{id}`

No response body.

---

## Draft Mode Workflow (样片模式)

Used to preview a video at low cost before generating the full video.

**Step 1**: Create draft task with `"draft": true`, using `480p` resolution only.

```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [...],
  "seed": 20,
  "duration": 6,
  "draft": true
}
```

Response: `{ "id": "cgt-2026xxxxxx-AAAAA" }`

**Step 2**: Poll task status until `succeeded`.

**Step 3**: Create full video task using `draft_task` content type:

```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [
    {
      "type": "draft_task",
      "draft_task": { "id": "cgt-2026xxxxxx-AAAAA" }
    }
  ],
  "watermark": false,
  "resolution": "720p",
  "return_last_frame": true,
  "service_tier": "default"
}
```

Response: `{ "id": "cgt-2026xxxxxx-BBBBB" }`

**Step 4**: Poll the new full-video task until `succeeded`.

---

## Metering

- **Usage field**: `usage.completion_tokens` in query task response
- `completion_tokens` = `total_tokens` for this API (no input tokens billed)
- Token count varies by resolution, duration, and fps

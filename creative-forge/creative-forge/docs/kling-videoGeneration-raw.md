# Kling Video Generation - Raw API Documentation

> Source: `kling_raw.md`
> Focus: MaaS_KeLing_V2.6 and O1 Video Generation

---

## Provider Info

- **Provider Name**: Kling (Kuaishou)
- **API Name**: Video Generation
- **Supported Models**:
  - MaaS_KL_V1.6
  - MaaS_KL_V2.1
  - MaaS_KL_V2.1_Master
  - **MaaS_KeLing_V2.6** (latest)

---

## Authentication

| Parameter | Type | Description |
|-----------|------|-------------|
| Authorization | string | Bearer token authentication |

Format: `Authorization: Bearer {API_KEY}`

---

# Part 1: Text-to-Video (文生视频)

## Create Task

- **HTTP Method**: POST
- **API Path**: `/v1/ai/{endpointPath}/kling/videos/text2video`

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| model_name | string | No | kling-v1 | Model name. Enum: `MaaS_KL_V1.6`, `MaaS_KL_V2.1_Master`, `MaaS_KeLing_V2.6` |
| prompt | string | Yes | - | Text prompt for video generation. Max 2500 characters. |
| sound | string | No | off | Generate audio with video. Enum: `on`, `off`. **Only MaaS_KeLing_V2.6+ supports this.** |
| negative_prompt | string | No | empty | Negative prompt. Max 2500 characters. |
| cfg_scale | float | No | 0.5 | Generation freedom. Range: [0, 1]. Higher = more adherence to prompt. **Not supported by MaaS_KL_V2.1_Master, MaaS_KeLing_V2.6.** |
| mode | string | No | std | Generation mode. Enum: `std` (standard), `pro` (high quality). **MaaS_KL_V2.1_Master not supported. MaaS_KeLing_V2.6 only supports `pro`.** |
| camera_control | object | No | - | Camera movement control. See below. |
| camera_control.type | string | No | - | Camera type. Enum: `simple`, `down_back`, `forward_up`, `right_turn_forward`, `left_turn_forward` |
| camera_control.config | object | No | - | Camera config (required when type=`simple`). Only one param can be non-zero. |
| camera_control.horizontal | float | No | - | Horizontal movement. Range: [-10, 10]. Negative=left, positive=right. |
| camera_control.vertical | float | No | - | Vertical movement. Range: [-10, 10]. Negative=down, positive=up. |
| camera_control.pan | float | No | - | Horizontal rotation. Range: [-10, 10]. |
| camera_control.tilt | float | No | - | Vertical rotation. Range: [-10, 10]. |
| camera_control.roll | float | No | - | Roll rotation. Range: [-10, 10]. |
| camera_control.zoom | float | No | - | Zoom. Range: [-10, 10]. Negative=zoom in, positive=zoom out. |
| camera_control.aspect_ratio | string | No | 16:9 | Aspect ratio. Enum: `16:9`, `9:16`, `1:1` |
| duration | string | No | 5 | Video duration in seconds. Enum: `5`, `10` |
| external_task_id | string | No | - | Custom task ID for tracking. Must be unique per user. |

### Request Example

```bash
curl --location 'https://genaiapi.cloudsway.net/v1/ai/{endpointPath}/kling/videos/text2video' \
--header 'Authorization: Bearer $API_KEY' \
--header 'Content-Type: application/json' \
--data '{
    "model_name": "kling-v2.6",
    "prompt": "小狗在草地上奔跑",
    "sound": "on",
    "mode": "pro",
    "duration": "5"
}'
```

### Response Example

```json
{
    "request_id": "string",
    "code": 0,
    "message": "string",
    "data": {
        "task_id": "string",
        "task_info": {
            "external_task_id": "string"
        },
        "task_status": "submitted",
        "created_at": 1722769557708,
        "updated_at": 1722769557708
    }
}
```

## Query Task

- **HTTP Method**: GET
- **API Path**: `/v1/ai/{endpointPath}/kling/videos/text2video/{task_id}`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| task_id | string | Optional | Task ID (path parameter). Use either this or external_task_id. |
| external_task_id | string | Optional | Custom task ID (query parameter). |

### Response Example (Success)

```json
{
    "code": 0,
    "message": "string",
    "request_id": "string",
    "data": {
        "task_status": "succeed",
        "task_status_msg": "string",
        "task_info": {
            "task_id": "string",
            "external_task_id": "string"
        },
        "task_result": {
            "videos": [
                {
                    "id": "string",
                    "url": "https://...",
                    "duration": "5"
                }
            ],
            "created_at": 1722769557708,
            "updated_at": 1722769557708
        }
    }
}
```

---

# Part 2: Image-to-Video (图生视频)

## Create Task

- **HTTP Method**: POST
- **API Path**: `/v1/ai/{endpointPath}/kling/videos/image2video`

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| model_name | string | No | kling-v1 | Model name. Enum: `MaaS_KL_V1.6`, `MaaS_KL_V2.1`, `MaaS_KL_V2.1_Master`, `MaaS_KeLing_V2.6` |
| image | string | Yes | - | First frame image. URL or Base64 (no `data:` prefix). Formats: jpg/jpeg/png. Max 10MB. Min 300x300px. |
| image_tail | string | No | - | Last frame image. Same format as image. At least one of image/image_tail required. |
| sound | string | No | off | Generate audio. Enum: `on`, `off`. **Only MaaS_KeLing_V2.6+.** |
| prompt | string | No | - | Text prompt. Max 2500 characters. |
| negative_prompt | string | No | - | Negative prompt. Max 2500 characters. |
| cfg_scale | float | No | 0.5 | Generation freedom. Range: [0, 1]. |
| mode | string | No | std | Mode. Enum: `std`, `pro`. **MaaS_KL_V2.1_Master not supported. MaaS_KeLing_V2.6 only supports `pro`.** |
| static_mask | string | No | - | Static brush mask image. Same aspect ratio as input image. |
| dynamic_masks | array | No | - | Dynamic brush configs (max 6 groups). |
| dynamic_masks[].mask | string | No | - | Mask image for dynamic brush. |
| dynamic_masks[].trajectories | array | No | - | Motion trajectory coordinates. Max 77 points for 5s video. |
| dynamic_masks[].trajectories[].x | int | No | - | X coordinate (origin at bottom-left). |
| dynamic_masks[].trajectories[].y | int | No | - | Y coordinate (origin at bottom-left). |
| camera_control | object | No | - | Camera control (same as text2video). |
| duration | string | No | 5 | Video duration. Enum: `5`, `10` |
| external_task_id | string | No | - | Custom task ID. |

### Request Example

```bash
curl --location 'https://genaiapi.cloudsway.net/v1/ai/{endpointPath}/kling/videos/image2video' \
--header 'Authorization: Bearer $API_KEY' \
--header 'Content-Type: application/json' \
--data '{
    "model_name": "kling-v2.6",
    "image": "https://example.com/image.jpg",
    "prompt": "人物在跳舞",
    "sound": "on",
    "mode": "pro",
    "duration": "5"
}'
```

### Response Example

```json
{
    "code": 0,
    "message": "string",
    "request_id": "string",
    "data": {
        "task_id": "string",
        "task_info": {
            "external_task_id": "string"
        },
        "task_status": "submitted",
        "created_at": 1722769557708,
        "updated_at": 1722769557708
    }
}
```

## Query Task

- **HTTP Method**: GET
- **API Path**: `/v1/ai/{endpointPath}/kling/videos/image2video/{task_id}`

### Response Example (Success)

```json
{
    "code": 0,
    "message": "string",
    "request_id": "string",
    "data": {
        "task_id": "string",
        "task_status": "succeed",
        "task_status_msg": "string",
        "task_info": {
            "external_task_id": "string"
        },
        "task_result": {
            "videos": [
                {
                    "id": "string",
                    "url": "https://...",
                    "duration": "5"
                }
            ]
        },
        "created_at": 1722769557708,
        "updated_at": 1722769557708
    }
}
```

---

# Part 3: O1 Video Generation (O1生视频 / Omni-Video)

## Overview

O1 Video Generation is an advanced unified API that supports:
- Text-to-video
- Image-to-video (first frame, last frame, or both)
- Video editing (with reference video)
- Element/subject reference (custom or preset subjects)

## Create Custom Element (Subject)

- **HTTP Method**: POST
- **API Path**: `/v1/ai/{endpointPath}/kling/general/custom-elements`

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| element_name | string | Yes | Subject name. Max 20 characters. |
| element_description | string | Yes | Subject description. Max 100 characters. |
| element_frontal_image | string | Yes | Front view reference image. URL or Base64. Max 10MB. Min 300px. Aspect ratio 1:2.5 ~ 2.5:1. |
| element_refer_list | array | Yes | Additional reference images (1-3 images). |
| element_refer_list[].image_url | string | Yes | Reference image URL. |

### Response Example

```json
{
    "code": 0,
    "message": "string",
    "request_id": "string",
    "data": {
        "element_id": 123456789,
        "element_name": "string",
        "element_description": "string",
        "element_frontal_image": "image_url",
        "element_refer_list": [
            {"image_url": "image_url_1"}
        ],
        "owned_by": "kling"
    }
}
```

## Query Personal Elements

- **HTTP Method**: GET
- **API Path**: `/v1/ai/{endpointPath}/kling/general/custom-elements?pageNum=1&pageSize=30`

## Query Preset Elements

- **HTTP Method**: GET
- **API Path**: `/v1/ai/{endpointPath}/kling/general/presets-elements?pageNum=1&pageSize=30`

## Create Video Task (Omni-Video)

- **HTTP Method**: POST
- **API Path**: `/v1/ai/{endpointPath}/kling/videos/omni-video`

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| prompt | string | Yes | - | Text prompt. Max 2500 chars. Use `<<<element_1>>>`, `<<<image_1>>>`, `<<<video_1>>>` to reference elements/images/videos. |
| image_list | array | No | - | Reference images. Max 7 without video, max 4 with video. |
| image_list[].image_url | string | No | - | Image URL or Base64. |
| image_list[].type | string | No | - | Image type. Enum: `first_frame`, `end_frame`. |
| element_list | array | No | - | Subject references from element library. |
| element_list[].element_id | long | No | - | Element ID from custom/preset elements. |
| video_list | array | No | - | Reference videos (max 1). |
| video_list[].video_url | string | No | - | Video URL. MP4/MOV, 3-10s, max 200MB. |
| video_list[].refer_type | string | No | base | Reference type. Enum: `feature` (style reference), `base` (video to edit). |
| video_list[].keep_original_sound | string | No | yes | Keep original audio. Enum: `yes`, `no`. |
| mode | string | No | pro | Mode. Enum: `std`, `pro`. |
| aspect_ratio | string | No | - | Aspect ratio. Enum: `16:9`, `9:16`, `1:1`. **Required when not using first frame or video editing.** |
| duration | string | No | 5 | Duration in seconds. Enum: `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`. Text/image-to-video only supports `5` and `10`. |
| callback_url | string | No | - | Callback URL for task status updates. |
| external_task_id | string | No | - | Custom task ID. |

### Request Example (Text-to-Video with Element)

```bash
curl --location --request POST 'https://genaiapi.cloudsway.net/v1/ai/{endpointPath}/kling/videos/omni-video' \
--header 'Authorization: Bearer $API_KEY' \
--header 'Content-Type: application/json' \
--data-raw '{
    "prompt": "基于<<<element_1>>>，生成图中人物正在前行的镜头，远方天空中隐隐有佛光闪耀",
    "mode": "pro",
    "aspect_ratio": "16:9",
    "element_list": [
        {"element_id": 829376081165181009}
    ]
}'
```

### Request Example (First Frame Image-to-Video)

```bash
curl --location --request POST 'https://genaiapi.cloudsway.net/v1/ai/{endpointPath}/kling/videos/omni-video' \
--header 'Authorization: Bearer $API_KEY' \
--header 'Content-Type: application/json' \
--data-raw '{
    "prompt": "人物缓缓转身，微笑着挥手",
    "mode": "pro",
    "duration": "5",
    "image_list": [
        {"image_url": "https://example.com/first_frame.jpg", "type": "first_frame"}
    ]
}'
```

### Response Example

```json
{
    "code": 0,
    "message": "string",
    "request_id": "string",
    "data": {
        "task_id": "string",
        "task_info": {
            "external_task_id": "string"
        },
        "task_status": "submitted",
        "created_at": 1722769557708,
        "updated_at": 1722769557708
    }
}
```

## Query Task (Omni-Video)

- **HTTP Method**: GET
- **API Path**: `/v1/ai/{endpointPath}/kling/videos/omni-video/{task_id}`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| task_id | string | Optional | Task ID (path parameter). |
| external_task_id | string | Optional | Custom task ID (query parameter). |

### Response Example (Success)

```json
{
    "code": 0,
    "message": "string",
    "request_id": "string",
    "data": {
        "task_id": "string",
        "task_status": "succeed",
        "task_status_msg": "string",
        "task_info": {
            "external_task_id": "string"
        },
        "task_result": {
            "videos": [
                {
                    "id": "string",
                    "url": "https://...",
                    "duration": "5"
                }
            ]
        },
        "created_at": 1722769557708,
        "updated_at": 1722769557708
    }
}
```

---

## Task Status Values

| Status | Description |
|--------|-------------|
| submitted | Task submitted |
| processing | Task processing |
| succeed | Task completed successfully |
| failed | Task failed |

---

## Error Response Format

```json
{
    "code": 1001,
    "message": "Error description",
    "request_id": "string"
}
```

---

## Notes

1. **Video URL Validity**: Generated video URLs are valid for 30 days
2. **Base64 Format**: Do NOT include `data:image/...;base64,` prefix
3. **MaaS_KeLing_V2.6 Features**:
   - Supports audio generation (`sound: "on"`)
   - Only supports `pro` mode
   - Does not support `cfg_scale`
4. **O1/Omni-Video**: Most flexible API, supports elements, images, and video editing in one interface

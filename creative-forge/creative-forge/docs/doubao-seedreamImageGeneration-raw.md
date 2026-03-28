# Doubao Seedream Image Generation - Raw API Documentation

> Source: https://docs.cloudsway.net/zh/maasapi/api-reference/image/seedream/

---

## Provider Info

- **Provider Name**: DouBao (ByteDance)
- **API Name**: Seedream Image Generation
- **Supported Models**:
  - MaaS_Seedream_4.5
  - MaaS_Seedream_4.0
  - MaaS_SeedEdit_3.0_i2i
  - MaaS_SeedEdit_3.0_t2i

---

## API Endpoint

- **Protocol**: HTTP
- **HTTP Method**: POST
- **API Path**: `/v1/ai/{endpointPath}/seedream/image/generations`
- **Full URL**: `https://genaiapi.cloudsway.net/v1/ai/{endpointPath}/seedream/image/generations`
- **Content-Type**: application/json

---

## Authentication

| Parameter | Type | Description |
|-----------|------|-------------|
| Authorization | string | Bearer token authentication |

Format: `Authorization: Bearer {API_KEY}`

---

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | string | Yes | Text prompt for image generation. Supports Chinese and English. Recommended: max 300 Chinese characters or 600 English words. Too many words may cause model to ignore details. |
| image | string/array | No | Input image(s) for image-to-image generation. Supports URL or Base64 encoding. Single or multiple images supported (MaaS_Seedream_4.5, MaaS_Seedream_4.0). MaaS_SeedEdit_3.0_i2i only supports single image. |
| size | string | No | Output image size. Two methods available (cannot be mixed): **Method 1**: `2K` or `4K` - model determines aspect ratio from prompt. **Method 2**: Specify width x height (e.g., `2048x2048`). Default: `2048x2048`. Total pixels range: [3,686,400 - 16,777,216]. Aspect ratio range: [1/16, 16]. MaaS_SeedEdit_3.0_i2i only supports `adaptive`. |
| seed | integer | No | Random seed for reproducibility. Default: -1. Range: [-1, 2147483647]. Only supported by MaaS_SeedEdit_3.0_i2i. |
| sequential_image_generation | string | No | Control multi-image generation. Default: `disabled`. Values: `auto` (model decides), `disabled` (single image only). Not supported by MaaS_SeedEdit_3.0_i2i. |
| sequential_image_generation_options | object | No | Multi-image generation options. Only effective when sequential_image_generation is `auto`. |
| sequential_image_generation_options.max_images | integer | No | Maximum images to generate. Default: 15. Range: [1, 15]. Note: input images + output images <= 15. |
| stream | boolean | No | Enable streaming output. Default: `false`. Not supported by MaaS_SeedEdit_3.0_i2i. |
| guidance_scale | float | No | Text guidance scale (prompt adherence). Range: [1, 10]. Higher = more adherence to prompt. Default for MaaS_SeedEdit_3.0_i2i: 5.5. Not supported by MaaS_Seedream_4.5/4.0. |
| response_format | string | No | Output format. Default: `url`. Values: `url` (download link, valid 24h), `b64_json` (Base64 encoded). Output format is JPEG. |
| watermark | boolean | No | Add watermark. Default: `true`. `true` adds "AI Generated" watermark at bottom-right. |
| optimize_prompt_options | object | No | Prompt optimization options. Not supported by MaaS_SeedEdit_3.0_i2i. |
| optimize_prompt_options.mode | string | No | Prompt optimization mode. Default: `standard`. Values: `standard` (higher quality, slower), `fast` (faster, lower quality). |

### Image Input Requirements

- **Formats**: jpeg, png (MaaS_Seedream_4.5/4.0 also support: webp, bmp, tiff, gif)
- **Aspect Ratio (width/height)**:
  - [1/16, 16] for MaaS_Seedream_4.5, MaaS_Seedream_4.0
  - [1/3, 3] for MaaS_SeedEdit_3.0_i2i, MaaS_SeedEdit_3.0_t2i
- **Dimensions**: width and height > 14px
- **Size**: max 10MB
- **Total Pixels**: max 6000x6000 px
- **Max Reference Images**: 14

### Base64 Image Format

```
data:image/<format>;base64,<base64_data>
```
Note: `<format>` must be lowercase (e.g., `data:image/png;base64,...`)

---

## Response Body

### Non-Streaming Response

```json
{
    "model": "doubao-seedream-4-5-251128",
    "created": 1757323224,
    "data": [
        {
            "url": "https://...",
            "size": "1760x2368"
        }
    ],
    "usage": {
        "generated_images": 1,
        "output_tokens": 16280,
        "total_tokens": 16280
    }
}
```

### Streaming Response

**Event: image_generation.partial_succeeded**
```json
{
  "type": "image_generation.partial_succeeded",
  "model": "doubao-seedream-4-5-251128",
  "created": 1757396757,
  "image_index": 0,
  "url": "https://...",
  "size": "2496x1664"
}
```

**Event: image_generation.completed**
```json
{
  "type": "image_generation.completed",
  "model": "doubao-seedream-4-5-251128",
  "created": 1757396825,
  "usage": {
    "generated_images": 3,
    "output_tokens": 48672,
    "total_tokens": 48672
  }
}
```

**Final Event:**
```
data: [DONE]
```

### Streaming Event Types

| Event Type | Description |
|------------|-------------|
| image_generation.partial_succeeded | Returned when any image generation succeeds |
| image_generation.partial_failed | Returned when any image generation fails. If due to content moderation: continues with next image. If due to internal error (500): stops processing. |
| image_generation.completed | Final event after all images processed (success or failure) |

### Error Response

```json
{
  "error": {
    "code": "BadRequest",
    "message": "The request failed because it is missing one or multiple required parameters. Request ID: {id}"
  }
}
```

---

## Request Examples

### Text-to-Image

```bash
curl https://genaiapi.cloudsway.net/v1/ai/{endpointPath}/seedream/image/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "doubao-seedream-4-5-251128",
    "prompt": "充满活力的特写编辑肖像，模特眼神犀利，头戴雕塑感帽子，色彩拼接丰富，眼部焦点锐利，景深较浅，具有Vogue杂志封面的美学风格，采用中画幅拍摄，工作室灯光效果强烈。",
    "size": "2K",
    "watermark": false
}'
```

### Image-to-Image (Single)

```bash
curl -X POST https://genaiapi.cloudsway.net/v1/ai/{endpointPath}/seedream/image/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "doubao-seedream-4-5-251128",
    "prompt": "保持模特姿势和液态服装的流动形状不变。将服装材质从银色金属改为完全透明的清水（或玻璃）。透过液态水流，可以看到模特的皮肤细节。光影从反射变为折射。",
    "image": "https://example.com/input.png",
    "size": "2K",
    "watermark": false
}'
```

### Image-to-Image (Multiple)

```bash
curl -X POST https://genaiapi.cloudsway.net/v1/ai/{endpointPath}/seedream/image/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "doubao-seedream-4-5-251128",
    "prompt": "将图1的服装换为图2的服装",
    "image": ["https://example.com/image1.png", "https://example.com/image2.png"],
    "sequential_image_generation": "disabled",
    "size": "2K",
    "watermark": false
}'
```

---

## Size Reference Tables

### Table 1: MaaS_Seedream_4.5 Recommended Sizes

| Aspect Ratio | Width x Height |
|--------------|----------------|
| 1:1 | 2048x2048 |
| 4:3 | 2304x1728 |
| 3:4 | 1728x2304 |
| 16:9 | 2560x1440 |
| 9:16 | 1440x2560 |
| 3:2 | 2496x1664 |
| 2:3 | 1664x2496 |
| 21:9 | 3024x1296 |

### Table 2: MaaS_SeedEdit_3.0_i2i Preset Sizes (Partial)

| Ratio (W/H) | Width | Height |
|-------------|-------|--------|
| 0.33 | 512 | 1536 |
| 0.5 | 672 | 1312 |
| 0.67 | 832 | 1248 |
| 1.0 | 1024 | 1024 |
| 1.5 | 1248 | 832 |
| 2.0 | 1344 | 672 |
| 3.0 | 1536 | 512 |

---

## API Type

- **Sync Mode**: Request returns result directly (non-streaming)
- **Streaming Mode**: Returns SSE stream with progressive results (when `stream: true`)

---

## Notes

1. **Model name in request**: Use deployment name (e.g., `doubao-seedream-4-5-251128`)
2. **URL validity**: Generated image URLs are valid for 24 hours
3. **Multi-image generation**: Total input + output images cannot exceed 15
4. **Content moderation**: Images may fail due to content policy violations
5. **Token-based metering**: Usage is measured in `output_tokens` and `total_tokens`

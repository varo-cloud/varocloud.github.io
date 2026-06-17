# WaveSpeed Bytedance 模型输入 Schema 参数整理

数据来源：通过 `https://wavespeed.ai/center/default/api/v1/model_schema/{model_name}` 抓取 21 个模型的 `Input` schema 后汇总。  
参考：[`waver-1.0` schema 示例](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/waver-1.0)

## 1. 需要设计的表单参数（统一视角）

共 10 类输入参数：

| 参数名 | JSON 类型 | 推荐组件 | 关键约束/选项 | 出现模型数 |
|---|---|---|---|---|
| `prompt` | `string` | `Textarea` | 多数模型必填；部分描述标注 max 2000 字 | 21 |
| `image` | `string` | `ImageUploader`（单图） | 常用于 i2v 主图；部分模型必填 | 11 |
| `last_image` | `string` | `ImageUploader`（单图，`uploader`） | 可选尾帧图 | 9 |
| `reference_images` | `array<string>` | `MultiImageUploader`（`uploaders`） | `minItems=1`，`maxItems=4` | 1 |
| `aspect_ratio` | `string` | `Select` | `21:9/16:9/4:3/1:1/3:4/9:16` | 19 |
| `duration` | `integer` | `Slider` 或 `Select`（按模型） | 详见下节 | 20 |
| `resolution` | `string` | `Select` | `480p/720p/1080p`（fast 部分仅 `720p/1080p`） | 7 |
| `generate_audio` | `boolean` | `Switch` | 默认 `true` | 5 |
| `camera_fixed` | `boolean` | `Switch` | 默认 `false` | 20 |
| `seed` | `integer` | `NumberInput` | 默认多为 `-1`（随机） | 21 |

## 2. `duration` 组件需要两种形态

同一字段在不同模型族有不同约束：

1. `Slider` 形态（连续整数步进）
   - 适用：`seedance-v1.5-pro` 系列、`seedance-v1-lite/reference-to-video`
   - 约束：
     - v1.5-pro：`min=4`, `max=12`, `step=1`
     - reference-to-video：`min=2`, `max=12`, `step=1`

2. `Select` 形态（离散枚举）
   - 适用：`seedance-v1-pro*`、`seedance-v1-lite-*`（大部分）
   - 选项：`[2,3,4,5,6,7,8,9,10,11,12]`

## 3. 各模型分组参数清单

说明：`*` 表示 required。

### 3.1 Seedance v1.5 Pro（5 个）

- `bytedance/seedance-v1.5-pro/image-to-video`
  - 必填：`prompt*`, `image*`
  - 可选：`last_image`, `aspect_ratio`, `duration`, `resolution`, `generate_audio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1.5-pro/image-to-video-fast`
  - 必填：`prompt*`, `image*`
  - 可选：`last_image`, `aspect_ratio`, `duration`, `resolution`（仅 `720p/1080p`）, `generate_audio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1.5-pro/text-to-video`
  - 必填：`prompt*`
  - 可选：`aspect_ratio`, `duration`, `resolution`, `generate_audio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1.5-pro/text-to-video-fast`
  - 必填：`prompt*`
  - 可选：`aspect_ratio`, `duration`, `resolution`（仅 `720p/1080p`）, `generate_audio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1.5-pro/image-to-video-spicy`
  - 必填：`image*`
  - 可选：`prompt`, `last_image`, `aspect_ratio`, `duration`, `resolution`, `generate_audio`, `camera_fixed`, `seed`

### 3.2 Seedance v1 Pro Fast（2 个）

- `bytedance/seedance-v1-pro-fast/text-to-video`
  - 必填：`prompt*`
  - 可选：`resolution`, `duration`（枚举 2-12）, `aspect_ratio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1-pro-fast/image-to-video`
  - 必填：`prompt*`, `image*`
  - 可选：`resolution`, `duration`（枚举 2-12）, `aspect_ratio`, `camera_fixed`, `seed`

### 3.3 Seedance v1 Pro 固定分辨率（6 个）

这组模型把分辨率固化在模型名中（`480p/720p/1080p`），schema 中通常不再提供 `resolution` 字段。

- `bytedance/seedance-v1-pro-i2v-480p`
  - 必填：`image*`, `duration*`
  - 可选：`prompt`, `last_image`, `aspect_ratio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1-pro-i2v-720p`
  - 必填：`image*`, `duration*`
  - 可选：`prompt`, `last_image`, `aspect_ratio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1-pro-i2v-1080p`
  - 必填：`image*`
  - 可选：`prompt`, `last_image`, `duration`, `aspect_ratio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1-pro-t2v-480p`
  - 必填：`prompt*`
  - 可选：`aspect_ratio`, `duration`, `camera_fixed`, `seed`

- `bytedance/seedance-v1-pro-t2v-720p`
  - 必填：`prompt*`
  - 可选：`aspect_ratio`, `duration`, `camera_fixed`, `seed`

- `bytedance/seedance-v1-pro-t2v-1080p`
  - 必填：`prompt*`
  - 可选：`aspect_ratio`, `duration`, `camera_fixed`, `seed`

### 3.4 Seedance v1 Lite（7 个）

- `bytedance/seedance-v1-lite-i2v-480p`
  - 必填：`image*`
  - 可选：`prompt`, `last_image`, `duration`, `aspect_ratio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1-lite-i2v-720p`
  - 必填：`image*`
  - 可选：`prompt`, `last_image`, `duration`, `aspect_ratio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1-lite-i2v-1080p`
  - 必填：`image*`
  - 可选：`prompt`, `last_image`, `duration`, `aspect_ratio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1-lite-t2v-480p`
  - 必填：`prompt*`, `duration*`
  - 可选：`aspect_ratio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1-lite-t2v-720p`
  - 必填：`prompt*`, `duration*`
  - 可选：`aspect_ratio`, `camera_fixed`, `seed`

- `bytedance/seedance-v1-lite-t2v-1080p`
  - 必填：`prompt*`
  - 可选：`aspect_ratio`, `duration`, `camera_fixed`, `seed`

- `bytedance/seedance-v1-lite/reference-to-video`
  - 必填：`prompt*`, `reference_images*`
  - 可选：`duration`, `camera_fixed`, `seed`

### 3.5 Waver（1 个）

- `bytedance/waver-1.0`
  - 必填：`prompt*`, `image*`
  - 可选：`seed`

## 4. 给设计师的组件清单（可直接出稿）

1. `PromptTextarea`
2. `SingleImageUploader`（`image` / `last_image`）
3. `MultiImageUploader`（`reference_images`, 1-4 张）
4. `AspectRatioSelect`（6 个比例）
5. `DurationSlider`（2-12 或 4-12）
6. `DurationSelect`（2~12）
7. `ResolutionSelect`（480/720/1080）
8. `GenerateAudioSwitch`
9. `CameraFixedSwitch`
10. `SeedNumberInput`（支持 `-1` 随机语义）

## 5. 推荐表单分区（信息架构）

按 schema 的 `x-order-properties`，建议统一为三段：

- 主输入：`prompt`、`image`、`last_image/reference_images`
- 视频设置：`aspect_ratio`、`duration`、`resolution`
- 高级参数：`generate_audio`、`camera_fixed`、`seed`


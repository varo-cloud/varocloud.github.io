# WaveSpeed Kling 模型输入 Schema 参数整理

数据来源：通过 `https://wavespeed.ai/center/default/api/v1/model_schema/{model_name}` 抓取 48 个模型的 `Input` schema 后汇总。

> **注意**：模型列表中的供应商前缀为 `kwaivgj`，但 WaveSpeed schema API 实际使用的前缀是 **`kwaivgi`**（少一个 `j`）。下文模型名均以 API 可用路径为准。

## 1. 需要设计的表单参数（统一视角）

共 24 类输入参数（比 Bytedance/Seedance 更复杂）：

| 参数名 | JSON 类型 | 推荐组件 | 关键约束/选项 | 出现模型数 |
|---|---|---|---|---|
| `prompt` | `string` | `Textarea` | 多数模型必填；与 `multi_prompt` 二选一 | 43 |
| `negative_prompt` | `string` | `Textarea` | 负向提示词，可选 | 29 |
| `text` | `string` | `Textarea` | 口型同步文本，max 120 字 | 1 |
| `image` | `string` | `ImageUploader` | 单图；jpg/png，≤10MB | 25 |
| `end_image` | `string` | `ImageUploader` (`uploader`) | 尾帧图 | 7 |
| `last_image` | `string` | `ImageUploader` (`uploader`) | 尾帧图（命名不同） | 3 |
| `images` | `array<string>` | `MultiImageUploader` | 参考图，max 4~10 张 | 7 |
| `video` | `string` | `VideoUploader` | mp4/mov，≤10MB；部分限制 ≤10s | 12 |
| `audio` | `string` | `AudioUploader` | 音频 URL | 6 |
| `aspect_ratio` | `string` | `Select` | `16:9` / `9:16` / `1:1` | 15 |
| `duration` | `integer` / `number` | `Select` 或 `NumberInput` | 见下节 | 32 |
| `cfg_scale` | `number` | `Slider` | 0–1，step 0.01，默认 0.5 | 8 |
| `guidance_scale` | `number` | `Slider` | 0–1，step 0.01/0.1，默认 0.5 | 12 |
| `sound` | `boolean` | `Switch` | 是否同步生成音频 | 8 |
| `shot_type` | `string` | `Select` / `Radio` | `customize` / `intelligent` | 6 |
| `character_orientation` | `string` | `Select` | `image` / `video` | 4 |
| `keep_original_sound` | `boolean` | `Switch` | 保留原视频声音，默认 true | 9 |
| `multi_prompt` | `array<object>` | 动态列表 (`array`) | 多镜头分镜；每项含 prompt + duration | 6 |
| `element_list` | `array<object>` | 动态列表 (`array`) | 元素引用，max 3；每项含 element_id | 8 |
| `voice_list` | `array<object>` | 动态列表 (`array`) | 音色引用，max 2；每项含 voice_id | 1 |
| `voice_id` | `string` | `Select` | 25 种预设音色 | 1 |
| `voice_language` | `string` | `Select` | `zh` / `en` | 1 |
| `voice_speed` | `number` | `Slider` | 0.8–2，step 0.1，默认 1 | 1 |
| `effect_scene` | `string` | `Select`（大列表） | 100+ 官方特效模板 | 1 |
| `sound_effect_prompt` | `string` | `Textarea` | 音效提示，max 200 字 | 1 |
| `bgm_prompt` | `string` | `Textarea` | 背景音乐提示，max 200 字 | 1 |
| `asmr_mode` | `boolean` | `Checkbox` | ASMR 模式，默认 false | 1 |

## 2. `duration` 的多种形态

| 形态 | 适用模型 | 选项/约束 |
|---|---|---|
| **Select 3–15 秒** | v3.0 全系（i2v/t2v） | `[3,4,5,...,15]`，默认 5 |
| **Select 3–10 秒** | video-o1 / o1-std（i2v/reference） | `[3,4,5,...,10]`，默认 5 |
| **Select 5/10 秒** | v2.6、v2.5、v2.x、v1.6 大部分 | `[5, 10]`，默认 5 |
| **Number 3–10** | `kling-text-to-audio` | `number`，min=3，max=10，默认 10 |

## 3. 复杂数组字段结构

### `multi_prompt`（多镜头分镜）

用于 v3.0 系列，与 `prompt` 二选一。

```json
[
  { "prompt": "镜头1描述", "duration": 5 },
  { "prompt": "镜头2描述", "duration": 3 }
]
```

- 每项 `duration`：整数，可选 3–15 秒
- UI 组件：`array`（动态增删列表）

### `element_list`（元素引用）

用于 v3.0 系列、motion-control。

```json
[
  { "element_id": "元素ID" }
]
```

- max 3 项
- UI 组件：`array`

### `voice_list`（音色列表）

仅 `kling-v2.6-pro/image-to-video`。

```json
[
  { "voice_id": "音色ID" }
]
```

- max 2 项
- UI 组件：`array`

## 4. 各模型分组参数清单

说明：`*` 表示 required。

### 4.1 Kling v3.0（std / pro / 4k）

#### Image-to-Video（3 个，参数相同）

- `kwaivgi/kling-v3.0-std/image-to-video`
- `kwaivgi/kling-v3.0-pro/image-to-video`
- `kwaivgi/kling-v3.0-4k/image-to-video`

| 必填 | 可选 |
|---|---|
| `image*` | `prompt`, `negative_prompt`, `end_image`, `duration`(3–15), `cfg_scale`, `sound`, `shot_type`, `multi_prompt`, `element_list` |

#### Text-to-Video（3 个）

- `kwaivgi/kling-v3.0-std/text-to-video` — 无必填（prompt 或 multi_prompt 二选一）
- `kwaivgi/kling-v3.0-pro/text-to-video` — 同上
- `kwaivgi/kling-v3.0-4k/text-to-video` — `prompt*`

可选：`negative_prompt`, `duration`, `aspect_ratio`, `cfg_scale`, `sound`, `shot_type`, `multi_prompt`, `element_list`

#### Motion Control（2 个）

- `kwaivgi/kling-v3.0-pro/motion-control`
- `kwaivgi/kling-v3.0-std/motion-control`

| 必填 | 可选 |
|---|---|
| `image*`, `video*` | `element_list`, `character_orientation`, `prompt`, `negative_prompt`, `keep_original_sound` |

### 4.2 Kling v2.6（pro / std）

#### Image-to-Video

- `kwaivgi/kling-v2.6-pro/image-to-video` — `prompt*`, `image*`；可选 `negative_prompt`, `end_image`, `cfg_scale`, `sound`, `voice_list`, `duration`(5/10)
- `kwaivgi/kling-v2.6-std/image-to-video` — `prompt*`, `image*`；可选 `negative_prompt`, `duration`(5/10)

#### Text-to-Video

- `kwaivgi/kling-v2.6-pro/text-to-video` — `prompt*`；可选 `negative_prompt`, `cfg_scale`, `sound`, `aspect_ratio`, `duration`
- `kwaivgi/kling-v2.6-std/text-to-video` — `prompt*`；可选 `negative_prompt`, `aspect_ratio`, `duration`

#### Motion Control（2 个，参数相同）

- `kwaivgi/kling-v2.6-pro/motion-control`
- `kwaivgi/kling-v2.6-std/motion-control`

| 必填 | 可选 |
|---|---|
| `image*`, `video*` | `character_orientation`, `prompt`, `negative_prompt`, `keep_original_sound` |

#### Create Voice

- `kwaivgi/kling-v2.6/create-voice` — `audio*`（仅 1 个参数）

### 4.3 Kling v2.5 Turbo（pro / std）

#### Image-to-Video

- `kwaivgi/kling-v2.5-turbo-pro/image-to-video` — `prompt*`, `image*`；可选 `last_image`, `negative_prompt`, `guidance_scale`, `duration`
- `kwaivgi/kling-v2.5-turbo-std/image-to-video` — `prompt*`, `image*`；可选 `negative_prompt`, `guidance_scale`, `duration`

#### Text-to-Video

- `kwaivgi/kling-v2.5-turbo-pro/text-to-video` — `prompt*`；可选 `negative_prompt`, `aspect_ratio`, `duration`, `guidance_scale`

### 4.4 Kling Video O1

#### O1 标准版

| 模型 | 必填 | 可选 |
|---|---|---|
| `video-o1/image-to-video` | `prompt*`, `image*` | `last_image`, `duration`(3–10) |
| `video-o1/text-to-video` | `prompt*` | `aspect_ratio`, `duration`(5/10) |
| `video-o1/reference-to-video` | `prompt*` | `video`, `images`(max 7), `keep_original_sound`, `aspect_ratio`, `duration` |
| `video-o1/video-edit` | `prompt*`, `video*` | `images`(max 4), `keep_original_sound` |
| `video-o1/video-edit-fast` | `prompt*`, `video*` | `images`(max 4), `keep_original_sound`, `aspect_ratio` |

#### O1-STD 轻量版

| 模型 | 必填 | 可选 |
|---|---|---|
| `video-o1-std/image-to-video` | `prompt*`, `image*` | `last_image`, `duration`(3–10) |
| `video-o1-std/text-to-video` | `prompt*` | `aspect_ratio`, `duration`(5/10) |
| `video-o1-std/reference-to-video` | `prompt*` | `video`, `images`(max 10), `keep_original_sound`, `duration` |
| `video-o1-std/video-edit` | `prompt*`, `video*` | `images`(max 10), `keep_original_sound` |

### 4.5 Kling LipSync（口型同步）

- `kwaivgi/kling-lipsync/audio-to-video` — `audio*`, `video*`
- `kwaivgi/kling-lipsync/text-to-video` — `video*`, `text*`, `voice_id*`；可选 `voice_language`, `voice_speed`

### 4.6 Kling AI Avatar（数字人，4 个，参数相同）

- `kwaivgi/kling-v2-ai-avatar-standard`
- `kwaivgi/kling-v2-ai-avatar-pro`
- `kwaivgi/kling-v1-ai-avatar-standard`
- `kwaivgi/kling-v1-ai-avatar-pro`

| 必填 | 可选 |
|---|---|
| `image*`, `audio*` | `prompt` |

### 4.7 Kling Effects（特效）

- `kwaivgi/kling-effects` — `image*`, `effect_scene*`（100+ 特效模板下拉，默认 `daily_ootd`）

### 4.8 Kling Audio（音频生成）

- `kwaivgi/kling-video-to-audio` — 全部可选：`video`, `sound_effect_prompt`, `bgm_prompt`, `asmr_mode`
- `kwaivgi/kling-text-to-audio` — `prompt*`, `duration*`（number 3–10）

### 4.9 Kling Multi Image-to-Video

- `kwaivgi/kling-v1.6-multi-i2v-standard` — `prompt*`, `images*`(1–4)；可选 `negative_prompt`, `duration`, `aspect_ratio`
- `kwaivgi/kling-v1.6-multi-i2v-pro` — 同上

### 4.10 Kling 旧版（v1.6 / v2.0 / v2.1）

#### v2.1

| 模型 | 必填 | 可选 |
|---|---|---|
| `v2.1-i2v-pro` | `prompt*`, `image*` | `negative_prompt`, `guidance_scale`, `duration` |
| `v2.1-i2v-standard` | 同上 | 同上 |
| `v2.1-i2v-master` | 同上 | 同上 |
| `v2.1-i2v-pro/start-end-frame` | `prompt*`, `image*`, `end_image*` | `negative_prompt`, `guidance_scale`, `duration` |
| `v2.1-t2v-master` | `prompt*` | `negative_prompt`, `aspect_ratio`, `duration`, `guidance_scale` |

#### v2.0

| 模型 | 必填 | 可选 |
|---|---|---|
| `v2.0-i2v-master` | `prompt*`, `image*` | `end_image`, `negative_prompt`, `guidance_scale`, `duration` |
| `v2.0-t2v-master` | `prompt*` | `aspect_ratio`, `negative_prompt`, `duration` |

#### v1.6

| 模型 | 必填 | 可选 |
|---|---|---|
| `v1.6-i2v-standard` | `prompt*`, `image*` | `negative_prompt`, `guidance_scale`, `duration` |
| `v1.6-i2v-pro` | `prompt*`, `image*` | `negative_prompt`, `end_image`, `guidance_scale`, `duration` |
| `v1.6-t2v-standard` | `prompt*` | `aspect_ratio`, `negative_prompt`, `guidance_scale`, `duration` |

## 5. 给设计师的组件清单

### 基础组件

1. `PromptTextarea` — 正向提示词
2. `NegativePromptTextarea` — 负向提示词
3. `SingleImageUploader` — image / end_image / last_image
4. `MultiImageUploader` — images / reference_images（带数量限制提示）
5. `VideoUploader` — video（含时长/大小限制说明）
6. `AudioUploader` — audio

### 选择与数值

7. `AspectRatioSelect` — 16:9 / 9:16 / 1:1
8. `DurationSelect` — 按模型展示不同选项集
9. `DurationNumberInput` — text-to-audio 专用
10. `CfgScaleSlider` / `GuidanceScaleSlider` — 0~1 浮点滑块
11. `VoiceSpeedSlider` — 0.8~2

### 开关与模式

12. `SoundSwitch` — 是否生成音频
13. `KeepOriginalSoundSwitch` — 保留原声
14. `AsmrModeCheckbox` — ASMR 模式
15. `ShotTypeSelect` — customize / intelligent
16. `CharacterOrientationSelect` — image / video

### 高级/复合组件

17. `MultiPromptEditor` — 多镜头分镜列表（prompt + duration 每项）
18. `ElementListEditor` — 元素引用列表（element_id，max 3）
19. `VoiceListEditor` — 音色列表（voice_id，max 2）
20. `VoiceSelect` — 25 种预设音色下拉
21. `VoiceLanguageSelect` — zh / en
22. `EffectScenePicker` — 100+ 特效模板（建议分类/搜索/卡片选择，不宜纯下拉）

## 6. 与 Bytedance/Seedance 的主要差异

| 特性 | Kling | Seedance |
|---|---|---|
| 负向提示词 | ✅ `negative_prompt` | ❌ |
| 尾帧图 | `end_image` / `last_image` | `last_image` |
| 视频上传 | ✅ motion-control / video-edit 等 | ❌ |
| 音频上传 | ✅ avatar / lipsync | ❌ |
| 多镜头分镜 | ✅ `multi_prompt` | ❌ |
| 元素引用 | ✅ `element_list` | ❌ |
| 特效模板 | ✅ `effect_scene`（100+） | ❌ |
| 口型同步 | ✅ lipsync 系列 | ❌ |
| 数字人 | ✅ avatar 系列 | ❌ |
| cfg/guidance scale | ✅ | ❌ |
| 分辨率字段 | 部分写死在模型名 | 有 `resolution` 字段 |

## 7. 推荐表单分区

- **主输入**：prompt / multi_prompt、image(s)、video、audio
- **风格与比例**：aspect_ratio、negative_prompt、effect_scene
- **视频参数**：duration、shot_type、character_orientation
- **生成控制**：cfg_scale / guidance_scale、sound、keep_original_sound
- **高级**：element_list、voice_list、seed（部分模型）

# Playground 表单组件设计规格（设计师版）

本文档汇总 WaveSpeed 平台 **Bytedance/Seedance** 与 **Kling** 两类模型输入 schema 后，提炼出前端 Playground 需要设计的**组件类型全集**。

设计师只需关注「要设计哪些组件、每种组件有哪些状态与变体」，无需关心具体模型与组件的映射关系（由开发侧根据 schema 动态组装）。

**竞品参考说明**：

- **模型详情页**：`https://wavespeed.ai/models/{模型路径}` — 打开后切换到 **Playground → Input**，查看竞品实际 UI
- **Schema API**：`https://wavespeed.ai/center/default/api/v1/model_schema/{模型路径}` — 查看字段类型、约束、默认值等技术定义

---

## 1. 组件总览

共 **27 种组件类型**，分 5 大类：

| 类别 | 数量 | 组件 |
|---|---|---|
| 文本输入 | 3 | 正向提示词、负向提示词、短文本输入 |
| 媒体上传 | 4 | 单图、多图、视频、音频 |
| 选择与数值 | 9 | 比例、时长、分辨率、滑块、种子等 |
| 开关与模式 | 5 | 各类布尔开关 |
| 下拉与选择器 | 4 | 镜头模式、角色朝向、音色、特效 |
| 复合/动态列表 | 3 | 多镜头、元素引用、音色列表 |

---

## 2. 文本输入类（3）

### 2.1 正向提示词 `PromptTextarea`

- **用途**：描述想要生成的视频内容
- **形态**：多行文本框，占主视觉区域
- **约束**：部分场景有字数上限（如 2000 字）
- **状态**：默认 / 聚焦 / 填写中 / 错误（必填未填）
- **竞品参考**：[Seedance V1.5 Pro Image-to-Video](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video)（字段 `prompt`）

### 2.2 负向提示词 `NegativePromptTextarea`

- **用途**：描述不希望出现的内容
- **形态**：多行文本框，视觉权重低于正向提示词
- **约束**：可选填写
- **状态**：默认可折叠或置于「高级设置」
- **竞品参考**：[Kling V2.6 Pro Image-to-Video](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/image-to-video)（字段 `negative_prompt`）

### 2.3 短文本输入 `ShortTextarea`

- **用途**：口型同步台词、音效描述、背景音乐描述等
- **形态**：单行或多行文本框（比正向提示词更紧凑）
- **约束**：不同场景字数上限不同（如 120 字、200 字），需展示字数统计
- **变体**：仅需设计一种组件，通过标签和字数上限区分场景
- **竞品参考**：
  - 口型同步台词：[Kling LipSync Text-to-Video](https://wavespeed.ai/models/kwaivgi/kling-lipsync/text-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-lipsync/text-to-video)（字段 `text`）
  - 音效/BGM 描述：[Kling Video-to-Audio](https://wavespeed.ai/models/kwaivgi/kling-video-to-audio) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-video-to-audio)（字段 `sound_effect_prompt` / `bgm_prompt`）

---

## 3. 媒体上传类（4）

### 3.1 单图上传 `SingleImageUploader`

- **用途**：首帧图、尾帧图、主参考图
- **形态**：拖拽/点击上传区域 + 预览缩略图
- **约束**：jpg/png，≤10MB，建议最小分辨率提示（如 300×300）
- **状态**：空态 / 上传中 / 已上传 / 替换 / 删除 / 错误（格式/大小不符）
- **变体**：首帧与尾帧可用同一组件，通过标签区分（如「首帧」「尾帧」）
- **竞品参考**：[Seedance V1.5 Pro Image-to-Video](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video)（字段 `image` 首帧 + `last_image` 尾帧）

### 3.2 多图上传 `MultiImageUploader`

- **用途**：多张参考图（风格、场景、元素等）
- **形态**：多图网格预览 + 添加按钮
- **约束**：需展示数量限制（如 1–4 张、最多 7/10 张）
- **状态**：空态 / 部分上传 / 已满 / 上传中 / 错误
- **交互**：支持拖拽排序、单张删除
- **竞品参考**：
  - 参考图生视频（1–4 张）：[Seedance V1 Lite Reference-to-Video](https://wavespeed.ai/models/bytedance/seedance-v1-lite/reference-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1-lite/reference-to-video)（字段 `reference_images`）
  - 多图生视频：[Kling V1.6 Multi I2V Standard](https://wavespeed.ai/models/kwaivgi/kling-v1.6-multi-i2v-standard) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v1.6-multi-i2v-standard)（字段 `images`）

### 3.3 视频上传 `VideoUploader`

- **用途**：动作参考视频、待编辑视频、口型同步源视频等
- **形态**：视频预览区 + 上传入口
- **约束**：mp4/mov，≤10MB；部分场景限制时长（如 ≤10 秒），需在上传区或说明中提示
- **状态**：空态 / 上传中 / 已上传（可播放预览）/ 错误
- **竞品参考**：
  - 动作迁移：[Kling V2.6 Pro Motion Control](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/motion-control) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/motion-control)（字段 `video`）
  - 视频编辑：[Kling Video O1 Video Edit](https://wavespeed.ai/models/kwaivgi/kling-video-o1/video-edit) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-video-o1/video-edit)（字段 `video`）

### 3.4 音频上传 `AudioUploader`

- **用途**：数字人驱动音频、口型同步音频、创建音色等
- **形态**：音频波形或图标预览 + 上传入口
- **约束**：展示支持的音频格式与大小限制
- **状态**：空态 / 上传中 / 已上传（可试听）/ 错误
- **竞品参考**：
  - 数字人驱动：[Kling V2 AI Avatar Standard](https://wavespeed.ai/models/kwaivgi/kling-v2-ai-avatar-standard) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2-ai-avatar-standard)（字段 `audio`）
  - 口型同步：[Kling LipSync Audio-to-Video](https://wavespeed.ai/models/kwaivgi/kling-lipsync/audio-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-lipsync/audio-to-video)（字段 `audio`）

---

## 4. 选择与数值类（9）

### 4.1 画面比例 `AspectRatioSelect`

- **用途**：选择生成视频的宽高比
- **形态**：下拉或图标卡片单选（建议可视化比例图标，便于识别）
- **选项集**（开发侧按模型切换，设计师需覆盖所有选项的视觉）：
  - 6 档：`21:9` / `16:9` / `4:3` / `1:1` / `3:4` / `9:16`
  - 3 档：`16:9` / `9:16` / `1:1`
- **竞品参考**：
  - 6 档比例：[Seedance V1.5 Pro Text-to-Video](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/text-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/text-to-video)（字段 `aspect_ratio`）
  - 3 档比例：[Kling V2.6 Pro Text-to-Video](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/text-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/text-to-video)（字段 `aspect_ratio`）

### 4.2 视频时长 · 滑块 `DurationSlider`

- **用途**：连续选择视频秒数
- **形态**：整数步进滑块 + 当前值显示（如「5 秒」）
- **范围变体**（同一组件，不同 min/max）：
  - 4–12 秒，步进 1
  - 2–12 秒，步进 1
- **竞品参考**：
  - 4–12 秒滑块：[Seedance V1.5 Pro Image-to-Video](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video)（字段 `duration`）
  - 2–12 秒滑块：[Seedance V1 Lite Reference-to-Video](https://wavespeed.ai/models/bytedance/seedance-v1-lite/reference-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1-lite/reference-to-video)（字段 `duration`）

### 4.3 视频时长 · 下拉 `DurationSelect`

- **用途**：从固定秒数选项中选择
- **形态**：下拉选择
- **选项集变体**（开发侧切换）：
  - 2–12 秒（逐个枚举）
  - 3–15 秒（逐个枚举）
  - 3–10 秒（逐个枚举）
  - 仅 5 秒 / 10 秒 两档
- **竞品参考**：
  - 2–12 秒枚举：[Seedance V1 Pro Fast Text-to-Video](https://wavespeed.ai/models/bytedance/seedance-v1-pro-fast/text-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1-pro-fast/text-to-video)（字段 `duration`）
  - 3–15 秒枚举：[Kling V3.0 Std Image-to-Video](https://wavespeed.ai/models/kwaivgi/kling-v3.0-std/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v3.0-std/image-to-video)（字段 `duration`）
  - 3–10 秒枚举：[Kling Video O1 Image-to-Video](https://wavespeed.ai/models/kwaivgi/kling-video-o1/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-video-o1/image-to-video)（字段 `duration`）
  - 5/10 秒两档：[Kling V2.6 Pro Image-to-Video](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/image-to-video)（字段 `duration`）

### 4.4 音频时长 · 数字输入 `DurationNumberInput`

- **用途**：音频生成时长（秒）
- **形态**：数字输入框，可配合 +/- 步进
- **约束**：3–10，默认 10
- **竞品参考**：[Kling Text-to-Audio](https://wavespeed.ai/models/kwaivgi/kling-text-to-audio) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-text-to-audio)（字段 `duration`）

### 4.5 分辨率 `ResolutionSelect`

- **用途**：选择输出视频分辨率
- **形态**：下拉或单选按钮组
- **选项**：`480p` / `720p` / `1080p`
- **变体**：部分场景仅提供 `720p` / `1080p` 两档
- **竞品参考**：
  - 三档分辨率：[Seedance V1.5 Pro Image-to-Video](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video)（字段 `resolution`）
  - 两档分辨率：[Seedance V1.5 Pro Image-to-Video Fast](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video-fast) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video-fast)（字段 `resolution`，仅 720p/1080p）

### 4.6 生成强度滑块 `ScaleSlider`

- **用途**：控制生成灵活度/引导强度（cfg_scale、guidance_scale）
- **形态**：0–1 浮点滑块 + 数值显示
- **约束**：步进 0.01 或 0.1，默认 0.5
- **说明**：两种参数名对应同一类 UI，设计一套即可
- **竞品参考**：
  - cfg_scale：[Kling V2.6 Pro Image-to-Video](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/image-to-video)（字段 `cfg_scale`）
  - guidance_scale：[Kling V2.5 Turbo Pro Image-to-Video](https://wavespeed.ai/models/kwaivgi/kling-v2.5-turbo-pro/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.5-turbo-pro/image-to-video)（字段 `guidance_scale`）

### 4.7 语速滑块 `VoiceSpeedSlider`

- **用途**：口型同步/语音合成的语速
- **形态**：滑块 + 数值（如 1.0x）
- **约束**：0.8–2.0，步进 0.1，默认 1.0
- **竞品参考**：[Kling LipSync Text-to-Video](https://wavespeed.ai/models/kwaivgi/kling-lipsync/text-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-lipsync/text-to-video)（字段 `voice_speed`）

### 4.8 随机种子 `SeedNumberInput`

- **用途**：控制生成随机性，便于复现结果
- **形态**：数字输入框
- **特殊语义**：`-1` 表示随机，建议提供「随机」快捷按钮或说明文案
- **默认**：-1
- **竞品参考**：[Seedance V1.5 Pro Image-to-Video](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video)（字段 `seed`）

---

## 5. 开关与模式类（5）

均为布尔开关，建议统一视觉风格（Toggle / Switch），通过标签和说明文案区分用途。

| 组件 | 用途 | 默认值 | 竞品参考 | Schema |
|---|---|---|---|---|
| `GenerateAudioSwitch` | 生成视频时是否同步生成音频 | 开 | [Seedance V1.5 Pro I2V](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video) |
| `SoundSwitch` | 同上（Kling 命名） | — | [Kling V3.0 Std I2V](https://wavespeed.ai/models/kwaivgi/kling-v3.0-std/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v3.0-std/image-to-video) |
| `CameraFixedSwitch` | 是否固定镜头位置 | 关 | [Seedance V1.5 Pro I2V](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video) |
| `KeepOriginalSoundSwitch` | 是否保留原视频声音 | 开 | [Kling V2.6 Pro Motion Control](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/motion-control) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/motion-control) |
| `AsmrModeCheckbox` | 是否启用 ASMR 音效增强模式 | 关 | [Kling Video-to-Audio](https://wavespeed.ai/models/kwaivgi/kling-video-to-audio) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-video-to-audio) |

> `GenerateAudioSwitch` 与 `SoundSwitch` 语义相同，设计一套开关组件即可。

---

## 6. 下拉与选择器类（4）

### 6.1 镜头模式 `ShotTypeSelect`

- **选项**：`customize`（自定义）/ `intelligent`（智能）
- **形态**：下拉或分段单选
- **竞品参考**：[Kling V3.0 Std Image-to-Video](https://wavespeed.ai/models/kwaivgi/kling-v3.0-std/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v3.0-std/image-to-video)（字段 `shot_type`）

### 6.2 角色朝向 `CharacterOrientationSelect`

- **选项**：`image`（跟随图片）/ `video`（跟随视频）
- **形态**：下拉或分段单选
- **场景**：动作迁移类功能
- **竞品参考**：[Kling V2.6 Pro Motion Control](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/motion-control) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/motion-control)（字段 `character_orientation`）

### 6.3 音色选择 `VoiceSelect`

- **用途**：口型同步选择预设音色
- **形态**：下拉，选项较多（约 25 种），建议支持搜索或分组
- **默认值**：有默认选中项
- **竞品参考**：[Kling LipSync Text-to-Video](https://wavespeed.ai/models/kwaivgi/kling-lipsync/text-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-lipsync/text-to-video)（字段 `voice_id`）

### 6.4 语言选择 `VoiceLanguageSelect`

- **选项**：`zh`（中文）/ `en`（英文）
- **形态**：下拉或分段单选
- **竞品参考**：[Kling LipSync Text-to-Video](https://wavespeed.ai/models/kwaivgi/kling-lipsync/text-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-lipsync/text-to-video)（字段 `voice_language`）

### 6.5 特效模板 `EffectScenePicker`

- **用途**：从官方特效模板中选择一种效果
- **形态**：**不建议纯下拉**（选项 100+）
- **推荐**：分类 Tab + 卡片网格 + 搜索
- **交互**：选中后展示预览图/名称，支持切换
- **竞品参考**：[Kling Effects](https://wavespeed.ai/models/kwaivgi/kling-effects) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-effects)（字段 `effect_scene`）

---

## 7. 复合/动态列表类（3）

均为「可增删的列表编辑器」，需设计：空态、添加按钮、列表项、删除、达到上限态。

### 7.1 多镜头分镜 `MultiPromptEditor`

- **用途**：将一个视频拆成多个镜头，每镜头独立描述
- **每项字段**：
  - 镜头描述（文本）
  - 镜头时长（秒，3–15 可选）
- **交互**：添加镜头、删除镜头、拖拽排序（可选）
- **关系**：与正向提示词二选一，需在 UI 层做模式切换
- **竞品参考**：[Kling V3.0 Std Image-to-Video](https://wavespeed.ai/models/kwaivgi/kling-v3.0-std/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v3.0-std/image-to-video)（字段 `multi_prompt`）

### 7.2 元素引用列表 `ElementListEditor`

- **用途**：引用已创建的元素（角色/物体等）
- **每项字段**：元素 ID（文本或选择器）
- **约束**：最多 3 项
- **竞品参考**：[Kling V3.0 Std Image-to-Video](https://wavespeed.ai/models/kwaivgi/kling-v3.0-std/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v3.0-std/image-to-video)（字段 `element_list`）

### 7.3 音色引用列表 `VoiceListEditor`

- **用途**：为视频生成指定参考音色
- **每项字段**：音色 ID
- **约束**：最多 2 项
- **竞品参考**：[Kling V2.6 Pro Image-to-Video](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/image-to-video) · [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/image-to-video)（字段 `voice_list`）

---

## 8. 推荐页面信息架构

表单建议统一分为三个区域，设计师可据此规划布局与层级：

```
┌─────────────────────────────────────┐
│  主输入区                            │
│  提示词 / 多镜头分镜                  │
│  图片 / 多图 / 视频 / 音频上传         │
├─────────────────────────────────────┤
│  视频设置区                          │
│  比例 / 时长 / 分辨率                 │
│  镜头模式 / 角色朝向 / 特效模板         │
├─────────────────────────────────────┤
│  高级设置区（可折叠）                  │
│  负向提示词 / 强度滑块 / 种子           │
│  音频开关 / 固定镜头 / 保留原声等        │
│  元素引用 / 音色列表                   │
└─────────────────────────────────────┘
```

---

## 9. 设计优先级建议

若分期交付，建议按优先级：

| 优先级 | 组件 | 说明 |
|---|---|---|
| P0 | 正向提示词、单图上传、比例选择、时长（滑块+下拉）、分辨率、种子 | 覆盖大部分视频生成模型 |
| P0 | 开关类（生成音频、固定镜头） | 高频出现 |
| P1 | 负向提示词、尾帧图、多图上传 | Kling 及部分 Seedance 模型 |
| P1 | 视频上传、强度滑块 | 动作迁移、视频编辑等 |
| P2 | 多镜头分镜、元素引用、特效模板选择器 | 复杂交互，选项多 |
| P2 | 音频上传、音色/语言/语速、口型同步短文本 | 数字人、口型同步类 |
| P3 | 音色引用列表、ASMR 模式、音效/BGM 短文本 | 低频场景 |

---

## 10. 组件清单速查（给设计师勾选）

| 状态 | 组件 | 说明 | 竞品参考 | Schema |
|---|---|---|---|---|
| [ ] | `PromptTextarea` | 正向提示词 | [Seedance V1.5 Pro I2V](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video) |
| [ ] | `NegativePromptTextarea` | 负向提示词 | [Kling V2.6 Pro I2V](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/image-to-video) |
| [ ] | `ShortTextarea` | 短文本（台词/音效/BGM） | [Kling LipSync T2V](https://wavespeed.ai/models/kwaivgi/kling-lipsync/text-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-lipsync/text-to-video) |
| [ ] | `SingleImageUploader` | 单图上传 | [Seedance V1.5 Pro I2V](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video) |
| [ ] | `MultiImageUploader` | 多图上传 | [Seedance Reference-to-Video](https://wavespeed.ai/models/bytedance/seedance-v1-lite/reference-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1-lite/reference-to-video) |
| [ ] | `VideoUploader` | 视频上传 | [Kling Motion Control](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/motion-control) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/motion-control) |
| [ ] | `AudioUploader` | 音频上传 | [Kling V2 AI Avatar](https://wavespeed.ai/models/kwaivgi/kling-v2-ai-avatar-standard) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2-ai-avatar-standard) |
| [ ] | `AspectRatioSelect` | 画面比例 | [Seedance V1.5 Pro T2V](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/text-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/text-to-video) |
| [ ] | `DurationSlider` | 时长滑块 | [Seedance V1.5 Pro I2V](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video) |
| [ ] | `DurationSelect` | 时长下拉 | [Kling V3.0 Std I2V](https://wavespeed.ai/models/kwaivgi/kling-v3.0-std/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v3.0-std/image-to-video) |
| [ ] | `DurationNumberInput` | 音频时长数字输入 | [Kling Text-to-Audio](https://wavespeed.ai/models/kwaivgi/kling-text-to-audio) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-text-to-audio) |
| [ ] | `ResolutionSelect` | 分辨率 | [Seedance V1.5 Pro I2V](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video) |
| [ ] | `ScaleSlider` | 生成强度（0–1） | [Kling V2.6 Pro I2V](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/image-to-video) |
| [ ] | `VoiceSpeedSlider` | 语速（0.8–2） | [Kling LipSync T2V](https://wavespeed.ai/models/kwaivgi/kling-lipsync/text-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-lipsync/text-to-video) |
| [ ] | `SeedNumberInput` | 随机种子 | [Seedance V1.5 Pro I2V](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video) |
| [ ] | `GenerateAudioSwitch` | 生成音频开关 | [Seedance V1.5 Pro I2V](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video) |
| [ ] | `CameraFixedSwitch` | 固定镜头开关 | [Seedance V1.5 Pro I2V](https://wavespeed.ai/models/bytedance/seedance-v1.5-pro/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-v1.5-pro/image-to-video) |
| [ ] | `KeepOriginalSoundSwitch` | 保留原声开关 | [Kling Motion Control](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/motion-control) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/motion-control) |
| [ ] | `AsmrModeCheckbox` | ASMR 模式 | [Kling Video-to-Audio](https://wavespeed.ai/models/kwaivgi/kling-video-to-audio) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-video-to-audio) |
| [ ] | `ShotTypeSelect` | 镜头模式 | [Kling V3.0 Std I2V](https://wavespeed.ai/models/kwaivgi/kling-v3.0-std/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v3.0-std/image-to-video) |
| [ ] | `CharacterOrientationSelect` | 角色朝向 | [Kling Motion Control](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/motion-control) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/motion-control) |
| [ ] | `VoiceSelect` | 音色选择 | [Kling LipSync T2V](https://wavespeed.ai/models/kwaivgi/kling-lipsync/text-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-lipsync/text-to-video) |
| [ ] | `VoiceLanguageSelect` | 语言选择 | [Kling LipSync T2V](https://wavespeed.ai/models/kwaivgi/kling-lipsync/text-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-lipsync/text-to-video) |
| [ ] | `EffectScenePicker` | 特效模板（大列表） | [Kling Effects](https://wavespeed.ai/models/kwaivgi/kling-effects) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-effects) |
| [ ] | `MultiPromptEditor` | 多镜头分镜列表 | [Kling V3.0 Std I2V](https://wavespeed.ai/models/kwaivgi/kling-v3.0-std/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v3.0-std/image-to-video) |
| [ ] | `ElementListEditor` | 元素引用列表 | [Kling V3.0 Std I2V](https://wavespeed.ai/models/kwaivgi/kling-v3.0-std/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v3.0-std/image-to-video) |
| [ ] | `VoiceListEditor` | 音色引用列表 | [Kling V2.6 Pro I2V](https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro/image-to-video) | [Schema](https://wavespeed.ai/center/default/api/v1/model_schema/kwaivgi/kling-v2.6-pro/image-to-video) |

# MCP 自动图片分析服务器

基于多模型视觉理解的 MCP (Model Context Protocol) 服务器，提供智能图片分析功能，**仅支持本地图片**。

## 功能特性

- 🤖 **智能获取**: 支持分析本地绝对路径的图片文件
- 💻 **内容提取 (Code)**: 精准提取图片中的文本、代码和符号
- 🏗️ **结构分析 (Architecture)**: 分析图片的视觉结构、布局和层级
- 🎨 **图像预处理**: 内置锐化、对比度增强、黑白转换等滤镜，提升识别率
- 🎯 **自定义指令**: 支持用户输入自定义 Prompt 进行针对性分析
- 🔄 **多模型支持**: 支持 GLM-4.1v、Intern-S1、Qwen3-VL 三种视觉模型
- 🚀 **高性能**: 基于先进视觉大模型，响应迅速

## 技术栈

- **运行时**: Node.js 18+
- **框架**: TypeScript
- **模型**: 智谱 AI GLM-4.1v / 上海人工智能实验室 Intern-S1 / 通义千问 Qwen3-VL
- **图片处理**: Sharp
- **协议**: MCP (Model Context Protocol)

## 安装配置

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件并填入配置：

```env
# 智谱 AI API 配置
ZHIPUAI_API_KEY=your_zhipuai_api_key_here
ZHIPUAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
ZHIPUAI_MODEL=glm-4.1v-thinking-flash

# Intern-S1 API 配置 (上海人工智能实验室)
INTERNS1_API_KEY=your_interns1_api_key_here
INTERNS1_BASE_URL=https://api-inference.modelscope.cn/v1
INTERNS1_MODEL=Shanghai_AI_Laboratory/Intern-S1

# Qwen3-VL API 配置 (通义千问)
QWENVL_API_KEY=your_qwenvl_api_key_here
QWENVL_BASE_URL=https://api-inference.modelscope.cn/v1
QWENVL_MODEL=Qwen/Qwen3-VL-235B-A22B-Instruct

# MCP 服务器配置
MCP_SERVER_NAME=mcp-vl
MCP_SERVER_VERSION=1.0.0

# 日志级别
LOG_LEVEL=info
```

### 3. 获取 API Key

**智谱 AI API Key:**
1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册账号并创建 API Key
3. 将 API Key 填入 `.env` 文件

**Intern-S1 / Qwen3-VL API Key (ModelScope):**
1. 访问 [ModelScope 平台](https://modelscope.cn/)
2. 注册账号并获取 API Key
3. 将 API Key 填入 `.env` 文件

### 4. 构建项目

```bash
pnpm run build
```

## 使用方法

### 在 Claude Code 中配置

#### 方式一：使用 claude mcp add 命令（推荐）

构建项目后，使用以下命令添加 MCP 服务器：

```bash
claude mcp add mcp-vl --scope user --env-file=/path/mcp-vl/.env" \
    --env ZHIPUAI_API_KEY=your_api_key_here  \
    -- node /path/mcp-vl/dist/index.js
```

#### 方式二：手动配置（推荐）

将以下配置添加到你的 `.claude.json` 配置文件中。注意：为了确保项目能正确读取配置文件，必须使用 `--env-file` 参数指向项目的 `.env` 文件绝对路径。

```json
{
  "mcpServers": {
    "mcp-vl": {
      "command": "node",
      "args": [
        "--env-file=/绝对路径/到你的/mcp-vl/.env", 
        "/绝对路径/到你的/mcp-vl/dist/index.js"
      ],
      "env": {
        "ZHIPUAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Claude 提示词
```
## ⚠️ 图片处理规范 - 非常重要
**重要提示：在 Claude 中使用时，禁止使用 read 工具读取图片二进制数据。请直接使用 mcp-vl 里的 auto_analyze_image 工具进行视觉分析。**
```

### 可用工具

#### auto_analyze_image
对指定的本地图片文件进行高级视觉分析。

**参数说明：**
- `imagePath` (必填): 图片文件的绝对路径。
- `focusArea` (可选): 预设分析策略。
  - `code`: 提取文本、代码和符号（默认）。
  - `architecture`: 分析结构、布局和层级。
  *注意：如果提供了 `customPrompt`，此选项将被忽略。*
- `customPrompt` (可选): 自定义分析指令，覆盖预设模式。
- `processingOptions` (可选): 图片预处理选项，用于增强识别效果。
  - `grayscale`: 转为黑白（适合 OCR）。
  - `contrast`: 调整对比度（1.0-10.0）。
  - `brightness`: 调整亮度（0.0-3.0）。
  - `sharpen`: 锐化处理。
- `modelType` (可选): 选择使用的视觉模型。
  - `glm-4.1v`: 智谱 AI GLM-4.1v 模型（默认）。
  - `intern-s1`: 上海人工智能实验室 Intern-S1 模型。
  - `qwen-vl`: 通义千问 Qwen3-VL-235B 模型（通过 ModelScope 调用）。

**使用示例：**
1. **基础分析**: `auto_analyze_image(imagePath="/path/to/img.png")`
2. **自定义指令**: `auto_analyze_image(imagePath="/path/to/img.png", customPrompt="提取图中所有红色的文字")`
3. **增强处理**: `auto_analyze_image(imagePath="/path/to/img.png", processingOptions={contrast: 2.0, grayscale: true})`
4. **切换模型**: `auto_analyze_image(imagePath="/path/to/img.png", modelType="qwen-vl")`

## 开发

### 开发模式运行

```bash
pnpm run dev
```

### 构建项目

```bash
pnpm run build
```

### 代码检查

```bash
pnpm run lint
pnpm run typecheck
```

## 项目结构

```
src/
├── index.ts                    # MCP 服务器主入口
├── config/
│   ├── index.ts               # 配置管理
│   └── prompts.ts             # 分析提示词配置
├── services/
│   ├── base-vision-service.ts # 视觉服务基类
│   ├── glm-v41-service.ts     # 智谱 GLM-4.1v 服务
│   ├── intern-s1-service.ts   # Intern-S1 服务
│   ├── qwen-vl-service.ts     # Qwen3-VL 服务
│   └── auto-image-service.ts  # 自动图片分析服务
├── types/
│   └── index.ts               # TypeScript 类型定义
└── utils/
    └── logger.ts              # 日志工具
```

## 注意事项

1. **API Key 安全**: 请妥善保管你的 API Key（智谱 AI / ModelScope）
2. **代码图片优化**: 专门针对代码截图优化，建议使用清晰的代码截图
3. **支持格式**: JPEG, PNG, WebP, GIF 等常见格式
4. **网络连接**: 需要稳定的网络连接访问各模型 API
5. **模型选择**:
   - `glm-4.1v`: 通用视觉理解，响应快速
   - `intern-s1`: 上海人工智能实验室开源模型
   - `qwen-vl`: 通义千问大参数视觉模型
6. **最佳实践**:
   - 使用高对比度的代码编辑器主题
   - 确保代码字体清晰可见
   - 避免截图过大或过小

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

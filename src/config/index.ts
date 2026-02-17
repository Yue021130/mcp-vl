import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // 智谱 AI 配置
  zhipuAI: {
    apiKey: process.env.ZHIPUAI_API_KEY || '',
    baseURL: process.env.ZHIPUAI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    model: process.env.ZHIPUAI_MODEL || 'glm-4.1v-thinking-flash',
  },

  // InternS1 配置
  internS1: {
    apiKey: process.env.INTERNS1_API_KEY || '',
    baseURL: process.env.INTERNS1_BASE_URL || 'https://api-inference.modelscope.cn/v1',
    model: process.env.INTERNS1_MODEL || 'Shanghai_AI_Laboratory/Intern-S1',
  },

  // Qwen VL 配置
  qwenVL: {
    apiKey: process.env.QWENVL_API_KEY || '',
    baseURL: process.env.QWENVL_BASE_URL || 'https://api-inference.modelscope.cn/v1',
    model: process.env.QWENVL_MODEL || 'Qwen/Qwen3-VL-235B-A22B-Instruct',
  },

  // MCP 服务器配置
  server: {
    name: process.env.MCP_SERVER_NAME || 'mcp-vl',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // 默认模型参数
  modelDefaults: {
    temperature: 0.8
  },
};

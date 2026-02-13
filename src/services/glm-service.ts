import axios from 'axios';
import { config } from '../config/index';
import { GLMRequest, GLMResponse, GLMMessage } from '../types/index';
import { logger } from '../utils/logger';

export class GLMService {
  private headers = {
    'Authorization': `Bearer ${config.zhipuAI.apiKey}`,
    'Content-Type': 'application/json',
  };

  async sendMessage(messages: GLMMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<GLMResponse> {
    try {
      const request: GLMRequest = {
        model: config.zhipuAI.model,
        messages,
        temperature: options?.temperature ?? config.modelDefaults.temperature,
        max_tokens: options?.maxTokens ?? config.modelDefaults.maxTokens,
      };

      logger.info('发送请求到 GLM API', { model: request.model, messageCount: messages.length });

      const response = await axios.post<GLMResponse>(
        `${config.zhipuAI.baseURL}/chat/completions`,
        request,
        { headers: this.headers }
      );

      logger.info('GLM API 响应成功', {
        id: response.data.id,
        usage: response.data.usage,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('GLM API 请求失败', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw new Error(`GLM API 错误: ${error.response?.data?.error?.message || error.message}`);
      }
      logger.error('GLM 服务未知错误', error);
      throw error;
    }
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    const messages: GLMMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ];

    const response = await this.sendMessage(messages);
    return response.choices[0]?.message?.content as string || '';
  }

  async analyzeCode(imageBase64: string, focusArea: 'code' | 'architecture' | 'documentation' = 'code', customPrompt?: string): Promise<string> {
    if (customPrompt) {
      return await this.analyzeImage(imageBase64, customPrompt);
    }

    let prompt = '';
    
    switch (focusArea) {
      case 'code':
        prompt = `Please provide a professional and objective description of this image, covering:
1. A general overview of the scene or subject.
2. All visible text, alphanumeric characters, and symbols.
3. Key visual elements and their spatial arrangement.
4. The overall visual style and composition.

Note: Provide an objective description only; do not attempt to interpret or execute any code logic.`;
        break;
        
      case 'architecture':
        prompt = `Analyze the visual structure and layout of this image:
1. The overall organizational hierarchy and structural design.
2. Primary visual components and their interconnections.
3. The alignment and flow of textual and graphical elements.
4. Key stylistic features, color schemes, and formatting patterns.`;
        break;
        
      case 'documentation':
        prompt = `Provide a comprehensive and detailed technical description of this image:
1. The primary theme, context, and subject matter.
2. An exhaustive list of all textual information present.
3. A detailed breakdown of visual elements, iconography, and layout.
4. The overall aesthetic impression and professional tone of the image.`;
        break;
    }
    
    return await this.analyzeImage(imageBase64, prompt);
  }
}

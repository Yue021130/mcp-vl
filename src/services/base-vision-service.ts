import { ChatRequest, ChatResponse, ChatMessage } from '../types/index';
import { logger } from '../utils/logger';
import axios from 'axios';
import { ANALYSIS_PROMPTS } from '../config/prompts';

export interface VisionServiceConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  defaultTemperature?: number;
}

export abstract class BaseVisionService {
  protected config: VisionServiceConfig;
  protected abstract readonly serviceName: string;

  constructor(config: VisionServiceConfig) {
    this.config = config;
  }

  protected get headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  protected abstract buildRequest(messages: ChatMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
  }): ChatRequest;

  protected async sendRequest(request: ChatRequest): Promise<ChatResponse> {
    const response = await axios.post<ChatResponse>(
      `${this.config.baseURL}/chat/completions`,
      request,
      { headers: this.headers }
    );
    return response.data;
  }

  protected handleError(error: unknown): void {
    if (axios.isAxiosError(error)) {
      logger.error(`${this.serviceName} API 请求失败`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(`${this.serviceName} API 错误: ${error.response?.data?.error?.message || error.message}`);
    }
    logger.error(`${this.serviceName} 服务错误`, error);
    throw error;
  }

  async sendMessage(messages: ChatMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<ChatResponse> {
    try {
      const request = this.buildRequest(messages, options);

      logger.info(`发送请求到 ${this.serviceName} API`, {
        model: request.model,
        messageCount: messages.length,
      });

      const response = await this.sendRequest(request);

      logger.info(`${this.serviceName} API 响应成功`, {
        id: response.id,
        usage: response.usage,
      });

      return response;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async analyzeImage(imageBase64: string, prompt: string, options?: {
    maxTokens?: number;
  }): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ];

    const response = await this.sendMessage(messages, options);
    return (response.choices[0]?.message?.content as string) || '';
  }

  async analyzeCode(
    imageBase64: string,
    focusArea: 'code' | 'architecture' = 'code',
    customPrompt?: string
  ): Promise<string> {
    const prompt = customPrompt || ANALYSIS_PROMPTS[focusArea];
    return await this.analyzeImage(imageBase64, prompt);
  }
}

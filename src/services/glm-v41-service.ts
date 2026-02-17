import { config } from '../config/index';
import { ChatRequest, ChatMessage } from '../types/index';
import { BaseVisionService, VisionServiceConfig } from './base-vision-service';

export class GLMV41Service extends BaseVisionService {
  protected readonly serviceName = 'GLMV41';

  constructor() {
    const serviceConfig: VisionServiceConfig = {
      apiKey: config.zhipuAI.apiKey,
      baseURL: config.zhipuAI.baseURL,
      model: config.zhipuAI.model,
      defaultTemperature: config.modelDefaults.temperature,
    };
    super(serviceConfig);
  }

  protected buildRequest(messages: ChatMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
  }): ChatRequest {
    return {
      model: this.config.model,
      messages,
      temperature: options?.temperature ?? this.config.defaultTemperature,
    };
  }
}

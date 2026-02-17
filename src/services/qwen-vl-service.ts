import { config } from '../config/index';
import { ChatRequest, ChatMessage } from '../types/index';
import { BaseVisionService, VisionServiceConfig } from './base-vision-service';

export class QwenVLService extends BaseVisionService {
  protected readonly serviceName = 'QwenVL';

  constructor() {
    const serviceConfig: VisionServiceConfig = {
      apiKey: config.qwenVL.apiKey,
      baseURL: config.qwenVL.baseURL,
      model: config.qwenVL.model,
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

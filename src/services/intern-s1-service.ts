import { config } from '../config/index';
import { ChatRequest, ChatMessage } from '../types/index';
import { BaseVisionService, VisionServiceConfig } from './base-vision-service';

export class InternS1Service extends BaseVisionService {
  protected readonly serviceName = 'InternS1';

  constructor() {
    const serviceConfig: VisionServiceConfig = {
      apiKey: config.internS1.apiKey,
      baseURL: config.internS1.baseURL,
      model: config.internS1.model,
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

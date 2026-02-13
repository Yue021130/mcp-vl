#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from './config/index';
import { GLMService } from './services/glm-service';
import { AutoImageService } from './services/auto-image-service';
import { logger } from './utils/logger';

class MCPServer {
  private server: Server;
  private glmService: GLMService;
  private autoImageService: AutoImageService;

  constructor() {
    this.server = new Server(
      {
        name: config.server.name,
        version: config.server.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.glmService = new GLMService();
    this.autoImageService = new AutoImageService();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'auto_analyze_image',
            description: 'Perform advanced visual analysis on a specified image file or URL. Specialized in extracting text, identifying structures, and describing visual content.',
            inputSchema: {
              type: 'object',
              properties: {
                imagePath: {
                  type: 'string',
                  description: 'The local path or URL of the image file to be visually processed.',
                },
                focusArea: {
                  type: 'string',
                  enum: ['code', 'architecture', 'documentation'],
                  description: 'The preset analysis strategy: \n- "code": Focuses on general content and precise text/symbol extraction.\n- "architecture": Analyzes structural design, layout hierarchy, and component relationships.\n- "documentation": Provides a comprehensive technical breakdown and exhaustive text capture.\nThis is IGNORED if "customPrompt" is provided.',
                  default: 'code',
                },
                customPrompt: {
                  type: 'string',
                  description: 'A custom analysis instruction that overrides the predefined focusArea prompt.',
                },
              },
              required: ['imagePath'],
            },
          },
        ],
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        const typedArgs = args as any;
        
        if (name === 'auto_analyze_image') {
          result = await this.autoImageService.autoGetAndAnalyzeImage(
            typedArgs.imagePath,
            typedArgs.focusArea || 'code',
            typedArgs.customPrompt
          );
        } else {
          throw new Error(`未知工具: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`工具调用失败: ${name}`, error);
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('MCP 图片识别服务器已启动 (stdio模式)');
  }
}

// 启动服务器
const mcpServer = new MCPServer();
mcpServer.run().catch((error) => {
  logger.error('服务器启动失败', error);
  process.exit(1);
});

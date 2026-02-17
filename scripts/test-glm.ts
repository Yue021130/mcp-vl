#!/usr/bin/env node

import { GLMV41Service } from '../src/services/glm-v41-service';
import { AutoImageService } from '../src/services/auto-image-service';
import { config } from '../src/config/index';

const MODEL_TYPE = 'glm-4.1v' as const;
const MODEL_NAME = 'GLMV41';

async function testConnection() {
  console.log(`=== 测试 ${MODEL_NAME} API 连接 ===`);

  const service = new GLMV41Service();

  try {
    const messages = [
      {
        role: 'user' as const,
        content: '你好，请简单介绍一下你自己。',
      },
    ];

    const response = await service.sendMessage(messages);
    const content = response.choices[0]?.message?.content;
    console.log(`✅ ${MODEL_NAME} API 连接成功`);
    console.log('响应:', typeof content === 'string' ? content.substring(0, 100) + '...' : content);
    return true;
  } catch (error) {
    console.error(`❌ ${MODEL_NAME} API 连接失败:`, error instanceof Error ? error.message : '未知错误');
    return false;
  }
}

async function testImageAnalysis(imagePath: string) {
  console.log(`\n=== 测试 ${MODEL_NAME} 图片分析 ===`);

  const autoImageService = new AutoImageService();

  try {
    console.log(`测试图片: ${imagePath}`);

    // 测试代码分析
    console.log(`\n1. 测试代码内容提取 (${MODEL_NAME})...`);
    const codeResult = await autoImageService.autoGetAndAnalyzeImage(imagePath, 'code', undefined, undefined, MODEL_TYPE);
    console.log(`✅ ${MODEL_NAME} 代码分析成功`);
    console.log('摘要:', codeResult.summary?.substring(0, 200) + '...');

    // 测试架构分析
    console.log(`\n2. 测试架构分析 (${MODEL_NAME})...`);
    const archResult = await autoImageService.autoGetAndAnalyzeImage(imagePath, 'architecture', undefined, undefined, MODEL_TYPE);
    console.log(`✅ ${MODEL_NAME} 架构分析成功`);
    console.log('摘要:', archResult.summary?.substring(0, 200) + '...');

    return true;
  } catch (error) {
    console.error(`❌ ${MODEL_NAME} 图片分析失败:`, error instanceof Error ? error.message : '未知错误');
    return false;
  }
}

function checkConfig(): boolean {
  console.log('=== 检查配置 ===');

  if (!config.zhipuAI.apiKey) {
    console.error(`❌ ZHIPUAI_API_KEY 未配置`);
    return false;
  }

  console.log(`✅ ${MODEL_NAME} 配置检查通过`);
  return true;
}

async function main() {
  console.log(`🧪 MCP ${MODEL_NAME} 测试脚本`);
  console.log('=' .repeat(40));

  // 检查配置
  if (!checkConfig()) {
    process.exit(1);
  }

  // 测试 API 连接
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  // 测试图片分析（如果提供了路径）
  const imagePath = process.argv[2];
  if (imagePath) {
    await testImageAnalysis(imagePath);
  } else {
    console.log('\nℹ️  未提供图片路径，跳过图片分析测试');
    console.log(`用法: npx ts-node scripts/test-glm.ts <图片路径>`);
  }

  console.log('\n🎉 测试完成！');
}

main().catch(console.error);

import { GLMService } from './glm-service';
import { ImageAnalysisResult } from '../types/index';
import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export class AutoImageService {
  private glmService: GLMService;
  private tempDir: string;

  constructor() {
    this.glmService = new GLMService();
    this.tempDir = path.join(os.tmpdir(), 'mcp-vl-auto');
  }

  /**
   * 获取并分析本地图片文件
   */
  async autoGetAndAnalyzeImage(
    imagePath: string,
    focusArea: 'code' | 'architecture' = 'code',
    customPrompt?: string,
    processingOptions?: {
      grayscale?: boolean;
      contrast?: number;
      brightness?: number;
      sharpen?: boolean;
    }
  ): Promise<ImageAnalysisResult & { source: string }> {
    try {
      logger.info('开始分析本地图片', { imagePath, focusArea, hasCustomPrompt: !!customPrompt, processingOptions });

      // 验证文件是否存在
      if (!(await this.fileExists(imagePath))) {
        throw new Error(`文件不存在: ${imagePath}`);
      }

      // 分析图片
      const result = await this.analyzeImageFile(imagePath, focusArea, customPrompt, processingOptions);

      return {
        ...result,
        source: 'file',
      };
    } catch (error) {
      logger.error('分析图片失败', { error });
      throw new Error(`处理图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检查文件是否存在
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 分析图片文件
   */
  private async analyzeImageFile(
    imagePath: string,
    focusArea: 'code' | 'architecture' = 'code',
    customPrompt?: string,
    processingOptions?: {
      grayscale?: boolean;
      contrast?: number;
      brightness?: number;
      sharpen?: boolean;
    }
  ): Promise<ImageAnalysisResult> {
    try {
      // 读取图片文件
      const imageBuffer = await fs.readFile(imagePath);
      
      // 使用 sharp 处理图片
      const sharp = require('sharp');
      let imageProcessor = sharp(imageBuffer);

      // 应用多样化处理方法
      if (processingOptions?.grayscale) {
        imageProcessor = imageProcessor.grayscale();
      }
      if (processingOptions?.contrast !== undefined || processingOptions?.brightness !== undefined) {
        imageProcessor = imageProcessor.modulate({
          brightness: processingOptions?.brightness ?? 1.0,
        });
        // 智谱/AI 对对比度敏感，sharp 的 contrast 是在自适应直方图均衡化基础上做的
        if (processingOptions?.contrast !== undefined) {
          imageProcessor = imageProcessor.clahe({
            width: 10,
            height: 10,
            maxSlope: processingOptions.contrast * 3 // 近似映射
          });
        }
      }
      if (processingOptions?.sharpen) {
        imageProcessor = imageProcessor.sharpen();
      }

      const processedImage = await imageProcessor
        .jpeg({ quality: 90 })
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();

      const base64 = processedImage.toString('base64');

      // 获取基本信息
      const metadata = await sharp(imageBuffer).metadata();
      const fileSize = (imageBuffer.length / 1024).toFixed(2) + ' KB';

      // 使用 GLM 服务分析图片
      const analysisResult = await this.glmService.analyzeCode(base64, focusArea, customPrompt);

      // 解析结果
      let result: ImageAnalysisResult;
      
      try {
        // 尝试解析JSON响应
        const parsed = JSON.parse(analysisResult);
        result = {
          description: parsed.description || parsed.content,
          type: parsed.type,
          layout: parsed.layout,
          issues: parsed.issues,
          details: parsed.details,
          summary: parsed.summary || analysisResult.substring(0, 500),
          confidence: 0.9,
          metadata: {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            fileSize,
          },
        };
      } catch {
        // 如果不是JSON格式，直接使用文本响应
        result = {
          summary: analysisResult,
          confidence: 0.8,
          metadata: {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            fileSize,
          },
        };
      }

      return result;
    } catch (error) {
      logger.error('分析图片文件失败', { path: imagePath, error });
      throw new Error(`分析图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 清理临时文件
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info('临时文件已清理', { path: filePath });
    } catch (error) {
      logger.warn('清理临时文件失败', { path: filePath, error });
      // 不抛出错误，因为这不是关键操作
    }
  }

  /**
   * 清理所有临时文件
   */
  async cleanupAllTempFiles(): Promise<void> {
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
      logger.info('所有临时文件已清理', { dir: this.tempDir });
    } catch (error) {
      logger.warn('清理临时目录失败', { error });
    }
  }
}

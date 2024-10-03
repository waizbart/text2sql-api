import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from 'redis';
import { DatabaseService } from './services/database.service';
import { PromptService } from './services/prompt.service';
import { QueueService } from './services/queue.service';

@Injectable()
export class AppService {
  private redisClient;

  constructor(
    private databaseService: DatabaseService,
    private promptService: PromptService,
    private queueService: QueueService,
  ) {
    this.initializeRedis();
  }

  private async initializeRedis() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    this.redisClient = createClient({ url: `redis://${redisHost}:6379` });
    this.redisClient.on('error', (err) =>
      console.error('Erro no cliente Redis', err),
    );
    await this.redisClient.connect();
  }

  async enqueueTask(question: string): Promise<string> {
    const taskId = uuidv4();

    const schemaContent = this.databaseService.getSchemaContent();
    const prompt = this.promptService.buildPrompt(schemaContent, question);

    this.queueService.enqueueTask('tasks.process_prompt', [taskId, prompt]);

    await this.redisClient.hSet(`task:${taskId}`, { status: 'pending' });

    return taskId;
  }

  async getTaskResult(taskId: string): Promise<any> {
    const result = await this.redisClient.hGetAll(`task:${taskId}`);

    if (!result || !result.status) {
      return null;
    } else if (result.status === 'completed' && !result.queryResult) {
      try {
        const queryResult = await this.databaseService.executeSQL(result.generatedSQL);
        await this.redisClient.hSet(`task:${taskId}`, {
          queryResult: JSON.stringify(queryResult),
        });
        result.queryResult = JSON.stringify(queryResult);
      } catch (error) {
        await this.redisClient.hSet(`task:${taskId}`, {
          status: 'error',
          error: error.message,
        });
        result.status = 'error';
        result.error = error.message;
      }
    }
    return result;
  }
}

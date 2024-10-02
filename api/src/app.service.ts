import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as celery from 'celery-node'; // Importa o cliente Celery para Node.js
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

@Injectable()
export class AppService {
  private prisma: PrismaClient;
  private redisClient;
  private celeryClient; // Cliente Celery

  constructor() {
    this.prisma = new PrismaClient();
    this.initializeRedis();
    this.initializeCelery(); // Inicializa o cliente Celery
  }

  private async initializeRedis() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    this.redisClient = createClient({ url: `redis://${redisHost}:6379` });
    this.redisClient.on('error', (err) =>
      console.error('Erro no cliente Redis', err),
    );
    await this.redisClient.connect();
  }

  private initializeCelery() {
    const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
    const redisHost = process.env.REDIS_HOST || 'localhost';

    this.celeryClient = celery.createClient(
      `amqp://${rabbitmqHost}`,
      `redis://${redisHost}:6379/0`,
    );
  }

  async enqueueTask(prompt: string): Promise<string> {
    const taskId = uuidv4();

    const task = this.celeryClient.createTask('tasks.process_prompt');

    task.applyAsync([taskId, prompt]);

    await this.redisClient.hSet(`task:${taskId}`, { status: 'pending' });

    return taskId;
  }

  async getTaskResult(taskId: string): Promise<any> {
    const result = await this.redisClient.hGetAll(`task:${taskId}`);
    if (!result || !result.status) {
      return null;
    } else if (result.status === 'completed' && !result.queryResult) {
      try {
        const queryResult = await this.executeSQL(result.generatedSQL);
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

  private async executeSQL(sql: string): Promise<any> {
    try {
      const result = await this.prisma.$queryRawUnsafe(sql);
      return result;
    } catch (error) {
      throw new Error(`Erro ao executar SQL: ${error.message}`);
    }
  }
}

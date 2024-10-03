import * as celery from 'celery-node';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QueueService {
  private celeryClient;

  constructor() {
    this.initializeCelery();
  }

  private initializeCelery() {
    const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
    const redisHost = process.env.REDIS_HOST || 'localhost';

    this.celeryClient = celery.createClient(
      `amqp://${rabbitmqHost}`,
      `redis://${redisHost}:6379/0`,
    );
  }

  enqueueTask(taskName: string, args: any[]) {
    const task = this.celeryClient.createTask(taskName);
    task.applyAsync(args);
  }
}

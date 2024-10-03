import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/api/query')
  async generate(@Body('prompt') prompt: string) {
    if (!prompt) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }
    const taskId = await this.appService.enqueueTask(prompt);
    return { taskId };
  }

  @Get('/api/status/:taskId')
  async getResult(@Param('taskId') taskId: string) {
    const result = await this.appService.getTaskResult(taskId);
    if (!result || !result.status) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    } else if (result.status === 'pending' || result.status === 'processing') {
      return { status: result.status };
    } else if (result.status === 'completed') {
      return { status: 'completed', result: result.queryResult };
    } else if (result.status === 'error') {
      return { status: 'error', error: result.error };
    }
  }
}

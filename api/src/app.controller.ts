import {
  Controller,
  UseGuards,
  Post,
  Get,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Logger,
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './guards/auth.guard';
import { Response } from 'express';

@UseGuards(AuthGuard)
@Controller('api')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Post('query')
  async generate(@Body('prompt') prompt: string): Promise<{ taskId: string }> {
    this.logger.log('Recebida requisição para gerar tarefa.');

    if (!prompt) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }

    const taskId = await this.appService.enqueueTask(prompt);
    return { taskId };
  }

  @Get('status/:taskId')
  async getResult(@Param('taskId') taskId: string, @Res() res: Response): Promise<any> {
    this.logger.log(`Consultando status da tarefa: ${taskId}`);

    const result = await this.appService.getTaskResult(taskId);

    if (!result || !result.status) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Task not found' });
    }

    const response = {
      status: result.status,
      generatedSql: result.generatedSQL,
    };

    switch (result.status) {
      case 'completed':
        return res.status(HttpStatus.OK).json({
          ...response,
          result: result.queryResult,
        });

      case 'pending':
      case 'processing':
        return res.status(HttpStatus.OK).json(response);

      case 'error':
        return res.status(HttpStatus.BAD_REQUEST).json({
          ...response,
          error: result.error,
        });

      default:
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Unknown task status' });
    }
  }
}

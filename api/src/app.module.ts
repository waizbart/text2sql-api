import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './services/database.service';
import { PromptService } from './services/prompt.service';
import { QueueService } from './services/queue.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    DatabaseService,
    PromptService,
    QueueService,
  ],
  exports: [AppService],
})
export class AppModule {}


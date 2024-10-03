import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptService {
  buildPrompt(schemaContent: string, question: string): string {
    return `### Database Schema\n\n${schemaContent}\n\n### Task \n\nBased on the provided database schema information, ${question}[SQL]\n`;
  }
}

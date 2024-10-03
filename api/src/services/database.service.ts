import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async executeSQL(sql: string): Promise<any> {
    try {
      const result = await this.prisma.$queryRawUnsafe(sql);
      return result;
    } catch (error) {
      throw new Error(`Erro ao executar SQL: ${error.message}`);
    }
  }

  getSchemaContent(): string {
    const schemaPath = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma');
    try {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      return schemaContent;
    } catch (error) {
      console.error('Erro ao ler o arquivo schema.prisma:', error);
      throw error;
    }
  }
}

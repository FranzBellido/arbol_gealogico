import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}
  @Get()
  getHello(): string {
    return 'Backend is running!';
  }

  @Get('ping')
  ping() {
    return {
      status: 'ok',
      message: 'pong',
      timestamp: new Date().toISOString()
    };
  }

  @Get('countries')
  async getCountries() {
    return this.prisma.pais.findMany({
      orderBy: { nombre: 'asc' }
    });
  }
}

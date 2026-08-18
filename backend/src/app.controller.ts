import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
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
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getWelcomeMessage() {
    return {
      name: 'Joincom Admin API',
      version: '0.1.0',
      docs: '/docs'
    };
  }
}

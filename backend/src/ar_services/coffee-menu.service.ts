import { Injectable } from '@nestjs/common';
import { ARServiceHandler } from './ar-service.interface';


@Injectable()
export class CoffeeMenuService implements ARServiceHandler {
  async processEvent(payload: any) {
    // Logic specific to the Coffee Menu AR App
    console.log('Coffee Menu Processing Event:', payload);
    return { status: 'success', data: payload };
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class CoffeeMenuService {
  async processEvent(payload: any) {
    // Logic specific to the Coffee Menu AR App
    console.log('Coffee Menu Processing Event:', payload);
    return { status: 'success', data: payload };
  }
}

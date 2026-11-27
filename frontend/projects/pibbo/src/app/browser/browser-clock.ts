import { Injectable } from '@angular/core';
import type { Clock } from '@pibbo/api';

@Injectable()
export class BrowserClock implements Clock {
  now(): number {
    return Date.now();
  }
}

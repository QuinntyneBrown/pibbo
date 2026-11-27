import { Injectable } from '@angular/core';
import type { Clock } from '@pibbo/api';

@Injectable()
export class BrowserClock implements Clock {
  now(): number {
    return Date.now();
  }

  after(ms: number, callback: () => void): () => void {
    const id = setTimeout(callback, ms);
    return () => clearTimeout(id);
  }
}

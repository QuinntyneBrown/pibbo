import { Injectable } from '@angular/core';
import type { RandomSource } from '@pibbo/api';

@Injectable()
export class BrowserRandomSource implements RandomSource {
  next(): number {
    return Math.random();
  }
}

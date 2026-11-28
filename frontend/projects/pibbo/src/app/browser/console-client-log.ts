import { Injectable } from '@angular/core';
import type { ClientLog } from '@pibbo/api';

/**
 * Warnings go to the browser's console and nowhere else: nothing is sent (ADR 0025). Callers
 * pass content ids only, never anything about a child.
 */
@Injectable()
export class ConsoleClientLog implements ClientLog {
  warn(message: string): void {
    console.warn(message);
  }
}

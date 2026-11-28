import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import type { ActivityExit, GroupId } from '@pibbo/api';

/**
 * Where an activity goes when it ends (ADR 0026). An activity opened from a lesson's path has
 * `?lesson=<id>&step=<n>` in its address: Leave returns to the path and the last Next returns
 * to it with `?finished=<n>`. Anything else returns Home with the activity's group chosen.
 */
@Injectable()
export class RouterActivityExit implements ActivityExit {
  private readonly router = inject(Router);

  leave(group: GroupId): void {
    const lesson = this.lesson();
    if (lesson) void this.router.navigate(['/lesson', lesson.id]);
    else void this.router.navigate(['/'], { queryParams: { group } });
  }

  finish(group: GroupId): void {
    const lesson = this.lesson();
    if (lesson)
      void this.router.navigate(['/lesson', lesson.id], {
        queryParams: { finished: lesson.step },
      });
    else void this.router.navigate(['/'], { queryParams: { group } });
  }

  private lesson(): { id: string; step: number } | null {
    const params = this.router.routerState.snapshot.root.queryParamMap;
    // Only a group can name a lesson; the path itself checks the rest. Kept free of the lesson
    // content so that nothing of the lesson is in the initial bundle.
    const id = params.get('lesson');
    const step = Number(params.get('step'));
    return (id === 'count' || id === 'read') && Number.isInteger(step) && step >= 1
      ? { id, step }
      : null;
  }
}

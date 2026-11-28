import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AUDIO_PLAYER, PROGRESS_STORE, RANDOM_SOURCE } from '@pibbo/api';
import { Confirm, GateView, VolumeSwitch } from '@pibbo/components';
import {
  DEFAULT_VOLUME,
  gateTask,
  isVolumeLevel,
  newGate,
  touchGate,
  volumeGain,
  VOLUMES,
  type VolumeLevel,
} from '@pibbo/domain';

/** Where the grown-up screen is: the gate always comes first (L2-037 #7). */
type Step = 'gate' | 'area' | 'confirm';

/**
 * The grown-up screen (docs/mocks/pages/grown-up): first the gate, then the area with volume,
 * clear progress and about Pibbo, with no link out (L2-037, ADR 0029). Leaving goes back to
 * the address Home was at, so Home is as it was.
 */
@Component({
  selector: 'pb-grown-up-area',
  imports: [GateView, VolumeSwitch, Confirm],
  templateUrl: './grown-up-area.html',
  styleUrl: './grown-up-area.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrownUpArea {
  private readonly router = inject(Router);
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly store = inject(PROGRESS_STORE);
  /** Home's address when the entry was touched; only a path on Pibbo's own origin. */
  private readonly from = homeAddress(this.router.currentNavigation()?.extras.state?.['from']);

  protected readonly step = signal<Step>('gate');
  protected readonly gate = signal(newGate(inject(RANDOM_SOURCE)));
  protected readonly task = computed(() => gateTask(this.gate()));
  protected readonly volumes = VOLUMES;
  protected readonly volume = signal<VolumeLevel>(storedVolume(this.store.read('volume')));
  /** Said once progress is cleared, in a status. */
  protected readonly cleared = signal(false);

  protected touchKey(n: number): void {
    const { gate, outcome } = touchGate(this.gate(), n);
    this.gate.set(gate);
    if (outcome === 'passed') this.step.set('area');
    else if (outcome === 'failed') this.back();
  }

  protected chooseVolume(level: string): void {
    if (!isVolumeLevel(level)) return;
    this.volume.set(level);
    this.store.write('volume', level);
    this.audio.setVolume(volumeGain(level));
  }

  protected askToClear(): void {
    this.cleared.set(false);
    this.step.set('confirm');
  }

  protected keep(): void {
    this.step.set('area');
  }

  /** Erases all progress on this device; the volume stays (L2-029 #4, L2-037 #5). */
  protected clear(): void {
    this.store.clearAll();
    this.step.set('area');
    this.cleared.set(true);
  }

  protected back(): void {
    void this.router.navigateByUrl(this.from);
  }
}

/** A stored or passed address counts only if it is Home's; anything else is Home itself. */
function homeAddress(value: unknown): string {
  return typeof value === 'string' && /^\/(\?group=(count|read))?$/.test(value) ? value : '/';
}

/** A stored volume counts only if it is one of the volumes; anything else is the default. */
function storedVolume(value: unknown): VolumeLevel {
  return isVolumeLevel(value) ? value : DEFAULT_VOLUME;
}

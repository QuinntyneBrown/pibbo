import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterActivityExit } from './router-activity-exit';

describe('RouterActivityExit', () => {
  let router: Router;
  let exit: RouterActivityExit;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }]), RouterActivityExit],
    });
    router = TestBed.inject(Router);
    exit = TestBed.inject(RouterActivityExit);
  });

  const settle = () => new Promise((resolve) => setTimeout(resolve));

  it('returns Home with the group chosen when not in a lesson', async () => {
    await router.navigateByUrl('/count/toys');
    exit.leave('count');
    await settle();
    expect(router.url).toBe('/?group=count');
    await router.navigateByUrl('/count/toys');
    exit.finish('count');
    await settle();
    expect(router.url).toBe('/?group=count');
  });

  it('returns to the path when left from a lesson, at the same step', async () => {
    await router.navigateByUrl('/count/toys?lesson=count&step=2');
    exit.leave('count');
    await settle();
    expect(router.url).toBe('/lesson/count');
  });

  it('returns to the path with the finished step when finished in a lesson', async () => {
    await router.navigateByUrl('/count/toys?lesson=count&step=2');
    exit.finish('count');
    await settle();
    expect(router.url).toBe('/lesson/count?finished=2');
  });

  it('ignores a lesson that does not exist or a step that is not one', async () => {
    for (const url of ['/count/toys?lesson=draw&step=1', '/count/toys?lesson=count&step=x']) {
      await router.navigateByUrl(url);
      exit.finish('count');
      await settle();
      expect(router.url).toBe('/?group=count');
    }
  });
});

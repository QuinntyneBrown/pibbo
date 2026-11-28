// Traces to: L2-030
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';

test.describe('Security headers', () => {
  test('Given Home is requested, when the response is inspected, then it allows only Pibbo’s own origin @critical', async ({
    page,
  }) => {
    const home = new HomePage(page);

    const headers = await home.openWithHeaders();

    const csp = headers['content-security-policy'] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('no-referrer');
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['permissions-policy']).toContain('microphone=()');
  });

  test('Given Home is requested, when the browser reads the headers, then it understands every one of them @critical', async ({
    page,
  }) => {
    const complaints: string[] = [];
    page.on('console', (message) => {
      if (/header/i.test(message.text())) complaints.push(message.text());
    });

    await new HomePage(page).openWithHeaders();

    expect(complaints).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';
import { registerDashboardMocks, seriesMock } from '../utils/dashboardMocks';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerDashboardMocks(page);
  });

  test('loads overview, filters, and drills down', async ({ page }) => {
    page.on('console', (message) => {
      // eslint-disable-next-line no-console
      console.log(`[console:${message.type()}] ${message.text()}`);
    });

    page.on('requestfinished', async (request) => {
      const response = await request.response();
      // eslint-disable-next-line no-console
      console.log(`[request] ${request.method()} ${request.url()} -> ${response?.status()}`);
    });

    page.on('requestfailed', (request) => {
      // eslint-disable-next-line no-console
      console.log(`[request-failed] ${request.method()} ${request.url()} -> ${request.failure()?.errorText}`);
    });

    const overviewRequests: string[] = [];

    page.on('request', (request) => {
      if (request.url().includes('/api/v1/dashboard/overview')) {
        overviewRequests.push(request.url());
      }
    });

    await page.goto('/dashboard');

    await expect(page.locator('.dashboard__kpi-card')).toHaveCount(6);
    await expect(
      page.locator('.dashboard__kpi-card').first().locator('.dashboard__kpi-number')
    ).toHaveText('128');

    await expect(page.locator('.trend-chart__item')).toHaveCount(seriesMock.points.length);

    await page.getByRole('button', { name: '近 7 天' }).click();
    await page.waitForTimeout(200);
    expect(overviewRequests.length).toBeGreaterThan(1);

    await page.getByRole('button', { name: '重置' }).click();
    await page.waitForTimeout(200);
    expect(overviewRequests.length).toBeGreaterThan(2);

    await page.locator('.dashboard__kpi-card').first().click();
    await expect(page).toHaveURL(/\/orders/);
  });
});

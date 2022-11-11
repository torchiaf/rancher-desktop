import path from 'path';

import { test, expect } from '@playwright/test';
import { ElectronApplication, BrowserContext, _electron, Page } from 'playwright';

import { NavPage } from './pages/nav-page';
import { PreferencesPage } from './pages/preferences';
import { createDefaultSettings, packageLogs, reportAsset } from './utils/TestUtils';

let page: Page;

async function takeScreenshot(title: any, navPage?: NavPage) {
  if (navPage) {
    await navPage.navigateTo(title);
  }
  await page.screenshot({ path: `${ title }.png` });
}

test.describe.serial('Main App Test', () => {
  let electronApp: ElectronApplication;
  let context: BrowserContext;

  test.beforeAll(async() => {
    createDefaultSettings();

    electronApp = await _electron.launch({
      args: [
        path.join(__dirname, '../'),
        '--disable-gpu',
        '--whitelisted-ips=',
        '--disable-dev-shm-usage',
        '--no-modal-dialogs',
      ],
      env: {
        ...process.env,
        RD_LOGS_DIR: reportAsset(__filename, 'log'),
      },
    });
    context = electronApp.context();

    await context.tracing.start({ screenshots: true, snapshots: true });
    page = await electronApp.firstWindow();

    await new NavPage(page).progressBecomesReady();
  });

  test.afterAll(async() => {
    await context.tracing.stop({ path: reportAsset(__filename) });
    await packageLogs(__filename);
    await electronApp.close();
  });

  test('Main Page', async() => {
    const navPage = new NavPage(page);

    await takeScreenshot('General');
    await takeScreenshot('PortForwarding', navPage);
    await takeScreenshot('Images', navPage);
    await takeScreenshot('Troubleshooting', navPage);
  });

  test('Preferences Page', async() => {
    await new NavPage(page).preferencesButton.click();

    const preferencesPage = await electronApp.waitForEvent('window', page => /preferences/i.test(page.url()));
    const { application } = new PreferencesPage(preferencesPage);

    await expect(application.nav).toHaveClass('preferences-nav-item active');
    await preferencesPage.screenshot({ path: 'Application.png' });
  });
});

import { Page, Locator } from 'playwright';
export class ApplicationNav {
  readonly page: Page;
  readonly nav: Locator;
  readonly tabBehavior: Locator;
  readonly tabEnvironment: Locator;
  readonly administrativeAccess: Locator;
  readonly automaticUpdates: Locator;
  readonly automaticUpdatesCheckbox: Locator;
  readonly statistics: Locator;
  readonly autoStart: Locator;
  readonly background: Locator;
  readonly trayIcon: Locator;
  readonly pathManagement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = page.locator('[data-test="nav-application"]');
    this.tabBehavior = page.locator('.tab >> text=Behavior');
    this.tabEnvironment = page.locator('.tab >> text=Environment');
    this.administrativeAccess = page.locator('[data-test="administrativeAccess"]');
    this.automaticUpdates = page.locator('[data-test="automaticUpdates"]');
    this.automaticUpdatesCheckbox = page.locator('[data-test="automaticUpdatesCheckbox"]');
    this.statistics = page.locator('[data-test="statistics"]');
    this.autoStart = page.locator('[data-test="autoStart"]');
    this.background = page.locator('[data-test="background"]');
    this.trayIcon = page.locator('[data-test="trayIcon"]');
    this.pathManagement = page.locator('[data-test="pathManagement"]');
  }
}

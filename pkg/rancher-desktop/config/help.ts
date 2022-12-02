import os from 'os';

import { shell } from 'electron';

import { TransientSettings } from '@pkg/config/transientSettings';

type Paths = Record<string, string>;

class Url {
  private readonly baseUrl = 'https://docs.rancherdesktop.io';
  private paths: Paths = {};

  constructor(paths: Paths) {
    this.paths = paths;
  }

  buildUrl(key: string | undefined, version: string): string {
    if (key) {
      const releasePattern = /^(\d+\.\d+)\.\d+$/;

      const docsVersion = releasePattern.exec(version)?.[1] ?? 'next';

      return `${ this.baseUrl }/${ docsVersion }/${ this.paths[key] }`;
    }

    return '';
  }
}

class PreferencesHelp {
  private readonly url = new Url({
    Application:                       'ui/preferences/application',
    'Application-behavior':            'ui/preferences/application#behavior',
    'Application-environment':         'ui/preferences/application#environment',
    'Virtual Machine':                 'ui/preferences/virtual-machine',
    'Container Engine-general':        'ui/preferences/container-engine#general',
    'Container Engine-allowed-images': 'ui/preferences/container-engine#allowed-images',
    WSL:                               'ui/preferences/wsl',
    Kubernetes:                        'ui/preferences/kubernetes',
  });

  openUrl(version: string): void {
    const { current, currentTabs } = TransientSettings.value.preferences.navItem;
    const tab = currentTabs[current] ? `-${ currentTabs[current] }` : '';

    const url = this.url.buildUrl(`${ current }${ tab }`, version);

    shell.openExternal(url);
  }
}

class HelpImpl {
  readonly shortcut = os.platform() === 'darwin' ? 'Command+?' : 'F1';

  readonly preferences = new PreferencesHelp();
}

export const Help = new HelpImpl();

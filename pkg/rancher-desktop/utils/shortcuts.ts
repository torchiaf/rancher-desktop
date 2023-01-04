import os from 'os';

import { BrowserWindow } from 'electron';

import { toArray } from '@pkg/utils/array';

type Platform = 'darwin' | 'linux' | 'win32';

export interface Shortcut {
  platform?: Platform | Platform[];
  meta?: boolean;
  shift?: boolean;
  control?: boolean;
  alt?: boolean;
  key: string;
}

interface ShortcutExt extends Shortcut {
  callback: () => void;
}

function matchPlatform(shortcut: Shortcut): boolean {
  if (shortcut.platform) {
    return toArray(shortcut.platform).includes(os.platform());
  }

  return true;
}

function currentPlatform(shortcuts: Shortcut[], action: (s: Shortcut) => void) {
  shortcuts.forEach((s) => {
    if (matchPlatform(s)) {
      action(s);
    }
  });
}

/**
 * TODO implement shift, alt
 */
function getId(shortcut: Shortcut) {
  return `${ shortcut.meta ? 'Cmd+' : '' }${ shortcut.control ? 'Ctrl+' : '' }${ shortcut.key }`;
}

class WindowShortcuts {
  private window: BrowserWindow;
  private shortcuts: Record<string, ShortcutExt> = {};

  constructor(window: BrowserWindow) {
    this.window = window;
    this.addListener();
  }

  private inputCallback = (event: Electron.Event, input: Electron.Input) => {
    const shortcut = this.findShortcut(input);

    if (shortcut) {
      shortcut.callback();
      event.preventDefault();
    }
  };

  get shortcutsList() {
    return Object.values(this.shortcuts);
  }

  findShortcut(shortcut: Shortcut) {
    const id = getId(shortcut);

    return this.shortcuts[id];
  }

  addShortcut(shortcut: ShortcutExt) {
    const id = getId(shortcut);

    if (this.shortcuts[id]) {
      console.warn(`Shortcut [${ id }] is already registered for window: [${ this.window.id }]; Skip.`);

      return;
    }

    this.shortcuts[id] = shortcut;

    console.log(`Window: [${ this.window.id }] - add shortcut: [${ id }]`);
  }

  removeShortcut(shortcut: Shortcut) {
    const id = getId(shortcut);

    if (!this.shortcuts[id]) {
      console.warn(`Shortcut [${ id }] is not registered for window: [${ this.window.id }]; Skip.`);

      return;
    }

    delete this.shortcuts[id];

    console.log(`Window: [${ this.window.id }] - remove shortcut: [${ id }]`);
  }

  addListener() {
    this.window.webContents.on('before-input-event', this.inputCallback);
  }

  removeListener() {
    this.window.webContents.off('before-input-event', this.inputCallback);
  }
}

class ShortcutsImpl {
  private windows: Record<number, WindowShortcuts> = {};

  /**
   *
   * @param window where the shortcuts takes effect, if it focused
   * @param _shortcuts definition of the shortcut, check Shortcut type
   * @param callback
   * @returns void
   */
  register(window: BrowserWindow, _shortcuts: Shortcut | Shortcut[], callback: () => void) {
    const id = window?.id;
    const shortcuts = toArray(_shortcuts) as Shortcut[];

    if (id === undefined) {
      console.warn('Window is undefined; Skip.');

      return;
    }

    if (shortcuts.length === 0) {
      console.warn('Shortcuts definition is empty; Skip.');

      return;
    }

    if (!this.windows[id]) {
      this.windows[id] = new WindowShortcuts(window);

      window.on('close', () => {
        delete this.windows[id];
      });
    }

    currentPlatform(shortcuts, (s) => {
      this.windows[id].addShortcut({
        ...s,
        callback,
      });
    });
  }

  /**
   *
   * @param window where the shortcuts is registered
   * @param _shortcuts shortcuts to be unregistered
   * @returns void
   */
  unregister(window: BrowserWindow, _shortcuts?: Shortcut | Shortcut[]) {
    const id = window?.id;
    const shortcuts: Shortcut[] = _shortcuts ? toArray(_shortcuts) : [];

    if (id === undefined) {
      console.warn('Window is undefined; Skip.');

      return;
    }

    currentPlatform(shortcuts, (s) => {
      this.windows[id].removeShortcut(s);
    });

    if (shortcuts.length === 0 || this.windows[id].shortcutsList.length === 0) {
      this.windows[id].removeListener();
      delete this.windows[id];

      console.log(`Window: [${ id }] - all shortcuts removed`);
    }
  }

  isRegistered(window: BrowserWindow): boolean {
    const id = window?.id;

    if (id === undefined) {
      console.warn('Window is undefined; Skip.');

      return false;
    }

    if (this.windows[id]) {
      return true;
    }

    return false;
  }
}

export const Shortcuts = new ShortcutsImpl();

import fs from 'fs';
import os from 'os';
import { join } from 'path';
import stream from 'stream';

import * as nativeReg from 'native-reg';

import * as settings from '@pkg/config/settings';
import { spawnFile } from '@pkg/utils/childProcess';
import Logging from '@pkg/utils/logging';
import paths from '@pkg/utils/paths';
import { RecursivePartial } from '@pkg/utils/typeUtils';

const console = Logging.deploymentProfile;

const REGISTRY_PATH_PROFILE = ['SOFTWARE', 'Rancher Desktop', 'Profile'];

/**
 * Lockable default settings used for validating deployment profiles.
 * Data values are ignored, but types are used for validation.
 */
const lockableDefaultSettings = {
  containerEngine: {
    allowedImages: {
      enabled:  true,
      patterns: [] as Array<string>,
    },
  },
};

/**
 * Read and validate deployment profiles, giving system level profiles
 * priority over user level profiles.  If the system directory contains a
 * defaults or locked profile, the user directory will not be read.
 * @returns type validated defaults and locked deployment profiles, and throws
 *          an error if there is an error parsing the locked profile.
 * NOTE: The renderer process can not access the 'native-reg' library, so the
 *       win32 portions of the deployment profile reader functions must be
 *       located in the main process.
 */

export async function readDeploymentProfiles(): Promise<settings.DeploymentProfileType> {
  let profiles: settings.DeploymentProfileType = {
    defaults: {},
    locked:   {},
  };

  switch (os.platform()) {
  case 'win32':
    for (const key of [nativeReg.HKLM, nativeReg.HKCU]) {
      const registryKey = nativeReg.openKey(key, REGISTRY_PATH_PROFILE.join('\\'), nativeReg.Access.READ);

      if (!registryKey) {
        continue;
      }
      const defaultsKey = nativeReg.openKey(registryKey, 'Defaults', nativeReg.Access.READ);
      const lockedKey = nativeReg.openKey(registryKey, 'Locked', nativeReg.Access.READ);

      try {
        if (defaultsKey) {
          profiles.defaults = readRegistryUsingSchema(settings.defaultSettings, defaultsKey) ?? {};
        }
        if (lockedKey) {
          profiles.locked = readRegistryUsingSchema(settings.defaultSettings, lockedKey) ?? {};
        }
      } catch (err) {
        console.error( `Error reading deployment profile: ${ err }`);
      } finally {
        nativeReg.closeKey(registryKey);
        if (defaultsKey) {
          nativeReg.closeKey(defaultsKey);
        }
        if (lockedKey) {
          nativeReg.closeKey(lockedKey);
        }
      }
      // If we found something in the HKLM Defaults or Locked registry hive, don't look at the user's
      // Alternatively, if the keys work, we could break, even if both hives are empty.
      if (Object.keys(profiles.defaults).length || Object.keys(profiles.locked).length) {
        break;
      }
    }
    break;
  case 'linux': {
    const linuxPaths = {
      [paths.deploymentProfileSystem]: ['defaults.json', 'locked.json'],
      [paths.deploymentProfileUser]:   ['rancher-desktop.defaults.json', 'rancher-desktop.locked.json'],
    };

    for (const configDir in linuxPaths) {
      const [defaults, locked] = linuxPaths[configDir];

      profiles = parseJsonFile(configDir, defaults, locked);
      if (typeof profiles.defaults !== 'undefined' || typeof profiles.locked !== 'undefined') {
        break;
      }
    }
  }
    break;
  case 'darwin':
    for (const rootPath of [paths.deploymentProfileSystem, paths.deploymentProfileUser]) {
      profiles = await parseJsonFromPlist(rootPath, 'io.rancherdesktop.profile.defaults.plist', 'io.rancherdesktop.profile.locked.plist');

      if (typeof profiles.defaults !== 'undefined' || typeof profiles.locked !== 'undefined') {
        break;
      }
    }
    break;
  }

  profiles.defaults = validateDeploymentProfile(profiles.defaults, settings.defaultSettings) ?? {};
  profiles.locked = validateDeploymentProfile(profiles.locked, lockableDefaultSettings) ?? {};

  return profiles;
}

/**
 * Read and parse plutil deployment profile files.
 * @param rootPath the system or user directory containing profiles.
 * @param defaultsPath the file path to the 'defaults' file.
 * @param lockedPath the file path to the 'locked' file.
 * @returns the defaults and/or locked objects if they exist, or
 *          throws an exception if there is an error parsing the locked file.
 */
async function parseJsonFromPlist(rootPath: string, defaultsPath: string, lockedPath: string) {
  let defaults;
  let locked;

  const plutilArgs = ['-convert', 'json', '-r', '-o', '-', '-']; // read from stdin and write to stdout
  let plutilPath = join(rootPath, defaultsPath);

  try {
    const body = stream.Readable.from(fs.readFileSync(plutilPath, { encoding: 'utf-8' }));
    const plutilResult = await spawnFile('plutil', plutilArgs, { stdio: [body, 'pipe', 'pipe'] });

    try {
      defaults = JSON.parse(plutilResult.stdout);
    } catch (error) {
      console.log(`Error parsing deployment profile JSON object ${ plutilPath }\n${ error }`);
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      // just log an error if we fail to parse the 'defaults' profile
      console.log(`Error parsing deployment profile ${ plutilPath }\n${ error }`);
    }
  }

  plutilPath = join(rootPath, lockedPath);
  let finalError: any;

  try {
    const body = stream.Readable.from(fs.readFileSync(plutilPath, { encoding: 'utf-8' }));
    const plutilResult = await spawnFile('plutil', plutilArgs, { stdio: [body, 'pipe', 'pipe'] });

    try {
      locked = JSON.parse(plutilResult.stdout);
    } catch (error: any) {
      // throw error if we fail to parse the 'locked' profile
      console.log(`Error parsing deployment profile JSON object ${ plutilPath }\n${ error }`);
      finalError = error;
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      // throw error if plutil fails to parse the 'locked' profile
      console.log(`Error parsing deployment profile ${ plutilPath }\n${ error }`);
      finalError = error;
    }
  }
  if (finalError) {
    throw new Error(`Error parsing deployment profile JSON object ${ plutilPath }: ${ finalError }`);
  }

  return { defaults, locked };
}

/**
 * Read and parse deployment profile files.
 * @param rootPath the system or user directory containing profiles.
 * @param defaultsPath the file path to the 'defaults' file.
 * @param lockedPath the file path to the 'locked' file.
 * @returns the defaults and/or locked objects if they exist, or
 *          throws an exception if there is an error parsing the locked file.
 */
function parseJsonFile(rootPath: string, defaultsPath: string, lockedPath: string) {
  let defaults;
  let locked;

  try {
    const defaultsData = fs.readFileSync(join(rootPath, defaultsPath), 'utf-8');

    defaults = JSON.parse(defaultsData);
  } catch {}
  try {
    const lockedData = fs.readFileSync(join(rootPath, lockedPath), 'utf-8');

    locked = JSON.parse(lockedData);
  } catch (ex: any) {
    if (ex.code !== 'ENOENT') {
      throw new Error(`Error parsing locked deployment profile: ${ ex }`);
    }
  }

  return { defaults, locked };
}

/**
 * Windows only. Read settings values from registry using schemaObj as a template.
 * @param schemaObj the object used as a template for navigating registry.
 * @param regKey the registry key obtained from nativeReg.openKey().
 * @returns null, or the registry data as an object.
 */
function readRegistryUsingSchema(schemaObj: any, regKey: nativeReg.HKEY): RecursivePartial<settings.Settings>|null {
  let newObject: RecursivePartial<settings.Settings>|null = null;

  const schemaKeys = Object.keys(schemaObj);
  // ignore case
  const registryKeys = nativeReg.enumKeyNames(regKey).concat(nativeReg.enumValueNames(regKey)).map(k => k.toLowerCase());
  const commonKeys = schemaKeys.filter(k => registryKeys.includes(k.toLowerCase()));

  for (const k of commonKeys) {
    const schemaVal = schemaObj[k];
    let regValue: any = null;

    if (typeof schemaVal === 'object') {
      if (!Array.isArray(schemaVal)) {
        const innerKey = nativeReg.openKey(regKey, k, nativeReg.Access.READ);

        if (!innerKey) {
          continue;
        }
        try {
          regValue = readRegistryUsingSchema(schemaVal, innerKey);
          if (regValue && (typeof regValue === 'object') && Object.keys(regValue).length === 0) {
            // Ignore empty objects
            regValue = null;
          }
        } finally {
          nativeReg.closeKey(innerKey);
        }
      } else {
        const multiSzValue = nativeReg.queryValueRaw(regKey, k);

        if (multiSzValue) {
          // Registry value can be a single-string or even a DWORD and parseMultiString will handle it.
          const arrayValue = nativeReg.parseMultiString(multiSzValue as nativeReg.Value);

          regValue = arrayValue.length ? arrayValue : null;
        }
      }
    } else {
      regValue = nativeReg.queryValue(regKey, k);
      if (typeof schemaVal === 'boolean') {
        if (typeof regValue === 'number') {
          regValue = regValue !== 0;
        } else {
          console.debug(`Deployment Profile expected boolean value for key ${ k }`);
          regValue = false;
        }
      }
    }
    if (regValue !== null) {
      newObject ??= {};
      (newObject as Record<string, any>)[k] = regValue;
    }
  }

  return newObject;
}

/**
 * Do simple type validation of a deployment profile
 * @param profile The profile to be validated
 * @param schema The structure (usually defaultSettings) used as a template
 * @returns The original profile, less any invalid fields
 */
function validateDeploymentProfile(profile: any, schema: any) {
  if (typeof profile === 'object') {
    for (const key in profile) {
      if (key in schema) {
        if (typeof profile[key] === typeof schema[key]) {
          if (typeof profile[key] === 'object') {
            if (Array.isArray(profile[key] !== Array.isArray(schema[key]))) {
              console.log(`Deployment Profile ignoring '${ key }'. Array type mismatch.`);
              delete profile[key];
            } else if (!Array.isArray(profile[key])) {
              validateDeploymentProfile(profile[key], schema[key]);
            }
          }
        } else {
          console.log(`Deployment Profile ignoring '${ key }'. Wrong type.`);
          delete profile[key];
        }
      } else {
        console.log(`Deployment Profile ignoring '${ key }'. Not in schema.`);
        delete profile[key];
      }
    }
  }

  return profile;
}

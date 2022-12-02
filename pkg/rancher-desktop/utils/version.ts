import * as childProcess from '@pkg/utils/childProcess';

function getProductionVersion() {
  try {
    return Electron.app.getVersion();
  } catch (err) {
    console.log(`Can't get app version: ${ err }`);

    return '?';
  }
}

async function getDevVersion() {
  try {
    const { stdout } = await childProcess.spawnFile('git', ['describe', '--tags'], { stdio: ['ignore', 'pipe', 'inherit'] });

    return stdout.trim();
  } catch (err) {
    console.log(`Can't get app version: ${ err }`);

    return '?';
  }
}

export async function getVersion() {
  if (process.env.NODE_ENV === 'production' || process.env.MOCK_FOR_SCREENSHOTS) {
    return getProductionVersion();
  }

  return await getDevVersion();
}

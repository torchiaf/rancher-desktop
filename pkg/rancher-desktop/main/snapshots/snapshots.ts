import { spawnFile } from '@pkg/utils/childProcess';
import Logging from '@pkg/utils/logging';
import { getRdctlPath } from '@pkg/utils/paths';

import { Snapshot, SpawnResult } from './types';

const console = Logging.snapshots;

class SnapshotsImpl {
  private async rdctl(commandArgs: string[]): Promise<SpawnResult> {
    try {
      const rdctlPath = getRdctlPath();

      return await spawnFile(rdctlPath || '', commandArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err: any) {
      return {
        stdout: err?.stdout ?? '', stderr: err?.stderr ?? '', error: err,
      };
    }
  }

  private parseFields(line: string): string[] {
    return line.split(/\s{2,}/);
  }

  private parseLines(response: SpawnResult) {
    const data = response.stdout.split(/\r?\n/).filter(line => line);
    const [header, ...lines] = data;

    const fields = this.parseFields(header);

    return lines.map(line => fields.reduce((acc, f, index) => ({
      ...acc,
      [f.toLowerCase()]: this.parseFields(line)[index],
    }), {} as Snapshot));
  }

  async list(): Promise<Snapshot[]> {
    const response = await this.rdctl(['snapshot', 'list']);

    if (response.stderr) {
      return [];
    }

    return this.parseLines(response);
  }

  async create(snapshot: Snapshot) : Promise<void> {
    const response = await this.rdctl(['snapshot', 'create', snapshot.name]);

    if (response.stderr) {
      console.log(response.stderr);
      throw new Error('Cannot create Snapshot');
    }
  }

  async restore(id: string) : Promise<void> {
    const response = await this.rdctl(['snapshot', 'restore', id]);

    if (response.stderr) {
      console.log(response.stderr);
      throw new Error('Cannot restore Snapshot');
    }
  }

  async delete(id: string) : Promise<void> {
    const response = await this.rdctl(['snapshot', 'delete', id]);

    if (response.stderr) {
      console.log(response.stderr);
      throw new Error('Cannot delete Snapshot');
    }
  }
}

export const Snapshots = new SnapshotsImpl();

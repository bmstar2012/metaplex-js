import stream from 'stream';
import { promisify } from 'util';
import { execSync } from 'child_process';
import { renameSync, rmSync, createWriteStream, mkdirSync } from 'fs';
import { tmpTestDir } from '../utils';
import axios from 'axios';
import StreamZip from 'node-stream-zip';

const rustGithubRepository = 'metaplex-program-library';
const repositoryDir = `${rustGithubRepository}-master`;
const rustProgramsRepository = `https://github.com/metaplex-foundation/${rustGithubRepository}/archive/refs/heads/master.zip`;

function outputAndExitError(error: Error): void {
  console.error(`${error.name}: ${error.message}`);
  process.exit(1);
}

async function build() {
  const programs: string[] = [
    'auction/program',
    'token-metadata/program',
    'token-vault/program',
    'metaplex/program',
  ];
  rmSync(tmpTestDir, { recursive: true, force: true });
  mkdirSync(tmpTestDir);

  async function downloadFile(path: string, destinationPath: string): Promise<void> {
    const done = promisify(stream.finished);
    const writer = createWriteStream(destinationPath);
    try {
      const response = await axios({ method: 'get', url: path, responseType: 'stream' });
      response.data.pipe(writer);
      await done(writer);
    } catch (error) {
      outputAndExitError(error);
    }
  }

  await downloadFile(rustProgramsRepository, `${tmpTestDir}/master.zip`);

  const zip = new StreamZip.async({ file: `${tmpTestDir}/master.zip` });

  try {
    await zip.extract(null, tmpTestDir);
    await zip.close();
  } catch (error) {
    outputAndExitError(error);
  }

  const currentDir = process.cwd();

  programs.forEach((directory) => {
    process.chdir(`${tmpTestDir}/${repositoryDir}/${directory}`);
    execSync(`cargo build-bpf`);
  });

  renameSync(`${tmpTestDir}/${repositoryDir}`, `${tmpTestDir}/rust`);
  process.chdir(currentDir);
}

build();

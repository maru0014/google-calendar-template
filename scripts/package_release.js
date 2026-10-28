import { readFileSync, lstatSync, openSync, closeSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const release_root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist_path = join(release_root, 'dist');
const read_json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const run_tar = (args) => {
  const result = spawnSync(process.platform === 'win32' ? 'tar.exe' : 'tar', args, { timeout: 30000, maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    throw new Error(`ZIP operation failed (requires bsdtar with ZIP support): ${result.error?.message ?? result.stderr.toString()}`);
  }
  return result.stdout;
};

try {
  const package_data = read_json(join(release_root, 'package.json'));
  const lock_data = read_json(join(release_root, 'package-lock.json'));
  const source_manifest = readFileSync(join(release_root, 'manifest.json'));
  const built_manifest_data = readFileSync(join(dist_path, 'manifest.json'));
  const built_manifest = JSON.parse(built_manifest_data.toString('utf8'));
  const version = package_data.version;
  if (!/^\d+\.\d+\.\d+$/.test(version) || version !== built_manifest.version ||
      version !== lock_data.version || version !== lock_data.packages[''].version ||
      !source_manifest.equals(built_manifest_data)) {
    throw new Error('Package, lock and source/built manifest must match; rebuild before packaging.');
  }
  const release_files = ['manifest.json', 'content.js', 'popup.html', 'popup.js', 'icons/icon16.png', 'icons/icon48.png', 'icons/icon128.png'];
  const referenced_files = [built_manifest.action.default_popup, ...Object.values(built_manifest.icons),
    ...Object.values(built_manifest.action.default_icon), ...built_manifest.content_scripts.flatMap((item) => [...(item.js ?? []), ...(item.css ?? [])])];
  if (referenced_files.some((path) => !release_files.includes(path))) throw new Error('Unexpected manifest resource; update the release allowlist.');
  const payload_hashes = new Map(release_files.map((path) => {
    const file = lstatSync(join(dist_path, path));
    if (!file.isFile() || file.size === 0) throw new Error(`Missing, empty or nonregular release file: ${path}`);
    return [path, sha256(readFileSync(join(dist_path, path)))];
  }));
  const archive_path = join(release_root, `google-calendar-template-v${version}.zip`);
  // Reserve a new filename; never remove or overwrite an existing user's archive.
  closeSync(openSync(archive_path, 'wx'));
  run_tar(['--format', 'zip', '-cf', archive_path, '-C', dist_path, ...release_files]);
  const entries = run_tar(['-tf', archive_path]).toString('utf8').trim().split(/\r?\n/);
  if (entries.length !== release_files.length || new Set(entries).size !== entries.length || entries.some((path) => !payload_hashes.has(path))) {
    throw new Error('Unexpected ZIP entries.');
  }
  for (const path of entries) {
    if (sha256(run_tar(['-xOf', archive_path, path])) !== payload_hashes.get(path)) throw new Error(`ZIP payload mismatch: ${path}`);
  }
  console.log(`✅ [Success] Release package: ${archive_path}`);
  console.log(`SHA256: ${sha256(readFileSync(archive_path))}`);
} catch (error) {
  console.error('❌ [Error] Release package creation failed; existing/partial archives are preserved.', error);
  process.exitCode = 1;
}

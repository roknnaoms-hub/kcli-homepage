// Run after registering or replacing public preview URLs. No media files are written.
import { readFile, writeFile, rename } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const catalog = new URL('../iso-19011-classroom/lessons.json', import.meta.url);
const publicBase = 'https://roknnaoms-hub.github.io/kcli-homepage/iso-19011-classroom/';
const lessons = JSON.parse(await readFile(catalog, 'utf8'));
let changed = false;
for (const lesson of lessons) {
  const source = lesson.videoUrl?.trim();
  if (!source && !lesson.verifiedVideoUrl && !lesson.verifiedAt) continue;
  let verified = false;
  if (source) {
    try {
      const url = new URL(source, publicBase);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('A public HTTPS video URL is required.');
      const result = spawnSync('ffmpeg', ['-nostdin', '-v', 'error', '-rw_timeout', '8000000',
        '-protocol_whitelist', 'https,tls,tcp', '-i', url.href, '-map', '0:v:0', '-frames:v', '1', '-f', 'framehash', '-'],
        {encoding:'utf8', timeout:15_000, maxBuffer:64_000});
      if (result.error?.code === 'ENOENT') throw result.error;
      verified = result.status === 0 && /^\s*0,\s*\d+,/m.test(result.stdout || '');
    } catch (error) {
      if (error.code === 'ENOENT') throw new Error('Install FFmpeg before verifying classroom videos.');
    }
    console.log(lesson.id + '교시 ' + (verified ? '재생 확인' : '확인 필요'));
    if (!verified) process.exitCode = 1;
  }
  if (verified) {
    lesson.verifiedVideoUrl = lesson.videoUrl;
    lesson.verifiedAt = new Date().toISOString();
    changed = true;
  } else if (lesson.verifiedAt || lesson.verifiedVideoUrl) {
    delete lesson.verifiedAt;
    delete lesson.verifiedVideoUrl;
    changed = true;
  }
}
if (changed) {
  const temporary = new URL(catalog.href + '.' + process.pid + '.tmp');
  await writeFile(temporary, JSON.stringify(lessons, null, 2) + '\n');
  await rename(temporary, catalog);
}

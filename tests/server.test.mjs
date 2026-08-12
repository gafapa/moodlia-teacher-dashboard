import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('static server serves the dashboard and returns explicit missing-file responses', async (context) => {
  const port = 43000 + (process.pid % 1000);
  const child = spawn(process.execPath, [path.join(root, '.codex-static-server.mjs')], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  context.after(() => child.kill());

  const baseUrl = `http://127.0.0.1:${port}`;
  const response = await waitForResponse(`${baseUrl}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^text\/html/);
  assert.match(await response.text(), /MoodlIA Teacher Dashboard/);

  const missing = await fetch(`${baseUrl}/missing-file.txt`);
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), 'Not found');
});

async function waitForResponse(url) {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      return await fetch(url);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw lastError ?? new Error('Static server did not start.');
}

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MoodleClient,
  appendParams,
  clamp,
  escapeHtml,
  normalizeCalendarEvents,
  normalizeCourse,
  normalizeServiceBaseUrl,
  readSettings,
  safeMoodleUrl,
  saveSettings,
  uniqueBy
} from '../app.js';

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

class BlockedStorage {
  getItem() { throw new DOMException('Blocked', 'SecurityError'); }
  setItem() { throw new DOMException('Blocked', 'SecurityError'); }
  removeItem() { throw new DOMException('Blocked', 'SecurityError'); }
}

test('Moodle client posts canonical REST fields and nested parameters', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  let request;
  globalThis.fetch = async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ userid: 7 }), { status: 200 });
  };

  const client = new MoodleClient('https://example.test/moodle/', ' token ');
  assert.deepEqual(await client.call('core_webservice_get_site_info', { options: [{ name: 'x', value: true }] }), { userid: 7 });
  assert.equal(request.url, 'https://example.test/moodle/webservice/rest/server.php');
  assert.equal(request.init.body.get('wstoken'), 'token');
  assert.equal(request.init.body.get('wsfunction'), 'core_webservice_get_site_info');
  assert.equal(request.init.body.get('options[0][name]'), 'x');
  assert.equal(request.init.body.get('options[0][value]'), 'true');
  assert.equal(request.init.redirect, 'error');
});

test('Moodle client rejects unsafe remote URLs before sending a token', () => {
  assert.throws(() => new MoodleClient('http://example.test', 'token'), /HTTPS/);
  assert.throws(() => new MoodleClient('https://user:secret@example.test', 'token'), /credenciales/);
  assert.equal(normalizeServiceBaseUrl('http://127.0.0.1:8080/moodle/'), 'http://127.0.0.1:8080/moodle');
});

test('rendered Moodle links reject unsafe schemes and embedded credentials', () => {
  assert.equal(safeMoodleUrl('https://example.test/course/view.php?id=4'), 'https://example.test/course/view.php?id=4');
  assert.equal(safeMoodleUrl('https://user:secret@example.test/course/view.php?id=4'), '#');
  assert.equal(safeMoodleUrl('http://example.test/course/view.php?id=4'), '#');
  assert.equal(safeMoodleUrl('javascript:alert(1)'), '#');
});

test('settings keep tokens in session storage and migrate legacy local data', (context) => {
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;
  context.after(() => {
    globalThis.localStorage = originalLocalStorage;
    globalThis.sessionStorage = originalSessionStorage;
  });
  globalThis.localStorage = new MemoryStorage();
  globalThis.sessionStorage = new MemoryStorage();

  saveSettings({ baseUrl: 'https://example.test/moodle', token: 'session-secret' });
  assert.equal(readSettings().token, 'session-secret');
  assert.doesNotMatch(globalThis.localStorage.getItem('moodle-control-settings'), /session-secret/);

  globalThis.localStorage.setItem('moodle-control-settings', JSON.stringify({ baseUrl: 'https://legacy.test', token: 'legacy-secret' }));
  assert.equal(readSettings().token, 'legacy-secret');
  assert.doesNotMatch(globalThis.localStorage.getItem('moodle-control-settings'), /legacy-secret/);
});

test('settings tolerate blocked browser storage', (context) => {
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;
  context.after(() => {
    globalThis.localStorage = originalLocalStorage;
    globalThis.sessionStorage = originalSessionStorage;
  });
  globalThis.localStorage = new BlockedStorage();
  globalThis.sessionStorage = new BlockedStorage();

  assert.doesNotThrow(() => saveSettings({ baseUrl: 'https://example.test', token: 'temporary' }));
  assert.deepEqual(readSettings(), { baseUrl: '', token: '' });
});

test('Moodle client surfaces Moodle API errors', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(JSON.stringify({ exception: 'moodle_exception', message: 'Denied' }), { status: 200 });

  await assert.rejects(() => new MoodleClient('https://example.test', 'token').call('core_webservice_get_site_info'), /Denied/);
});

test('parameter encoder handles arrays and nested objects', () => {
  const body = new URLSearchParams();
  appendParams(body, { courseids: [4, 9], filter: { active: false }, ignored: null });
  assert.equal(body.get('courseids[0]'), '4');
  assert.equal(body.get('courseids[1]'), '9');
  assert.equal(body.get('filter[active]'), 'false');
  assert.equal(body.has('ignored'), false);
});

test('course and calendar normalization produces safe, stable dashboard records', () => {
  const course = normalizeCourse({ id: '4', fullname: '<b>Biology</b>', progress: 130 }, 'https://example.test/moodle/');
  assert.deepEqual(course, {
    id: 4,
    fullname: 'Biology',
    shortname: '',
    progress: 100,
    viewurl: 'https://example.test/moodle/course/view.php?id=4',
    summary: ''
  });

  const events = normalizeCalendarEvents({ events: [{ id: 8, courseid: 4, name: '<i>Quiz</i>', timesort: 1_800_000_000 }] }, [course]);
  assert.equal(events.length, 1);
  assert.equal(events[0].title, 'Quiz');
  assert.equal(events[0].courseName, 'Biology');
  assert.equal(events[0].id, 'calendar-8');
});

test('utility functions deduplicate, clamp, and escape untrusted values', () => {
  assert.deepEqual(uniqueBy([{ id: 1 }, { id: 1 }, { id: 2 }], 'id'), [{ id: 1 }, { id: 2 }]);
  assert.equal(clamp(Number.NaN, 0, 100), 0);
  assert.equal(clamp(120, 0, 100), 100);
  assert.equal(escapeHtml('<script>"x"</script>'), '&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { isAnonymousSeoRoute } from '@/shared/seo-public-routes';

test('published song and catalogue URLs bypass Clerk browser handshake', () => {
  for (const url of ['/en/song/ElysianVeil/202', '/en/song/ToTheMoonAndBack/203', '/my/song/ToTheMoonAndBack/203', '/en/song/WayThwarLal/19', '/en/song-catalogue', '/my/song-catalogue']) {
    assert.equal(isAnonymousSeoRoute(url), true, url);
  }
});

test('admin, API, and unrelated routes continue through Clerk middleware', () => {
  for (const url of ['/en/admin', '/my/admin/songs', '/api/admin/song', '/en/account', '/en/song-request', '/en/song/ElysianVeil/202/edit', '/__clerk/foo']) {
    assert.equal(isAnonymousSeoRoute(url), false, url);
  }
});

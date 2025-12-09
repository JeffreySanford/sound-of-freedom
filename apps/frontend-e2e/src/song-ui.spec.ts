import { test, expect } from '@playwright/test';

test('song generation job via API completes and download works', async ({ request }) => {
  // create a musicgen job via backend API
  const payload = { payload: { text: 'ui-smoke test', duration: 1 } };
  const resp = await request.post('/api/jobs/musicgen', { data: payload });
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  const jobId = body.jobId;
  expect(jobId).toBeTruthy();

  // Poll job status
  let status = '';
  for (let i = 0; i < 30; i++) {
    const st = await request.get(`/api/jobs/${jobId}`);
    expect(st.ok()).toBeTruthy();
    const body = await st.json();
    status = body.status || '';
    if (status === 'done') break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  expect(status).toBe('done');

  // Validate download endpoint returns an audio file
  const dl = await request.get(`/api/jobs/${jobId}/download`);
  expect(dl.ok()).toBeTruthy();
  const ctype = dl.headers()['content-type'] || '';
  expect(ctype.includes('wav') || ctype.includes('octet-stream') || ctype.includes('audio')).toBeTruthy();
});

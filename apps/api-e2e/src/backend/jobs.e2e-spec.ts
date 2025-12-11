import axios from 'axios';
import jwt from 'jsonwebtoken';

describe('Jobs lifecycle (PoC)', () => {
  const testUser = {
    email: 'e2e+jobs@test.local',
    username: 'e2e-jobs',
    password: 'e2e-password',
  };

  let accessToken: string;

  beforeAll(async () => {
    // Register or login test user
    try {
      await axios.post('/api/auth/register', testUser);
    } catch (e) {
      // ignore if already exists
    }
    const loginResp = await axios.post('/api/auth/login', {
      emailOrUsername: testUser.email,
      password: testUser.password,
    });
    accessToken = loginResp.data?.accessToken;
  });

  it('should enqueue async jen1 job and accept orchestrator completion report', async () => {
    const res = await axios.post('/api/songs/generate-song', {
      narrative: 'An e2e test story',
      duration: 45,
      model: 'jen1',
      async: true,
      options: { generatedSong: { title: 'e2e song' } },
    }, { headers: { Authorization: `Bearer ${accessToken}` }});

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.data).toHaveProperty('jobId');
    const { jobId } = res.data;

    // create an orchestrator token and post a completion report
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const orchestratorToken = jwt.sign({ sub: 'orchestrator', role: 'orchestrator' }, secret, { expiresIn: '7d' });

    const requestId = 'e2e-test-request-id';
    const reportResp = await axios.post('/api/jobs/report', {
      jobId,
      type: 'completed',
      payload: { job: { id: jobId, artifactUrl: 'http://example.org/artifact', result: { title: 'e2e song' } } },
    }, { headers: { Authorization: `Bearer ${orchestratorToken}`, 'X-Request-Id': requestId } });

    expect(reportResp.status).toBe(200);

    // Confirm job persisted and status updated
    const jobResp = await axios.get(`/api/jobs/${jobId}`);
    expect(jobResp.status).toBe(200);
    expect(jobResp.data).toBeDefined();
    expect(jobResp.data.status).toBe('completed');
    expect(jobResp.data.artifactUrl).toBe('http://example.org/artifact');
    expect(jobResp.data.requestId).toBe(requestId);
  });
});

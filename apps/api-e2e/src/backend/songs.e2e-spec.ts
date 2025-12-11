import axios from 'axios';
import jwt from 'jsonwebtoken';


describe('POST /api/songs/generate-metadata', () => {
  it('should return generated or fallback metadata', async () => {
    // Ensure a test user and login to obtain token
    const testUser = { email: 'e2e+meta@test.local', username: 'e2e-meta', password: 'e2e-password' };
    try { await axios.post('/api/auth/register', testUser); } catch (err) {}
    const loginResp = await axios.post('/api/auth/login', { emailOrUsername: testUser.email, password: testUser.password });
    const token = loginResp.data?.accessToken;

    const res = await axios.post('/api/songs/generate-metadata', {
      narrative: 'A short story about rain and morning',
      duration: 45,
      model: 'minstral3',
    }, { headers: { Authorization: `Bearer ${token}` }});

    expect(res.status).toBe(200);
    const data = res.data;
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('lyrics');
    expect(data).toHaveProperty('genre');
    expect(data).toHaveProperty('mood');
  });
});

import axios from 'axios';

describe('GPU Smoke test for jen1', () => {
  const shouldRun = process.env.RUN_GPU_SMOKE === '1' || process.env.RUN_GPU_SMOKE === 'true';

  it('should report torch/cuda availability if enabled', async () => {
    if (!shouldRun) {
      console.warn('Skipping GPU Smoke test; set RUN_GPU_SMOKE=1 to enable');
      return;
    }
    const res = await axios.get('http://localhost:4001/debug/torch', { timeout: 5000 });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('has_torch');
    expect(res.data.has_torch).toBe(true);
    expect(res.data.device).toBeDefined();
  }, 20000);
});

const axios = require('axios');

(async () => {
  try {
    const API_BASE = process.env.API_URL || 'http://localhost:3000';
    console.log('Fetching visits list...');
    const visitsResp = await axios.get(`${API_BASE}/api/visits`);
    const visits = visitsResp.data?.data || [];
    console.log(`Found ${visits.length} visits`);

    for (const v of visits) {
      const id = v.id;
      try {
        console.log(`Processing visit ${id}...`);
        await axios.post(`${API_BASE}/api/visits/${id}/process-images`, {});
        console.log(`  OK: Visit ${id} processed`);
      } catch (err) {
        console.error(`  ERROR processing visit ${id}:`, err.response ? err.response.data : err.message);
      }
    }

    console.log('Reprocessing complete');
  } catch (e) {
    console.error('Failed to reprocess visits:', e.response ? e.response.data : e.message);
    process.exit(1);
  }
})();
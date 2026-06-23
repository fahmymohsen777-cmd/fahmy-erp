const https = require('https');

const PAT = 'sbp_6721dc7285ce72dd11b53c0f42cb726adb215ab5';
const PROJECT_REF = 'rzwfgxsyfddcfeaeieqk';

const sql = `
  alter table public.customers disable row level security;
`;

const body = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAT}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => { console.error('Error:', e.message); });
req.write(body);
req.end();

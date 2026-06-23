const https = require('https');

const PAT = 'sbp_6721dc7285ce72dd11b53c0f42cb726adb215ab5';
const PROJECT_REF = 'rzwfgxsyfddcfeaeieqk';

const verifySQL = `
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
`;

const body = JSON.stringify({ query: verifySQL });

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
    const tables = JSON.parse(data);
    console.log('✅ Tables created:');
    tables.forEach(t => console.log(' -', t.table_name));
  });
});

req.on('error', (e) => { console.error('Error:', e.message); });
req.write(body);
req.end();

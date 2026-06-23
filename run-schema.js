const fs = require('fs');
const https = require('https');

const PAT = 'sbp_6721dc7285ce72dd11b53c0f42cb726adb215ab5';
const PROJECT_REF = 'rzwfgxsyfddcfeaeieqk';

const sql = fs.readFileSync('d:/fahm/supabase-schema.sql', 'utf8');

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
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✅ Schema deployed successfully!');
    } else {
      console.log('\n❌ Error deploying schema');
    }
  });
});

req.on('error', (e) => { console.error('Error:', e.message); });
req.write(body);
req.end();

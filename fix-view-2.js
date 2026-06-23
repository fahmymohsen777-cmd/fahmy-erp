const https = require('https');

const PAT = 'sbp_6721dc7285ce72dd11b53c0f42cb726adb215ab5';
const PROJECT_REF = 'rzwfgxsyfddcfeaeieqk';

const sql = `
DROP VIEW IF EXISTS public.customer_balances;

create or replace view public.customer_balances as
select
  c.*,
  coalesce((
    select sum(oi.total_price)
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.customer_id = c.id
  ), 0) as total_purchases,
  coalesce((
    select sum(p.amount)
    from public.payments p
    where p.customer_id = c.id
  ), 0) as total_payments,
  coalesce((
    select sum(oi.total_price)
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.customer_id = c.id
  ), 0) - coalesce((
    select sum(p.amount)
    from public.payments p
    where p.customer_id = c.id
  ), 0) as outstanding_balance
from public.customers c;
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

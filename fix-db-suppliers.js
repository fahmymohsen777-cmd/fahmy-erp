const https = require('https');

const PAT = 'sbp_6721dc7285ce72dd11b53c0f42cb726adb215ab5';
const PROJECT_REF = 'rzwfgxsyfddcfeaeieqk';

const sql = `
-- 1. Add cost columns to inventory_movements
ALTER TABLE public.inventory_movements 
ADD COLUMN IF NOT EXISTS unit_price numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_price numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED;

-- 2. Drop view if exists
DROP VIEW IF EXISTS public.supplier_balances;

-- 3. Create supplier balances view
CREATE OR REPLACE VIEW public.supplier_balances AS
SELECT
  s.id,
  s.name,
  s.charcoal_type,
  s.price_per_kg,
  s.price_per_bag,
  s.bag_weight_kg,
  s.delivery_cost,
  s.phone,
  s.notes,
  s.created_at,
  COALESCE((
    SELECT SUM(im.total_price)
    FROM public.inventory_movements im
    WHERE im.supplier_id = s.id AND im.movement_type = 'in'
  ), 0) AS total_purchases,
  COALESCE((
    SELECT SUM(sp.amount)
    FROM public.supplier_payments sp
    WHERE sp.supplier_id = s.id
  ), 0) AS total_payments,
  COALESCE((
    SELECT SUM(im.total_price)
    FROM public.inventory_movements im
    WHERE im.supplier_id = s.id AND im.movement_type = 'in'
  ), 0) - COALESCE((
    SELECT SUM(sp.amount)
    FROM public.supplier_payments sp
    WHERE sp.supplier_id = s.id
  ), 0) AS outstanding_balance
FROM public.suppliers s;
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

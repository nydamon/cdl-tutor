const { createServer } = require('http');
const { parse } = require('url');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

const PORT = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json'
};

// Environment variables (set in Vercel dashboard)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const routes = {
  '/health': { status: 200, json: { status: 'ok', version: '1.0.0' }},
  '/api/states': { 
    status: 200, 
    json: [
      { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
      { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
      { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
      { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
      { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
      { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
      { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
      { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
      { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
      { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
      { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
      { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
      { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
      { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
      { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
      { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
      { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
      { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
      { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
      { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
      { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
      { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
      { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
      { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
      { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
    ]
  },
  // Get state-specific data
  '/api/state/:code': {
    status: 200,
    async: true,
    handler: async (params) => {
      const code = params.code?.toUpperCase() || 'NJ';
      try {
        const data = JSON.parse(readFileSync(join(__dirname, `data/states/${code}.json`), 'utf8');
        return { status: 200, json: data };
      } catch (e) {
        return { status: 200, json: { 
          state: code, 
          state_name: code,
          topics: [],
          message: 'Coming soon'
        }};
      }
    }
  }
};
    status: 200,
    json: {
      state: 'NJ',
      state_name: 'New Jersey',
      topics: [
        { name: 'General Knowledge', must_memorize: ['4-second following distance', '5-6 seconds for trucks'] },
        { name: 'Air Brakes', must_memorize: ['60 psi warning', '20-45 psi spring brakes'] },
        { name: 'Hazardous Materials', must_memorize: ['0.04% BAC'] }
      ]
    }
  },
  
  // OpenAI Realtime token endpoint
  '/api/realtime-token': {
    status: 200,
    async: true,
    handler: async () => {
      if (!OPENAI_API_KEY) {
        return { status: 503, json: { error: 'OpenAI not configured' }};
      }
      
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview',
          modalities: ['audio', 'text'],
          instructions: `You are "Red", a veteran truck driver helping students pass the CDL written test. Be conversational, explain WHY answers are correct, not just what they are. Focus on memorization points: 4-second following distance, 60psi air brakes, 0.04% BAC.`
        })
      });
      
      const data = await response.json();
      return { status: 200, json: data };
    }
  },
  
  // Stripe checkout
  '/api/billing/create-checkout': {
    status: 200,
    async: true,
    handler: async () => {
      if (!STRIPE_SECRET_KEY) {
        return { status: 503, json: { error: 'Stripe not configured' }};
      }
      
      // Create checkout session via Stripe API
      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'mode': 'subscription',
          'payment_method_types[]': 'card',
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][product_data][name]': 'CDL Tutor Premium',
          'line_items[0][price_data][product_data][description]': 'Unlimited voice sessions, all 50 states, practice tests',
          'line_items[0][price_data][unit_amount]': '999',
          'line_items[0][price_data][recurring][interval]': 'month',
          'line_items[0][quantity]': '1',
          'success_url': 'https://cdl-tutor.vercel.app?success=true',
          'cancel_url': 'https://cdl-tutor.vercel.app?canceled=true'
        })
      });
      
      const data = await response.json();
      return { status: 200, json: { url: data.url || data.error }};
    }
  }

const server = createServer(async (req, res) => {
  const url = parse(req.url, true);
  const pathname = url.pathname;
  
  // Check exact routes first
  let route = routes[pathname];
  
  // Check parameterized routes
  if (!route) {
    const stateMatch = pathname.match(/^\/api\/state\/(\w+)$/);
    if (stateMatch && routes['/api/state/:code']) {
      route = routes['/api/state/:code'];
      route._params = { code: stateMatch[1] };
    }
  }
  
  if (route) {
    
    // Handle async handlers
    if (route.async && route.handler) {
      try {
        const result = await route.handler(route._params || {});
        res.writeHead(result.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.json));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
    
    res.writeHead(route.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(route.json));
    return;
  }
  
  // Serve static files
  let filePath = join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  
  if (!existsSync(filePath)) {
    filePath = join(__dirname, 'public', 'index.html');
  }
  
  if (existsSync(filePath)) {
    const ext = filePath.match(/\.[^.]+$/)?.[0] || '.html';
    const contentType = mimeTypes[ext] || 'text/plain';
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`CDL Tutor running on port ${PORT}`);
});

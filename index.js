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

// Simple router
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
  '/api/state/NJ': {
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
  }
};

const server = createServer((req, res) => {
  const url = parse(req.url, true);
  const pathname = url.pathname;
  
  // API routes
  if (routes[pathname]) {
    const route = routes[pathname];
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

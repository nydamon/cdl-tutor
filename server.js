// Simple Express server for CDL Tutor
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0',
    openaiConfigured: !!(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')),
    stripeConfigured: !!(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')),
    clerkConfigured: !!(process.env.CLERK_SECRET_KEY && !process.env.CLERK_SECRET_KEY.includes('placeholder'))
  });
});

// Auth routes (Clerk integration placeholder)
app.post('/api/auth/clerk-webhook', express.json(), (req, res) => {
  // Handle Clerk webhooks for user creation/deletion
  console.log('Clerk webhook:', req.body);
  res.json({ received: true });
});

// Billing routes (Stripe integration placeholder)  
app.post('/api/billing/create-checkout', express.json(), (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }
  // Stripe checkout session creation would go here
  res.json({ url: '/upgrade' });
});

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // Handle Stripe webhooks
  console.log('Stripe webhook received');
  res.json({ received: true });
});

// User profile endpoints
app.get('/api/user/profile', (req, res) => {
  // Would fetch from Clerk/user DB
  res.json({ 
    id: 'demo-user',
    email: 'demo@example.com',
    plan: 'free',
    state: 'NJ'
  });
});

app.put('/api/user/profile', express.json(), (req, res) => {
  // Update user profile (state selection, etc.)
  res.json({ success: true, ...req.body });
});

// State selection
const STATES = [
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
];

app.get('/api/states', (req, res) => {
  res.json(STATES);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CDL Tutor server running on port ${PORT}`);
});

module.exports = app;

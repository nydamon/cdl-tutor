// CDL Tutor Frontend App
const API_BASE = '';

class CDLTutor {
    constructor() {
        this.state = null;
        this.user = null;
        this.init();
    }

    async init() {
        try {
            // Check health
            const health = await this.fetch('/health');
            console.log('Health:', health);
            
            // Load states
            await this.loadStates();
            
            // Check for saved state
            const savedState = localStorage.getItem('cdl_state');
            if (savedState) {
                this.state = savedState;
                this.showDashboard();
            }
            
            this.setupEventListeners();
        } catch (e) {
            console.error('Init error:', e);
            this.loadFallbackStates();
        }
    }

    async fetch(endpoint, options = {}) {
        try {
            const response = await fetch(API_BASE + endpoint, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            if (!response.ok) throw new Error('Network error');
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    }

    async loadStates() {
        const states = await this.fetch('/api/states');
        
        const dropdown = document.getElementById('state-dropdown');
        
        if (states && states.states) {
            dropdown.innerHTML = '<option value="">Select your state...</option>' + 
                states.states.map(s => `<option value="${s.code}">${s.name}</option>`).join('');
        } else {
            this.loadFallbackStates();
        }
        
        dropdown.addEventListener('change', (e) => {
            this.state = e.target.value;
            document.getElementById('continue-btn').disabled = !this.state;
            document.getElementById('continue-btn').style.opacity = this.state ? '1' : '0.5';
        });
    }

    loadFallbackStates() {
        const states = [
            {code: 'AL', name: 'Alabama'}, {code: 'AK', name: 'Alaska'}, {code: 'AZ', name: 'Arizona'},
            {code: 'AR', name: 'Arkansas'}, {code: 'CA', name: 'California'}, {code: 'CO', name: 'Colorado'},
            {code: 'CT', name: 'Connecticut'}, {code: 'DE', name: 'Delaware'}, {code: 'FL', name: 'Florida'},
            {code: 'GA', name: 'Georgia'}, {code: 'HI', name: 'Hawaii'}, {code: 'ID', name: 'Idaho'},
            {code: 'IL', name: 'Illinois'}, {code: 'IN', name: 'Indiana'}, {code: 'IA', name: 'Iowa'},
            {code: 'KS', name: 'Kansas'}, {code: 'KY', name: 'Kentucky'}, {code: 'LA', name: 'Louisiana'},
            {code: 'ME', name: 'Maine'}, {code: 'MD', name: 'Maryland'}, {code: 'MA', name: 'Massachusetts'},
            {code: 'MI', name: 'Michigan'}, {code: 'MN', name: 'Minnesota'}, {code: 'MS', name: 'Mississippi'},
            {code: 'MO', name: 'Missouri'}, {code: 'MT', name: 'Montana'}, {code: 'NE', name: 'Nebraska'},
            {code: 'NV', name: 'Nevada'}, {code: 'NH', name: 'New Hampshire'}, {code: 'NJ', name: 'New Jersey'},
            {code: 'NM', name: 'New Mexico'}, {code: 'NY', name: 'New York'}, {code: 'NC', name: 'North Carolina'},
            {code: 'ND', name: 'North Dakota'}, {code: 'OH', name: 'Ohio'}, {code: 'OK', name: 'Oklahoma'},
            {code: 'OR', name: 'Oregon'}, {code: 'PA', name: 'Pennsylvania'}, {code: 'RI', name: 'Rhode Island'},
            {code: 'SC', name: 'South Carolina'}, {code: 'SD', name: 'South Dakota'}, {code: 'TN', name: 'Tennessee'},
            {code: 'TX', name: 'Texas'}, {code: 'UT', name: 'Utah'}, {code: 'VT', name: 'Vermont'},
            {code: 'VA', name: 'Virginia'}, {code: 'WA', name: 'Washington'}, {code: 'WV', name: 'West Virginia'},
            {code: 'WI', name: 'Wisconsin'}, {code: 'WY', name: 'Wyoming'}, {code: 'DC', name: 'Washington D.C.'}
        ];
        
        const dropdown = document.getElementById('state-dropdown');
        dropdown.innerHTML = '<option value="">Select your state...</option>' + 
            states.map(s => `<option value="${s.code}">${s.name}</option>`).join('');
    }

    setupEventListeners() {
        // Continue button
        document.getElementById('continue-btn')?.addEventListener('click', () => {
            if (this.state) {
                localStorage.setItem('cdl_state', this.state);
                this.showDashboard();
            }
        });

        // Start voice session
        document.getElementById('start-btn')?.addEventListener('click', () => {
            window.location.href = '/call.html';
        });

        // Upgrade button
        document.getElementById('upgrade-btn')?.addEventListener('click', () => {
            this.showScreen('upgrade');
        });

        // Back button
        document.getElementById('back-btn')?.addEventListener('click', () => {
            this.showScreen('dashboard');
        });

        // Subscribe buttons
        document.querySelectorAll('.subscribe-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const plan = e.target.dataset.plan;
                await this.createCheckout(plan);
            });
        });

        // Practice & Progress buttons
        document.getElementById('practice-btn')?.addEventListener('click', () => {
            alert('Practice tests coming soon!');
        });
        
        document.getElementById('progress-btn')?.addEventListener('click', () => {
            alert('Progress tracking coming soon!');
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(screenId)?.classList.remove('hidden');
    }

    showDashboard() {
        this.showScreen('dashboard');
        const progress = localStorage.getItem('cdl_progress') || 0;
        this.updateProgress(progress);
    }

    updateProgress(pct) {
        document.getElementById('progress-fill').style.width = pct + '%';
        document.getElementById('progress-pct').textContent = pct;
    }

    async createCheckout(plan) {
        const result = await this.fetch('/api/billing/create-checkout', {
            method: 'POST',
            body: JSON.stringify({ plan })
        });
        
        if (result?.url) {
            window.location.href = result.url;
        } else if (result?.error) {
            alert('Checkout: ' + result.error);
        } else {
            alert('Billing coming soon!');
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CDLTutor();
});

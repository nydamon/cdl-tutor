// CDL Tutor Frontend App
const API_BASE = '';

class CDL Tutor {
    constructor() {
        this.state = null;
        this.user = null;
        this.init();
    }

    async init() {
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
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    }

    async loadStates() {
        const states = await this.fetch('/api/states');
        if (!states) return;
        
        const dropdown = document.getElementById('state-dropdown');
        dropdown.innerHTML = states.map(s => 
            `<option value="${s.code}">${s.name}</option>`
        ).join('');
        
        dropdown.addEventListener('change', (e) => {
            this.state = e.target.value;
            document.getElementById('continue-btn').disabled = !this.state;
        });
    }

    setupEventListeners() {
        // Continue button
        document.getElementById('continue-btn')?.addEventListener('click', () => {
            localStorage.setItem('cdl_state', this.state);
            this.showDashboard();
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

        // Practice & Progress buttons (placeholder)
        document.getElementById('practice-btn')?.addEventListener('click', () => {
            alert('Practice tests coming soon! Subscribe to unlock.');
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
        // Update progress (would come from API)
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
        
        if (result.url) {
            // Redirect to checkout (placeholder - would be Stripe)
            alert('Stripe checkout integration coming soon! Plan: ' + plan);
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CDL Tutor();
});

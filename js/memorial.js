// =============================================================================
// Memorial Page Logic
// =============================================================================

class MemorialPage {
  constructor() {
    this.api = new SheetsAPI(CONFIG);
    this.currentView = 'home'; // 'home', 'tributes', 'form'
    this.messages = [];
    this.honeypot = null;
    
    this.init();
  }

  // ===========================================================================
  // Initialize
  // ===========================================================================
  
  async init() {
    this.updateMemorialName();
    this.setupEventListeners();
    this.loadRecaptcha();
    await this.loadMessages();
  }

  updateMemorialName() {
    const nameEl = document.getElementById('memorialName');
    if (nameEl && CONFIG.MEMORIAL_NAME) {
      nameEl.textContent = CONFIG.MEMORIAL_NAME;
    }

    const photoEl = document.getElementById('memorialPhoto');
    if (photoEl && CONFIG.MEMORIAL_PHOTO_URL) {
      photoEl.src = CONFIG.MEMORIAL_PHOTO_URL;
      photoEl.alt = CONFIG.MEMORIAL_NAME;
    }
    
    // Update page title
    document.title = `In Memory of ${CONFIG.MEMORIAL_NAME}`;
  }

  setupEventListeners() {
    // View tributes button
    document.getElementById('viewTributesBtn')?.addEventListener('click', () => {
      this.showView('tributes');
    });

    // Leave tribute buttons (home and tributes views)
    document.getElementById('leaveTributeBtn')?.addEventListener('click', () => {
      this.showView('form');
    });
    document.getElementById('leaveTributeBtn2')?.addEventListener('click', () => {
      this.showView('form');
    });

    // Cancel button
    document.getElementById('cancelBtn')?.addEventListener('click', () => {
      this.showView('tributes');
      this.clearForm();
    });

    // Submit form
    document.getElementById('tributeForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Back to home (if viewing tributes)
    document.getElementById('backBtn')?.addEventListener('click', () => {
      this.showView('home');
    });
  }

  loadRecaptcha() {
    if (!CONFIG.RECAPTCHA_SITE_KEY || CONFIG.RECAPTCHA_SITE_KEY.includes('YOUR_')) {
      console.warn('reCAPTCHA not configured');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${CONFIG.RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  // ===========================================================================
  // Load and display messages
  // ===========================================================================
  
  async loadMessages() {
    const container = document.getElementById('tributesList');
    if (!container) return;

    try {
      // Show loading state
      container.innerHTML = '<div class="loading">Loading tributes...</div>';

      this.messages = await this.api.getApprovedMessages();
      this.renderMessages();
    } catch (error) {
      container.innerHTML = `<div class="error">Could not load tributes. Please try again later.</div>`;
      console.error('Error loading messages:', error);
    }
  }

  renderMessages() {
    const container = document.getElementById('tributesList');
    if (!container) return;

    if (this.messages.length === 0) {
      container.innerHTML = `<div class="no-tributes">${CONFIG.TEXT.noTributesYet}</div>`;
      return;
    }

    container.innerHTML = this.messages.map(msg => this.createMessageHTML(msg)).join('');
  }

  createMessageHTML(msg) {
    const date = CONFIG.FEATURES.showTimestamps 
      ? `<div class="tribute-date">${this.formatDate(msg.timestamp)}</div>`
      : '';
    
    const name = msg.name && msg.name !== 'Anonymous' 
      ? `<div class="tribute-name">${this.escapeHTML(msg.name)}</div>`
      : '';

    return `
      <div class="tribute-card">
        ${name}
        <div class="tribute-message">${this.escapeHTML(msg.message)}</div>
        ${date}
      </div>
    `;
  }

  // ===========================================================================
  // Form submission
  // ===========================================================================
  
  async handleSubmit() {
    const nameInput = document.getElementById('nameInput');
    const messageInput = document.getElementById('messageInput');
    const submitBtn = document.getElementById('submitBtn');
    
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    // Validation
    if (!message) {
      this.showError('Please enter a message.');
      return;
    }

    if (!CONFIG.FEATURES.allowAnonymous && !name) {
      this.showError('Please enter your name.');
      return;
    }

    // Check honeypot
    if (this.honeypot && !this.honeypot.check()) {
      console.warn('Honeypot triggered');
      this.showError('Submission failed. Please try again.');
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      await this.api.submitMessage(name, message);
      
      this.showSuccess(CONFIG.TEXT.submissionSuccess);
      this.clearForm();
      
      // Return to tributes view after 2 seconds
      setTimeout(() => {
        this.showView('tributes');
      }, 2000);
      
    } catch (error) {
      this.showError(error.message || CONFIG.TEXT.submissionError);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = CONFIG.TEXT.submitButton;
    }
  }

  // ===========================================================================
  // View management
  // ===========================================================================
  
  showView(view) {
    this.currentView = view;

    // Hide all views
    document.getElementById('homeView')?.classList.remove('active');
    document.getElementById('tributesView')?.classList.remove('active');
    document.getElementById('formView')?.classList.remove('active');

    // Show requested view
    if (view === 'home') {
      document.getElementById('homeView')?.classList.add('active');
    } else if (view === 'tributes') {
      document.getElementById('tributesView')?.classList.add('active');
      this.loadMessages(); // Refresh messages
    } else if (view === 'form') {
      document.getElementById('formView')?.classList.add('active');
      this.setupFormHoneypot();
    }
  }

  setupFormHoneypot() {
    if (this.honeypot) return; // Already set up
    
    const form = document.getElementById('tributeForm');
    if (form) {
      this.honeypot = setupHoneypot(form);
    }
  }

  clearForm() {
    document.getElementById('nameInput').value = '';
    document.getElementById('messageInput').value = '';
    document.getElementById('formMessage')?.classList.remove('success', 'error');
    document.getElementById('formMessage').textContent = '';
  }

  // ===========================================================================
  // UI feedback
  // ===========================================================================
  
  showError(message) {
    const msgEl = document.getElementById('formMessage');
    if (!msgEl) return;
    
    msgEl.textContent = message;
    msgEl.className = 'form-message error';
    msgEl.style.display = 'block';
  }

  showSuccess(message) {
    const msgEl = document.getElementById('formMessage');
    if (!msgEl) return;
    
    msgEl.textContent = message;
    msgEl.className = 'form-message success';
    msgEl.style.display = 'block';
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================
  
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }

  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ===========================================================================
// Initialize on page load
// ===========================================================================

document.addEventListener('DOMContentLoaded', () => {
  new MemorialPage();
});

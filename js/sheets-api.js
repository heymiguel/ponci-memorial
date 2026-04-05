// =============================================================================
// Google Sheets API Wrapper
// =============================================================================
// Handles all communication with the Google Apps Script backend

class SheetsAPI {
  constructor(config) {
    this.baseUrl = config.APPS_SCRIPT_URL;
    this.recaptchaSiteKey = config.RECAPTCHA_SITE_KEY;
  }

  // ===========================================================================
  // Get approved messages (public)
  // ===========================================================================
  
  async getApprovedMessages() {
    try {
      const url = `${this.baseUrl}?action=getApproved`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching approved messages:', error);
      throw new Error('Could not load messages. Please try again later.');
    }
  }

  // ===========================================================================
  // Submit new message
  // ===========================================================================
  
  async submitMessage(name, message) {
    try {
      // Get reCAPTCHA token if enabled
      let recaptchaToken = null;
      if (this.recaptchaSiteKey && window.grecaptcha) {
        recaptchaToken = await this.getRecaptchaToken();
      }
      
      // Check client-side rate limit
      if (!this.checkClientRateLimit()) {
        throw new Error('Please wait before submitting another message.');
      }
      
      const response = await fetch(`${this.baseUrl}?action=submit`, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
          recaptchaToken: recaptchaToken
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      
      // Update rate limit tracking
      this.recordSubmission();
      
      return await response.json();
    } catch (error) {
      console.error('Error submitting message:', error);
      throw error;
    }
  }

  // ===========================================================================
  // reCAPTCHA
  // ===========================================================================
  
  async getRecaptchaToken() {
    return new Promise((resolve, reject) => {
      if (!window.grecaptcha) {
        reject(new Error('reCAPTCHA not loaded'));
        return;
      }
      
      grecaptcha.ready(() => {
        grecaptcha.execute(this.recaptchaSiteKey, { action: 'submit' })
          .then(token => resolve(token))
          .catch(error => reject(error));
      });
    });
  }

  // ===========================================================================
  // Client-side rate limiting (additional layer)
  // ===========================================================================
  
  checkClientRateLimit() {
    if (!CONFIG.RATE_LIMIT.enabled) return true;
    
    const submissions = this.getSubmissionHistory();
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Filter to submissions in last hour
    const recentSubmissions = submissions.filter(timestamp => timestamp > oneHourAgo);
    
    return recentSubmissions.length < CONFIG.RATE_LIMIT.maxSubmissionsPerHour;
  }
  
  recordSubmission() {
    const submissions = this.getSubmissionHistory();
    submissions.push(Date.now());
    
    // Keep only last 24 hours
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const filtered = submissions.filter(timestamp => timestamp > dayAgo);
    
    localStorage.setItem('memorial_submissions', JSON.stringify(filtered));
  }
  
  getSubmissionHistory() {
    try {
      const stored = localStorage.getItem('memorial_submissions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

// ===========================================================================
// Simple honeypot check (bot detection)
// ===========================================================================

function setupHoneypot(formElement) {
  // Create hidden field that humans won't fill but bots might
  const honeypot = document.createElement('input');
  honeypot.type = 'text';
  honeypot.name = 'website';
  honeypot.style.position = 'absolute';
  honeypot.style.left = '-9999px';
  honeypot.setAttribute('tabindex', '-1');
  honeypot.setAttribute('autocomplete', 'off');
  
  formElement.appendChild(honeypot);
  
  return {
    check: () => honeypot.value === '' // If filled, likely a bot
  };
}

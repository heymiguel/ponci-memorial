// =============================================================================
// CONFIGURATION - Edit these values
// =============================================================================

const CONFIG = {
  // Google Sheets Integration
  SPREADSHEET_ID: '1xrM-Gnx-Ti_XYy0UXEvMRul2FX5Z310NQUa1Wk3jy88', // From Google Sheets URL
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxD7rEfkjz3SYvIC7RmsZt4olE7WgcbLGVaUiBKrZVw9f8PSkOjKCp0Z3l5hj7Ix_wOYA/exec', // From Apps Script deployment
  
  // reCAPTCHA (optional but recommended)
  RECAPTCHA_SITE_KEY: '6Lc2XKcsAAAAACu_C53oV2qlnSglDLiJV6zVnJAj', // Leave empty to disable
  
  // Memorial Details
  MEMORIAL_NAME: 'Ponci', // Name to display
  MEMORIAL_PHOTO_URL:'https://i.postimg.cc/P55W758C/506488118-10161243822376024-3337848425727522507-n.jpg', // blank to hide
  
  // UI Text (customize as needed)
  TEXT: {
    pageTitle: 'In Memory',
    viewTributesButton: 'View Messages',
    leaveTributeButton: 'Leave a Message',
    submitButton: 'Submit',
    cancelButton: 'Cancel',
    namePlaceholder: 'Your name (optional)',
    messagePlaceholder: 'Share a memory, a thought, a moment...',
    noTributesYet: 'No messages yet. Be the first to share.',
    submissionSuccess: 'Thank you. Your message will appear pending admin approval.',
    submissionError: 'Something went wrong. Please try again.',
    adminTitle: 'Pending Messages',
    adminApprove: 'Approve',
    adminReject: 'Reject',
  },
  
  // Rate Limiting (client-side, additional to server-side)
  RATE_LIMIT: {
    enabled: true,
    maxSubmissionsPerHour: 2, // Per device
  },
  
  // Feature Flags
  FEATURES: {
    allowAnonymous: true, // Allow submissions without a name
    requireRecaptcha: true, // Require reCAPTCHA for submissions
    showTimestamps: true, // Show dates on tributes
  },
};

// =============================================================================
// Don't edit below unless you know what you're doing
// =============================================================================

// Validate configuration
(function validateConfig() {
  const required = ['SPREADSHEET_ID', 'APPS_SCRIPT_URL'];
  const missing = required.filter(key => !CONFIG[key] || CONFIG[key].includes('YOUR_'));
  
  if (missing.length > 0) {
    console.warn('⚠️ Configuration incomplete:', missing);
  }
})();

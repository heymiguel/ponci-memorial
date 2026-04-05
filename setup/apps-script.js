// =============================================================================
// Google Apps Script - Memorial Site Backend
// =============================================================================
// Deploy this as a Web App with "Execute as: Me" and "Access: Anyone"

const RECAPTCHA_SECRET_KEY = 'YOUR_RECAPTCHA_SECRET_KEY_HERE'; // From reCAPTCHA admin
const SHEET_NAME = 'messages'; // Name of your sheet tab

// =============================================================================
// Main Handler
// =============================================================================

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    if (action === 'getApproved') {
      return getApprovedMessages();
    } else {
      return createResponse(400, 'Invalid action');
    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error);
    return createResponse(500, 'Server error: ' + error.message);
  }
}

function doPost(e) {
  const action = e.parameter.action;
  
  try {
    if (action === 'submit') {
      return submitMessage(e);
    } else {
      return createResponse(400, 'Invalid action');
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error);
    return createResponse(500, 'Server error: ' + error.message);
  }
}

// =============================================================================
// Get Approved Messages (Public)
// =============================================================================

function getApprovedMessages() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  // Skip header row, filter to approved only
  const messages = data.slice(1)
    .filter(row => row[3] === 'approved') // Column D (status)
    .map(row => ({
      timestamp: row[0],
      name: row[1] || 'Anonymous',
      message: row[2],
      approvedDate: row[4]
    }))
    .reverse(); // Most recent first
  
  return createResponse(200, { messages });
}

// =============================================================================
// Submit New Message
// =============================================================================

function submitMessage(e) {
  const params = JSON.parse(e.postData.contents);
  const { name, message, recaptchaToken } = params;
  
  // Get user's IP (hashed for privacy)
  const ipHash = hashIP(e.parameter.userip || 'unknown');
  
  // Validate input
  if (!message || message.trim().length === 0) {
    return createResponse(400, 'Message cannot be empty');
  }
  
  if (message.length > 1000) {
    return createResponse(400, 'Message too long (max 1000 characters)');
  }
  
  // Verify reCAPTCHA if token provided
  if (recaptchaToken && RECAPTCHA_SECRET_KEY !== 'YOUR_RECAPTCHA_SECRET_KEY_HERE') {
    const isHuman = verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
      return createResponse(403, 'reCAPTCHA verification failed');
    }
  }
  
  // Check rate limit
  if (!checkRateLimit(ipHash)) {
    return createResponse(429, 'Too many submissions. Please try again later.');
  }
  
  // Add to messages sheet with status = pending
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.appendRow([
    new Date(),      // timestamp
    name || '',      // name
    message.trim(),  // message
    'pending',       // status
    ''               // approved_date (empty until approved)
  ]);
  
  return createResponse(200, { success: true });
}

// =============================================================================
// Helper Functions
// =============================================================================

function verifyRecaptcha(token) {
  if (!RECAPTCHA_SECRET_KEY || RECAPTCHA_SECRET_KEY === 'YOUR_RECAPTCHA_SECRET_KEY_HERE') {
    return true; // Skip if not configured
  }
  
  const url = 'https://www.google.com/recaptcha/api/siteverify';
  const payload = {
    secret: RECAPTCHA_SECRET_KEY,
    response: token
  };
  
  const options = {
    method: 'post',
    payload: payload
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    // For reCAPTCHA v3, check score (0.0 - 1.0, higher is more likely human)
    return result.success && (result.score >= 0.5);
  } catch (error) {
    Logger.log('reCAPTCHA verification error: ' + error);
    return false;
  }
}

function checkRateLimit(ipHash) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Count submissions from this IP in the last hour
  // Note: We don't store IP hash in the new schema, so this is simplified
  // In production, you might want to add an ip_hash column if rate limiting is critical
  const recentSubmissions = data.filter(row => {
    const timestamp = new Date(row[0]);
    return timestamp > oneHourAgo;
  }).length;
  
  return recentSubmissions < 10; // Max 10 total submissions per hour (simplified)
}

function hashIP(ip) {
  // Simple hash function (not cryptographically secure, but fine for rate limiting)
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, ip)
    .map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2))
    .join('');
}

function createResponse(status, data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

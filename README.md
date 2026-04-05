# Memorial Site - Setup Guide

A static memorial page hosted on GitHub Pages with Google Sheets as the backend. Visitors can view messages and leave their own, which go through admin moderation before appearing publicly.

## Quick Start

1. **Set up Google Sheets** (create spreadsheet with single `messages` tab and status dropdown)
2. **Deploy Apps Script** (paste code from `/setup/apps-script.js`, deploy as web app)
3. **Edit `config.js`** (add your spreadsheet ID, Apps Script URL, reCAPTCHA key)
4. **Push to GitHub Pages** (see detailed instructions below)
5. **Generate QR code** pointing to your live site

Total time: ~30 minutes

---

## Features
- 📱 Mobile-first responsive design
- 🔒 Admin moderation for all messages
- 🤖 Bot protection (reCAPTCHA v3, honeypot, rate limiting)
- 📊 Google Sheets as database (no server needed)
- 🚀 Free hosting on GitHub Pages
- 🌙 Dark mode (always on)

## Setup Instructions

### 1. Google Sheets Setup

1. Create a new Google Sheet
2. Create a single tab called **`messages`** with these columns:
   - `timestamp | name | message | status | approved_date`
3. In the **status** column (column D), set up data validation:
   - Select the entire column D (click the column header)
   - **Data → Data validation**
   - Criteria: **List of items**
   - Items: `pending,approved`
   - Click **Save**
4. Note your spreadsheet ID (from URL: `docs.google.com/spreadsheets/d/1xrM-Gnx-Ti_XYy0UXEvMRul2FX5Z310NQUa1Wk3jy88/edit`)

### 2. Google Apps Script Setup

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete the default code
3. Copy the contents of `setup/apps-script.js` and paste it in
4. Click **Deploy > New Deployment**
5. Choose type: **Web app**
6. Set "Execute as": **Me**
7. Set "Who has access": **Anyone**
8. Click **Deploy** and authorize
9. Copy the **Web App URL** (you'll need this for `config.js`)
- https://script.google.com/macros/s/AKfycbxD7rEfkjz3SYvIC7RmsZt4olE7WgcbLGVaUiBKrZVw9f8PSkOjKCp0Z3l5hj7Ix_wOYA/exec

### 3. Google reCAPTCHA Setup (Optional but Recommended)

1. Go to https://www.google.com/recaptcha/admin/create
2. Choose **reCAPTCHA v3**
3. Add your domain (and `localhost` for testing)
4. Copy your **Site Key** and **Secret Key**
5. Add the Secret Key to your Apps Script (see `apps-script.js` line 3)
6. Add the Site Key to `config.js`

### 4. Repository Configuration

1. Edit `config.js` with your details:
   - `SPREADSHEET_ID`: Your Google Sheets ID
   - `APPS_SCRIPT_URL`: Your deployed Apps Script web app URL
   - `RECAPTCHA_SITE_KEY`: Your reCAPTCHA site key (optional)
   - `MEMORIAL_NAME`: The person's name

### 5. GitHub Pages Deployment

**Option A: Using GitHub Desktop (easiest)**

1. Download and install [GitHub Desktop](https://desktop.github.com/)
2. Create a new repository on [github.com](https://github.com/new)
   - Name it something like `ponci-memorial`
   - Make it **Public** (required for free GitHub Pages)
   - Don't initialize with README
3. In GitHub Desktop:
   - **File → Add Local Repository**
   - Browse to your `memorial-site` folder
   - If it says "not a git repository", click **Create a repository**
4. Make your first commit:
   - All files should be checked in the left sidebar
   - Write commit message: "Initial commit"
   - Click **Commit to main**
5. Click **Publish repository**
   - Uncheck "Keep this code private"
   - Click **Publish Repository**
6. On GitHub.com, go to your repository
7. Click **Settings → Pages** (in left sidebar)
8. Under "Source":
   - Branch: **main**
   - Folder: **/ (root)**
   - Click **Save**
9. Wait 1-2 minutes, then visit `https://[your-username].github.io/[repo-name]/`

**Option B: Using Command Line**

```bash
# Navigate to your memorial-site folder
cd path/to/memorial-site

# Initialize git repository
git init

# Add all files
git add .

# Make first commit
git commit -m "Initial commit"

# Create repository on github.com first, then:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Push to GitHub
git branch -M main
git push -u origin main

# Then enable GitHub Pages in Settings → Pages
```

**After deployment:**
- Your site will be live at `https://[username].github.io/[repo-name]/`
- Any changes you push will auto-deploy in 1-2 minutes
- Moderate messages by editing the Google Sheet directly

**Important:** Make sure your repository is **Public** for GitHub Pages to work on the free tier.

### 6. Create QR Code

Use any QR code generator (like qr-code-generator.com) pointing to your GitHub Pages URL.

## File Structure

```
memorial-site/
├── README.md              # This file
├── index.html             # Memorial page (public)
├── config.js              # Configuration (edit this!)
├── css/
│   └── styles.css         # Styles (mobile-first, dark mode)
├── js/
│   ├── memorial.js        # Memorial page logic
│   └── sheets-api.js      # Google Sheets API wrapper
└── setup/
    └── apps-script.js     # Google Apps Script code
```

## How It Works

### Visitor Flow
1. Scan QR code → memorial page
2. Read approved messages
3. (Optional) Submit a new message
4. Message goes to Google Sheet with status = "pending"

### Admin Flow (via Google Sheets)

**To approve a message:**
1. Open your Google Sheet
2. Find the message you want to approve
3. In the **status** column, change the dropdown from `pending` to `approved`
4. (Optional) Add today's date in the `approved_date` column
5. The message appears on the site immediately

**To reject a message:**
1. Just delete the entire row
2. That's it — it's gone

**No admin panel needed.** You control everything directly in the spreadsheet.

## Security Notes

- 🤖 Bot protection via reCAPTCHA v3 + honeypot + rate limiting
- 🔒 Google Apps Script handles write operations (prevents direct sheet manipulation)
- 📝 All submissions start as "pending" and require manual approval
- 🔐 Only you (with Google account access) can approve/reject messages via the spreadsheet

## Customization

### Changing Styles
Edit `css/styles.css` - mobile-first breakpoints at 768px and 1024px

### Changing Text
Edit `config.js` for labels, or edit HTML directly for structure

### Rate Limiting
Adjust rate limit in `apps-script.js` (default: 10 submissions per hour site-wide)

## Testing Locally

You can test locally with:
```bash
python3 -m http.server 8000
```
Then visit http://localhost:8000

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Apps Script deployment is active
3. Ensure Google Sheet permissions are set correctly
4. Check reCAPTCHA domain settings include your GitHub Pages URL

---

Built with care for Ponci.

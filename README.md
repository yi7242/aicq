# AI-CQ (AI Chat Notification Extension)

A browser extension that notifies you when ChatGPT, Claude, or Gemini finishes answering your question - with that nostalgic ICQ "Uh-Oh!" sound.

## Features

- Detects when AI assistants (ChatGPT, Claude, Gemini) complete their responses
- Shows a browser notification with the site's favicon
- Displays your question context in the notification
- Classic ICQ notification sound
- Auto-dismisses notification after 5 seconds
- Click notification to return to the AI chat tab

## Installation

1. Download or clone this repository to your local machine

2. Create placeholder icons (or use your own):

   - You'll need three PNG files: `icon16.png`, `icon48.png`, and `icon128.png`
   - For quick testing, you can remove the `icons` field from `manifest.json`

3. Open Chrome and navigate to `chrome://extensions/`

4. Enable "Developer mode" using the toggle in the top-right corner

5. Click "Load unpacked" button

6. Select the directory containing this extension (`NotificationAI`)

7. The extension should now be loaded and active

## Usage

1. Open ChatGPT, Claude, or Gemini:
   - ChatGPT: https://chat.openai.com or https://chatgpt.com
   - Claude: https://claude.ai
   - Gemini: https://gemini.google.com

2. Ask a question

3. When the AI finishes generating the response, you'll receive a notification with:
   - The site's favicon
   - Your original question (truncated if needed)
   - The classic ICQ notification sound

4. Click the notification to bring the AI chat tab back into focus (optional)

## How It Works

- **content.js**: Monitors AI chat pages for response completion by watching for the "Stop" button, extracts the favicon and your question context
- **background.js**: Handles browser notifications with the favicon and context, plays the ICQ sound
- **offscreen.js**: Handles audio playback in the background
- **manifest.json**: Defines the extension configuration and permissions

## Permissions

The extension requires:

- `notifications`: To display browser notifications
- `offscreen`: To play notification sounds in the background
- Host permissions for ChatGPT, Claude, and Gemini domains to run the content script

## Troubleshooting

If notifications aren't appearing, you need to enable them both in your browser AND in your macOS system settings:

### Step 1: Enable Notifications within Your Browser

#### Safari
1. Open Safari and navigate to the AI chat website
2. Go to **Safari menu** → **Settings** (or Preferences)
3. Click the **Websites** tab
4. In the left sidebar, click **Notifications**
5. Find your AI chat site and set its status to **Allow**
6. If not listed, visit the site and look for the "Allow Notifications" prompt

#### Google Chrome
1. Open Chrome
2. Click the three vertical dots (top right) → **Settings**
3. Click **Privacy and security** → **Site settings**
4. Scroll to **Permissions** → **Notifications**
5. Under "Allowed to send notifications", click **Add**
6. Enter the website address and click **Add**
7. Alternatively, when you first visit a site, click **Allow** when Chrome asks

#### Firefox
1. Open Firefox
2. Click the three horizontal lines (top right) → **Settings**
3. Click **Privacy & Security** on the left
4. Scroll to **Permissions** → click **Settings...** next to Notifications
5. Find your AI chat sites and ensure status is set to **Allow**

### Step 2: Enable macOS System Notifications

Even if your browser allows notifications, macOS can block them at the system level:

1. Click the **Apple menu** → **System Settings** (or System Preferences)
2. Click **Notifications** in the left sidebar
3. Scroll down and find your browser (Safari, Google Chrome, or Firefox)
4. Click on your browser's name
5. Make sure **Allow Notifications** toggle is turned **On** (green)
6. Customize how notifications appear:
   - **Banners**: Disappear automatically
   - **Alerts**: Require you to dismiss them

### Other Common Issues

1. Verify the extension is enabled in `chrome://extensions/`
2. Check the browser console for any errors (F12 or Cmd+Option+I)
3. Make sure you're on the correct domain (chat.openai.com, claude.ai, or gemini.google.com)
4. Try reloading the extension and refreshing the AI chat page

## Customization

You can customize the extension by:

- Changing notification duration in `background.js` (currently 5 seconds)
- Modifying the notification message
- Adding custom sounds
- Adjusting the detection logic in `content.js`

## Notes

- The extension works by monitoring DOM changes on AI chat pages
- If ChatGPT, Claude, or Gemini update their UI significantly, the selectors may need to be updated
- The extension only works when one of the supported AI chat sites is open in your browser
- The favicon is converted to a data URL to avoid CORS issues
- User questions are truncated to 100 characters for notification display

## Credits

Inspired by the nostalgic ICQ messenger notification sound - bringing back that classic "Uh-Oh!" to the modern AI era.

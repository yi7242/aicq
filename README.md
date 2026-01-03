# ChatGPT Notification Extension

A simple Chrome extension that notifies you when ChatGPT finishes answering your question.

## Features

- Detects when ChatGPT completes its response
- Shows a browser notification
- Auto-dismisses notification after 5 seconds
- Click notification to return to ChatGPT tab

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

1. Open ChatGPT (https://chat.openai.com or https://chatgpt.com)

2. Ask a question

3. When ChatGPT finishes generating the response, you'll receive a notification

4. Click the notification to bring the ChatGPT tab back into focus (optional)

## How It Works

- **content.js**: Monitors the ChatGPT page for response completion by watching for the "Stop generating" button and streaming indicators
- **background.js**: Handles the browser notifications when messages are received from the content script
- **manifest.json**: Defines the extension configuration and permissions

## Permissions

The extension requires:

- `notifications`: To display browser notifications
- Host permissions for `chat.openai.com` and `chatgpt.com`: To run the content script on ChatGPT pages

## Troubleshooting

If notifications aren't appearing:

1. Check that Chrome notifications are enabled in your system settings
2. Verify the extension is enabled in `chrome://extensions/`
3. Check the browser console for any errors
4. Make sure you're on the correct ChatGPT domain (chat.openai.com or chatgpt.com)

## Customization

You can customize the extension by:

- Changing notification duration in `background.js` (currently 5 seconds)
- Modifying the notification message
- Adding custom sounds
- Adjusting the detection logic in `content.js`

## Notes

- The extension works by monitoring DOM changes on the ChatGPT page
- If ChatGPT updates their UI significantly, the selectors may need to be updated
- The extension only works when ChatGPT is open in your browser

# AI-CQ (AI Chat Notification Extension)

A browser extension that notifies you when ChatGPT, Claude, or Gemini finishes answering your question - with that nostalgic ICQ "Uh-Oh!" sound.

## Features

- **Multi-Platform Support**: Works with ChatGPT, Claude, and Gemini
- **Smart Detection**: Uses Chrome's webRequest API for reliable detection even in background tabs
- **Volume Control**: Adjustable notification sound with 4 levels (off, soft, balanced, loud)
- **Rich Notifications**: Shows platform-specific icons and your question context
- **Classic ICQ Sound**: That nostalgic "Uh-Oh!" notification sound
- **Auto-Dismiss**: Notifications disappear automatically after 5 seconds
- **Quick Navigation**: Click notification to return to the AI chat tab

## Installation

1. Download or clone this repository to your local machine

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" using the toggle in the top-right corner

4. Click "Load unpacked" button

5. Select the directory containing this extension (`NotificationAI`)

6. The extension should now be loaded and active

## Usage

### Basic Usage

1. Open any supported AI chat platform:
   - ChatGPT: https://chat.openai.com or https://chatgpt.com
   - Claude: https://claude.ai
   - Gemini: https://gemini.google.com

2. Ask a question and continue with other tasks (notifications work even in background tabs!)

3. When the AI finishes generating the response, you'll receive a notification with:
   - Platform-specific icon (ChatGPT, Claude, or Gemini logo)
   - Your original question (truncated to 100 chars if needed)
   - The classic ICQ notification sound

4. Click the notification to bring the AI chat tab back into focus

### Volume Control

Click the extension icon in your browser toolbar to access volume settings:

- **Off**: No sound (visual notification only)
- **Soft**: 30% volume
- **Balanced**: 60% volume (default)
- **Loud**: 100% volume

Settings are automatically saved and synced across your devices via Chrome sync.

## How It Works

The extension uses a hybrid approach for maximum reliability:

- **background.js**:
  - Monitors network requests via `chrome.webRequest` API to detect when AI responses complete
  - Uses a unified `LLM_ENDPOINTS` configuration for easy addition of new platforms
  - Handles browser notifications with platform-specific icons and context
  - Manages volume preferences via `chrome.storage.sync`

- **content.js**:
  - Extracts your question context from the chat page
  - Provides platform-specific information to the background script
  - Shows an in-page banner to request notification permissions if needed

- **offscreen.js**:
  - Handles audio playback in the background (Chrome requirement for service workers)
  - Applies volume levels from user preferences

- **popup.html/popup.js**:
  - Minimalist volume control interface
  - Test sound button to preview volume levels

- **manifest.json**:
  - Defines extension configuration, permissions, and supported domains

## Permissions

The extension requires:

- **notifications**: To display browser notifications
- **offscreen**: To play notification sounds in the background
- **webRequest**: To monitor network requests and detect AI response completion
- **storage**: To save volume preferences across sessions
- **Host permissions**: Access to ChatGPT, Claude, and Gemini domains to run the content script and monitor API requests

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

### Via UI
- **Volume Control**: Click the extension icon to adjust notification sound volume (off/soft/balanced/loud)

### Via Code
- **Notification Duration**: Edit timeout in `background.js` (default: 5 seconds)
- **Volume Levels**: Adjust `VOLUME_LEVELS` mapping in `offscreen.js`
- **Notification Sound**: Replace `sounds/icq.mp3` with your custom sound
- **Add New AI Platforms**: Simply add a new entry to `LLM_ENDPOINTS` array in `background.js`:
  ```javascript
  {
    name: "YourAI",
    pattern: "https://yourai.com/api/chat/completion",
    icon: "icons/yourai128.png"
  }
  ```
- **Message Context**: Adjust selectors in `getLatestUserMessage()` in `content.js`

## Notes

- **Network Monitoring**: Uses Chrome's `webRequest` API to detect completion of AI responses - works reliably even in background tabs
- **Platform Icons**: Each platform (ChatGPT, Claude, Gemini) has its own icon in notifications
- **Context Extraction**: User questions are extracted from the DOM and truncated to 100 characters for notification display
- **Volume Sync**: Volume preferences sync across devices using `chrome.storage.sync`
- **Extensibility**: Adding support for new AI platforms requires only adding an entry to `LLM_ENDPOINTS` array
- **UI Updates**: If platforms change their UI, you may need to update selectors in `content.js` for context extraction
- **Background Compatibility**: Works perfectly when AI chat tabs are in the background

## Credits

Inspired by the nostalgic ICQ messenger notification sound - bringing back that classic "Uh-Oh!" to the modern AI era.

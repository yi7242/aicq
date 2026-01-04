// Content script - provides notification info to background script

// Function to get platform name
function getPlatformName() {
  const hostname = window.location.hostname;
  if (hostname.includes("openai.com") || hostname.includes("chatgpt.com")) {
    return "ChatGPT";
  } else if (hostname.includes("claude.ai")) {
    return "Claude";
  } else if (hostname.includes("gemini.google.com")) {
    return "Gemini";
  } else if (hostname.includes("perplexity.ai")) {
    return "Perplexity";
  }
  return "AI Assistant";
}

// Function to extract the latest user message (question)
function getLatestUserMessage() {
  let messageText = "";

  // Try ChatGPT selectors
  const chatGPTMessages = document.querySelectorAll(
    '[data-message-author-role="user"]'
  );
  if (chatGPTMessages.length > 0) {
    const lastMessage = chatGPTMessages[chatGPTMessages.length - 1];
    messageText = lastMessage.textContent?.trim() || "";
  }

  // Try Claude selectors
  if (!messageText) {
    const claudeMessages = document.querySelectorAll(
      'div[data-is-streaming="false"]'
    );
    for (let i = claudeMessages.length - 1; i >= 0; i--) {
      const msg = claudeMessages[i];
      if (
        msg.querySelector('[aria-label*="user"]') ||
        msg.closest('[data-testid*="user"]')
      ) {
        messageText = msg.textContent?.trim() || "";
        break;
      }
    }
  }

  // Try Gemini selectors
  if (!messageText) {
    const geminiMessages = document.querySelectorAll(
      ".query-content, .user-query"
    );
    if (geminiMessages.length > 0) {
      messageText =
        geminiMessages[geminiMessages.length - 1].textContent?.trim() || "";
    }
  }

  // Truncate if too long (max 100 chars for notification)
  if (messageText.length > 100) {
    messageText = messageText.substring(0, 97) + "...";
  }

  return messageText;
}

// Function to check if extension context is valid
function isExtensionContextValid() {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch (error) {
    return false;
  }
}

// Function to get platform icon filename
function getPlatformIcon(platform) {
  const iconMap = {
    ChatGPT: "icons/chatgpt128.png",
    Claude: "icons/claude128.png",
    Gemini: "icons/gemini128.png",
    Perplexity: "icons/perplexity128.png",
  };

  return iconMap[platform] || "icons/icon128.png";
}

// Function to check notification permission and show banner if needed
function checkNotificationPermission() {
  if (Notification.permission !== "granted") {
    showNotificationBanner();
  }
}

// Function to show a banner prompting user to enable notifications
function showNotificationBanner() {
  const dismissed = sessionStorage.getItem("aicq-banner-dismissed");
  if (dismissed === "true") {
    return;
  }

  const banner = document.createElement("div");
  banner.id = "aicq-notification-banner";
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 999999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  `;

  const content = document.createElement("div");
  content.style.cssText =
    "flex: 1; display: flex; align-items: center; gap: 12px;";
  content.innerHTML = `
    <span style="font-size: 20px;">🔔</span>
    <span>
      <strong>AI-CQ:</strong> Enable notifications to get notified when your AI assistant finishes responding!
    </span>
  `;

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText =
    "display: flex; gap: 8px; align-items: center;";

  const enableBtn = document.createElement("button");
  enableBtn.textContent = "Enable Notifications";
  enableBtn.style.cssText = `
    background: white;
    color: #667eea;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 13px;
    transition: transform 0.2s;
  `;
  enableBtn.onmouseover = () => (enableBtn.style.transform = "scale(1.05)");
  enableBtn.onmouseout = () => (enableBtn.style.transform = "scale(1)");
  enableBtn.onclick = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        banner.remove();
        if (isExtensionContextValid()) {
          try {
            chrome.runtime.sendMessage({
              type: "RESPONSE_COMPLETE",
              timestamp: Date.now(),
              platformIcon: "icons/icon128.png",
              platform: "AI-CQ",
              context:
                "Notifications enabled! You'll now be notified when AI responses complete.",
            });
          } catch (msgError) {
            console.error("[AICQ] Failed to send test notification:", msgError);
          }
        }
      }
    } catch (error) {
      console.error("[AICQ] Failed to request notification permission:", error);
    }
  };

  const dismissBtn = document.createElement("button");
  dismissBtn.textContent = "✕";
  dismissBtn.style.cssText = `
    background: transparent;
    color: white;
    border: none;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 18px;
    opacity: 0.8;
    transition: opacity 0.2s;
  `;
  dismissBtn.onmouseover = () => (dismissBtn.style.opacity = "1");
  dismissBtn.onmouseout = () => (dismissBtn.style.opacity = "0.8");
  dismissBtn.onclick = () => {
    banner.remove();
    sessionStorage.setItem("aicq-banner-dismissed", "true");
  };

  buttonContainer.appendChild(enableBtn);
  buttonContainer.appendChild(dismissBtn);
  banner.appendChild(content);
  banner.appendChild(buttonContainer);

  document.body.appendChild(banner);
  console.log("[AICQ] Notification permission banner displayed");
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_NOTIFICATION_INFO") {
    console.log("[AICQ] Background script requesting notification info");

    const platform = getPlatformName();
    const platformIcon = getPlatformIcon(platform);
    const context = getLatestUserMessage();

    const response = {
      platform: platform,
      platformIcon: platformIcon,
      context: context,
    };

    console.log("[AICQ] Sending notification info to background:", response);
    sendResponse(response);

    return true;
  }
});

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    checkNotificationPermission();
  });
} else {
  checkNotificationPermission();
}

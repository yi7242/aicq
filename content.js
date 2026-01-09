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
  } else if (hostname.includes("grok.com")) {
    return "Grok";
  } else if (hostname.includes("z.ai")) {
    return "Z.ai";
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
    Grok: "icons/grok128.png",
    "Z.ai": "icons/zai128.png",
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

  // Create container for centering
  const container = document.createElement("div");
  container.id = "aicq-banner-container";
  container.style.cssText = `
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
    z-index: 2147483647;
    pointer-events: auto;
    animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  `;

  // Inject keyframes
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(-50%) translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
      to {
        transform: translateX(-50%) translateY(-100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  const banner = document.createElement("div");
  banner.id = "aicq-notification-banner";
  banner.style.cssText = `
    background: #ffffff;
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04);
    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    line-height: 1.4;
    min-width: 380px;
    max-width: 90vw;
    pointer-events: auto;
  `;

  // Icon container with subtle background
  const iconWrapper = document.createElement("div");
  iconWrapper.style.cssText = `
    width: 64px;
    height: 64px;
    background: #fafafa;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `;
  const iconImg = document.createElement("img");
  iconImg.src = chrome.runtime.getURL("icons/icon128.png");
  iconImg.style.cssText = `
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: contain;
  `;
  iconWrapper.appendChild(iconImg);

  const content = document.createElement("div");
  content.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;
  content.innerHTML = `
    <span style="font-weight: 500; color: #171717; letter-spacing: -0.01em; font-size: 11px;">aicq</span>
    <span style="font-weight: 500; color: #171717; letter-spacing: -0.01em;">Enable push notifications</span>
    <span style="color: #737373; font-size: 12px;">See alerts when AI responses complete</span>
  `;

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText =
    "display: flex; gap: 8px; align-items: center; pointer-events: auto;";

  const enableBtn = document.createElement("button");
  enableBtn.textContent = "Enable";
  enableBtn.style.cssText = `
    background: #171717;
    color: white;
    border: none;
    padding: 9px 16px;
    border-radius: 7px;
    font-weight: 500;
    cursor: pointer;
    font-size: 12px;
    letter-spacing: -0.01em;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
    pointer-events: auto;
  `;

  // Hover effects
  enableBtn.onmouseenter = () => {
    enableBtn.style.background = "#262626";
    enableBtn.style.transform = "scale(1.02)";
  };
  enableBtn.onmouseleave = () => {
    enableBtn.style.background = "#171717";
    enableBtn.style.transform = "scale(1)";
  };
  enableBtn.onmousedown = () => {
    enableBtn.style.transform = "scale(0.97)";
  };
  enableBtn.onmouseup = () => {
    enableBtn.style.transform = "scale(1.02)";
  };

  // Use onclick directly (not addEventListener) for proper user gesture detection
  enableBtn.onclick = async () => {
    console.log("[AICQ] Enable button clicked");

    // Request notification permission
    const permission = await Notification.requestPermission();
    console.log("[AICQ] Permission result:", permission);

    // Always close the banner after user responds
    container.style.animation =
      "slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards";
    setTimeout(() => container.remove(), 300);

    if (permission === "granted" && isExtensionContextValid()) {
      try {
        chrome.runtime.sendMessage({
          type: "RESPONSE_COMPLETE",
          timestamp: Date.now(),
          platformIcon: "icons/icon128.png",
          platform: "aicq",
          context:
            "Notifications enabled! You'll now be notified when AI responses complete.",
        });
      } catch (msgError) {
        console.error("[AICQ] Failed to send test notification:", msgError);
      }
    }
  };

  const dismissBtn = document.createElement("button");
  dismissBtn.textContent = "Dismiss";
  dismissBtn.style.cssText = `
    background: transparent;
    color: #737373;
    border: none;
    padding: 9px 14px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    border-radius: 7px;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
    pointer-events: auto;
  `;
  dismissBtn.onmouseover = () => {
    dismissBtn.style.background = "#fafafa";
    dismissBtn.style.color = "#171717";
  };
  dismissBtn.onmouseout = () => {
    dismissBtn.style.background = "transparent";
    dismissBtn.style.color = "#737373";
  };
  dismissBtn.onclick = () => {
    container.style.animation =
      "slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards";
    setTimeout(() => {
      container.remove();
      sessionStorage.setItem("aicq-banner-dismissed", "true");
    }, 300);
  };

  buttonContainer.appendChild(enableBtn);
  buttonContainer.appendChild(dismissBtn);
  banner.appendChild(iconWrapper);
  banner.appendChild(content);
  banner.appendChild(buttonContainer);
  container.appendChild(banner);

  document.body.appendChild(container);
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

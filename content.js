// Monitor ChatGPT responses and notify when complete

let isGenerating = false;
let hasNotifiedForCurrentMessage = false;

// Function to check if AI is currently generating
function checkGeneratingStatus() {
  // All platforms now use webRequest in background.js
  // DOM observer is disabled - keeping this function for backwards compatibility
  return false;
}

// Function to get favicon as data URL to avoid CORS issues
async function getFaviconAsDataUrl() {
  try {
    // Try multiple selectors to find favicon
    let favicon =
      document.querySelector('link[rel="icon"]') ||
      document.querySelector('link[rel="shortcut icon"]') ||
      document.querySelector('link[rel*="icon"]');

    // If no favicon found, try to construct default favicon URL
    if (!favicon || !favicon.href) {
      const defaultFaviconUrl = `${window.location.origin}/favicon.ico`;
      console.log(
        "[AICQ] No favicon link found, trying default:",
        defaultFaviconUrl
      );

      // Try to fetch default favicon
      try {
        const testResponse = await fetch(defaultFaviconUrl, { method: "HEAD" });
        if (testResponse.ok) {
          // Create a temporary link element
          favicon = { href: defaultFaviconUrl };
        } else {
          console.log("[AICQ] Default favicon not found");
          return null;
        }
      } catch (e) {
        console.log("[AICQ] Default favicon fetch failed");
        return null;
      }
    }

    console.log("[AICQ] Attempting to fetch favicon:", favicon.href);

    // Fetch the favicon and convert to data URL
    const response = await fetch(favicon.href);
    if (!response.ok) {
      console.log("[AICQ] Failed to fetch favicon: HTTP", response.status);
      return null;
    }

    const blob = await response.blob();

    // Check if it's a valid image
    if (!blob.type.startsWith("image/")) {
      console.log("[AICQ] Favicon is not an image:", blob.type);
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("[AICQ] Favicon converted to data URL successfully");
        resolve(reader.result);
      };
      reader.onerror = (error) => {
        console.log("[AICQ] Failed to read favicon blob:", error);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.log("[AICQ] Failed to fetch favicon:", error.message);
    return null;
  }
}

// Function to get platform name
function getPlatformName() {
  const hostname = window.location.hostname;
  if (hostname.includes("openai.com") || hostname.includes("chatgpt.com")) {
    return "ChatGPT";
  } else if (hostname.includes("claude.ai")) {
    return "Claude";
  } else if (hostname.includes("gemini.google.com")) {
    return "Gemini";
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
    ChatGPT: "icons/chatgpt128.png", // Using default for ChatGPT for now
    Claude: "icons/claude128.png",
    Gemini: "icons/gemini128.png",
  };

  return iconMap[platform] || "icons/icon128.png";
}

// Function to send notification
async function notifyResponseComplete() {
  console.log("[NOTIFY] Sending notification message to background script");

  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    console.warn(
      "[AICQ] Extension context invalidated. Please reload the page."
    );
    return;
  }

  const platform = getPlatformName();
  const platformIcon = getPlatformIcon(platform);
  const userMessage = getLatestUserMessage();

  try {
    chrome.runtime.sendMessage({
      type: "RESPONSE_COMPLETE",
      timestamp: Date.now(),
      platformIcon: platformIcon,
      platform: platform,
      context: userMessage,
    });
    console.log("[SUCCESS] Message sent to background script", {
      platform,
      platformIcon,
      hasContext: !!userMessage,
    });
  } catch (error) {
    console.error("[AICQ] Failed to send message:", error.message);
    console.warn(
      "[AICQ] Extension may have been reloaded. Please refresh the page."
    );
  }
}

// Main observer to watch for changes
const observer = new MutationObserver(() => {
  const currentlyGenerating = checkGeneratingStatus();

  // Log state transitions
  if (!isGenerating && currentlyGenerating) {
    console.log("[STATE] AI started generating (Stop button appeared)");
    hasNotifiedForCurrentMessage = false; // Reset flag for new response
  }

  console.log("[OBSERVER] State:", {
    wasGenerating: isGenerating,
    isNowGenerating: currentlyGenerating,
    hasNotified: hasNotifiedForCurrentMessage,
    transition: isGenerating && !currentlyGenerating ? "COMPLETE" : "NO_CHANGE",
  });

  // If we were generating and now we're not (button disappeared), send notification
  if (isGenerating && !currentlyGenerating && !hasNotifiedForCurrentMessage) {
    console.log(
      "[TRIGGER] AI finished generating (Stop button disappeared) - triggering notification!"
    );
    notifyResponseComplete();
    hasNotifiedForCurrentMessage = true; // Prevent multiple notifications for same message
  }

  // Update state
  isGenerating = currentlyGenerating;
});

// Start observing when the page loads
function startObserving() {
  const targetNode = document.body;

  if (targetNode) {
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-label", "class"],
    });
    console.log(
      "AI Chat Notification extension is active - monitoring for ChatGPT, Claude, and Gemini"
    );
  }
}

// Function to check notification permission and show banner if needed
function checkNotificationPermission() {
  // Check if notifications are granted
  if (Notification.permission !== "granted") {
    showNotificationBanner();
  }
}

// Function to show a banner prompting user to enable notifications
function showNotificationBanner() {
  // Check if banner was previously dismissed
  const dismissed = sessionStorage.getItem("aicq-banner-dismissed");
  if (dismissed === "true") {
    return;
  }

  // Create banner element
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

  // Banner content
  const content = document.createElement("div");
  content.style.cssText =
    "flex: 1; display: flex; align-items: center; gap: 12px;";
  content.innerHTML = `
    <span style="font-size: 20px;">🔔</span>
    <span>
      <strong>AI-CQ:</strong> Enable notifications to get notified when your AI assistant finishes responding!
    </span>
  `;

  // Button container
  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText =
    "display: flex; gap: 8px; align-items: center;";

  // Enable button
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
        // Show a test notification
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

  // Dismiss button
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

  // Assemble banner
  buttonContainer.appendChild(enableBtn);
  buttonContainer.appendChild(dismissBtn);
  banner.appendChild(content);
  banner.appendChild(buttonContainer);

  // Add to page
  document.body.appendChild(banner);
  console.log("[AICQ] Notification permission banner displayed");
}

// Function to inject Gemini network monitor
// NOTE: Disabled - Gemini is now handled by webRequest API in background.js
function injectGeminiMonitor() {
  const hostname = window.location.hostname;

  // Gemini detection is now handled by chrome.webRequest in background.js
  // This function is kept for backwards compatibility but does nothing
  if (hostname.includes("gemini.google.com")) {
    console.log(
      "[AICQ] Gemini detection via webRequest API (background script)"
    );
    return;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_NOTIFICATION_INFO") {
    console.log("[AICQ] Background script requesting notification info");

    // Get current platform and context
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

    return true; // Keep channel open for async response
  }
});

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    checkNotificationPermission();
    injectGeminiMonitor();
    startObserving();
  });
} else {
  checkNotificationPermission();
  injectGeminiMonitor();
  startObserving();
}

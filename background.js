// Background script to handle notifications

// Function to setup offscreen document for playing sound
async function setupOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });

  if (existingContexts.length > 0) {
    return; // Offscreen document already exists
  }

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Play notification sound when AI finishes responding",
  });

  console.log("[BACKGROUND] Offscreen document created");
}

// Function to play notification sound
async function playNotificationSound() {
  try {
    // Get stored volume preference
    const result = await chrome.storage.sync.get(["volumeLevel"]);
    const volumeLevel = result.volumeLevel || "balanced";

    // Ensure offscreen document exists
    await setupOffscreenDocument();

    // Send message to offscreen document to play sound with volume
    await chrome.runtime.sendMessage({
      type: "PLAY_SOUND",
      volume: volumeLevel,
    });
    console.log(
      "[BACKGROUND] Sent play sound message with volume:",
      volumeLevel
    );
  } catch (error) {
    console.error("[BACKGROUND] Failed to play sound:", error);
  }
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log("[BACKGROUND] Received message:", message);

  // Handle test sound from popup
  if (message.type === "PLAY_SOUND") {
    const volume = message.volume || "balanced";
    console.log("[BACKGROUND] Playing test sound with volume:", volume);

    await setupOffscreenDocument();
    await chrome.runtime.sendMessage({
      type: "PLAY_SOUND",
      volume: volume,
    });

    return true;
  }

  if (message.type === "RESPONSE_COMPLETE") {
    console.log("[BACKGROUND] Creating notification...");

    // Play notification sound
    playNotificationSound();

    // Use platform icon from message
    const iconPath = message.platformIcon || "icons/icon128.png";
    const iconUrl = chrome.runtime.getURL(iconPath);

    // Use platform name if available
    const platform = message.platform || "AI Assistant";

    // Use context if available, otherwise show generic message
    const notificationMessage = message.context
      ? `Re: ${message.context}`
      : "Your AI assistant has finished answering your question!";

    // Create notification options
    const notificationOptions = {
      type: "basic",
      iconUrl: iconUrl,
      title: `${platform} Response Complete`,
      message: notificationMessage,
      priority: 2,
      requireInteraction: false,
    };

    // Create a notification when AI finishes responding
    try {
      chrome.notifications.create(notificationOptions, (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error(
            "[AICQ ERROR] Failed to create notification:",
            chrome.runtime.lastError.message
          );
        } else {
          console.log(
            "[AICQ SUCCESS] Notification created with ID:",
            notificationId
          );
          console.log("[AICQ] Using icon:", iconUrl);

          // Auto-clear notification after 5 seconds
          setTimeout(() => {
            chrome.notifications.clear(notificationId, (wasCleared) => {
              if (wasCleared) {
                console.log("[AICQ] Notification cleared");
              }
            });
          }, 5000);
        }
      });
    } catch (error) {
      console.error("[AICQ ERROR] Exception creating notification:", error);
    }
  }

  // Return true to indicate we might send a response asynchronously
  return true;
});

// Handle notification clicks (optional - brings AI chat tab to focus)
chrome.notifications.onClicked.addListener(() => {
  console.log("[INFO] Notification clicked - focusing AI chat tab");
  chrome.tabs.query(
    {
      url: [
        "https://chat.openai.com/*",
        "https://chatgpt.com/*",
        "https://claude.ai/*",
        "https://gemini.google.com/*",
      ],
    },
    (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true });
        chrome.windows.update(tabs[0].windowId, { focused: true });
      }
    }
  );
});

// Configuration for LLM endpoints - Easy to add new LLMs!
const LLM_ENDPOINTS = [
  {
    name: "ChatGPT",
    pattern: "https://chatgpt.com/backend-api/f/conversation",
    icon: "icons/chatgpt128.png",
  },
  {
    name: "ChatGPT",
    pattern: "https://chat.openai.com/backend-api/conversation",
    icon: "icons/chatgpt128.png",
  },
  {
    name: "Gemini",
    pattern:
      "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate*",
    icon: "icons/gemini128.png",
  },
  {
    name: "Claude",
    pattern:
      "https://claude.ai/api/organizations/*/chat_conversations/*/completion",
    icon: "icons/claude128.png",
  },
  // To add a new LLM: just add a new entry here with name, pattern, and icon!
];

// Single reusable function to handle LLM completion
async function handleLLMCompletion(details, platformName, fallbackIcon) {
  // Only process successful requests
  if (details.statusCode !== 200) return;

  console.log(`[AICQ-WEBR] ${platformName} completion for tab:`, details.tabId);

  try {
    // Ask content script for notification info (platform, context, icon)
    const response = await chrome.tabs.sendMessage(details.tabId, {
      type: "GET_NOTIFICATION_INFO",
    });

    if (response && response.platform === platformName) {
      console.log(
        "[AICQ-WEBR] Received notification info from content script:",
        response
      );

      // Create notification with info from content script
      const notificationOptions = {
        type: "basic",
        iconUrl: chrome.runtime.getURL(response.platformIcon || fallbackIcon),
        title: `${response.platform} Response Complete`,
        message:
          response.context || "Your AI assistant has finished answering!",
        priority: 2,
        requireInteraction: false,
      };

      // Play sound
      playNotificationSound();

      // Create notification
      chrome.notifications.create(notificationOptions, (notificationId) => {
        if (notificationId) {
          console.log("[AICQ-WEBR] Notification created:", notificationId);
          setTimeout(() => chrome.notifications.clear(notificationId), 5000);
        } else if (chrome.runtime.lastError) {
          console.error(
            "[AICQ-WEBR] Failed to create notification:",
            chrome.runtime.lastError
          );
        }
      });
    }
  } catch (error) {
    console.log("[AICQ-WEBR] Could not get notification info:", error);
  }
}

// Register webRequest listeners for each LLM
LLM_ENDPOINTS.forEach((llm) => {
  chrome.webRequest.onCompleted.addListener(
    (details) => handleLLMCompletion(details, llm.name, llm.icon),
    { urls: [llm.pattern] }
  );
  console.log(`[AICQ] Registered webRequest listener for ${llm.name}`);
});

console.log("AI Chat Notification background script loaded");

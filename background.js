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
    // Ensure offscreen document exists
    await setupOffscreenDocument();

    // Send message to offscreen document to play sound
    await chrome.runtime.sendMessage({ type: "PLAY_SOUND" });
    console.log("[BACKGROUND] Sent play sound message to offscreen document");
  } catch (error) {
    console.error("[BACKGROUND] Failed to play sound:", error);
  }
}

chrome.runtime.onMessage.addListener((message) => {
  console.log("[BACKGROUND] Received message:", message);

  if (message.type === "RESPONSE_COMPLETE") {
    console.log("[BACKGROUND] Creating notification...");

    // Play notification sound
    playNotificationSound();

    // Create a notification when AI finishes responding
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "AI Response Complete",
        message: "Your AI assistant has finished answering your question!",
        priority: 2,
        requireInteraction: false,
      },
      (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error(
            "[ERROR] Failed to create notification:",
            chrome.runtime.lastError
          );
        } else {
          console.log(
            "[SUCCESS] Notification created with ID:",
            notificationId
          );

          // Auto-clear notification after 5 seconds
          setTimeout(() => {
            chrome.notifications.clear(notificationId);
            console.log("[INFO] Notification cleared");
          }, 5000);
        }
      }
    );
  }
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

console.log("AI Chat Notification background script loaded");

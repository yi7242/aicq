// Monitor ChatGPT responses and notify when complete

let isGenerating = false;
let hasNotifiedForCurrentMessage = false;

// Function to check if AI is currently generating
function checkGeneratingStatus() {
  // Look for the "Stop streaming" button (ChatGPT)
  const chatGPTStopButton = document.querySelector(
    'button[aria-label="Stop streaming"]'
  );

  // Look for the "Stop response" button (Claude)
  const claudeStopButton = document.querySelector(
    'button[aria-label="Stop response"]'
  );

  // Look for the stop button (Gemini) - using class selector (language-independent)
  const geminiStopButton = document.querySelector("button.send-button.stop");

  const stopButton = chatGPTStopButton || claudeStopButton || geminiStopButton;
  const isCurrentlyGenerating = !!stopButton;

  const platform = chatGPTStopButton
    ? "ChatGPT"
    : claudeStopButton
    ? "Claude"
    : geminiStopButton
    ? "Gemini"
    : "Unknown";

  console.log("[DEBUG] checkGeneratingStatus:", {
    platform,
    hasChatGPTButton: !!chatGPTStopButton,
    hasClaudeButton: !!claudeStopButton,
    hasGeminiButton: !!geminiStopButton,
    isGenerating: isCurrentlyGenerating,
  });

  return isCurrentlyGenerating;
}

// Function to send notification
function notifyResponseComplete() {
  console.log("[NOTIFY] Sending notification message to background script");
  chrome.runtime.sendMessage({
    type: "RESPONSE_COMPLETE",
    timestamp: Date.now(),
  });
  console.log("[SUCCESS] Message sent to background script");
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

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startObserving);
} else {
  startObserving();
}

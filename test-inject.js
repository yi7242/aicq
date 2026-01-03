// Test script to verify content script is running
// Paste this in the ChatGPT console to test if extension is loaded

console.log("=== TESTING EXTENSION ===");
console.log("Current URL:", window.location.href);
console.log(
  "Extension context:",
  typeof chrome !== "undefined" && chrome.runtime
    ? "Available"
    : "NOT Available"
);

// Try to find ChatGPT elements
console.log("\n=== CHECKING DOM ELEMENTS ===");
const assistantMessages = document.querySelectorAll(
  '[data-message-author-role="assistant"]'
);
console.log("Assistant messages found:", assistantMessages.length);

const stopButton = document.querySelector('button[aria-label*="Stop"]');
console.log("Stop button:", stopButton ? "FOUND" : "NOT FOUND");

// List all buttons to help find the right selector
const allButtons = document.querySelectorAll("button");
console.log("\nAll buttons on page:", allButtons.length);
console.log("Button aria-labels:");
allButtons.forEach((btn, i) => {
  if (btn.getAttribute("aria-label")) {
    console.log(`  ${i}: ${btn.getAttribute("aria-label")}`);
  }
});

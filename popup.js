// α-explain Popup Script
// Handles settings management

const apiKeyInput = document.getElementById('apiKey');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

// Load saved API key on popup open
chrome.storage.local.get('apiKey', (result) => {
    if (result.apiKey) {
        apiKeyInput.value = result.apiKey;
    }
});

// Save API key
saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        showStatus('Please enter an API key', 'error');
        return;
    }

    // Save to storage
    chrome.storage.local.set({ apiKey }, () => {
        showStatus('Settings saved successfully! ✓', 'success');

        // Hide success message after 2 seconds
        setTimeout(() => {
            status.style.display = 'none';
        }, 2000);
    });
});

// Show status message
function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
}

// Allow Enter key to save
apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveBtn.click();
    }
});

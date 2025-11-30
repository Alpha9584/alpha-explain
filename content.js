// α-explain Content Script
let explanationPopup = null;
let selectedText = '';

document.addEventListener('keydown', async (event) => {
  if (event.shiftKey && event.key === 'E') {
    event.preventDefault();

    const selection = window.getSelection();
    selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      await showExplanation(selectedText, rect);
    }
  }

  if (event.key === 'Escape' && explanationPopup) {
    closePopup();
  }
});

async function showExplanation(text, rect) {
  closePopup();

  explanationPopup = document.createElement('div');
  explanationPopup.className = 'alpha-explain-popup';
  explanationPopup.innerHTML = `
    <div class="alpha-explain-header">
      <div class="alpha-explain-icon">α</div>
      <div class="alpha-explain-term">${escapeHtml(text)}</div>
      <button class="alpha-explain-close" aria-label="Close">×</button>
    </div>
    <div class="alpha-explain-content">
      <div class="alpha-explain-loading">
        <div class="alpha-explain-spinner"></div>
        <p>Explaining...</p>
      </div>
    </div>
  `;

  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  explanationPopup.style.left = `${rect.left + scrollX}px`;
  explanationPopup.style.top = `${rect.bottom + scrollY + 10}px`;

  document.body.appendChild(explanationPopup);

  const closeBtn = explanationPopup.querySelector('.alpha-explain-close');
  closeBtn.addEventListener('click', closePopup);

  setTimeout(() => {
    const popupRect = explanationPopup.getBoundingClientRect();

    if (popupRect.right > window.innerWidth) {
      explanationPopup.style.left = `${window.innerWidth - popupRect.width - 20 + scrollX}px`;
    }

    if (popupRect.bottom > window.innerHeight) {
      explanationPopup.style.top = `${rect.top + scrollY - popupRect.height - 10}px`;
    }
  }, 10);

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'explain',
      text: text
    });

    if (response.success) {
      displayExplanation(response.explanation);
    } else {
      displayError(response.error || 'Failed to get explanation');
    }
  } catch (error) {
    displayError('Failed to connect to explanation service');
  }
}

function displayExplanation(explanation) {
  if (!explanationPopup) return;

  const content = explanationPopup.querySelector('.alpha-explain-content');
  content.innerHTML = `
    <div class="alpha-explain-explanation">
      ${escapeHtml(explanation).replace(/\n/g, '<br>')}
    </div>
  `;
}

function displayError(errorMsg) {
  if (!explanationPopup) return;

  const content = explanationPopup.querySelector('.alpha-explain-content');
  content.innerHTML = `
    <div class="alpha-explain-error">
      <p>⚠️ ${escapeHtml(errorMsg)}</p>
    </div>
  `;
}

function closePopup() {
  if (explanationPopup) {
    explanationPopup.remove();
    explanationPopup = null;
  }
}

document.addEventListener('click', (event) => {
  if (explanationPopup && !explanationPopup.contains(event.target)) {
    closePopup();
  }
});

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

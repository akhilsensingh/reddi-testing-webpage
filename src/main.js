/**
 * Chat integration script tag tester.
 * - Textarea for the full <script> tag; value is stored in localStorage.
 * - On "Apply & refresh", page reloads and the tag is parsed and injected so the chat runs.
 */

const STORAGE_KEY = 'chat-integration-script-tag';

const DEFAULT_SCRIPT_TAG = `<script
  src="https://storage.googleapis.com/phinite-public/website/dev/index.js"
  data-integration-id="zV4LNuSlg"
  data-company-name="Smart Chatbot"
  data-input-placeholder="Dell Bot"
  data-company-description="Hi, how can I help you today?"
  data-company-logo="https://storage.googleapis.com/phinite-public/website/phinite-logo.png"
  data-company-env="development"
  data-brand-color="#156ab0"
  data-header-theme="white"
  data-corner-radius="8"
  data-position="bottom-right"
  data-position-width="30"
  data-position-height="30"
  data-modality-type="widget"
  data-header-logo="https://storage.googleapis.com/phinite-public/chatbot/oEtGgEm%2FHdu_Bsb%2Fintegration%2F0e-Zx4ah5-dell-logo.jpg"
  data-agent-logo="https://storage.googleapis.com/phinite-public/chatbot/oEtGgEm%2FHdu_Bsb%2Fintegration%2F4afIH3EWD-dell-logo.jpg"
  data-launcher-logo="https://storage.googleapis.com/phinite-public/chatbot/oEtGgEm%2FHdu_Bsb%2Fintegration%2F_gykdEFas-dell-logo.jpg"
  data-launcher-type="0"
  data-agent-name="Smart Chatbot"
  data-agent-description="Hi, how can I help you today?"
  data-minimized-launcher-text="Dell Bot"
  data-banner-image="https://storage.googleapis.com/phinite-public/chatbot/oEtGgEm%2FHdu_Bsb%2Fintegration%2FqaUBf6Mp2-dell-logo.jpg"
  data-brand-secondary-color="#156ab04d"
></scr` + `ipt>`;

function getStoredScriptTag() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
  } catch (_) {}
  return DEFAULT_SCRIPT_TAG;
}

function setStoredScriptTag(tag) {
  try {
    localStorage.setItem(STORAGE_KEY, tag.trim());
  } catch (_) {}
}

/**
 * Parse script tag HTML string and inject a real script element (so it executes).
 * Scripts added via innerHTML do not run; we must create an element and copy src + attributes.
 */
function injectChatScriptFromTag(tagHtml) {
  const container = document.getElementById('chat-script-container');
  if (!container) return;

  const wrapped = '<div id="script-tag-parse-root">' + tagHtml + '</div>';
  const doc = new DOMParser().parseFromString(wrapped, 'text/html');
  const parsedScript = doc.querySelector('#script-tag-parse-root script');
  if (!parsedScript) return;

  const script = document.createElement('script');
  if (parsedScript.src) script.src = parsedScript.src;
  script.async = true;

  for (const attr of parsedScript.attributes) {
    script.setAttribute(attr.name, attr.value);
  }

  container.appendChild(script);
}

function init() {
  const textarea = document.getElementById('script-tag');
  const applyBtn = document.getElementById('apply-refresh');

  const currentTag = getStoredScriptTag();
  textarea.value = currentTag;
  textarea.placeholder = 'Paste your full <script>...</script> tag here...';

  injectChatScriptFromTag(currentTag);

  applyBtn.addEventListener('click', () => {
    const tag = textarea.value.trim();
    if (!tag) {
      textarea.value = currentTag;
      return;
    }
    if (!tag.includes('<script') || !tag.includes('</script>')) {
      alert('Please enter a valid script tag (must contain <script ... </script>).');
      return;
    }
    setStoredScriptTag(tag);
    window.location.reload();
  });
}

init();

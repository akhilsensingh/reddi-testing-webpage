(async function () {
  const script = document.currentScript;
  const inputPlaceholder = "Ask me anything";
  const integrationIdFromScript = script.dataset.integrationId || "";
  const dataCompanyEnvFromScript = script.dataset.companyEnv || "development";

  // These values used throughout the widget; we populate them from config fetched by integrationId.
  let minimizedLauncherText = "Smart";
  let launcherType = "";
  let headerLogo = "";
  let companyName = "";
  let agentLogo = "";
  let launcherLogo = "";
  let brandColor = "#E0E2E7";
  let brandSecondaryColor = "#E0E2E7";
  let bubbleColor = "#E0E2E7";
  let bubbleTextTightness = "normal";
  let bubblePadding = 12;
  let bubbleBorderRadius = 7;
  let bubbleShadow = "soft";
  let bannerImage = "";
  let positionWidth = "300";
  let positionHeight = "300";
  let position = "bottom-left";
  let cornerRadius = "8";
  let integrationId = integrationIdFromScript;
  let companyDescription = "I'm Verizon's Smart Assistant";
  let dataCompanyEnv = dataCompanyEnvFromScript;

  const apiEndpoint = "https://webhook.dev.phinite.ai/api/v1/ai/chat_integration/conversations"; // constant API

  const continueEndpoint = `https://webhook.dev.phinite.ai/api/v1/ai/chat_integration/conversations`;

  // Page origin for API requests (Origin is a forbidden header in fetch, so we send it as X-Origin)
  const pageOrigin = typeof window !== "undefined" ? window.location.origin : "";

  async function fetchWidgetConfigFromApi(integrationIdParam, envParam, originParam) {
    const encodedIntegrationId = encodeURIComponent(integrationIdParam || "");
    const encodedEnv = encodeURIComponent(envParam || "development");
    const encodedOrigin = encodeURIComponent(originParam || "");
    const configEndpoint = `https://webhook.dev.phinite.ai/api/v1/chat-bot/${encodedIntegrationId}/${encodedEnv}/${encodedOrigin}`;

    const response = await fetch(configEndpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Config API failed with status ${response.status}`);
    }
    return response.json();
  }

  // Fetch widget config using integration id + env + origin.
  // NOTE: This must complete before the widget styles/DOM are generated.
  let widgetConfig = null;
  try {
    widgetConfig = await fetchWidgetConfigFromApi(
      integrationIdFromScript,
      dataCompanyEnvFromScript,
      pageOrigin,
    );
  } catch (err) {
    console.error("Widget config API error:", err);
    widgetConfig = null;
  }

  // Do not render the widget until configuration is fetched successfully.
  if (!widgetConfig || typeof widgetConfig !== "object") {
    return;
  }

  minimizedLauncherText = widgetConfig.minimizedLauncherText || minimizedLauncherText;
  launcherType = String(widgetConfig.launcherType ?? launcherType);
  headerLogo = widgetConfig.headerImage || headerLogo;
  companyName = widgetConfig.agentName || companyName;
  agentLogo = widgetConfig.agentImage || agentLogo;
  launcherLogo = widgetConfig.launcherImage || launcherLogo;
  brandColor = widgetConfig.brandPrimaryColor || brandColor;
  brandSecondaryColor = widgetConfig.brandSecondaryColor || brandSecondaryColor;
  bubbleColor = widgetConfig.bubbleColor || widgetConfig.brandSecondaryColor || bubbleColor;
  bubbleTextTightness = widgetConfig.bubbleTextTightness || bubbleTextTightness;
  bubblePadding = Number(widgetConfig.bubblePadding ?? bubblePadding);
  bubbleBorderRadius = Number(widgetConfig.bubbleBorderRadius ?? bubbleBorderRadius);
  bubbleShadow = widgetConfig.bubbleShadow || bubbleShadow;

  function getBubbleLineHeight(tightness) {
    if (tightness === "tight") return "1.3";
    if (tightness === "relaxed") return "1.6";
    return "1.45";
  }

  function getBubbleShadowStyle(shadow) {
    if (shadow === "none") return "none";
    if (shadow === "medium") return "0 4px 12px rgba(0,0,0,0.12)";
    return "0 1px 2px rgba(0,0,0,0.06)";
  }

  const bubbleLineHeight = getBubbleLineHeight(bubbleTextTightness);
  const bubbleShadowStyle = getBubbleShadowStyle(bubbleShadow);
  const bubblePaddingPx = Number.isFinite(bubblePadding)
    ? Math.max(6, Math.min(24, bubblePadding))
    : 12;
  const bubbleRadiusPx = Number.isFinite(bubbleBorderRadius)
    ? Math.max(2, Math.min(30, bubbleBorderRadius))
    : 8;
  bannerImage = widgetConfig.bannerLogo || bannerImage;
  positionWidth = String(widgetConfig.positionWidth ?? positionWidth);
  positionHeight = String(widgetConfig.positionHeight ?? positionHeight);
  position = widgetConfig.position || position;
  cornerRadius = String(widgetConfig.cornerRadius ?? cornerRadius);
  integrationId = widgetConfig.integrationid || integrationId;
  companyDescription = widgetConfig.description || companyDescription;

  // Function to determine if a color is dark or light
  function isDarkColor(color) {
    // Convert hex to RGB
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance using the formula: 0.299*R + 0.587*G + 0.114*B
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return true if the color is dark (luminance < 0.5)
    return luminance < 0.5;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Sanitize a URL: only allow http(s) and data: image URIs; block javascript:, vbscript:, etc.
  function sanitizeUrl(url) {
    if (typeof url !== "string") return "";
    var trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed)) return trimmed;
    if (/^\/[^\/]/.test(trimmed) || /^\.\//.test(trimmed) || /^#/.test(trimmed)) return trimmed;
    return "";
  }

  // Build a safe <img> tag using DOM APIs (prevents src injection)
  function safeImgTag(src, alt, style) {
    var img = document.createElement("img");
    img.src = sanitizeUrl(src);
    img.alt = alt || "";
    if (style) img.setAttribute("style", style);
    return img.outerHTML;
  }

  // Check if a line looks like a Markdown table row
  function isTableRow(line) {
    const t = line.trim();
    return t.length > 0 && t.startsWith("|") && (t.match(/\|/g) || []).length >= 2;
  }

  // Check if a row is a Markdown table separator (|---|---|)
  function isTableSeparator(cells) {
    return (
      cells.length > 0 &&
      cells.every(function (c) {
        return /^[-:\s]+$/.test(c);
      })
    );
  }

  // Parse Markdown table lines into HTML table
  function parseTableToHtml(tableLines) {
    var rows = tableLines.map(function (line) {
      return line
        .split("|")
        .map(function (c) {
          return c.trim();
        })
        .slice(1, -1);
    });
    if (rows.length === 0) return "";
    var headerRow = rows[0];
    var bodyRows = rows.slice(1);
    if (bodyRows.length > 0 && isTableSeparator(bodyRows[0])) {
      bodyRows = bodyRows.slice(1);
    }
    var theadCells = headerRow
      .map(function (c) {
        return "<th>" + escapeHtml(c) + "</th>";
      })
      .join("");
    var thead = "<thead><tr>" + theadCells + "</tr></thead>";
    var tbodyRows = bodyRows
      .map(function (row) {
        var cells = row
          .map(function (c) {
            return "<td>" + escapeHtml(c) + "</td>";
          })
          .join("");
        return "<tr>" + cells + "</tr>";
      })
      .join("");
    var tbody = "<tbody>" + tbodyRows + "</tbody>";
    return '<table class="chatbot-message-table">' + thead + tbody + "</table>";
  }

  // Markdown reply: same behavior as ChatMarkdownReply (GFM-style + tables)
  function unescapeLiteralNewlines(str) {
    return String(str).replace(/\\n/g, "\n");
  }

  function parseInlineMarkdown(html) {
    if (!html) return "";
    var out = html;
    out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/__(.+?)__/g, "<strong>$1</strong>");
    out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
    out = out.replace(/_(.+?)_/g, "<em>$1</em>");
    out = out.replace(/`([^`]+)`/g, function (_, code) {
      return "<code>" + code.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</code>";
    });
    out = out.replace(/\[([^\]]*)\]\(([^)]+)\)/g, function (_, text, url) {
      var safeHref = sanitizeUrl(url);
      if (!safeHref) return escapeHtml(text);
      return (
        '<a href="' +
        safeHref.replace(/"/g, "&quot;") +
        '" target="_blank" rel="noopener noreferrer">' +
        text +
        "</a>"
      );
    });
    return out;
  }

  function formatBotMessage(text) {
    if (!text || typeof text !== "string") return "";
    var raw = unescapeLiteralNewlines(text);
    var lines = raw.split("\n");
    var out = [];
    var i = 0;
    var inCodeBlock = false;
    var codeBlockLines = [];
    var codeBlockLang = "";

    while (i < lines.length) {
      var line = lines[i];
      var trimmed = line.trim();

      var codeFence = trimmed.match(/^```(\w*)\s*$/);
      if (codeFence) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = codeFence[1] || "";
          codeBlockLines = [];
        } else {
          inCodeBlock = false;
          var codeContent = codeBlockLines
            .map(function (l) {
              return escapeHtml(l);
            })
            .join("\n");
          out.push("<pre><code>" + codeContent + "</code></pre>");
        }
        i++;
        continue;
      }
      if (inCodeBlock) {
        codeBlockLines.push(line);
        i++;
        continue;
      }

      if (isTableRow(line)) {
        var tableLines = [];
        while (i < lines.length && isTableRow(lines[i])) {
          tableLines.push(lines[i]);
          i++;
        }
        out.push(parseTableToHtml(tableLines));
        continue;
      }

      var headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        var level = headerMatch[1].length;
        var headerText = parseInlineMarkdown(escapeHtml(headerMatch[2]));
        out.push("<h" + level + ">" + headerText + "</h" + level + ">");
        i++;
        continue;
      }
      if (/^-{3,}\s*$/.test(trimmed) || /^\*{3,}\s*$/.test(trimmed)) {
        out.push("<hr/>");
        i++;
        continue;
      }
      if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
        var listTag = /^\s*\d+\.\s+/.test(line) ? "ol" : "ul";
        var listItems = [];
        while (
          i < lines.length &&
          (/^\s*[-*+]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))
        ) {
          var liLine = lines[i];
          var bullet = liLine.replace(/^\s*[-*+]\s+/, "").replace(/^\s*\d+\.\s+/, "");
          listItems.push("<li>" + parseInlineMarkdown(escapeHtml(bullet)) + "</li>");
          i++;
        }
        out.push("<" + listTag + ">" + listItems.join("") + "</" + listTag + ">");
        continue;
      }

      var escaped = escapeHtml(line);
      out.push(parseInlineMarkdown(escaped) + "<br>");
      i++;
    }

    if (inCodeBlock && codeBlockLines.length) {
      var codeContent = codeBlockLines
        .map(function (l) {
          return escapeHtml(l);
        })
        .join("\n");
      out.push("<pre><code>" + codeContent + "</code></pre>");
    }

    return out.join("");
  }

  // Inject styles
  const style = document.createElement("style");
  style.textContent = `
    .chatbot-container {
      position: fixed;
      display: none; /* Initially hidden */
      z-index: 9999;
    }
    .chatbot-toggle {
      position: fixed;
      color: white;
      border: none;
      padding: 0;
      cursor: pointer;
      z-index: 9999;
    }
    .chatbot-container {
      height:600px;
      width: 400px;
      background: white;
      border: 1px solid #ccc;
      border-radius: ${cornerRadius}px;
      box-shadow: 0 0 12px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      font-family: sans-serif;
      transition: all 0.3s ease;
      overflow: hidden;
    }
    .chatbot-container.expanded {
      min-height: calc(100vh - ${parseInt(positionHeight) + 70}px);
      top: 3px !important;
      width: 1000px;
      max-height: 1200px;
    }

    .chatbot-mobile-close-btn {
      display: none; /* Hide on desktop */
      cursor: pointer;
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      background: none;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s ease;
      color: inherit;
    }
    .chatbot-mobile-close-btn:hover {
      opacity: 0.8;
    }

    @media (max-width: 640px) {
      .chatbot-mobile-close-btn {
        display: inline-flex !important; /* Show only on mobile screens */
      }
      .chatbot-container {
        width: 100% !important;
        height: 100% !important;
        max-height: 100% !important;
        min-height: 100% !important;
        border-radius: 0 !important;
        border: none !important;
        top: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        position: fixed !important;
      }
      /* Hide the float launcher button completely when the chat window is open on mobile */
      .chatbot-container:not([style*="display: none"]) ~ .chatbot-toggle {
        display: none !important;
      }
      .chatbot-toggle {
        right: 16px !important;
        bottom: 16px !important;
        left: auto !important;
        top: auto !important;
      }
    }

    .chatbot-close-btn {
      display: none !important; /* Hide maximize/minimize screen buttons as they are not needed */
      cursor: pointer;
      width: 20px;
      height: 20px;
      margin-left: auto;
      padding: 0;
      border: none;
      background: none;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s ease;
      filter: ${isDarkColor(brandColor) ? "brightness(0) invert(1)" : "brightness(0)"};
    }
    .chatbot-close-btn .icon-maximize,
    .chatbot-close-btn .icon-minimize {
      display: none;
    }
    .chatbot-close-btn .icon-maximize {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .chatbot-close-btn.expanded .icon-maximize {
      display: none;
    }
    .chatbot-close-btn.expanded .icon-minimize {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .chatbot-close-btn .icon-maximize svg,
    .chatbot-close-btn .icon-minimize svg {
      width: 24px;
      height: 24px;
    }
      
    .chatbot-toggle {
      background: #E0E2E7;
      color: black;
      border: none;
      padding: 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .chatbot-toggle--circle {
      width: 52px;
      height: 52px;
      min-width: 52px;
      min-height: 52px;
      border-radius: 50%;
    }
    .chatbot-toggle:not(.chatbot-toggle--circle) {
      padding: 10px 16px;
    }
    .chatbot-toggle.loading {
      pointer-events: none;
      cursor: wait;
    }
    .chatbot-toggle-loader {
      width: 24px;
      height: 24px;
      animation: chatbot-launcher-spin 0.7s linear infinite;
    }
    .chatbot-toggle--circle .chatbot-toggle-loader {
      width: 28px;
      height: 28px;
    }
    @keyframes chatbot-launcher-spin {
      to { transform: rotate(360deg); }
    }
    .chatbot-toggle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .chatbot-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      border-bottom: 1px solid #eee;
      border-top-left-radius: ${cornerRadius}px;
      border-top-right-radius: ${cornerRadius}px;
      padding: 0.8rem 1rem;
      gap: 14px;
      background-color: ${brandColor};
      color: ${isDarkColor(brandColor) ? "white" : "black"};
    }
    .chatbot-header img {
      width: 32px;
      height: 32px;
      min-width: 32px;
      min-height: 32px;
      margin-left: 8px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      flex-shrink: 0;
    }
    .chatbot-body {
      padding: 10px 14px 16px;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: #ccc transparent;
    }
    .chatbot-body::-webkit-scrollbar {
      width: 6px;
    }
    .chatbot-body::-webkit-scrollbar-track {
      background: transparent;
    }
    .chatbot-body::-webkit-scrollbar-thumb {
      background-color: #ccc;
      border-radius: 3px;
    }
    .chatbot-body::-webkit-scrollbar-thumb:hover {
      background-color: #999;
    }
    .chatbot-message {
      margin-bottom: 10px;
    }
    .chatbot-message.user {
      text-align: right;
      color: #007bff;
    }
    .chatbot-message.bot {
      text-align: left;
      color: #333;
    }
    .chat-bubble {
      position: relative;
      border-radius: ${bubbleRadiusPx}px;
      max-width: 80%;
      padding: ${bubblePaddingPx}px;
      border-width: 1px;
      border-style: solid;
      border-color: #E0E2E7;
      font-family: Inter, sans-serif;
      font-size: 14px;
      font-weight: 400;
      line-height: ${bubbleLineHeight};
      word-wrap: break-word;
      display: flex;
      flex-direction: column;
    }
    .chat-bubble--bot {
      background: #ffffff;
      border-color: #E0E2E7;
      box-shadow: ${bubbleShadowStyle};
    }
    .chat-bubble--user {
      background: ${bubbleColor};
      border-color: ${bubbleColor};
      box-shadow: ${bubbleShadowStyle};
    }
    .chat-bubble .chat-bubble-text {
      margin-bottom: 4px;
      overflow-x: auto;
      overflow-y: visible;
      min-width: 0;
      color: #1a1a1a;
      line-height: ${bubbleLineHeight};
      font-family: Inter, sans-serif;
      font-size: 14px;
    }
    .chat-bubble .chat-bubble-text p { margin: 0 0 0.25em 0; }
    .chat-bubble .chat-bubble-text p:last-child { margin-bottom: 0; }
    .chat-bubble .chat-bubble-text p + p { margin-top: 1.25em; }
    .chat-bubble .chat-bubble-text ul + p,
    .chat-bubble .chat-bubble-text ol + p { margin-top: 1.25em; }
    .chat-bubble .chat-bubble-text h1 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0 0.25em 0; line-height: 1.3; }
    .chat-bubble .chat-bubble-text h2 { font-size: 1.3em; font-weight: 700; margin: 0.5em 0 0.25em 0; line-height: 1.35; }
    .chat-bubble .chat-bubble-text h3 { font-size: 1.15em; font-weight: 600; margin: 0.45em 0 0.2em 0; line-height: 1.4; }
    .chat-bubble .chat-bubble-text h4 { font-size: 1.08em; font-weight: 600; margin: 0.4em 0 0.2em 0; line-height: 1.4; }
    .chat-bubble .chat-bubble-text h5 { font-size: 1.02em; font-weight: 600; margin: 0.35em 0 0.15em 0; line-height: 1.4; }
    .chat-bubble .chat-bubble-text h6 { font-size: 0.98em; font-weight: 600; margin: 0.3em 0 0.15em 0; line-height: 1.4; }
    .chat-bubble .chat-bubble-text hr {
      margin: 1em 0;
      border: 0;
      border-top: 1px solid #E0E2E7;
      opacity: 0.6;
    }
    .chat-bubble .chat-bubble-text strong { font-weight: 700; }
    .chat-bubble .chat-bubble-text em { font-style: italic; }
    .chat-bubble .chat-bubble-text a {
      color: #2563EB;
      text-decoration: underline;
      text-underline-offset: 2px;
      font-weight: 500;
      word-break: break-word;
    }
    .chat-bubble .chat-bubble-text a:hover { color: #1D4ED8; }
    .chat-bubble .chat-bubble-text a[target="_blank"]::after { content: ""; }
    .chat-bubble .chat-bubble-text code {
      background-color: rgba(0,0,0,0.06);
      color: #1a1a1a;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: ui-monospace, monospace;
      font-size: 0.875em;
    }
    .chat-bubble .chat-bubble-text pre {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 12px;
      overflow-x: auto;
      font-family: ui-monospace, monospace;
      font-size: 0.875em;
      border: 1px solid #E0E2E7;
      margin: 0.5em 0;
    }
    .chat-bubble .chat-bubble-text pre code {
      background: none;
      padding: 0;
    }
    .chat-bubble .chat-bubble-text ul,
    .chat-bubble .chat-bubble-text ol {
      list-style-position: outside;
      padding-left: 1.25rem;
      margin: 0.15em 0;
    }
    .chat-bubble .chat-bubble-text ul { list-style-type: disc; }
    .chat-bubble .chat-bubble-text ol { list-style-type: decimal; }
    .chat-bubble .chat-bubble-text .chatbot-message-table {
      border-collapse: collapse;
      width: 100%;
      margin: 8px 0;
      border: 1px solid #E0E2E7;
      border-radius: 8px;
      overflow: hidden;
    }
    .chat-bubble .chat-bubble-text .chatbot-message-table th {
      background-color: #f3f4f6;
      border: 1px solid #E0E2E7;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 0.875em;
    }
    .chat-bubble .chat-bubble-text .chatbot-message-table td {
      border: 1px solid #E0E2E7;
      padding: 8px 12px;
      font-size: 0.875em;
    }
    .chat-bubble .chat-bubble-text .chatbot-message-table tr:nth-of-type(even) { background-color: #f9fafb; }
    .chat-bubble .chat-bubble-text .chatbot-message-table tr:nth-of-type(odd) { background-color: #fff; }
    .chat-bubble .chat-bubble-time {
      font-size: 11px;
      color: #8D8D96;
    }
    .chat-bubble--user .chat-bubble-time {
      text-align: right;
    }
    .chat-message-block {
      display: flex;
      flex-direction: column;
      margin-bottom: 1rem;
      align-items: flex-start;
    }
    .chat-message-block--user {
      align-items: flex-end;
    }
    .chat-sender-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
    }
    .chat-sender-row--user {
      flex-direction: row-reverse;
    }
    .chat-sender-label {
      font-size: 12px;
      font-weight: 400;
      color: #8D8D96;
      font-family: Inter, sans-serif;
    }
    .chat-sender-avatar {
      width: 36px;
      height: 36px;
      min-width: 36px;
      min-height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
      object-fit: cover;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #374151;
      background: #E0E2E7;
    }
    .chat-sender-avatar.user-avatar {
      background: #7C44FF;
      color: #fff;
    }
    .chat-bubble-row {
      display: flex;
      align-items: flex-start;
      gap: 0;
      width: 100%;
      max-width: 100%;
    }
    .chat-bubble-row--user {
      flex-direction: row-reverse;
    }
    .chat-image-reply {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      max-width: 100%;
      font-family: Inter, sans-serif;
    }
    .chat-image-reply-thumb {
      width: 72px;
      height: 72px;
      min-width: 72px;
      min-height: 72px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #E0E2E7;
      background: #f3f4f6;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      flex-shrink: 0;
    }
    .chat-image-reply-thumb:hover {
      border-color: #d1d5db;
      background: #e5e7eb;
    }
    .chat-image-reply-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .chat-image-reply-thumb-error {
      cursor: default;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chat-image-reply-thumb-error svg {
      width: 20px;
      height: 20px;
      color: #9ca3af;
    }
    .chat-image-lightbox {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(0,0,0,0.9);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .chat-image-lightbox.is-open {
      display: flex;
    }
    .chat-image-lightbox-content {
      position: relative;
      max-width: 95vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .chat-image-lightbox-content img {
      max-width: 100%;
      max-height: 85vh;
      object-fit: contain;
      border-radius: 8px;
    }
    .chat-image-lightbox-close {
      position: absolute;
      top: -40px;
      right: 0;
      width: 36px;
      height: 36px;
      border: none;
      background: rgba(255,255,255,0.2);
      color: #fff;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chat-image-lightbox-close:hover {
      background: rgba(255,255,255,0.3);
    }
    .chat-image-lightbox-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 12px;
      padding: 8px 16px;
      background: rgba(255,255,255,0.1);
      border-radius: 999px;
      color: #fff;
      font-size: 12px;
    }
    .chat-image-lightbox-download {
      border: none;
      background: transparent;
      color: #fff;
      cursor: pointer;
      padding: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .chat-image-lightbox-download:hover {
      color: #a78bfa;
    }
    .chat-media-stack {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
      width: 100%;
      min-width: 0;
      font-family: Inter, sans-serif;
    }
    .chat-media-stack .chat-image-reply {
      margin-top: 0;
    }
    .chat-audio-reply,
    .chat-video-reply,
    .chat-document-reply {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      min-width: 0;
    }
    .chat-audio-card,
    .chat-video-card {
      width: 100%;
      max-width: 520px;
      min-width: 0;
      border-radius: 8px;
      border: 1px solid #E0E2E7;
      background: #fff;
      overflow: hidden;
    }
    .chat-audio-card {
      padding: 16px;
    }
    .chat-media-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .chat-media-card-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }
    .chat-media-icon {
      width: 36px;
      height: 36px;
      min-width: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .chat-media-icon--audio {
      background: #f5f3ff;
      color: #7c3aed;
    }
    .chat-media-icon--video {
      background: #eff6ff;
      color: #3b82f6;
    }
    .chat-media-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }
    .chat-media-name {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      word-break: break-all;
    }
    .chat-media-sub {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
    }
    .chat-media-download {
      width: 28px;
      height: 28px;
      min-width: 28px;
      border: none;
      background: transparent;
      color: #6b7280;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      padding: 0;
      flex-shrink: 0;
    }
    .chat-media-download:hover {
      color: #7c3aed;
      background: rgba(0,0,0,0.04);
    }
    .chat-audio-card audio {
      width: 100%;
      height: 40px;
      margin-top: 8px;
      border-radius: 999px;
    }
    .chat-video-card-header {
      padding: 12px;
      border-bottom: 1px solid #E0E2E7;
    }
    .chat-video-player-wrap {
      position: relative;
      width: 100%;
      padding-top: 56.25%;
      background: #000;
    }
    .chat-video-player-wrap video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .chat-document-card {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      min-width: 0;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #E0E2E7;
      background: transparent;
    }
    .chat-document-icon {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border-radius: 6px;
      border: 1px solid #E0E2E7;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .chat-document-icon img {
      width: 20px;
      height: 20px;
      object-fit: contain;
    }
    .chat-document-info {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
    }
    .chat-document-ext {
      font-size: 12px;
      color: #6b7280;
      white-space: nowrap;
    }
    .chatbot-input {
      display: flex;
      flex-shrink: 0;
      padding: 0.5rem 1rem 1rem;
      flex-direction: column;
      gap: 8px;
    }
    .chat-attachment-preview-wrap {
      width: 100%;
      max-height: 56px;
      overflow-x: auto;
      overflow-y: hidden;
      flex-shrink: 0;
      font-family: Inter, sans-serif;
    }
    .chat-attachment-preview-wrap::-webkit-scrollbar {
      height: 4px;
    }
    .chat-attachment-preview-wrap::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 2px;
    }
    .chat-attachment-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
      padding: 2px 0;
      width: max-content;
      min-width: 100%;
    }
    .chat-attachment-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      background: #f3f4f6;
      border: 1px solid #E0E2E7;
      color: #374151;
      padding: 4px 8px 4px 8px;
      border-radius: 8px;
      max-width: 180px;
      font-size: 12px;
    }
    .chat-attachment-chip-icon {
      width: 20px;
      height: 20px;
      min-width: 20px;
      min-height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .chat-attachment-chip-icon img {
      width: 20px;
      height: 20px;
      object-fit: contain;
      opacity: 0.85;
    }
    .chat-attachment-chip-name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chat-attachment-chip-remove {
      width: 20px;
      height: 20px;
      min-width: 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      padding: 0;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .chat-attachment-chip-remove:hover {
      background: rgba(0,0,0,0.08);
      color: #374151;
    }
    .chat-message-input {
      position: relative;
      width: 100%;
      border-radius: 8px;
      border: 1px solid #E0E2E7;
      background: #fff;
      transition: border-color 0.2s, box-shadow 0.2s;
      font-family: Inter, sans-serif;
    }
    .chat-message-input:focus-within {
      outline: none;
      box-shadow: 0 0 0 1px #E0E2E7;
    }
    .chat-message-input-inner {
      display: flex;
      flex-direction: column;
      padding: 8px;
      gap: 8px;
    }
    .chat-message-input .chat-input-textarea-wrap {
      position: relative;
      width: 100%;
      min-height: 72px;
    }
    .chat-message-input .input-chatbot {
      position: relative;
      z-index: 10;
      width: 100%;
      min-height: 72px;
      max-height: 300px;
      resize: none;
      border: 0;
      padding: 0;
      margin: 0;
      background: transparent;
      font-size: 14px;
      line-height: 1.5;
      outline: none;
      box-shadow: none;
      border-radius: 0;
      display: block;
      flex: none;
    }
    .chat-message-input .input-chatbot::placeholder {
      color: #8D8D96;
    }
    .chat-input-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .chat-input-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .chat-input-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .chat-attach-btn {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      padding: 0;
    }
    .chat-attach-btn:hover {
      background: rgba(0,0,0,0.05);
      color: #374151;
    }
    .chat-attach-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .chat-send-btn {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border: none;
      background: transparent;
      border-radius: 50%;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      padding: 0;
    }
    .chat-send-btn:hover:not(:disabled) {
      background: rgba(0,0,0,0.05);
      color: #111;
    }
    .chat-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .chat-message-input .hidden {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
      pointer-events: none;
    }
    .chat-input-origin-error {
      padding: 10px 12px;
      margin: 8px 12px 10px;
      background: #fef2f2;
      color: #b91c1c;
      font-size: 13px;
      border-radius: 8px;
      border: 1px solid #fecaca;
    }
    .chat-input-origin-error-detail {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: #991b1b;
    }

    .chatbot-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chatbot-header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chatbot-input textarea {
      transition: height 0.2s ease;
      overflow-y: auto;
      font-family: inherit;
    }
    .chatbot-welcome {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 0.75rem 1rem 0.5rem;
      min-height: 0;
    }
    .welcome-avatar {
      margin-bottom: 0.35rem;
    }
    .welcome-avatar img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid #e0e0e0;
    }
    .welcome-content {
      max-width: 250px;
    }
    .welcome-name {
      margin: 0 0 0.2rem 0;
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }
    .welcome-message {
      margin: 0;
      font-size: 12px;
      font-weight: 400;
      color: #666;
      line-height: 1.35;
    }
      
      .chat-ended-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        min-height: 116px;
        width: 100%;
      }
      .chat-ended-title {
        margin: 0 0 13px 0;
        font-size: 12px;
        font-weight: 500;
        color: #8D8D96;
      }
      .start-chat-btn {
        background: ${brandSecondaryColor};
        color: ${brandColor};
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.2s ease;
        min-width: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .start-chat-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .start-chat-btn.loading {
        pointer-events: none;
        opacity: 0.8;
        cursor: wait;
      }
      .start-chat-btn .loader {
        display: flex;
        gap: 3px;
      }
      .start-chat-btn .loader span {
        animation: loadingDot 1.4s infinite;
        opacity: 0.5;
        color: currentColor;
        font-weight: 700;
        font-size: 18px;
      }
      .start-chat-btn .loader span:nth-of-type(2) {
        animation-delay: 0.2s;
      }
      .start-chat-btn .loader span:nth-of-type(3) {
        animation-delay: 0.4s;
      }
      .chat-ended-origin-error {
        padding: 10px 12px;
        margin: 0 12px 12px;
        background: #fef2f2;
        color: #b91c1c;
        font-size: 13px;
        border-radius: 8px;
        border: 1px solid #fecaca;
        max-width: 100%;
        box-sizing: border-box;
      }
      .chat-ended-origin-error-detail {
        display: block;
        margin-top: 6px;
        font-size: 12px;
        color: #991b1b;
      }
      .powered-by {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 10px;
        color: #999;
      }
      .powered-by-text {
        flex-shrink: 0;
        text-align: center;
        font-size: 10px;
        color: #999;
        padding: 8px 0;
        margin-top: 0px;
      }
      .input-chatbot {
      transition: height 0.2s ease;
    }
    .chatbot-send-btn.chat-send-btn {
      color: ${brandColor};
    }
    .chatbot-send-btn.chat-send-btn:hover:not(:disabled) {
      color: ${brandColor};
      background: rgba(0,0,0,0.05);
    }

      #brand-icon {

        width: 20px;
        height: 20px;
      }

    .chatbot-message {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          margin-bottom: 10px;
          border: 1px solid #E0E2E7;
          border-radius: 12px;
          position: relative;
    }

      .chatbot-message.bot {
        justify-content: flex-start;
        margin-right: auto;
        background-color: #f0f0f0; /* Light grey background for bot messages */
      }

      .chatbot-message.user {
        justify-content: flex-end;
        margin-left: auto;
        background-color: #E0E2E7; /* Different color for user messages */
      }

      .chatbot-message img {
        width: 24px;
        height: 24px;
        margin-right: 10px; /* Space between icon and text */
      }

      .chatbot-message.user img {
        order: 1; /* Place the icon after the text for user messages */
        margin-right: 0;
        margin-left: 10px; /* Space between text and icon */
      }

      .chatbot-message-table {
        width: 100%;
        min-width: max-content;
        border-collapse: collapse;
        margin: 8px 0;
        font-size: 13px;
      }
      .chatbot-message-table th,
      .chatbot-message-table td {
        border: 1px solid #e0e0e0;
        padding: 8px 10px;
        text-align: left;
      }
      .chatbot-message-table th {
        background-color: #f0f0f0;
        font-weight: 600;
      }
      .chatbot-message-table tr:nth-child(even) {
        background-color: #fafafa;
      }

      @keyframes loadingDot {
        0%, 20% {
          opacity: 0.3;
          transform: translateY(0);
        }
        50% {
          opacity: 1;
          transform: translateY(-2px);
        }
        80%, 100% {
          opacity: 0.3;
          transform: translateY(0);
        }
      }
  `;
  document.head.appendChild(style);

  function getChatInputHTML() {
    return `
      <div class="chat-attachment-preview-wrap" id="chat-attachment-preview-wrap" style="display: none;">
        <div class="chat-attachment-preview" id="chat-attachment-preview"></div>
      </div>
      <div class="chat-message-input">
        <div class="chat-message-input-inner">
          <input type="file" multiple class="hidden" id="chatbot-file-input" aria-hidden>
          <div class="chat-input-textarea-wrap">
            <textarea class="input-chatbot" id="chatbot-input" placeholder="${inputPlaceholder}" rows="1"></textarea>
          </div>
          <div class="chat-input-row">
            <div class="chat-input-left">
              <button type="button" class="chat-attach-btn chatbot-attach-btn" aria-label="Add attachment">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
            </div>
            <div class="chat-input-right">
              <button type="button" id="chatbot-send" class="chatbot-send-btn chat-send-btn" aria-label="Send">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  var FILE_TYPE_ICONS = {
    pdf: "https://storage.googleapis.com/phinite-public/pdf.svg",
    doc: "https://storage.googleapis.com/phinite-public/doc.svg",
    docx: "https://storage.googleapis.com/phinite-public/doc.svg",
    xls: "https://storage.googleapis.com/phinite-public/xls.svg",
    xlsx: "https://storage.googleapis.com/phinite-public/xls.svg",
    ppt: "https://storage.googleapis.com/phinite-public/ppt.svg",
    pptx: "https://storage.googleapis.com/phinite-public/ppt.svg",
    txt: "https://storage.googleapis.com/phinite-public/txt.svg",
    csv: "https://storage.googleapis.com/phinite-public/csv.svg",
    html: "https://storage.googleapis.com/phinite-public/html.svg",
    md: "https://storage.googleapis.com/phinite-public/md.svg",
    zip: "https://storage.googleapis.com/phinite-public/zip.svg",
  };
  var DEFAULT_DOC_ICON = "https://storage.googleapis.com/phinite-public/doc.svg";

  function getFileExtension(name) {
    var parts = name.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  }

  function getDocumentIconUrl(file) {
    var ext = getFileExtension(file.name);
    return FILE_TYPE_ICONS[ext] || DEFAULT_DOC_ICON;
  }

  function getFileKind(file) {
    if (file.type.indexOf("image/") === 0) return "image";
    if (file.type.indexOf("audio/") === 0) return "audio";
    if (file.type.indexOf("video/") === 0) return "video";
    return "document";
  }

  var pendingAttachments = [];
  var MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024; // 100MB — per chat_integration API

  function addFilesToPending(fileList) {
    if (!fileList || !fileList.length) return;
    var rejected = [];
    for (var i = 0; i < fileList.length; i++) {
      var file = fileList[i];
      if (file.size > MAX_ATTACHMENT_BYTES) {
        rejected.push(file.name);
        continue;
      }
      pendingAttachments.push(file);
    }
    if (rejected.length) {
      window.alert(
        "These files exceed the 100MB limit and were not added:\n" + rejected.join("\n"),
      );
    }
    renderAttachmentPreview();
  }

  function filesToMediaOptions(files) {
    var images = [];
    var audio = [];
    var video = [];
    var documents = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var kind = getFileKind(f);
      var item = {
        id: "user-" + kind + "-" + i + "-" + Date.now(),
        url: URL.createObjectURL(f),
        name: f.name,
        metadata: {
          filename: f.name,
          size: f.size,
          mimeType: f.type || "",
        },
      };
      if (kind === "image") images.push(item);
      else if (kind === "audio") audio.push(item);
      else if (kind === "video") video.push(item);
      else documents.push(item);
    }
    return {
      images: images,
      audio: audio,
      video: video,
      documents: documents,
    };
  }

  function bindAttachmentControls(root) {
    var scope = root || document;
    var attachBtn = scope.querySelector ? scope.querySelector(".chatbot-attach-btn") : null;
    var fileInput = scope.querySelector ? scope.querySelector("#chatbot-file-input") : null;
    if (!attachBtn || !fileInput) return;
    attachBtn.addEventListener("click", function () {
      if (attachBtn.disabled || fileInput.disabled) return;
      fileInput.click();
    });
    fileInput.addEventListener("change", function () {
      var files = fileInput.files;
      if (files && files.length) {
        addFilesToPending(files);
      }
      fileInput.value = "";
    });
    renderAttachmentPreview();
  }

  function setComposerDisabled(disabled) {
    var inputEl = document.getElementById("chatbot-input");
    var sendEl = document.getElementById("chatbot-send");
    var attachEl = document.querySelector(".chatbot-attach-btn");
    var fileEl = document.getElementById("chatbot-file-input");
    if (inputEl) inputEl.disabled = disabled;
    if (sendEl) sendEl.disabled = disabled;
    if (attachEl) attachEl.disabled = disabled;
    if (fileEl) fileEl.disabled = disabled;
  }

  function renderAttachmentPreview() {
    var wrap = document.getElementById("chat-attachment-preview-wrap");
    var list = document.getElementById("chat-attachment-preview");
    if (!wrap || !list) return;
    list.innerHTML = "";
    if (pendingAttachments.length === 0) {
      wrap.style.display = "none";
      return;
    }
    wrap.style.display = "block";
    for (var i = 0; i < pendingAttachments.length; i++) {
      (function (idx) {
        var f = pendingAttachments[idx];
        var kind = getFileKind(f);
        var chip = document.createElement("div");
        chip.className = "chat-attachment-chip";
        var iconEl = document.createElement("div");
        iconEl.className = "chat-attachment-chip-icon";
        if (kind === "image") {
          iconEl.innerHTML =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
        } else if (kind === "audio") {
          iconEl.innerHTML =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
        } else if (kind === "video") {
          iconEl.innerHTML =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>';
        } else {
          var img = document.createElement("img");
          img.src = getDocumentIconUrl(f);
          img.alt = "";
          iconEl.appendChild(img);
        }
        var nameEl = document.createElement("span");
        nameEl.className = "chat-attachment-chip-name";
        nameEl.textContent = f.name;
        chip.dataset.index = String(idx);
        var removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "chat-attachment-chip-remove";
        removeBtn.setAttribute("aria-label", "Remove " + f.name);
        removeBtn.innerHTML =
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        removeBtn.addEventListener("click", function () {
          var i = parseInt(chip.dataset.index, 10);
          pendingAttachments.splice(i, 1);
          renderAttachmentPreview();
        });
        chip.appendChild(iconEl);
        chip.appendChild(nameEl);
        chip.appendChild(removeBtn);
        list.appendChild(chip);
      })(i);
    }
  }

  // Create chatbot HTML
  const container = document.createElement("div");
  container.className = "chatbot-container";
  container.style.display = "none";
  container.innerHTML = `
  <div class="chatbot-header">
    <div class="chatbot-header-left">
      ${
        headerLogo
          ? safeImgTag(headerLogo, "logo")
          : `<img src="public/canvas-studio-logo.svg" alt="Smart Chatbot"/>`
      }
      <strong>${escapeHtml(companyName)}</strong>
      </div>
      <div class="chatbot-header-right">
        <button type="button" class="chatbot-close-btn" aria-label="Toggle maximize">
          <span class="icon-maximize"><i data-lucide="maximize"></i></span>
          <span class="icon-minimize"><i data-lucide="minimize"></i></span>
        </button>
        <button type="button" class="chatbot-mobile-close-btn" aria-label="Close Chat">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
    <div class="chatbot-body" id="chatbot-body">
        <div class="chatbot-welcome" id="chatbot-welcome">
            <div class="welcome-avatar">
                ${safeImgTag(bannerImage, "Bot Avatar")}
            </div>
            <div class="welcome-content">
                <h3 class="welcome-name" >${escapeHtml(companyName || "Dev Bot")}</h3>
                <p class="welcome-message">${escapeHtml(companyDescription || "Who are you?")}</p>
            </div>
        </div>
    </div>
    <div class="chatbot-input" id="chatbot-input-container">
      ${getChatInputHTML()}
    </div>
    <div class="powered-by-text">Powered By Phinite.ai</div>
  `;
  // <img class="" src="https://phinite-bot.s3.ap-south-1.amazonaws.com/right-arrow.png" alt="send" />
  document.body.appendChild(container);

  // Load Lucide and render header icons (maximize when minimized, minimize when maximized)
  (function initLucideIcons(rootEl) {
    if (typeof lucide !== "undefined") {
      lucide.createIcons({ root: rootEl });
      return;
    }
    var s = document.createElement("script");
    s.src = "https://unpkg.com/lucide@latest/dist/umd/lucide.min.js";
    s.onload = function () {
      lucide.createIcons({ root: rootEl });
    };
    document.head.appendChild(s);
  })(container);

  // Image reply lightbox (single global overlay)
  var currentLightboxImage = null;
  var imageLightbox = document.createElement("div");
  imageLightbox.className = "chat-image-lightbox";
  imageLightbox.id = "chat-image-lightbox";
  imageLightbox.innerHTML = `
    <div class="chat-image-lightbox-content">
      <button type="button" class="chat-image-lightbox-close" aria-label="Close">&times;</button>
      <img id="chat-image-lightbox-img" src="" alt="" />
      <div class="chat-image-lightbox-bar">
        <span id="chat-image-lightbox-filename"></span>
        <button type="button" class="chat-image-lightbox-download" aria-label="Download">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(imageLightbox);
  (function () {
    var lb = document.getElementById("chat-image-lightbox");
    var lbImg = document.getElementById("chat-image-lightbox-img");
    var lbFilename = document.getElementById("chat-image-lightbox-filename");
    var closeBtn = lb.querySelector(".chat-image-lightbox-close");
    var downloadBtn = lb.querySelector(".chat-image-lightbox-download");
    function closeLightbox() {
      lb.classList.remove("is-open");
      currentLightboxImage = null;
    }
    closeBtn.addEventListener("click", closeLightbox);
    lb.addEventListener("click", function (e) {
      if (e.target === lb) closeLightbox();
    });
    downloadBtn.addEventListener("click", function () {
      if (!currentLightboxImage || !currentLightboxImage.url) return;
      var name = getImageDisplayFilename(currentLightboxImage, "image.jpg");
      var url = currentLightboxImage.url;
      if (url.indexOf("storage.googleapis.com") !== -1) {
        var sep = url.indexOf("?") !== -1 ? "&" : "?";
        url =
          url +
          sep +
          "response-content-disposition=attachment%3Bfilename%3D" +
          encodeURIComponent(name);
      }
      var a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
    window.chatImageLightboxClose = closeLightbox;
  })();

  function getImageDisplayFilename(item, defaultLabel) {
    return getMediaDisplayFilename(item, defaultLabel);
  }

  function getMediaDisplayFilename(item, defaultLabel) {
    if (item && item.name && String(item.name).trim()) {
      return String(item.name).trim();
    }
    if (item && item.metadata && item.metadata.filename && String(item.metadata.filename).trim()) {
      return String(item.metadata.filename).trim();
    }
    if (item && item.url) {
      try {
        var pathname = new URL(item.url).pathname;
        var segment = pathname.split("/").filter(Boolean).pop();
        if (segment) return decodeURIComponent(segment);
      } catch (e) {}
    }
    return defaultLabel;
  }

  function formatMediaFileSize(bytes) {
    if (!bytes && bytes !== 0) return "";
    var mb = bytes / (1024 * 1024);
    if (mb < 1) {
      var kb = bytes / 1024;
      return kb < 1 ? bytes + " B" : kb.toFixed(1) + " KB";
    }
    return mb.toFixed(1) + " MB";
  }

  function formatMediaDuration(seconds) {
    if (!seconds && seconds !== 0) return "";
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ":" + String(secs).padStart(2, "0");
  }

  function triggerMediaDownload(url, filename) {
    if (!url) return;
    var downloadUrl = url;
    try {
      if (url.indexOf("storage.googleapis.com") !== -1) {
        var sep = url.indexOf("?") !== -1 ? "&" : "?";
        downloadUrl =
          url +
          sep +
          "response-content-disposition=" +
          encodeURIComponent('attachment; filename="' + filename + '"');
      }
      var a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
    }
  }

  function toMediaItem(raw, index, prefix) {
    if (!raw) return null;
    if (typeof raw === "string") {
      return {
        id: prefix + "-" + index,
        url: raw,
        metadata: {},
      };
    }
    var meta = raw.metadata || {};
    var url = raw.url || meta.thumbnail || raw.src || "";
    if (!url) return null;
    if (raw.name && !meta.filename) meta.filename = raw.name;
    return {
      id: raw.id || prefix + "-" + index,
      url: url,
      name: raw.name || meta.filename || "",
      metadata: meta,
      type: raw.type || "",
    };
  }

  function normalizeMediaUrlList(list, prefix) {
    var out = [];
    if (!Array.isArray(list)) return out;
    for (var i = 0; i < list.length; i++) {
      var item = toMediaItem(list[i], i, prefix);
      if (item) out.push(item);
    }
    return out;
  }

  function extractMediaFromResponse(response, topLevel) {
    var images = [];
    var audio = [];
    var video = [];
    var documents = [];
    var resp = response && typeof response === "object" ? response : {};
    var root = topLevel && typeof topLevel === "object" ? topLevel : {};

    images = normalizeMediaUrlList(resp.images || resp.image || root.images || root.image, "img");
    audio = normalizeMediaUrlList(resp.audio || root.audio, "audio");
    video = normalizeMediaUrlList(resp.video || root.video, "video");
    documents = normalizeMediaUrlList(
      resp.document || resp.documents || root.document || root.documents,
      "doc",
    );

    var contentList = resp.content || root.content;
    if (Array.isArray(contentList)) {
      for (var c = 0; c < contentList.length; c++) {
        var item = contentList[c];
        if (!item) continue;
        var type = String(item.type || "").toLowerCase();
        var mime = String(
          (item.metadata && item.metadata.mimeType) || item.mimeType || "",
        ).toLowerCase();
        var normalized = toMediaItem(item, c, "content");
        if (!normalized) continue;
        if (type === "image" || mime.indexOf("image/") === 0) images.push(normalized);
        else if (type === "audio" || mime.indexOf("audio/") === 0) audio.push(normalized);
        else if (type === "video" || mime.indexOf("video/") === 0) video.push(normalized);
        else if (type === "document" || type === "file" || mime) documents.push(normalized);
        else if (normalized.url) images.push(normalized);
      }
    }

    return { images: images, audio: audio, video: video, documents: documents };
  }

  function createDownloadButton(onClick) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chat-media-download";
    btn.setAttribute("aria-label", "Download");
    btn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    btn.addEventListener("click", onClick);
    return btn;
  }

  function appendImageReply(container, images) {
    if (!images || !images.length) return;
    var imageReplyWrap = document.createElement("div");
    imageReplyWrap.className = "chat-image-reply";
    for (var idx = 0; idx < images.length; idx++) {
      (function (image, i) {
        var meta = image.metadata || {};
        var item = {
          id: image.id || "img-" + i + "-" + Date.now(),
          url: image.url || meta.thumbnail || "",
          metadata: meta,
          name: image.name || "",
        };
        var thumb = document.createElement("div");
        thumb.className = "chat-image-reply-thumb";
        var imgUrl = item.url || (item.metadata && item.metadata.thumbnail);
        if (!imgUrl) {
          thumb.classList.add("chat-image-reply-thumb-error");
          thumb.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
          imageReplyWrap.appendChild(thumb);
          return;
        }
        var thumbImg = document.createElement("img");
        thumbImg.src = imgUrl;
        thumbImg.alt = getMediaDisplayFilename(item, "Image");
        thumbImg.loading = i === 0 ? "eager" : "lazy";
        thumbImg.onerror = function () {
          thumb.classList.add("chat-image-reply-thumb-error");
          thumb.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
        };
        thumb.appendChild(thumbImg);
        thumb.addEventListener("click", function () {
          currentLightboxImage = item;
          var lb = document.getElementById("chat-image-lightbox");
          var lbImg = document.getElementById("chat-image-lightbox-img");
          var lbFilename = document.getElementById("chat-image-lightbox-filename");
          if (lb && lbImg) {
            lbImg.src = item.url || item.metadata.thumbnail || "";
            lbImg.alt = getMediaDisplayFilename(item, "Image");
            if (lbFilename) lbFilename.textContent = getMediaDisplayFilename(item, "Image");
            lb.classList.add("is-open");
          }
        });
        imageReplyWrap.appendChild(thumb);
      })(images[idx], idx);
    }
    container.appendChild(imageReplyWrap);
  }

  function appendAudioReply(container, audioItems) {
    if (!audioItems || !audioItems.length) return;
    var wrap = document.createElement("div");
    wrap.className = "chat-audio-reply";
    for (var i = 0; i < audioItems.length; i++) {
      (function (audio) {
        var meta = audio.metadata || {};
        var name = getMediaDisplayFilename(audio, "Audio file");
        var card = document.createElement("div");
        card.className = "chat-audio-card";

        var header = document.createElement("div");
        header.className = "chat-media-card-header";

        var left = document.createElement("div");
        left.className = "chat-media-card-left";
        left.innerHTML =
          '<div class="chat-media-icon chat-media-icon--audio"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>';

        var metaEl = document.createElement("div");
        metaEl.className = "chat-media-meta";
        var nameEl = document.createElement("div");
        nameEl.className = "chat-media-name";
        nameEl.title = name;
        nameEl.textContent = name;
        var subEl = document.createElement("div");
        subEl.className = "chat-media-sub";
        var parts = [];
        if (meta.duration) parts.push(formatMediaDuration(meta.duration));
        if (meta.size) parts.push(formatMediaFileSize(meta.size));
        if (meta.mimeType) parts.push(String(meta.mimeType).split("/")[1].toUpperCase());
        subEl.textContent = parts.join(" • ");
        metaEl.appendChild(nameEl);
        if (parts.length) metaEl.appendChild(subEl);
        left.appendChild(metaEl);

        header.appendChild(left);
        header.appendChild(
          createDownloadButton(function () {
            triggerMediaDownload(
              audio.url,
              name !== "Audio file" ? name : "audio-" + audio.id + ".mp3",
            );
          }),
        );
        card.appendChild(header);

        if (audio.url) {
          var player = document.createElement("audio");
          player.controls = true;
          player.preload = "metadata";
          var source = document.createElement("source");
          source.src = audio.url;
          source.type = meta.mimeType || "audio/mpeg";
          player.appendChild(source);
          card.appendChild(player);
        }
        wrap.appendChild(card);
      })(audioItems[i]);
    }
    container.appendChild(wrap);
  }

  function appendVideoReply(container, videoItems) {
    if (!videoItems || !videoItems.length) return;
    var wrap = document.createElement("div");
    wrap.className = "chat-video-reply";
    for (var i = 0; i < videoItems.length; i++) {
      (function (video) {
        var meta = video.metadata || {};
        var name = getMediaDisplayFilename(video, "Video file");
        var card = document.createElement("div");
        card.className = "chat-video-card";

        var header = document.createElement("div");
        header.className = "chat-video-card-header chat-media-card-header";

        var left = document.createElement("div");
        left.className = "chat-media-card-left";
        left.innerHTML =
          '<div class="chat-media-icon chat-media-icon--video"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></div>';

        var metaEl = document.createElement("div");
        metaEl.className = "chat-media-meta";
        var nameEl = document.createElement("div");
        nameEl.className = "chat-media-name";
        nameEl.title = name;
        nameEl.textContent = name;
        var subEl = document.createElement("div");
        subEl.className = "chat-media-sub";
        var parts = [];
        if (meta.duration) parts.push(formatMediaDuration(meta.duration));
        if (meta.dimensions && meta.dimensions.width && meta.dimensions.height) {
          parts.push(meta.dimensions.width + "x" + meta.dimensions.height);
        }
        if (meta.size) parts.push(formatMediaFileSize(meta.size));
        if (meta.mimeType) parts.push(String(meta.mimeType).split("/")[1].toUpperCase());
        subEl.textContent = parts.join(" • ");
        metaEl.appendChild(nameEl);
        if (parts.length) metaEl.appendChild(subEl);
        left.appendChild(metaEl);

        header.appendChild(left);
        header.appendChild(
          createDownloadButton(function () {
            triggerMediaDownload(
              video.url,
              name !== "Video file" ? name : "video-" + video.id + ".mp4",
            );
          }),
        );
        card.appendChild(header);

        if (video.url) {
          var playerWrap = document.createElement("div");
          playerWrap.className = "chat-video-player-wrap";
          var player = document.createElement("video");
          player.controls = true;
          player.preload = "metadata";
          if (meta.thumbnail) player.poster = meta.thumbnail;
          var source = document.createElement("source");
          source.src = video.url;
          source.type = meta.mimeType || "video/mp4";
          player.appendChild(source);
          playerWrap.appendChild(player);
          card.appendChild(playerWrap);
        }
        wrap.appendChild(card);
      })(videoItems[i]);
    }
    container.appendChild(wrap);
  }

  function appendDocumentReply(container, documentItems) {
    if (!documentItems || !documentItems.length) return;
    var wrap = document.createElement("div");
    wrap.className = "chat-document-reply";
    for (var i = 0; i < documentItems.length; i++) {
      (function (doc) {
        var meta = doc.metadata || {};
        var name = getMediaDisplayFilename(doc, "Document");
        var ext = getFileExtension(name).toUpperCase();
        var sizeStr = meta.size ? formatMediaFileSize(meta.size) : "";
        var card = document.createElement("div");
        card.className = "chat-document-card";

        var icon = document.createElement("div");
        icon.className = "chat-document-icon";
        var img = document.createElement("img");
        img.src = getDocumentIconUrl({ name: name });
        img.alt = "";
        icon.appendChild(img);

        var info = document.createElement("div");
        info.className = "chat-document-info";
        var nameEl = document.createElement("div");
        nameEl.className = "chat-media-name";
        nameEl.title = name;
        nameEl.textContent = name;
        info.appendChild(nameEl);
        if (ext || sizeStr) {
          var extEl = document.createElement("span");
          extEl.className = "chat-document-ext";
          extEl.textContent = [ext, sizeStr].filter(Boolean).join(" · ");
          info.appendChild(extEl);
        }

        card.appendChild(icon);
        card.appendChild(info);
        card.appendChild(
          createDownloadButton(function () {
            triggerMediaDownload(doc.url, name !== "Document" ? name : "document-" + doc.id);
          }),
        );
        wrap.appendChild(card);
      })(documentItems[i]);
    }
    container.appendChild(wrap);
  }

  function appendMediaReplies(container, media) {
    if (!media) return;
    var hasAny =
      (media.images && media.images.length) ||
      (media.audio && media.audio.length) ||
      (media.video && media.video.length) ||
      (media.documents && media.documents.length);
    if (!hasAny) return;
    var stack = document.createElement("div");
    stack.className = "chat-media-stack";
    appendImageReply(stack, media.images);
    appendAudioReply(stack, media.audio);
    appendVideoReply(stack, media.video);
    appendDocumentReply(stack, media.documents);
    container.appendChild(stack);
  }

  // Function to set positions based on position parameter
  function setPositions() {
    const containerStyle = container.style;
    const toggleStyle = toggleBtn.style;

    // Do not set manual inline positioning coordinates on mobile screens
    if (window.innerWidth <= 640) {
      containerStyle.left = "";
      containerStyle.bottom = "";
      containerStyle.right = "";
      containerStyle.top = "";

      toggleStyle.left = "";
      toggleStyle.bottom = "";
      toggleStyle.right = "";
      toggleStyle.top = "";
      return;
    }

    if (position === "bottom-left") {
      // Container positioned from left and bottom
      containerStyle.left = `${parseInt(positionWidth)}px`;
      containerStyle.bottom = `${parseInt(positionHeight) + 70}px`;
      containerStyle.right = "auto";
      containerStyle.top = "auto";

      // Toggle button positioned from left and bottom
      toggleStyle.left = `${parseInt(positionWidth)}px`;
      toggleStyle.bottom = `${parseInt(positionHeight)}px`;
      toggleStyle.right = "auto";
      toggleStyle.top = "auto";
    } else if (position === "bottom-right") {
      // Container positioned from right and bottom
      containerStyle.right = `${parseInt(positionWidth)}px`;
      containerStyle.bottom = `${parseInt(positionHeight) + 70}px`;
      containerStyle.left = "auto";
      containerStyle.top = "auto";

      // Toggle button positioned from right and bottom
      toggleStyle.right = `${parseInt(positionWidth) + 10}px`;
      toggleStyle.bottom = `${parseInt(positionHeight) + 10}px`;
      toggleStyle.left = "auto";
      toggleStyle.top = "auto";
    } else {
      // Default: bottom-right
      containerStyle.right = `${positionWidth}px`;
      containerStyle.bottom = `${positionHeight + 70}px`;
      containerStyle.left = "auto";
      containerStyle.top = "auto";

      toggleStyle.right = `${positionWidth}px`;
      toggleStyle.bottom = `${positionHeight}px`;
      toggleStyle.left = "auto";
      toggleStyle.top = "auto";
    }
  }

  // Toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "chatbot-toggle";

  // Set different styles based on launcherType
  if (launcherType === "0") {
    // Circular button ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ fixed size for perfect circle, logo fills the circle
    toggleBtn.classList.add("chatbot-toggle--circle");
    toggleBtn.style.cssText = `
      background: ${brandSecondaryColor};
      color: black;
      border: none;
      padding: 0;
      width: 52px;
      height: 52px;
      min-width: 52px;
      min-height: 52px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 9999;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    `;
    toggleBtn.innerHTML = launcherLogo
      ? safeImgTag(launcherLogo, "logo")
      : `<img src="public/canvas-studio-logo.svg" alt="Smart Chatbot"/>`;
  } else if (launcherType === "1") {
    // Button with logo + text (like first screenshot)
    toggleBtn.style.cssText = `
      background: ${brandSecondaryColor};
      color:  ${brandColor};;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    toggleBtn.innerHTML = `
      ${safeImgTag(launcherLogo || "public/canvas-studio-logo.svg", "logo", "width:24px; height:24px")}
      <span></span>
    `;
    toggleBtn.querySelector("span").textContent = minimizedLauncherText;
  } else if (launcherType === "2") {
    // Button with just text (like second screenshot)
    toggleBtn.style.cssText = `
      background: ${brandSecondaryColor};
      color:  ${brandColor};;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      z-index: 9999;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    toggleBtn.textContent = minimizedLauncherText;
  }

  document.body.appendChild(toggleBtn);

  // Set initial positions
  setPositions();

  const chatBody = container.querySelector("#chatbot-body");
  const inputBox = container.querySelector("#chatbot-input");
  const sendBtn = container.querySelector("#chatbot-send");
  const closeBtn = container.querySelector(".chatbot-close-btn");
  bindAttachmentControls(container);

  // Mobile Close functionality (simulates toggle click to trigger closing state changes)
  const mobileCloseBtn = container.querySelector(".chatbot-mobile-close-btn");
  if (mobileCloseBtn) {
    mobileCloseBtn.addEventListener("click", function () {
      toggleBtn.click();
    });
  }

  // Toggle expand/shrink functionality
  closeBtn.addEventListener("click", function () {
    const isExpanded = container.classList.contains("expanded");
    if (isExpanded) {
      // Shrink back to normal size
      container.classList.remove("expanded");
      closeBtn.classList.remove("expanded");
      closeBtn.setAttribute("aria-label", "Maximize");
    } else {
      // Expand to 2x size
      container.classList.add("expanded");
      closeBtn.classList.add("expanded");
      closeBtn.setAttribute("aria-label", "Minimize");
    }
  });

  // Track if this is the first time opening the chat
  let isFirstTime = true;
  let hasActiveSession = false;
  let isLauncherLoading = false;

  var launcherLoaderHtml =
    '<span class="chatbot-toggle-loader" aria-hidden="true"><svg style="width:100%;height:100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="24 48"><circle cx="12" cy="12" r="10"/></svg></span>';

  toggleBtn.addEventListener("click", async function () {
    const isOpen = container.style.display !== "none";

    if (!isOpen) {
      if (isLauncherLoading) return;

      // PERSISTENCE: Restore history if this is the first time but we have a saved session for THIS integration
      if (isFirstTime) {
        const storedIntegrationId = localStorage.getItem("stored_integration_id");
        const existingSession = localStorage.getItem("session_id");
        const existingHistory = JSON.parse(localStorage.getItem("chat_history") || "[]");

        if (existingSession && existingHistory.length > 0) {
          if (storedIntegrationId === integrationId) {
            // Restore messages one by one silently (without re-saving)
            existingHistory.forEach(function (msg) {
              addMessage(
                msg.text,
                msg.sender,
                Object.assign({}, msg.options, {
                  skipSave: true,
                  timestamp: msg.timestamp,
                }),
              );
            });
            isFirstTime = false;
            hasActiveSession = true;

            const lastMsg = existingHistory[existingHistory.length - 1];
            if (lastMsg && lastMsg.options) {
              const lastStatus = lastMsg.options.status;
              if (
                lastStatus === "complete" ||
                lastStatus === "completed" ||
                lastStatus === "transferred"
              ) {
                // Ensure UI is initialized before showing chat ended screen
                setTimeout(() => showChatEndedScreen(), 10);
              }
            }
          } else {
            // Integration ID changed: clear old session and start fresh
            localStorage.removeItem("session_id");
            localStorage.removeItem("chat_history");
            localStorage.removeItem("stored_integration_id");
          }
        }
      }

      if (isFirstTime) {
        isLauncherLoading = true;
        toggleBtn.classList.add("loading");
        toggleBtn.innerHTML = launcherLoaderHtml;
      }
      // Opening the chat
      if (isFirstTime) {
        // First time: Make API call to get session_id and display the first bot message
        try {
          const res = await fetch(apiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Origin": pageOrigin },
            body: JSON.stringify({
              integration_id: integrationId,
              env: dataCompanyEnv,
            }),
          });

          const data = await res.json();
          if (data && data.detail === "Invalid origin") {
            var inputContainer = container.querySelector("#chatbot-input-container");
            var inputEl = container.querySelector("#chatbot-input");
            var sendEl = container.querySelector("#chatbot-send");
            if (inputContainer && !container.querySelector(".chat-input-origin-error")) {
              var errDiv = document.createElement("div");
              errDiv.className = "chat-input-origin-error";
              errDiv.innerHTML =
                'Invalid origin<br><span class="chat-input-origin-error-detail">It seems your origin was not added while configuration setup. Please contact the configuration team.</span>';
              inputContainer.parentNode.insertBefore(errDiv, inputContainer);
            }
            if (inputEl) {
              inputEl.disabled = true;
              inputEl.placeholder = "";
            }
            if (sendEl) sendEl.disabled = true;
          } else if (data.error) {
            addMessage(String(data.error), "bot");
          } else if (data.session_id) {
            localStorage.setItem("session_id", data.session_id);
            localStorage.setItem("stored_integration_id", integrationId);
            const messageText =
              (typeof data.response === "object" && data.response?.query) ||
              data.response?.query ||
              (typeof data.response === "string" ? data.response : "") ||
              "How can I help you today?";
            var startMedia = extractMediaFromResponse(
              typeof data.response === "object" ? data.response : {},
              data,
            );
            var startOptions = {
              status: data.status,
              requires_input: data.requires_input,
            };
            if (startMedia.images.length) startOptions.images = startMedia.images;
            if (startMedia.audio.length) startOptions.audio = startMedia.audio;
            if (startMedia.video.length) startOptions.video = startMedia.video;
            if (startMedia.documents.length) startOptions.documents = startMedia.documents;
            addMessage(messageText, "bot", startOptions);
            hasActiveSession = true;
          }
        } catch (err) {
          console.error("API error:", err);
          addMessage("Error reaching server.", "bot");
        } finally {
          isLauncherLoading = false;
        }
        isFirstTime = false;
      } else {
        // Subsequent times: Just show the existing chat
        // Check if there's an existing session
        const existingSession = localStorage.getItem("session_id");
        if (existingSession) {
          hasActiveSession = true;
        }
      }
    } else {
      // Closing the chat - don't clear session, just hide
      // Keep the session_id and chat content for next time
    }

    container.style.display = isOpen ? "none" : "flex";

    // Update button content based on launcherType (removes loader when loading just finished)
    toggleBtn.classList.remove("loading");
    if (launcherType === "0") {
      // Circular button ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ same circle dimensions, logo fills when open
      toggleBtn.innerHTML = isOpen
        ? launcherLogo
          ? safeImgTag(launcherLogo, "logo")
          : `<img src="public/canvas-studio-logo.svg" alt="Smart Chatbot"/>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>`;
      toggleBtn.style.cssText = `
           background: ${isOpen ? brandSecondaryColor : brandColor};
           color: ${isOpen ? "white" : "black"};
           border: none;
           padding: 0;
           width: 52px;
           height: 52px;
           min-width: 52px;
           min-height: 52px;
           border-radius: 50%;
           cursor: pointer;
           z-index: 9999;
           display: inline-flex;
           align-items: center;
           justify-content: center;
           overflow: hidden;
      `;
      setPositions();
    } else if (launcherType === "1") {
      // Button with logo + text
      if (isOpen) {
        toggleBtn.innerHTML = `${safeImgTag(launcherLogo || "public/canvas-studio-logo.svg", "logo", "width:24px; height:24px")}
             <span></span>`;
        toggleBtn.querySelector("span").textContent = minimizedLauncherText;
      } else {
        toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" style="color: white; padding-top: 2px;" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <line x1="18" y1="6" x2="6" y2="18"></line>
             <line x1="6" y1="6" x2="18" y2="18"></line>
           </svg>`;
      }
      toggleBtn.style.cssText = `
         background: ${isOpen ? brandSecondaryColor : brandColor};
         color:  ${isOpen ? brandColor : "white"};;
         border: none;
         border-radius: ${isOpen ? "20px" : "50%"};
         margin-top: ${isOpen ? "0px" : "6px"};
         cursor: pointer;
         z-index: 9999;
         font-size: 14px;
         font-weight: 500;
         box-shadow: 0 2px 8px rgba(0,0,0,0.1);
         ${
           isOpen
             ? `display: flex;
           align-items: center;
           gap: 8px;`
             : ""
         }
         `;
      setPositions();
    } else if (launcherType === "2") {
      // Button with just text
      if (isOpen) {
        toggleBtn.innerHTML = `<span></span>`;
        toggleBtn.querySelector("span").textContent = minimizedLauncherText;
      } else {
        toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" style="color: white; padding-top: 2px;" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <line x1="18" y1="6" x2="6" y2="18"></line>
             <line x1="6" y1="6" x2="18" y2="18"></line>
           </svg>`;
      }
      toggleBtn.style.cssText = `
         background: ${isOpen ? brandSecondaryColor : brandColor};
         color:  ${isOpen ? brandColor : "white"};;
         border: none;
         border-radius: ${isOpen ? "20px" : "50%"};
         margin-top: ${isOpen ? "0px" : "4px"};
         cursor: pointer;
         z-index: 9999;
         font-size: 14px;
         font-weight: 500;
         box-shadow: 0 2px 8px rgba(0,0,0,0.1);
       `;
      setPositions();
    }
  });

  // Track if this is the first bot message (welcome message)
  let isFirstBotMessage = true;

  function formatSenderTime(date) {
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return isToday ? "Today " + timeStr : date.toLocaleDateString() + " " + timeStr;
  }

  function addMessage(text, sender = "bot", options) {
    options = options || {};
    var images = Array.isArray(options.images) ? options.images : [];
    var audio = Array.isArray(options.audio) ? options.audio : [];
    var video = Array.isArray(options.video) ? options.video : [];
    var documents = Array.isArray(options.documents) ? options.documents : [];
    var msgTimestamp = options.timestamp ? new Date(options.timestamp) : new Date();
    var hasText = text != null && String(text).trim() !== "";
    var hasMedia =
      images.length > 0 || audio.length > 0 || video.length > 0 || documents.length > 0;

    // PERSISTENCE: Save message to localStorage unless skipSave is true
    if (!options.skipSave) {
      var chatHistory = JSON.parse(localStorage.getItem("chat_history") || "[]");
      chatHistory.push({
        text: text,
        sender: sender,
        options: options,
        timestamp: msgTimestamp.toISOString(),
      });
      localStorage.setItem("chat_history", JSON.stringify(chatHistory));
    }

    // Check if there are existing messages (excluding welcome screen)
    const existingMessages = chatBody.querySelectorAll(".chat-message-block");
    const hasExistingMessages = existingMessages.length > 0;

    const messageBlock = document.createElement("div");
    messageBlock.className =
      "chat-message-block" + (sender === "user" ? " chat-message-block--user" : "");

    // Sender row: avatar + name, Today time (above the bubble)
    const senderRow = document.createElement("div");
    senderRow.className = "chat-sender-row" + (sender === "user" ? " chat-sender-row--user" : "");

    const avatar = document.createElement(sender === "bot" ? "img" : "div");
    avatar.className = "chat-sender-avatar" + (sender === "user" ? " user-avatar" : "");

    if (sender === "bot") {
      avatar.src = agentLogo || "public/canvas-studio-logo.svg";
      avatar.alt = companyName || "Bot";
    } else {
      avatar.textContent = "Y";
    }

    const senderLabel = document.createElement("span");
    senderLabel.className = "chat-sender-label";
    const senderName = sender === "bot" ? companyName || "Bot" : "You";
    senderLabel.textContent = senderName + ", " + formatSenderTime(msgTimestamp);

    senderRow.appendChild(avatar);
    senderRow.appendChild(senderLabel);

    // Bubble row: bubble directly under sender row (aligned under avatar to cover gap)
    const bubbleRow = document.createElement("div");
    bubbleRow.className = "chat-bubble-row" + (sender === "user" ? " chat-bubble-row--user" : "");

    const messageBubble = document.createElement("div");
    messageBubble.className =
      "chat-bubble " + (sender === "bot" ? "chat-bubble--bot" : "chat-bubble--user");

    if (hasText) {
      const messageText = document.createElement("div");
      messageText.className = "chat-bubble-text";

      if (sender === "bot") {
        const formattedText = formatBotMessage(text);
        messageText.innerHTML = formattedText;
      } else {
        messageText.textContent = text;
      }

      messageBubble.appendChild(messageText);
    }

    // Media replies (image / audio / video / document) — mirrors Chat*Reply components
    if (hasMedia) {
      appendMediaReplies(messageBubble, {
        images: images,
        audio: audio,
        video: video,
        documents: documents,
      });
    }

    bubbleRow.appendChild(messageBubble);

    messageBlock.appendChild(senderRow);
    messageBlock.appendChild(bubbleRow);
    chatBody.appendChild(messageBlock);

    const welcomeEl = document.getElementById("chatbot-welcome");
    if (welcomeEl) welcomeEl.style.display = "none";

    // Only scroll if it's a user message or if there are existing messages
    if (sender === "user" || hasExistingMessages) {
      chatBody.scrollTop = chatBody.scrollHeight;
    } else {
      // For the first bot message, ensure we're at the top
      chatBody.scrollTop = 0;
    }

    // Always allow scroll so long messages (e.g. first bot message) are never clipped
    chatBody.style.overflowY = "auto";

    // Mark that we've had the first bot message
    if (sender === "bot") {
      isFirstBotMessage = false;
    }
  }

  async function sendMessage() {
    // Get current input elements
    const currentInputBox = document.getElementById("chatbot-input");
    const currentSendBtn = document.getElementById("chatbot-send");

    if (!currentInputBox || !currentSendBtn) {
      console.error("Input elements not found");
      return;
    }

    const userMessage = currentInputBox.value.trim();
    const filesToSend = pendingAttachments.slice();
    if (!userMessage && filesToSend.length === 0) return;

    // Disable composer while sending
    setComposerDisabled(true);

    var userMsgOptions = filesToSend.length ? filesToMediaOptions(filesToSend) : {};
    addMessage(userMessage, "user", userMsgOptions);
    currentInputBox.value = "";
    pendingAttachments = [];
    renderAttachmentPreview();
    const sessionId = localStorage.getItem("session_id");

    // Add loading animation
    const loadingContainer = document.createElement("div");
    loadingContainer.className = "loading-container";
    loadingContainer.style.cssText = `
      display: flex;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 8px;
    `;

    const loadingAvatar = document.createElement("img");
    loadingAvatar.src = agentLogo || "public/canvas-studio-logo.svg";
    loadingAvatar.alt = "Agent";
    loadingAvatar.style.cssText = `
      width: 36px;
      height: 36px;
      min-width: 36px;
      min-height: 36px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      margin-top: 8px;
    `;

    const loadingBubble = document.createElement("div");
    loadingBubble.style.cssText = `
      background-color: #F9F9F9;
      color: #000000;
      padding: 12px 16px;
      border-radius: 12px;
      max-width: 70%;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.4;
      word-wrap: break-word;
      display: flex;
      align-items: center;
      gap: 4px;
    `;

    const loadingDots = document.createElement("div");
    loadingDots.innerHTML = "<span>.</span><span>.</span><span>.</span>";
    loadingDots.style.cssText = `
      display: flex;
      gap: 2px;
    `;

    // Add animation to dots
    const dots = loadingDots.querySelectorAll("span");
    dots.forEach((dot, index) => {
      dot.style.cssText = `
        animation: loadingDot 1.4s infinite;
        animation-delay: ${index * 0.2}s;
        opacity: 0.3;
      `;
    });

    // Add timestamp inside the bubble
    const timestamp = document.createElement("div");
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    timestamp.textContent = timeString;
    timestamp.style.cssText = `
       font-size: 11px;
       color: ${isDarkColor(brandColor) ? "#e8e8e8" : "#8D8D96"};
       ${"text-align: left;"}
     `;

    loadingBubble.appendChild(loadingDots);
    loadingContainer.appendChild(loadingAvatar);
    loadingContainer.appendChild(loadingBubble);
    chatBody.appendChild(loadingContainer);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      var fetchOpts;
      if (filesToSend.length > 0) {
        // Multipart: raw files via "files" field — server uploads to GCP & categorizes
        var formData = new FormData();
        formData.append("message", userMessage);
        for (var fi = 0; fi < filesToSend.length; fi++) {
          formData.append("files", filesToSend[fi], filesToSend[fi].name);
        }
        fetchOpts = {
          method: "POST",
          body: formData,
        };
      } else {
        fetchOpts = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            image: [],
            audio: [],
            video: [],
            document: [],
          }),
        };
      }

      const response = await fetch(`${continueEndpoint}/${sessionId}`, fetchOpts);

      if (!response.ok || !response.body) {
        if (response.status === 404) {
          try {
            const errData = await response.json();
            if (errData.error === "Session not found" && errData.status === "error") {
              console.warn("Session not found (404), restarting chat automatically...");
              await restartChat(true);
              return;
            }
          } catch (e) {
            // If body is not JSON or doesn't match, fall through to default error
          }
        }
        throw new Error("Streaming failed");
      }

      const reader = response.body.getReader();

      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      // Extract one complete JSON object from the start of the buffer (handles concatenated JSON)
      function extractOneJson(str) {
        const start = str.indexOf("{");
        if (start === -1) return null;
        let depth = 0;
        let inString = false;
        let escape = false;
        let quoteChar = null;
        for (let i = start; i < str.length; i++) {
          const c = str[i];
          if (escape) {
            escape = false;
            continue;
          }
          if (inString) {
            if (c === "\\") escape = true;
            else if (c === quoteChar) inString = false;
            continue;
          }
          if (c === '"' || c === "'") {
            inString = true;
            quoteChar = c;
            continue;
          }
          if (c === "{") depth++;
          else if (c === "}") {
            depth--;
            if (depth === 0) {
              try {
                const obj = JSON.parse(str.substring(start, i + 1));
                return { obj, endIndex: i + 1 };
              } catch (e) {
                return null;
              }
            }
          }
        }
        return null;
      }

      let streamDone = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse every complete JSON object in the buffer (server may send multiple concatenated)
        while (true) {
          const extracted = extractOneJson(buffer);
          if (!extracted) break;

          const parsed = extracted.obj;
          buffer = buffer.slice(extracted.endIndex).trim();

          try {
            if (parsed.error) {
              const existingLoading = chatBody.querySelector(".loading-container");
              if (existingLoading) existingLoading.remove();

              var errOptions = {};
              if (parsed.status) errOptions.status = parsed.status;
              else errOptions.status = "completed"; // Always end session on error
              if (parsed.requires_input !== undefined)
                errOptions.requires_input = parsed.requires_input;

              addMessage("Error: " + parsed.error, "bot", errOptions);
              if (parsed.error === "Session not found" && parsed.status === "error") {
                console.warn("Session not found in error payload, restarting...");
                await restartChat(true);
                return;
              }
              throw new Error(parsed.error);
            }

            if (parsed.response || parsed.status || parsed.requires_input !== undefined) {
              const existingLoading = chatBody.querySelector(".loading-container");
              if (existingLoading) existingLoading.remove();

              let addedMessage = false;
              if (parsed.response !== undefined && parsed.response !== null) {
                var responseText = "";
                if (typeof parsed.response.query === "string") responseText = parsed.response.query;
                else if (typeof parsed.response === "string") responseText = parsed.response;

                var media = extractMediaFromResponse(
                  typeof parsed.response === "object" ? parsed.response : {},
                  parsed,
                );
                var hasMedia =
                  media.images.length > 0 ||
                  media.audio.length > 0 ||
                  media.video.length > 0 ||
                  media.documents.length > 0;

                if (responseText.trim() !== "" || hasMedia) {
                  var msgOptions = {};
                  if (media.images.length > 0) msgOptions.images = media.images;
                  if (media.audio.length > 0) msgOptions.audio = media.audio;
                  if (media.video.length > 0) msgOptions.video = media.video;
                  if (media.documents.length > 0) msgOptions.documents = media.documents;
                  if (parsed.status) msgOptions.status = parsed.status;
                  if (parsed.requires_input !== undefined)
                    msgOptions.requires_input = parsed.requires_input;
                  addMessage(responseText, "bot", msgOptions);
                  addedMessage = true;
                }
              }

              if (!addedMessage && (parsed.status || parsed.requires_input !== undefined)) {
                // Update the last message in history with the latest status so reload knows exact state
                var chatHist = JSON.parse(localStorage.getItem("chat_history") || "[]");
                if (chatHist.length > 0) {
                  var lastMsgObj = chatHist[chatHist.length - 1];
                  lastMsgObj.options = lastMsgObj.options || {};
                  if (parsed.status) lastMsgObj.options.status = parsed.status;
                  if (parsed.requires_input !== undefined)
                    lastMsgObj.options.requires_input = parsed.requires_input;
                  localStorage.setItem("chat_history", JSON.stringify(chatHist));
                }
              }
              chatBody.scrollTop = chatBody.scrollHeight;
            }

            const isTurnEnd =
              parsed.status === "complete" ||
              parsed.status === "completed" ||
              parsed.requires_input === true ||
              parsed.status === "waiting_for_input" ||
              parsed.status === "transferred";

            if (isTurnEnd) {
              if (parsed.status === "complete" || parsed.status === "completed") {
                showChatEndedScreen();
              } else if (parsed.status === "transferred") {
                showChatEndedScreen();
              }
              streamDone = true;
              break;
            }
          } catch (err) {
            console.error("Streaming error:", err);
            throw err;
          }
        }

        if (streamDone) break;
      }
    } catch (err) {
      console.error("Streaming error:", err);

      // Remove loading animation if present
      const existingLoading = chatBody.querySelector(".loading-container");
      if (existingLoading) {
        existingLoading.remove();
      }

      showChatEndedScreen();
    } finally {
      setComposerDisabled(false);
      const currentInputBox = document.getElementById("chatbot-input");
      if (currentInputBox) currentInputBox.focus();
    }
  }

  // Function to show chat ended screen (optional originError: show "Invalid origin" message in UI)
  function showChatEndedScreen(originError) {
    const inputContainer = document.getElementById("chatbot-input-container");
    const inputBox = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");
    const poweredByDiv = document.querySelector(".powered-by-text");

    // Hide input and send button
    if (inputBox) inputBox.style.display = "none";
    if (sendBtn) sendBtn.style.display = "none";
    if (poweredByDiv) poweredByDiv.style.display = "none";
    // Show chat ended screen; if originError, show Invalid origin at marked place
    const errorBlock = originError
      ? `<div class="chat-ended-origin-error">Invalid origin<br><span class="chat-ended-origin-error-detail">It seems your origin was not added while configuration setup. Please contact the configuration team.</span></div>`
      : "";
    inputContainer.innerHTML = `
      <div class="chat-ended-screen">
        <h3 class="chat-ended-title">Chat Ended</h3>
        ${errorBlock}
        <button class="start-chat-btn" onclick="restartChat()">Start Chat</button>
      </div>
    `;
  }

  function removeChatEndedScreen() {
    const inputContainer = document.getElementById("chatbot-input-container");
    const chatEndedScreen = inputContainer.querySelector(".chat-ended-screen");

    // Hide chat ended screen
    if (chatEndedScreen) {
      chatEndedScreen.remove();
    }

    // Show input and send button
    const inputBox = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");

    if (inputBox) inputBox.style.display = "block";
    if (sendBtn) sendBtn.style.display = "block";

    // Focus on the input box
    if (inputBox) inputBox.focus();
  }

  async function restartChat(isAutomatic = false) {
    const startBtn = document.querySelector(".start-chat-btn");
    if (!isAutomatic && (!startBtn || startBtn.classList.contains("loading"))) return;

    // Clear old chat immediately to show transition
    if (chatBody) {
      chatBody.innerHTML = "";
    }

    if (isAutomatic && chatBody) {
      chatBody.innerHTML = `
        <div class="chat-ended-screen" style="height: 100%; justify-content: center;">
          <h3 class="chat-ended-title">Loading new chat session...</h3>
          <div class="loader" style="font-size: 32px; display: flex; gap: 4px; justify-content: center; color: ${brandColor};">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      `;
      // 3-second intentional delay for better UX transition
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    let originalBtnText = "";
    if (startBtn) {
      originalBtnText = startBtn.innerHTML;
      startBtn.classList.add("loading");
      startBtn.innerHTML =
        'Starting<span class="loader"><span>.</span><span>.</span><span>.</span></span>';
    }

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Origin": pageOrigin },
        body: JSON.stringify({
          integration_id: integrationId,
          env: dataCompanyEnv,
        }),
      });

      const data = await res.json();
      if (data && data.detail === "Invalid origin") {
        showChatEndedScreen(true);
        return;
      }
      if (data.error) {
        addMessage(String(data.error), "bot");
        return;
      }
      if (data.session_id) {
        // Clear old persistence on restart
        localStorage.setItem("session_id", data.session_id);
        localStorage.removeItem("chat_history");

        // Clear DOM history
        if (chatBody) {
          chatBody.innerHTML = "";
        }
        pendingAttachments = [];

        const messageText =
          (typeof data.response === "object" && data.response?.query) ||
          data.response?.query ||
          (typeof data.response === "string" ? data.response : "") ||
          "How can I help you today?";
        var restartMedia = extractMediaFromResponse(
          typeof data.response === "object" ? data.response : {},
          data,
        );
        var restartOptions = {
          status: data.status,
          requires_input: data.requires_input,
        };
        if (restartMedia.images.length) restartOptions.images = restartMedia.images;
        if (restartMedia.audio.length) restartOptions.audio = restartMedia.audio;
        if (restartMedia.video.length) restartOptions.video = restartMedia.video;
        if (restartMedia.documents.length) restartOptions.documents = restartMedia.documents;
        addMessage(messageText, "bot", restartOptions);

        // Reset first-time flag since we're starting a new session
        isFirstTime = false;
        hasActiveSession = true;

        // Restore the input and send button after restarting
        const inputContainer = document.getElementById("chatbot-input-container");

        inputContainer.innerHTML = getChatInputHTML();

        // Re-use existing "Powered By" div (one already exists in initial HTML); remove any duplicates from previous clicks
        const container = inputContainer.parentNode;
        const existingPoweredBy = container.querySelectorAll(".powered-by-text");
        if (existingPoweredBy.length > 1) {
          for (let i = 1; i < existingPoweredBy.length; i++) {
            existingPoweredBy[i].remove();
          }
        }
        const poweredByEl = container.querySelector(".powered-by-text");
        if (poweredByEl) poweredByEl.style.display = "";

        pendingAttachments = [];
        // Re-bind input and button behavior
        const newInputBox = document.getElementById("chatbot-input");
        const newSendBtn = document.getElementById("chatbot-send");
        bindAttachmentControls(inputContainer);
        newInputBox.addEventListener("input", () => {
          window.autoResizeTextarea(newInputBox);
        });
        newInputBox.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            window.sendMessage();
          }
        });
        newSendBtn.addEventListener("click", () => {
          window.sendMessage();
        });
        newInputBox.focus();
      }
    } catch (err) {
      console.error("API error:", err);
      addMessage("Error reaching server.", "bot");
      if (startBtn) {
        startBtn.classList.remove("loading");
        startBtn.innerHTML = originalBtnText;
      }
    }
  }

  // Make restartChat globally accessible
  window.restartChat = restartChat;

  // Make sendMessage globally accessible
  window.sendMessage = sendMessage;

  // Make autoResizeTextarea globally accessible
  window.autoResizeTextarea = autoResizeTextarea;

  // Make addMessage globally accessible
  window.addMessage = addMessage;

  function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    if (textarea.value.trim() === "") {
      textarea.style.height = "72px";
    } else {
      const newHeight = Math.min(textarea.scrollHeight, 300);
      textarea.style.height = newHeight + "px";
    }
  }

  // Add event listeners for auto-resize
  inputBox.addEventListener("input", () => {
    autoResizeTextarea(inputBox);
  });

  // Handle Enter key (send message) and Shift+Enter (new line)
  inputBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener("click", sendMessage);

  // Re-run positioning on window resize to ensure correct styling for mobile vs desktop views
  window.addEventListener("resize", setPositions);
})();

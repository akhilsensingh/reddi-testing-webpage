# Chat integration script tag tester

Vite sample project to paste your **full script tag** for the chat integration and refresh the page so the widget loads accordingly.

## Run

```bash
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`).

## Usage

1. Paste your full `<script ...></script>` tag into the textarea (or edit the default one).
2. Click **Apply & refresh page**.
3. The page reloads and the chat integration is injected from your tag (same `src` and all `data-*` attributes).

The tag is stored in `localStorage` so it persists until you change it again.

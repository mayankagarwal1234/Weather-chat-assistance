🌤️ Weather Chat Assistant

A modern bilingual weather chatbot powered by AI — works best on Google Chrome

🎥 Demo Video

Replace the link with your hosted demo:

👉 Demo: https://your-demo-video-link-here.com

🎞️ Theme Previews
☀️ Light Mode (Sakura Animation)

🌙 Dark Mode (Snow Animation)

📌 Overview

Weather Chat Assistant is a compact, intelligent weather chatbot built with Next.js (App Router).
It retrieves live weather data from OpenWeatherMap and asks Google Gemini to generate short, helpful suggestions — about clothing, activities, safety, and food — in English or Japanese depending on the selected UI language.

Runs best on Chrome due to Web Speech API performance.

✨ Key Features
🌐 Bilingual (EN ↔ JA)

Full end-to-end language control (UI → query → Gemini → response)

Replies always match selected interface language

🏙️ Smart City Detection

Detects English & Japanese place names

Handles mixed inputs and Japanese suffixes (市, 県, 区)

Includes Indian city variants and common global cities

Graceful fallback to previous valid city on 404

🌦️ Rich Weather Cards

Displays the exact city requested

Auto-updates unless the user asks about a different place

Shows temp, humidity, wind, condition, etc.

🎙️ Voice Input

JA/EN speech recognition via Web Speech API

Same pipeline as typed messages (city detection → weather → reply)

🎨 Clean UI/UX

Persistent dark mode

Sticky, compact-on-scroll header with hysteresis

Floating “↓ Latest” button

Fixed chat input bar

Smooth auto-scroll to latest messages

💬 Improved AI Replies

Bolded weather values

Highlight gear/safety terms

Auto-link URLs

Safe HTML formatting

🔄 How the App Works — Flow Overview

User types or speaks a message (EN/JA).

City detection runs (handles JP suffixes + EN/JP dictionaries).

Weather is fetched from OpenWeatherMap:

If new city fails (404) → fallback to previous valid city with notice.

Weather context + user question → sent to /api/gemini.

Gemini generates a concise reply in the selected language.

UI renders weather card + assistant message.

Auto-scroll keeps the latest reply visible.

🏗️ Architecture Diagram (Text Based)
User
  ↓
Next.js UI (page.tsx)
  ↓
OpenWeatherMap API → Current Weather
  ↓
/api/gemini → Server-side proxy
  ↓
Google Gemini → Advice / Suggestions
  ↓
UI renders:
   - Weather Card
   - Assistant Message

📁 Project Structure
src/
  app/
    page.tsx                # Main chat UI & controller
    api/
      gemini/route.ts       # Server route – Gemini proxy w/ language enforcement
    globals.css             # Global styles, resets, animations

  components/
    MessageTime.tsx         # Client-only timestamp renderer (fixes hydration mismatch)

  hooks/
    useVoiceInput.ts        # Web Speech API hook (EN/JA voice → text → detection)

  lib/
    api.ts                  # fetchWeather + fetchGeminiResponse
    constants.ts            # System prompt + model config
    helpers.ts              # Utility methods (optional)

  public/                   # Static assets, icons

🧩 Why this structure works well

Clear separation of UI, API logic, hooks, and components

MessageTime.tsx isolates hydration-sensitive code (timestamps)

Server route keeps API keys safe

Easy to scale and maintain

⚙️ Setup

Create a .env.local file in the root:

NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
GEMINI_API_KEY=your_gemini_key


Install dependencies:

npm install


Run locally:

npm run dev


Open:
👉 http://localhost:3000

🧪 Quick Functional Test

Try the following to confirm all core features:

✔ Language

Switch to JA → Ask a question → Reply appears in Japanese
Switch to EN → Same question → Reply appears in English

✔ City Detection

“Weather in Delhi”

“東京の天気教えて”

“Is it cold in Osaka today?”
→ Weather card updates automatically

✔ Error Handling

Try an unknown city:

“Weather in GokulCityXYZ”
→ App falls back to previous city + shows a friendly notice

✔ Voice

Click mic → say “Nagoya no tenki” → works

🌐 Deployment

Fully compatible with:

Vercel (recommended)

Netlify

Cloudflare Pages

Docker / Custom Node server

Add your environment keys in the hosting dashboard.

🔒 Security Notes

Never commit .env.local

Use separate keys for dev & production

Rotate leaked keys immediately

Gemini key stays server-side via /api/gemini

📜 License

This project is licensed under the MIT License.

❤️ Credits

OpenWeatherMap — Real-time weather API

Google Gemini — AI-powered suggestions

Next.js — App framework

TailwindCSS — Styling

Emojis & icons — Twemoji / Unicode
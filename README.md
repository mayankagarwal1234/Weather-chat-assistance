🌤️ Weather Chat Assistant

A modern bilingual weather chatbot powered by AI — works best on Google Chrome

🎥 Demo Video

👉 Live Demo: https://weather-chat-assistance.vercel.app/

🎞️ Theme Previews
☀️ Light Mode (Sakura Animation)

🌙 Dark Mode (Snow Animation)

💡 You can replace these GIFs with your own recordings anytime.

📌 Overview

Weather Chat Assistant is a compact, intelligent chatbot built using Next.js (App Router).
It fetches real-time weather from OpenWeatherMap and uses Google Gemini to generate short, helpful suggestions about:

Clothing

Activities

Safety

Food & comfort

Supports both English and Japanese, with full end-to-end language consistency.

Chrome recommended due to best Web Speech API performance.

✨ Key Features
🌐 Bilingual (EN ↔ JA)

Full language pipeline: UI → Query → Gemini → Response

Replies always match selected language

🏙️ Smart City Detection

Detects Japanese & English city names

Handles Japanese suffixes: 市, 県, 区

Includes Indian city variants & global cities

Graceful fallback on 404 (previous valid city + notice)

🌦️ Rich Weather Cards

Shows the exact city asked by the user

Auto-updates based on text/voice input

Displays: temperature, humidity, wind, condition, description

🎙️ Voice Input

JA/EN speech recognition

Flows into same city-detection & weather pipeline

🎨 Advanced UI/UX

Persistent dark mode

Smart sticky header (compact on scroll)

“↓ Latest” floating scroll button

Fixed mobile-friendly chat bar

Smooth auto-scroll behavior

💬 Polished Gemini Responses

Bold important values

Highlights items like coats, umbrellas, warnings

Auto-link URLs

Safe HTML formatting

🔄 How the App Works

User types or speaks (English / Japanese)

City detection analyzes the input

Weather is fetched from OpenWeatherMap

If invalid city → fallback to last valid city

Context is sent to /api/gemini

Gemini produces short useful suggestions

UI displays a weather card + assistant message

Scroll automatically updates to latest message

🏗️ Architecture Diagram (Text-Based)
User
  ↓
Next.js UI (page.tsx)
  ↓
OpenWeatherMap API → Current Weather
  ↓
/api/gemini → Server-side proxy
  ↓
Google Gemini → Suggestions
  ↓
UI Renders:
  → Weather Card
  → Assistant Message

📁 Project Structure
src/
  app/
    page.tsx                # Main chat UI & controller
    api/
      gemini/route.ts       # Server route – Gemini proxy with enforced language
    globals.css             # Global styles, resets, animations

  components/
    MessageTime.tsx         # Client-only timestamp rendering (fixes hydration mismatch)

  hooks/
    useVoiceInput.ts        # JA/EN Voice → Text → City detection

  lib/
    api.ts                  # fetchWeather + fetchGeminiResponse
    constants.ts            # System prompt + model config
    helpers.ts              # Optional utilities

  public/
    # Icons, images, logos

🧩 Why This Structure Works

Clear separation of UI, logic, and API

MessageTime.tsx prevents hydration errors from timestamps

/api/gemini keeps your Gemini API key secure

Modular and easy to expand

⚙️ Setup

Create .env.local in the project root:

NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
GEMINI_API_KEY=your_gemini_key


Install dependencies:

npm install


Start development server:

npm run dev


Open app in browser:
👉 http://localhost:3000

🧪 Quick Functional Test
✔ Language Switching

Set JA → Ask → Reply in Japanese

Set EN → Ask → Reply in English

✔ City Detection

Try:

“Weather in Delhi”

“東京の天気教えて”

“Is it cold in Osaka today?”

→ Weather card updates correctly

✔ Error Handling

Try invalid:

“Weather in RandomCityXYZ”
→ App uses previous city + shows notice

✔ Voice

Tap mic → say “Nagoya no tenki”
→ Works seamlessly

🌐 Deployment

Supported on:

Vercel (recommended)

Netlify

Cloudflare Pages

Docker / custom Node server

Add environment keys in dashboard settings.

🔒 Security Notes

Never commit .env.local

Use separate dev & prod API keys

Rotate keys immediately if exposed

Gemini key stays server-side (never exposed to browser)

📜 License

MIT License — open for personal & commercial use.

❤️ Credits

OpenWeatherMap — Real-time weather API

Google Gemini — AI suggestions

Next.js — App framework

TailwindCSS — Styling

Twemoji / Unicode — Icons & emoji

# 🌤️ Weather Chat Assistant  
*A modern bilingual weather chatbot powered by AI — works best on Google Chrome*

---

## 🎥 Demo Video  
👉 **Live Demo:** https://weather-chat-assistance.vercel.app/

---

## 🎞️ Theme Previews  

### ☀️ Light Mode (Sakura Animation)  
![Light Mode Preview](https://i.imgur.com/qp0QYlC.gif)

### 🌙 Dark Mode (Snow Animation)  
![Dark Mode Preview](https://i.imgur.com/m0bL9Rd.gif)

> 💡 Replace these GIFs with your own previews anytime.

---

# 📌 Overview

**Weather Chat Assistant** is a compact, intelligent chatbot built using **Next.js (App Router)**.  
It fetches real-time weather from **OpenWeatherMap** and uses **Google Gemini** to generate short, helpful suggestions about:

- Clothing  
- Activities  
- Safety  
- Food & comfort  

Supports both **English** and **Japanese**, with full end-to-end language consistency.

Chrome recommended due to best Web Speech API performance.

---

# ✨ Key Features

### 🌐 Bilingual (EN ↔ JA)
- Full language pipeline: **UI → Query → Gemini → Response**
- Replies always match selected interface language

### 🏙️ Smart City Detection
- Detects EN & JP place names  
- Handles Japanese suffixes (`市`, `県`, `区`)  
- Includes Indian city variants & global cities  
- Graceful fallback on 404 (previous valid city + notice)

### 🌦️ Rich Weather Cards
- Shows the exact city asked by the user  
- Auto-updates unless specified otherwise  
- Displays temp, humidity, wind, condition & more  

### 🎙️ Voice Input
- JA/EN Web Speech API  
- Follows same city detection → weather → reply pipeline  

### 🎨 Clean UI/UX
- Persistent **dark mode**  
- Sticky header (compact on scroll)  
- Floating **“↓ Latest”** scroll button  
- Fixed bottom chat bar  
- Smooth auto-scroll  

### 💬 AI Response Improvements
- Bold key values  
- Highlight safety/gear terms  
- Auto-link URLs  
- Safe HTML formatting  

---

# 🔄 How the App Works

1. User types or uses voice (EN/JA).  
2. City detection parses the input.  
3. App fetches weather from OpenWeatherMap.  
   - If invalid → fallback to previous valid city.  
4. Weather + question sent to `/api/gemini`.  
5. Gemini returns a clean, short reply.  
6. UI displays weather card + assistant message.  
7. Scroll updates to latest message.

---

# 🏗️ Architecture Diagram (Text-Based)

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

yaml
Copy code

---

# 📁 Project Structure

src/
app/
page.tsx # Main chat UI & controller
api/
gemini/route.ts # Server route – Gemini proxy with enforced language
globals.css # Global styles, resets, animations

components/
MessageTime.tsx # Client-only timestamp rendering (fixes hydration mismatch)

hooks/
useVoiceInput.ts # JA/EN Voice → Text → City detection

lib/
api.ts # fetchWeather + fetchGeminiResponse
constants.ts # System prompt + model config
helpers.ts # Optional utilities

public/
# Static assets, icons

yaml
Copy code

---

## 🧩 Why This Structure Works

- UI, logic, and API code separated cleanly  
- `MessageTime.tsx` prevents React hydration issues  
- Gemini API key stays secure on server  
- Codebase is modular & scalable  

---

# ⚙️ Setup

Create `.env.local`:

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
GEMINI_API_KEY=your_gemini_key
Install dependencies:

bash
Copy code
npm install
Run the development server:

bash
Copy code
npm run dev
Open the app:
👉 http://localhost:3000

🧪 Quick Functional Test
✔ Language
Switch JA → Ask → reply should be in Japanese

Switch EN → Ask → reply should be in English

✔ City Detection
Try:

“Weather in Delhi”

“東京の天気教えて”

“Is it cold in Osaka today?”

Expect correct city detection.

✔ 404 Handling
Ask:

“Weather in RandomCityXYZ”
→ App falls back to previous city + shows notice

✔ Voice
Tap mic → say “Nagoya no tenki” → works

🌐 Deployment
Compatible with:

Vercel (recommended)

Netlify

Cloudflare Pages

Docker

Add the environment variables in dashboard settings.

🔒 Security Notes
Never commit .env.local

Use different API keys for dev & prod

Immediately rotate if leaked

Gemini key is always server-side

📜 License
MIT License — free for personal & commercial use.

❤️ Credits
OpenWeatherMap — Weather data

Google Gemini — AI suggestions

Next.js — Framework

TailwindCSS — Styling

Twemoji / Unicode — Emojis


# 🌤️ Weather Chat Assistant  
*A modern bilingual weather chatbot powered by AI — works best on Google Chrome*

> **Note:** Save your local diagram images to `public/assets/architecture.png` and `public/assets/structure.png` (or update the paths below).

---

## 🎥 Demo Video
👉 **Live Demo:** https://weather-chat-assistance.vercel.app/

---

## 🎞️ Theme Previews

### ☀️ Light Mode (Sakura Animation)  
![Light Mode Preview](https://i.imgur.com/qp0QYlC.gif)

### 🌙 Dark Mode (Snow Animation)  
![Dark Mode Preview](https://i.imgur.com/m0bL9Rd.gif)

> 💡 *Replace these GIFs with your own previews anytime.*

---

# 📌 Overview

**Weather Chat Assistant** is a compact, intelligent chatbot built using **Next.js (App Router)**.  
It fetches real-time weather from **OpenWeatherMap** and uses **Google Gemini** to generate short, helpful suggestions about:

- Clothing  
- Activities  
- Safety  
- Food & comfort

Supports both **English** and **Japanese**, with full end-to-end language consistency.

*Chrome recommended due to best Web Speech API performance.*

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

# 🏗️ Architecture

![Architecture Diagram](/assets/architecture.png)  
*Visual representation of the data flow: User → Next.js UI → OpenWeatherMap → Gemini AI.*
graph TD
    User([👤 User])
    
    subgraph Client ["🖥️ Next.js Client (Browser)"]
        UI[page.tsx UI]
        Voice[Voice Input]
    end

    subgraph Server ["⚙️ Next.js Server"]
        Proxy[("/api/gemini/route.ts")]
    end

    subgraph External ["☁️ External Services"]
        OWM[OpenWeatherMap API]
        Gemini[Google Gemini AI]
    end

    %% Interactions
    User -->|Types or Speaks| UI
    User -->|Voice| Voice
    Voice -->|Text| UI
    
    UI -->|1. Fetch Weather| OWM
    OWM -- Weather Data --> UI
    
    UI -->|2. Send Weather + Query| Proxy
    Proxy -->|3. Construct Prompt| Gemini
    Gemini -- AI Suggestion --> Proxy
    Proxy -- Response --> UI
    
    UI -->|4. Render Chat| User

    %% Styling
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style Client fill:#e1f5fe,stroke:#01579b
    style Server fill:#fff3e0,stroke:#ff6f00
    style External fill:#f3e5f5,stroke:#7b1fa2

> **Tip:** If you used the generator image provided earlier, place it at `public/assets/architecture.png` so the path above works on GitHub and Vercel.

---

# 📁 Project Structure

![Project Structure](/assets/structure.png)  
*Overview of the Next.js App Router file organization.*
graph TD
    Root[📁 src/]
    
    %% App Directory
    Root --> App[📂 app/]
    App --> Page["📄 page.tsx <br/>(Main UI & Logic)"]
    App --> Globals["🎨 globals.css <br/>(Tailwind & Themes)"]
    App --> API[📂 api/]
    API --> GemRoute[📂 gemini/]
    GemRoute --> Route["⚡ route.ts <br/>(Gemini Proxy)"]

    %% Components
    Root --> Comps[📂 components/]
    Comps --> MsgTime["🧩 MessageTime.tsx"]

    %% Hooks
    Root --> Hooks[📂 hooks/]
    Hooks --> VoiceHook["🪝 useVoiceInput.ts"]

    %% Lib
    Root --> Lib[📂 lib/]
    Lib --> APIFuncs["🛠️ api.ts <br/>(Fetch Functions)"]
    Lib --> Consts["📝 constants.ts <br/>(Prompts & Types)"]
    Lib --> Helpers["🔧 helpers.ts"]

    %% Public
    Root --> Public[📂 public/]
    Public --> Assets["🖼️ images/icons"]

    %% Styling
    style Root fill:#fafafa,stroke:#333,stroke-width:2px
    style App fill:#e3f2fd,stroke:#2196f3
    style API fill:#e3f2fd,stroke:#2196f3
    style Comps fill:#fff9c4,stroke:#fbc02d
    style Hooks fill:#e8f5e9,stroke:#4caf50
    style Lib fill:#fce4ec,stroke:#e91e63

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
assets/
architecture.png # Architecture diagram (move image here)
structure.png # Project structure image (move image here)
# Other static assets & icons
---

## 🧩 Why This Structure Works

- UI, logic, and API code separated cleanly  
- `MessageTime.tsx` isolates hydration-sensitive code (timestamps)  
- `/api/gemini` keeps Gemini key server-side (secure)  
- Modular layout makes the app easy to maintain and extend

---

# ⚙️ Setup

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
GEMINI_API_KEY=your_gemini_key
Install dependencies:

npm install
Run the development server:

npm run dev
Open the app:
👉 http://localhost:3000

🧪 Quick Functional Test
✔ Language
Switch to 日本語 → Ask → reply should be in Japanese

Switch to English → Ask → reply should be in English

✔ City Detection
Try:

Weather in Delhi

東京の天気教えて

Is it cold in Osaka today?

Expect the weather card to update correctly.

✔ 404 Handling
Ask:

Weather in RandomCityXYZ
→ App falls back to previous valid city + shows a friendly notice

✔ Voice
Tap mic → say “Nagoya no tenki” → should work via Web Speech API

🌐 Deployment
Compatible with:

Vercel (recommended)

Netlify

Cloudflare Pages

Docker / Custom Node server

Add the environment variables in your hosting dashboard. For Vercel, set them in Project → Settings → Environment Variables.

🔒 Security Notes
Never commit .env.local to the repo

Use separate keys for development & production

Rotate API keys immediately if accidentally exposed

Gemini key must remain server-side (use /api/gemini)

📜 License
MIT License — free for personal and commercial use.

❤️ Credits
OpenWeatherMap — Weather data

Google Gemini — AI suggestions

Next.js — Framework

TailwindCSS — Styling

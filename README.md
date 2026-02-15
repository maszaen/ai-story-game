<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Infinite Adventure Engine

An interactive "choose your own path" adventure engine powered by **Google Gemini AI**. Every choice generates a brand-new story with unique AI-generated images — no two adventures are ever the same.

## Specs

| Component | Details |
|---|---|
| **Frontend** | React 19 · TypeScript · Vite |
| **AI Model (Story)** | `gemini-3-pro-preview` |
| **AI Model (Image)** | `gemini-3-pro-image-preview` |
| **Styling** | Tailwind CSS (CDN) · Custom medieval theme |
| **Fonts** | Cinzel · Cinzel Decorative · Crimson Text |
| **Storage** | IndexedDB (saves) · sessionStorage (API key) · localStorage (settings) |
| **UI Language** | Indonesian |

## Features

- 16 adventure genres (fantasy, horror, sci-fi, pirate, zombie, etc.)
- 2–3 AI-generated images per turn with selectable art styles (Ghibli, Dark Fantasy, Watercolor, Realistic, Pixel Art, Comic)
- AI-managed inventory & quest system
- Scene history navigation (browse back/forward between chapters)
- Dynamic game over — AI decides whether death is truly final
- Save/load with thumbnails
- Image resolution: 1K / 2K / 4K
- Page, scene, and lightbox transition animations
- Medieval-themed UI with ornaments & classical typography

## Game Flow

```
┌─────────────────────────────────────────────────┐
│                  HOME SCREEN                     │
│                                                  │
│            ⚔  INFINITE ADVENTURE  ⚔             │
│                                                  │
│  [New Adventure]  [Settings]                     │
│                                                  │
│  ── Saved Adventures (max 2 preview) ──          │
│  │ Save 1 │ Save 2 │  [View All →]              │
└──────────────┬───────────────┬───────────────────┘
               │               │
     ┌─────────▼─────┐  ┌─────▼──────────────┐
     │   SETTINGS     │  │  SAVED GAMES PAGE  │
     │                │  │                    │
     │ • API Key*     │  │  Full list of all  │
     │ • Quality      │  │  saved games       │
     │ • Art Style    │  │  + delete          │
     │ • Images/Turn  │  └────────────────────┘
     │ • Auto-save    │
     └────────────────┘
               │
               │  * API Key card only appears
               │    when no env variable is set
               │
     ┌─────────▼─────────────────────────────────┐
     │          GENRE SELECTION (16 options)       │
     │                                            │
     │  Fantasy · Horror · Adventure · Sci-Fi     │
     │  Mystery · Romance · Pirate · Post-        │
     │  Apocalyptic · Mythology · Survival ·      │
     │  Steampunk · Samurai · Underwater ·        │
     │  Detective · Comedy · Zombie               │
     └──────────────────┬─────────────────────────┘
                        │
     ┌──────────────────▼────────────────────────┐
     │            GAME START SCREEN               │
     │                                            │
     │        "Your story awaits..."              │
     │        [⚔ Begin Adventure ⚔]               │
     └──────────────────┬─────────────────────────┘
                        │
     ┌──────────────────▼─────────────────────────┐
     │              GAME LOOP                      │
     │                                             │
     │  ┌─ SIDEBAR ──────┐  ┌─ STORY PANEL ────┐  │
     │  │ Scene nav       │  │                  │  │
     │  │ ◀ Ch. 2/5 ▶    │  │  [AI Image #1]   │  │
     │  │                 │  │  Story text...    │  │
     │  │ ── Quests ──    │  │      ◆           │  │
     │  │ ✓ Quest done    │  │  [AI Image #2]   │  │
     │  │ ◇ Active quest  │  │  Story text...   │  │
     │  │                 │  │                  │  │
     │  │ ── Inventory ── │  └──────────────────┘  │
     │  │ Iron Sword      │                        │
     │  │ Red Potion      │  ┌─ CHOICE BAR ─────┐  │
     │  │                 │  │  I. Choice A      │  │
     │  │ [Main Menu]     │  │  II. Choice B     │  │
     │  └─────────────────┘  │  III. Choice C    │  │
     │                       └──────────┬────────┘  │
     └──────────────────────────────────┘           │
                        │                           │
                        ▼                           │
              ┌─────────────────┐                   │
              │  Gemini AI      │                   │
              │  generates:     │                   │
              │  • Story text   │                   │
              │  • Image prompts│──► Image AI ──┐   │
              │  • Choices      │               │   │
              │  • Inventory    │   ┌───────────▼─┐ │
              │  • Quests       │   │ 2-3 images  │ │
              │  • Game Over?   │   │ per turn    │ │
              └────────┬────────┘   └─────────────┘ │
                       │                            │
              ┌────────▼────────┐                   │
              │  Auto-save to   │                   │
              │  IndexedDB      │                   │
              └────────┬────────┘                   │
                       │                            │
                       ▼                            │
              Game Over?──── No ───► Loop back ─────┘
                  │
                  ▼ Yes
     ┌────────────────────────────┐
     │      ☠  GAME OVER  ☠      │
     │                            │
     │  "Dramatic AI message"     │
     │                            │
     │   [Back to Menu]           │
     └────────────────────────────┘
```

## Run Locally

**Prerequisites:** Node.js

1. Clone the repo:
   ```bash
   git clone https://github.com/maszaen/ai-story-game.git
   cd ai-story-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. *(Optional)* Create a `.env` file with your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
   If no `.env` is present, users can enter the API key via the Settings page.

4. Run:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`

## Production Build

```bash
npm run build
```

Output in `dist/`.

## License

MIT

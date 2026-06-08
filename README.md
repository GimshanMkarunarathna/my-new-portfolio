# Gimshan Menaka Portfolio V2

Dark editorial — Burnt Orange + Bone White aesthetic.

## Quick Start

```bash
npm install
cp .env.example .env   # fill in your Gmail + App Password
npm run dev            # http://localhost:3000
```

## Add Your Images
Put your project screenshots in `public/images/`:
- `Fitnexa.png`, `VRZONE.png`, `Portfolio.png`
- `FoodMenu.png`, `movie-ticket.png`, `Avengers.png`
- `profile.png` (if you add a profile photo somewhere)

## Deploy
- **Render / Railway**: set env vars, start command `npm start`
- **VPS**: `pm2 start server.js --name portfolio`

## What's new in V2
- Custom cursor with project hover state & text
- Cursor-tracked floating tech icons (parallax mouse)  
- No profile image in hero — pure editorial typography
- No circle avatar — full screen text-led hero
- Projects shown in horizontal swiper cards (new layout)
- About section is text-only with info cards
- Dark editorial palette: #ff4d00 accent, bone white, noir black
- Noise texture overlay for tactile depth
- Animated loader with line reveal

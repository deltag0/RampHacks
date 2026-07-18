# 🌲 TrailQuest

Turn **any trail into an AI-powered scavenger hunt game**. Paste an AllTrails link (or
pick Venue mode for indoor demos), and OpenAI generates a themed hunt. Point your camera
at things, and an AI **vision** model verifies your finds and awards points.

Built at RampHacks — targets **Best Game**, **Best Use of OpenAI/Codex**, and
**Audience Favorite**.

## What it does
- **Generates** a 6-challenge themed hunt with GPT-4o (trail or indoor venue).
- **Verifies** each photo with GPT-4o vision — the "magic" moment.
- **Scores** points, tracks progress, and writes an AI **trail-journal recap** at the end.

## Run it (venue laptop, ~1 min)
```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then paste your OpenAI key into .env
python app.py
```
Open **http://localhost:5001** in Chrome. Allow camera access.

> No iPhone needed — it runs entirely in the browser on the demo laptop's webcam.

## Demo script (3 parts)
1. **Venue Mode (live, 60s):** hand a judge the laptop → they photograph a nearby object →
   AI verifies it live → points fire. They feel the magic.
2. **Trail Mode (the story):** paste an AllTrails link → a full themed nature hunt
   generates in ~10s on screen.
3. **Finish:** complete a hunt → show the AI-written trail journal recap.

### Demo safety net
- If wifi is flaky, keep the app open with a hunt already generated.
- Verification is tuned **lenient**, so photos accept easily on stage.

## Stack
- **Backend:** Flask (`app.py`) — `/api/generate`, `/api/verify`, `/api/recap`
- **Frontend:** single `static/index.html` (webcam + game UI, no build step)
- **AI:** OpenAI `gpt-4o` (generation + vision)

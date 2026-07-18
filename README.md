# 🌲 TrailQuest

Turn **any trail into an AI-powered scavenger hunt and shared scrapbook**. Paste an
AllTrails link or trail name (or choose Venue mode for an indoor demo), complete
photo challenges together, and turn the crew's discoveries and memories into a story
worth revisiting.

Built at RampHacks — targets **Best Game**, **Best Use of OpenAI/Codex**, and
**Audience Favorite**.

## What it does

- **Generates** a six-challenge themed hunt with GPT-4o for a trail or indoor venue.
- **Verifies** each photo with GPT-4o vision and awards points for accepted finds.
- **Captures the crew's story** with a crew name, optional member names, four story
  styles, a contributor, and an optional short memory for every accepted photo.
- **Reviews before sharing with AI** so the crew can edit memories and contributors,
  hide photos, choose a cover, and confirm the story style.
- **Builds a structured scrapbook** through `/api/story`, with a cover, opening,
  photo-backed chapters, crew awards, closing, and score summary.
- **Renders a visual, mobile-friendly scrapbook** that can be printed or saved with the
  browser's print dialog.

## Shared storyteller flow

1. Name the crew, optionally add up to six members, choose a story style, and generate a
   Trail or Venue quest.
2. Capture a challenge photo. After AI verification accepts it, choose who captured the
   moment and optionally add a short memory. Skipping the note never blocks play.
3. Follow the **Story so far** strip as accepted moments collect during the quest.
4. At completion, review every moment, edit its details, hide anything unwanted, and
   select the scrapbook cover.
5. Generate and reveal the crew's visual story. Each chapter is matched to its captured
   photo locally; the model returns story text and structure, not replacement images.
6. Print or save the scrapbook, or start another adventure with a clean in-memory photo
   session.

## Privacy and reliability

- Captured scrapbook photos stay in browser memory for the current adventure; they are
  not put in `localStorage`, uploaded to public storage, or auto-published.
- A capture is sent to the OpenAI service for challenge verification. When the crew
  chooses **Generate Story**, only photos still included on the review screen are sent
  again for story writing; hidden moments are excluded from that request.
- Captures are resized to JPEGs before verification and story generation, which also
  strips camera EXIF metadata.
- Crew setup preferences may be saved locally so the next adventure is quicker to start.
- If structured AI story generation is unavailable or returns unusable data, TrailQuest
  creates a deterministic scrapbook from the captured photos, challenge details,
  memories, contributors, and score instead of discarding the experience.
- Scrapbooks are never publicly shared by the app.

## Run it (venue laptop, ~1 min)

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then paste your OpenAI key into .env
python app.py
```

Open **http://localhost:5001** in Chrome and allow camera access.

> No iPhone is needed — it runs entirely in the browser with the demo laptop's webcam.

## Demo script (3 parts)

1. **Crew + Venue Mode (live, 60s):** name the crew, choose a tone, hand a judge the
   laptop, and let them photograph a nearby object. AI verifies it live and the moment
   appears in the story strip.
2. **Trail Mode (the story):** paste an AllTrails link or trail name to generate a full,
   place-aware nature hunt.
3. **Finish (the payoff):** review the captured moments, select a cover, and reveal the
   crew's visual scrapbook. Open the browser print dialog to show the save/print layout.

### Demo safety net

- If Wi-Fi is flaky, keep the app open with a hunt already generated.
- Verification is tuned **lenient**, so photos accept easily on stage.
- Story generation degrades to the deterministic scrapbook fallback, preserving every
  included photo and memory.

## Stack and API

- **Backend:** Flask (`app.py`)
  - `POST /api/generate` — generate the six-challenge hunt.
  - `POST /api/verify` — verify and describe a captured photo.
  - `POST /api/story` — validate up to six included moments and return structured
    scrapbook JSON, with a deterministic fallback if the model call fails.
  - `POST /api/recap` — legacy text recap and collector-badge endpoint, retained for
    compatibility; the shared storyteller completion flow uses `/api/story`.
  - `POST /api/ask` — answer short questions through the Ranger nature guide.
- **Frontend:** one `static/index.html` file with the webcam, game, review, and scrapbook
  UI; no build step is required.
- **AI:** OpenAI `gpt-4o` for hunt generation, vision verification, and structured story
  writing; `gpt-image-1` remains available to the legacy recap badge flow.

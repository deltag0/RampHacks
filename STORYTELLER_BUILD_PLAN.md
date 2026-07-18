# TrailQuest Shared Storyteller — Codex Build Plan

## Objective

Turn the current text-only end screen into the emotional payoff of TrailQuest: a visual,
AI-written scrapbook built from the crew, challenge photos, short memories, and moments
captured during the quest.

The finished experience should make players feel that TrailQuest followed their adventure,
noticed what made it unique, and turned it into something worth revisiting or sharing.

**New product loop:**

> Explore together → capture discoveries and memories → reveal a shared story → choose the
> next adventure.

This plan is intentionally scoped to the existing Flask + single-page HTML/JavaScript app.
It does not require accounts, a database, GPS, or real-time multiplayer for the first build.

---

## 1. Target Experience

### Before the quest

Add a lightweight crew setup to the existing generation form:

- Crew name, with a playful generated default such as “Muddy Boot Crew.”
- Two to six optional member names.
- Story style:
  - Cozy trail journal
  - Epic expedition
  - Nature documentary
  - Chaotic comedy
- Keep the existing Trail and Venue modes.

Do not require sign-up. The demo should still start in under 30 seconds.

### During the quest

After a photo is accepted:

1. Preserve the submitted photo instead of discarding it.
2. Show a quick “Save this moment” sheet.
3. Let the player choose who captured it.
4. Ask for one optional short memory, using a context-sensitive prompt such as:
   - “What made this moment memorable?”
   - “What did your crew almost miss?”
   - “Describe this in three words.”
   - “Who spotted it first?”
5. Allow Skip so this never blocks game momentum.
6. Add the completed challenge to a visible “Story so far” photo strip.

The user must be able to edit the contributor and memory later.

### At quest completion

Do not immediately hide the game and show a text paragraph. Instead:

1. Show a review screen with all captured moments.
2. Let the crew:
   - Choose the cover photo.
   - Edit memories and contributor names.
   - Hide unwanted photos from the scrapbook.
   - Confirm the story style.
3. Display an animated generation state that reports real counts, for example:
   - “Turning 6 discoveries and 4 memories into your crew’s story…”
4. Generate and reveal a visual, scrollable scrapbook.

### Scrapbook content

The generated scrapbook should contain:

- Cover photo, crew name, hunt name, and date.
- A short opening paragraph that sets the chosen tone.
- One chapter/card per included challenge photo.
- The player’s memory or quote, when provided.
- A short AI narration grounded in the photo and verification result.
- A “Crew Awards” section with one playful award per contributing member.
- Final score and completed challenge count as secondary details.
- A closing paragraph that celebrates the shared experience.
- A “Start another adventure” action.

The scrapbook should prioritize the people, photos, and memories over points.

---

## 2. MVP Scope

### Required for the first implementation

- [ ] Crew name and optional member names in setup.
- [ ] Four selectable story styles.
- [ ] Store the accepted JPEG for every completed challenge.
- [ ] Contributor selector and optional short memory after each accepted photo.
- [ ] “Story so far” thumbnail strip.
- [ ] End-of-quest review and cover-photo selection.
- [ ] New `/api/story` endpoint returning structured JSON.
- [ ] Visual scrapbook renderer using the existing photos.
- [ ] One playful AI award per contributor.
- [ ] Edit/hide controls before generation.
- [ ] Graceful fallback scrapbook when the AI request fails.
- [ ] Mobile-friendly and printable scrapbook styling.

### Explicitly out of scope for the first implementation

- User accounts or authentication.
- Cloud photo storage.
- Multi-device crew joining.
- Public profiles, feeds, comments, or leaderboards.
- GPS maps or automatic location tracking.
- Voice recording and transcription.
- Automatic illustrated image generation.
- Permanent scrapbook URLs.

These can be added after the core capture-to-story experience is compelling.

---

## 3. Frontend Data Model

Extend the current in-memory game state with a `crew` object and a `moments` array.

```js
const crew = {
  name: "Muddy Boot Crew",
  members: ["Alex", "Sam", "Jordan"],
  storyStyle: "chaotic_comedy"
};

const moments = [
  {
    challengeId: 1,
    challengeTitle: "Bark Detective",
    clue: "Find peeling bark",
    points: 20,
    imageDataUrl: "data:image/jpeg;base64,...",
    verificationReason: "The photo clearly shows peeling tree bark.",
    contributor: "Sam",
    memory: "Alex walked past it three times.",
    capturedAt: "2026-07-18T18:00:00Z",
    included: true,
    isCover: false
  }
];
```

Implementation notes:

- Resize captures before storage and upload. Limit the longest edge to approximately
  900–1024 pixels and use JPEG quality around `0.65`.
- Keep photos in memory for the MVP; do not place base64 images in `localStorage`.
- Store only crew name, member names, and preferred story style in `localStorage` so setup
  can be prefilled on the next visit.
- Revoke or clear photo data when the user starts a new adventure or reloads the page.
- Never insert AI- or user-generated strings with unsafe `innerHTML`; render text through
  `textContent` or escaped DOM construction.

---

## 4. Backend API

### Add `POST /api/story`

The endpoint receives the full context required to create a grounded story.

Suggested request shape:

```json
{
  "hunt_title": "Whispers of the Greenway",
  "score": 110,
  "mode": "trail",
  "place": "Prospect Park Loop",
  "crew": {
    "name": "Muddy Boot Crew",
    "members": ["Alex", "Sam", "Jordan"],
    "story_style": "chaotic_comedy"
  },
  "moments": [
    {
      "challenge_id": 1,
      "challenge_title": "Bark Detective",
      "clue": "Find peeling bark",
      "verification_reason": "The image shows peeling bark.",
      "contributor": "Sam",
      "memory": "Alex walked past it three times.",
      "image": "data:image/jpeg;base64,..."
    }
  ]
}
```

Require a strict structured response:

```json
{
  "cover_title": "The Muddy Boot Chronicles",
  "subtitle": "A questionably organized expedition through Prospect Park",
  "opening": "...",
  "chapters": [
    {
      "challenge_id": 1,
      "heading": "The Bark That Almost Got Away",
      "narration": "..."
    }
  ],
  "awards": [
    {
      "member": "Sam",
      "title": "Sharpest Eyes",
      "reason": "Spotted the expedition's most elusive patch of bark."
    }
  ],
  "closing": "..."
}
```

### Story-generation requirements

The prompt must instruct the model to:

- Ground each chapter in the supplied photo, challenge, contributor, memory, and
  verification result.
- Never invent a crew member, event, quote, location, species, or dangerous action.
- Preserve user-written memories without changing their factual meaning.
- Match the selected style without becoming excessively verbose.
- Keep the opening, each chapter, each award reason, and closing short enough for cards.
- Give awards only to listed contributors.
- Avoid authoritative species identification, health advice, or safety claims.
- Return strict JSON and include exactly one chapter for each included moment.

### Validation and limits

- Reject requests with no included moments.
- Cap the number of moments at six for the MVP.
- Cap memory and member-name lengths before sending them to the model.
- Validate the model response and fill missing fields with deterministic fallback text.
- Do not log image data or return raw exception details to the browser.
- Keep the existing `/api/recap` endpoint temporarily for compatibility, but route the new
  completion flow through `/api/story`.

---

## 5. UI Components and States

Keep the no-build-step architecture and add the following sections to
`static/index.html`:

1. **Crew setup**
   - Crew-name input
   - Member-name inputs or comma-separated entry
   - Story-style chips

2. **Moment capture sheet**
   - Accepted photo preview
   - Contributor selector
   - Short memory input
   - Save and Skip actions

3. **Story-so-far strip**
   - Small thumbnails below the score bar
   - Contributor label
   - Edit action

4. **Scrapbook review screen**
   - Photo grid
   - Cover selector
   - Include/hide toggle
   - Editable memory and contributor
   - Generate Story button

5. **Generating state**
   - Progress copy based on actual moment counts
   - Friendly retry path

6. **Scrapbook view**
   - Hero cover
   - Opening section
   - Alternating photo/chapter cards
   - Crew awards
   - Closing and score summary
   - Print/Save action using browser print styles
   - New Adventure action

Use semantic buttons, visible focus states, large touch targets, high contrast, and reduced
motion support.

---

## 6. Failure and Edge Cases

- **No member names:** use “The Crew” and omit individual awards or award the crew once.
- **Memory skipped:** write only from the challenge, image, and verification result.
- **Photo rejected:** do not create a moment until the challenge is accepted.
- **AI story fails:** render a deterministic scrapbook with the photos, challenge titles,
  memories, score, and a generic closing. Never discard the captured experience.
- **A member has no contribution:** do not fabricate an individual award.
- **All photos hidden:** prevent generation and explain that at least one moment is needed.
- **Large payload:** resize every image client-side and show a useful error if limits are
  still exceeded.
- **Sensitive photo:** allow hiding or replacing it before story generation.
- **Refresh during the hunt:** acceptable for MVP; preserving photo sessions is a later
  IndexedDB enhancement.

---

## 7. Privacy and Outdoor Safety

- Explain that selected photos are sent to the AI service to generate the story.
- Do not persist or publicly share photos by default.
- Never auto-publish a scrapbook.
- Give the crew control over every included photo.
- Avoid challenges or story language involving leaving the trail, approaching wildlife,
  touching or collecting plants, entering water, climbing, or photographing strangers.
- Do not expose precise coordinates, EXIF metadata, or sensitive-species locations.
- For a future public-sharing feature, add face and license-plate blurring first.

---

## 8. Build Sequence for Codex

Implement and verify each milestone before continuing.

### Milestone 1 — Capture and retain moments

- Add crew and story-style inputs.
- Preserve accepted photos and verification reasons.
- Add contributor and memory capture.
- Render the story-so-far strip.
- Confirm completing all six challenges still works.

### Milestone 2 — Review experience

- Replace the automatic recap transition with the scrapbook review screen.
- Add cover selection, editing, and photo hiding.
- Validate that at least one photo remains included.

### Milestone 3 — Structured AI story

- Add `/api/story`.
- Send included moments and images with the selected style.
- Validate strict JSON output.
- Add a deterministic fallback response.

### Milestone 4 — Scrapbook renderer

- Build the cover, chapters, awards, and closing sections.
- Ensure the correct photo is matched to each `challenge_id` locally; the model should not
  return image data.
- Add responsive and print styling.

### Milestone 5 — Polish and reliability

- Add loading, retry, fallback, and empty states.
- Test long names, skipped memories, missing member names, and failed AI calls.
- Check the full experience on narrow mobile and laptop screens.
- Confirm a new adventure clears all previous photos and story state.

---

## 9. Acceptance Criteria

The feature is complete when:

- A player can create a named crew and select a story style.
- Every accepted challenge can retain its photo, contributor, and optional memory.
- Players can review, edit, hide, and choose a cover from their moments.
- The final scrapbook visibly uses the actual captured photos.
- AI narration references only supplied events and memories.
- Each contributor receives no more than one grounded, playful award.
- The experience still succeeds when every memory is skipped.
- An AI failure produces a usable photo scrapbook instead of an error-only screen.
- No scrapbook or photo is publicly shared without an explicit future sharing action.
- The layout works at approximately 375px mobile width and on the demo laptop.
- Starting a new adventure clears all prior in-memory photos.

---

## 10. Follow-on Features After MVP

Prioritize only after the core scrapbook tests well with real groups:

1. Five-second voice memories with transcription.
2. Shareable poster/card export with per-photo privacy controls.
3. IndexedDB draft recovery after accidental refresh.
4. Persistent “Adventure Shelf” of past scrapbooks.
5. Annual and seasonal AI adventure recaps.
6. QR-based multi-device crew joining.
7. Next-adventure recommendations and crew voting.
8. Optional collaborative reactions and post-hike editing.

Do not build public feeds, global leaderboards, permanent location histories, or autonomous
public sharing before privacy, moderation, and consent controls exist.

---

## Definition of Success

The feature succeeds when the strongest reaction at the end is not “the AI verified my
photo,” but:

> “That actually feels like our adventure—and I want to send it to the group.”

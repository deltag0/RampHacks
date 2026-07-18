import json
import os

import httpx
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from openai import OpenAI

load_dotenv()

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

MODEL = "gpt-4o"
IMAGE_MODEL = "gpt-image-1"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
USER_AGENT = "TrailQuest/1.0 (RampHacks hackathon project)"

_client = None


def get_client():
    """Lazily create the OpenAI client so the server boots even without a key set."""
    global _client
    if _client is None:
        key = os.getenv("OPENAI_API_KEY")
        if not key:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. Copy .env.example to .env and add your key."
            )
        _client = OpenAI(api_key=key)
    return _client


@app.errorhandler(Exception)
def handle_error(e):
    return jsonify({"error": str(e)}), 500


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


# ---------------------------------------------------------------------------
# Location resolution pipeline — turns loose hiker input into real nearby
# OpenStreetMap features, so generated challenges can be grounded in reality.
# Every step degrades silently on failure; trail generation never hard-fails
# because a free public geocoding API timed out.
# ---------------------------------------------------------------------------

def resolve_location(raw_text):
    """Use GPT-4o to turn loose hiker input into a clean geocodable query."""
    raw_text = (raw_text or "").strip()
    if not raw_text:
        return None
    try:
        prompt = (
            "A hiker typed this into a 'where are you headed' box for a hiking app. "
            "It could be a trail name, a vague description, or a pasted AllTrails URL. "
            f'Input: "{raw_text}"\n\n'
            "Return STRICT JSON with the best real-world geocoding search query and a "
            "short friendly display name:\n"
            '{"query": "a search string a geocoder could resolve", '
            '"display_name": "short friendly name"}'
        )
        resp = get_client().chat.completions.create(
            model=MODEL,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
        )
        result = json.loads(resp.choices[0].message.content)
        if result.get("query"):
            return result
    except Exception:
        pass
    return None


def geocode(query):
    """Resolve a search query to lat/lon via OpenStreetMap Nominatim."""
    try:
        resp = httpx.get(
            NOMINATIM_URL,
            params={"format": "json", "limit": 1, "q": query},
            headers={"User-Agent": USER_AGENT},
            timeout=5,
        )
        results = resp.json()
        if results:
            return {"lat": float(results[0]["lat"]), "lon": float(results[0]["lon"])}
    except Exception:
        pass
    return None


def fetch_nearby_features(lat, lon, radius_m=800):
    """Query OpenStreetMap Overpass for real natural/landmark features near a point."""
    query = f"""
    [out:json][timeout:5];
    (
      node["natural"~"^(tree|water|peak|rock)$"](around:{radius_m},{lat},{lon});
      way["natural"~"^(water|wood)$"](around:{radius_m},{lat},{lon});
      node["waterway"="stream"](around:{radius_m},{lat},{lon});
      node["tourism"="viewpoint"](around:{radius_m},{lat},{lon});
      node["leisure"="park"](around:{radius_m},{lat},{lon});
      node["amenity"="bench"](around:{radius_m},{lat},{lon});
    );
    out center 20;
    """
    try:
        resp = httpx.post(
            OVERPASS_URL,
            data={"data": query},
            headers={"User-Agent": USER_AGENT},
            timeout=6,
        )
        elements = resp.json().get("elements", [])
        features = []
        for el in elements[:15]:
            tags = el.get("tags", {})
            feature_lat = el.get("lat") or (el.get("center") or {}).get("lat")
            feature_lon = el.get("lon") or (el.get("center") or {}).get("lon")
            if feature_lat is None or feature_lon is None:
                continue
            kind = (
                tags.get("natural") or tags.get("waterway") or tags.get("tourism")
                or tags.get("leisure") or tags.get("amenity") or "feature"
            )
            features.append({
                "type": kind,
                "name": tags.get("name") or kind.replace("_", " "),
                "lat": feature_lat,
                "lon": feature_lon,
            })
        return features
    except Exception:
        return []


def generate_badge(hunt_title, score, rarity_counts):
    """Generate a shareable collector's-badge image for a completed hunt."""
    try:
        tally = ", ".join(
            f"{count} {rarity}" for rarity, count in (rarity_counts or {}).items() if count
        )
        prompt = (
            f"A clean, colorful trading-card style collector's badge illustration for a "
            f"nature scavenger hunt app. Title: '{hunt_title}'. Score: {score} points. "
            f"Catches: {tally or 'a handful of finds'}. Flat vector illustration style, "
            "outdoorsy nature theme (leaves, mountains, trail badge shapes), no readable "
            "body text other than the title and score."
        )
        resp = get_client().images.generate(
            model=IMAGE_MODEL, prompt=prompt, size="1024x1024"
        )
        b64 = resp.data[0].b64_json
        return f"data:image/png;base64,{b64}"
    except Exception:
        return None


@app.route("/api/generate", methods=["POST"])
def generate():
    """Generate a themed scavenger hunt for a trail OR the venue (indoor mode)."""
    data = request.get_json(force=True)
    place = (data.get("place") or "").strip()
    mode = data.get("mode", "trail")  # "trail" or "venue"

    grounding = ""
    if mode == "trail" and place:
        resolved = resolve_location(place)
        if resolved and resolved.get("query"):
            coords = geocode(resolved["query"])
            if coords:
                features = fetch_nearby_features(coords["lat"], coords["lon"])
                if features:
                    feature_lines = "\n".join(
                        f'- {f["name"]} ({f["type"]}) at {f["lat"]:.5f},{f["lon"]:.5f}'
                        for f in features
                    )
                    grounding = (
                        "\n\nReal features actually near this location (from "
                        f"OpenStreetMap):\n{feature_lines}\n"
                        "Where it fits naturally, ground a challenge in one of these "
                        'real features and attach its coordinates as "location": '
                        '{"lat": ..., "lon": ..., "name": ...} on that challenge object.'
                    )

    if mode == "venue":
        context = (
            "The players are INDOORS at a hackathon venue with only common objects "
            "around (laptops, water bottles, badges, logos, plants, chairs, cables, "
            "snacks, people). Create quick challenges they can complete by pointing a "
            "webcam at things nearby. Keep them fun and easy to satisfy indoors."
        )
        title_hint = "an indoor venue scavenger hunt"
    else:
        context = (
            f"The players are hiking the trail: '{place or 'a scenic nature trail'}'. "
            "Create nature-themed photo challenges they would encounter along a real "
            "hike: trees, bark, leaves, water, rocks, wildlife signs, views, textures. "
            "Ground the challenges in things actually found in nature."
        ) + grounding
        title_hint = f"a scavenger hunt for {place or 'the trail'}"

    prompt = (
        f"You are designing {title_hint} in the style of a Pokemon-Go-esque wildlife "
        f"scavenger hunt. {context}\n\n"
        "Return STRICT JSON with this shape:\n"
        "{\n"
        '  "hunt_title": "a short catchy adventure name",\n'
        '  "challenges": [\n'
        '    {"id": 1, "title": "short name", "clue": "what to find & photograph",\n'
        '     "hint": "a helpful hint", "points": 10,\n'
        '     "species_name": "a fun Pokemon-style name for the thing to find",\n'
        '     "rarity": "common|uncommon|rare|epic",\n'
        '     "encounter_line": "a \'wild X has appeared!\' style one-liner"}\n'
        "  ]\n"
        "}\n"
        "Make exactly 6 challenges. Vary difficulty (points 10-30) and rarity — rarer "
        "finds should have higher points. Clues must be satisfiable by taking ONE photo. "
        'Be creative and playful. Only include a "location" field on a challenge if you '
        "are grounding it in one of the real features listed above."
    )

    resp = get_client().chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
    )
    payload = json.loads(resp.choices[0].message.content)
    return jsonify(payload)


@app.route("/api/verify", methods=["POST"])
def verify():
    """Use vision to check whether the submitted photo satisfies the challenge,
    and identify/teach about what's actually in it (the nature-learning layer)."""
    data = request.get_json(force=True)
    clue = data.get("clue", "")
    image = data.get("image", "")  # data URL: data:image/jpeg;base64,....

    if not image:
        return jsonify({"match": False, "confidence": 0, "reason": "No photo received."})

    prompt = (
        "You are a friendly, LENIENT scavenger-hunt judge AND a nature field guide. The "
        f'player was asked to photograph: "{clue}". Look at the image and decide if it '
        "reasonably satisfies the challenge. Be generous — if it plausibly matches, "
        "accept it. If the photo shows a real natural object (plant, leaf, tree, rock, "
        "water feature, etc.), also identify it in plain language and share one true, "
        "fun fact about it — if you are not confident of the exact species, describe "
        "the general category (e.g. 'a type of oak' or 'a type of moss') rather than "
        "guessing a precise species.\n"
        "Return STRICT JSON: "
        '{"match": true/false, "confidence": 0-1, "reason": "one fun sentence", '
        '"catch_line": "a short celebratory gotcha line if match is true, else empty", '
        '"common_name": "plain name of the real thing in the photo, or empty if not '
        'natural/unclear", '
        '"nature_fact": "a 1-2 sentence fun fact about it, or empty if not applicable"}'
    )

    resp = get_client().chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image}},
                ],
            }
        ],
    )
    result = json.loads(resp.choices[0].message.content)
    return jsonify(result)


@app.route("/api/recap", methods=["POST"])
def recap():
    """Write a short trail-journal recap of the completed adventure, plus a
    shareable collector's-badge image."""
    data = request.get_json(force=True)
    hunt_title = data.get("hunt_title", "The Adventure")
    completed = data.get("completed", [])  # list of challenge titles
    score = data.get("score", 0)
    rarity_counts = data.get("rarity_counts", {})

    prompt = (
        f"Write a short, upbeat 'trail journal' recap (3-4 sentences) for an adventure "
        f"called '{hunt_title}'. The explorer scored {score} points and completed these "
        f"challenges: {', '.join(completed) or 'a few'}. Make it feel rewarding and "
        "celebratory, like a badge of honor. No hashtags."
    )
    resp = get_client().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    badge_image = generate_badge(hunt_title, score, rarity_counts)
    return jsonify({
        "recap": resp.choices[0].message.content.strip(),
        "badge_image": badge_image,
    })


@app.route("/api/ask", methods=["POST"])
def ask():
    """Ranger: a friendly AI nature-guide companion the hiker can ask questions to."""
    data = request.get_json(force=True)
    question = (data.get("question") or "").strip()
    context = data.get("context") or {}

    if not question:
        return jsonify({"answer": "Ask me anything about what you've found out there!"})

    finds = context.get("finds") or []
    location_name = context.get("location_name") or ""
    context_lines = []
    if location_name:
        context_lines.append(f"The hiker is near: {location_name}.")
    if finds:
        context_lines.append(
            "Things the hiker has recently found: " + ", ".join(finds) + "."
        )

    prompt = (
        "You are Ranger, a friendly, knowledgeable nature-guide companion inside a "
        "hiking scavenger-hunt app. Give short (2-4 sentence), encouraging, factual "
        "answers. When relevant context is given, connect your answer to the hiker's "
        "own finds or location.\n"
        f"{' '.join(context_lines)}\n\n"
        f'Hiker\'s question: "{question}"'
    )
    resp = get_client().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return jsonify({"answer": resp.choices[0].message.content.strip()})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)

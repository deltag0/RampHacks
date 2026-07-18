import json
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from openai import OpenAI

load_dotenv()

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

MODEL = "gpt-4o"

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


@app.route("/api/generate", methods=["POST"])
def generate():
    """Generate a themed scavenger hunt for a trail OR the venue (indoor mode)."""
    data = request.get_json(force=True)
    place = (data.get("place") or "").strip()
    mode = data.get("mode", "trail")  # "trail" or "venue"

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
        )
        title_hint = f"a scavenger hunt for {place or 'the trail'}"

    prompt = (
        f"You are designing {title_hint}. {context}\n\n"
        "Return STRICT JSON with this shape:\n"
        "{\n"
        '  "hunt_title": "a short catchy adventure name",\n'
        '  "challenges": [\n'
        '    {"id": 1, "title": "short name", "clue": "what to find & photograph",\n'
        '     "hint": "a helpful hint", "points": 10}\n'
        "  ]\n"
        "}\n"
        "Make exactly 6 challenges. Vary difficulty (points 10-30). "
        "Clues must be satisfiable by taking ONE photo. Be creative and playful."
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
    """Use vision to check whether the submitted photo satisfies the challenge."""
    data = request.get_json(force=True)
    clue = data.get("clue", "")
    image = data.get("image", "")  # data URL: data:image/jpeg;base64,....

    if not image:
        return jsonify({"match": False, "confidence": 0, "reason": "No photo received."})

    prompt = (
        "You are a friendly, LENIENT scavenger-hunt judge. The player was asked to "
        f'photograph: "{clue}". Look at the image and decide if it reasonably '
        "satisfies the challenge. Be generous — if it plausibly matches, accept it.\n"
        "Return STRICT JSON: "
        '{"match": true/false, "confidence": 0-1, "reason": "one fun sentence"}'
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
    """Write a short, fun trail-journal recap of the completed adventure."""
    data = request.get_json(force=True)
    hunt_title = data.get("hunt_title", "The Adventure")
    completed = data.get("completed", [])  # list of challenge titles
    score = data.get("score", 0)

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
    return jsonify({"recap": resp.choices[0].message.content.strip()})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)

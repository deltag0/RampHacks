import base64
import json
from types import SimpleNamespace
import unittest
from unittest.mock import MagicMock, patch

import app as trailquest
from werkzeug.exceptions import RequestEntityTooLarge


def jpeg_data(marker=b"photo"):
    encoded = base64.b64encode(b"\xff\xd8\xff\xe0" + marker + b"\xff\xd9").decode()
    return "data:image/jpeg;base64," + encoded


def story_payload():
    return {
        "hunt_title": "Greenway Quest",
        "score": 42,
        "mode": "trail",
        "place": "Prospect Park Loop",
        "crew": {
            "name": "Muddy Boots",
            "members": ["Alex", "Sam", "Jordan"],
            "story_style": "chaotic_comedy",
        },
        "moments": [
            {
                "challenge_id": 1,
                "challenge_title": "Bark Detective",
                "clue": "Find peeling bark",
                "verification_reason": "The photo shows peeling bark.",
                "contributor": "alex",
                "memory": "We walked past it twice.",
                "image": jpeg_data(b"one"),
            },
            {
                "challenge_id": 2,
                "challenge_title": "Stone Spotter",
                "clue": "Find a patterned rock",
                "verification_reason": "The rock has a striped pattern.",
                "contributor": "SAM",
                "memory": "",
                "image": jpeg_data(b"two"),
            },
        ],
    }


def mock_openai_client(content):
    client = MagicMock()
    client.chat.completions.create.return_value = SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
    )
    return client


class StoryApiTests(unittest.TestCase):
    def setUp(self):
        trailquest.app.config.update(TESTING=True)
        self.client = trailquest.app.test_client()

    def test_validation_rejects_bad_or_ambiguous_moments_without_calling_ai(self):
        valid_moment = story_payload()["moments"][0]
        cases = {
            "invalid json": None,
            "empty": {"moments": []},
            "all hidden": {
                "moments": [{"included": False, "image": "secret-hidden-image"}]
            },
            "non-object moment": {"moments": [None]},
            "too many": {
                "moments": [
                    {
                        **valid_moment,
                        "challenge_id": challenge_id,
                        "image": jpeg_data(str(challenge_id).encode()),
                    }
                    for challenge_id in range(1, 8)
                ]
            },
            "duplicate ids": {
                "moments": [
                    valid_moment,
                    {**valid_moment, "challenge_id": "1"},
                ]
            },
            "bad jpeg": {
                "moments": [{**valid_moment, "image": "data:image/png;base64,AAAA"}]
            },
            "invalid base64": {
                "moments": [
                    {**valid_moment, "image": "data:image/jpeg;base64,!!!!"}
                ]
            },
            "truncated jpeg": {
                "moments": [
                    {
                        **valid_moment,
                        "image": "data:image/jpeg;base64,"
                        + base64.b64encode(b"\xff\xd8\xfftruncated").decode(),
                    }
                ]
            },
            "oversized jpeg": {
                "moments": [{
                    **valid_moment,
                    "image": "data:image/jpeg;base64,"
                    + base64.b64encode(
                        b"\xff\xd8\xff"
                        + (b"x" * trailquest.MAX_STORY_IMAGE_BYTES)
                        + b"\xff\xd9"
                    ).decode(),
                }]
            },
        }

        for name, payload in cases.items():
            with self.subTest(name=name), patch.object(
                trailquest, "get_client"
            ) as get_client:
                if name == "invalid json":
                    response = self.client.post(
                        "/api/story", data="not-json", content_type="application/json"
                    )
                else:
                    response = self.client.post("/api/story", json=payload)
                self.assertEqual(response.status_code, 400)
                self.assertIn("error", response.get_json())
                get_client.assert_not_called()

    def test_story_repairs_model_output_and_never_uploads_hidden_moments(self):
        payload = story_payload()
        payload["moments"].insert(1, {
            "challenge_id": 99,
            "challenge_title": "Private Moment",
            "included": False,
            "memory": "do not send this",
            "image": "secret-hidden-image",
        })
        model_story = {
            "cover_title": "The Muddy Boot Chronicles",
            "subtitle": "   ",
            "opening": "Two discoveries and one determined crew.",
            "chapters": [
                {
                    "challenge_id": 2,
                    "heading": "The Stripe Situation",
                    "narration": "Sam captured the striped rock.",
                },
                {
                    "challenge_id": 1,
                    "heading": "The Bark That Waited",
                },
                {
                    "challenge_id": 999,
                    "heading": "Invented chapter",
                    "narration": "This must be discarded.",
                },
                {
                    "challenge_id": 2,
                    "heading": "Duplicate chapter",
                    "narration": "This must also be discarded.",
                },
            ],
            "awards": [
                {
                    "member": "Jordan",
                    "title": "Invented Award",
                    "reason": "Jordan did not contribute.",
                },
                {
                    "member": "alex",
                    "title": "Bark Radar",
                    "reason": "Kept the bark discovery in sight.",
                },
                {
                    "member": "Alex",
                    "title": "Duplicate Award",
                    "reason": "This must be discarded.",
                },
            ],
            "closing": "The trail has not heard the last of them.",
        }
        ai_client = mock_openai_client(json.dumps(model_story))

        with patch.object(trailquest, "get_client", return_value=ai_client):
            response = self.client.post("/api/story", json=payload)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["X-TrailQuest-Story-Source"], "ai")
        result = response.get_json()
        self.assertEqual(
            set(result),
            {"cover_title", "subtitle", "opening", "chapters", "awards", "closing"},
        )
        self.assertEqual([chapter["challenge_id"] for chapter in result["chapters"]], [1, 2])
        self.assertEqual(result["chapters"][0]["heading"], "The Bark That Waited")
        self.assertEqual(
            result["chapters"][0]["narration"], "The photo shows peeling bark."
        )
        self.assertEqual(result["chapters"][1]["heading"], "The Stripe Situation")
        self.assertEqual([award["member"] for award in result["awards"]], ["Alex", "Sam"])
        self.assertEqual(result["awards"][0]["title"], "Bark Radar")
        self.assertEqual(result["awards"][1]["title"], "Moment Maker")
        self.assertNotIn("Jordan", json.dumps(result))
        self.assertNotIn("data:image", json.dumps(result))

        call_kwargs = ai_client.chat.completions.create.call_args.kwargs
        user_content = call_kwargs["messages"][1]["content"]
        uploaded_images = [
            item["image_url"]["url"]
            for item in user_content
            if item["type"] == "image_url"
        ]
        self.assertEqual(uploaded_images, [jpeg_data(b"one"), jpeg_data(b"two")])
        self.assertNotIn("secret-hidden-image", repr(call_kwargs))
        self.assertNotIn("do not send this", repr(call_kwargs))

    def test_model_errors_and_invalid_json_return_deterministic_fallback(self):
        payload = story_payload()
        expected_cover = "Muddy Boots: Greenway Quest"

        broken_client = mock_openai_client("not json")
        cases = {
            "client failure": patch.object(
                trailquest, "get_client", side_effect=RuntimeError("secret API detail")
            ),
            "invalid model json": patch.object(
                trailquest, "get_client", return_value=broken_client
            ),
        }
        for name, client_patch in cases.items():
            with self.subTest(name=name), client_patch:
                response = self.client.post("/api/story", json=payload)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.headers["X-TrailQuest-Story-Source"], "fallback")
            result = response.get_json()
            self.assertEqual(result["cover_title"], expected_cover)
            self.assertEqual(
                [chapter["challenge_id"] for chapter in result["chapters"]], [1, 2]
            )
            self.assertEqual(
                result["chapters"][0]["narration"], "The photo shows peeling bark."
            )
            self.assertNotIn("We walked past it twice.", result["chapters"][0]["narration"])
            self.assertEqual([award["member"] for award in result["awards"]], ["Alex", "Sam"])
            self.assertNotIn("data:image", json.dumps(result))
            self.assertNotIn("secret API detail", json.dumps(result))

    def test_no_named_members_omits_individual_awards(self):
        payload = story_payload()
        payload["crew"]["members"] = []
        payload["moments"] = [payload["moments"][0]]
        payload["moments"][0]["verification_reason"] = ""

        with patch.object(trailquest, "get_client", side_effect=RuntimeError("offline")):
            response = self.client.post("/api/story", json=payload)

        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertEqual(result["awards"], [])
        self.assertTrue(result["chapters"][0]["narration"].startswith("The Crew"))

    def test_the_crew_contributor_is_preserved_with_named_members(self):
        payload = story_payload()
        payload["moments"] = [payload["moments"][0]]
        payload["moments"][0].update({
            "contributor": "  tHe CrEw  ",
            "verification_reason": "",
            "memory": "",
        })

        with patch.object(trailquest, "get_client", side_effect=RuntimeError("offline")):
            response = self.client.post("/api/story", json=payload)

        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertEqual(
            result["chapters"][0]["narration"],
            "The Crew captured this moment while completing Bark Detective.",
        )
        self.assertEqual(result["awards"], [])

    def test_camel_case_frontend_fields_and_zero_id_are_supported(self):
        payload = {
            "hunt_title": "Venue Dash",
            "crew": {
                "name": "Cable Crew",
                "members": ["Lee"],
                "storyStyle": "epic",
            },
            "moments": [{
                "challengeId": 0,
                "challengeTitle": "Cable Finder",
                "verificationReason": "The photo shows a cable.",
                "contributor": "Lee",
                "imageDataUrl": jpeg_data(b"camel"),
            }],
        }
        model_story = {
            "cover_title": "The Cable Chronicle",
            "subtitle": "One venue discovery",
            "opening": "The crew began its indoor expedition.",
            "chapters": [{
                "challenge_id": 0,
                "heading": "The Cable Appears",
                "narration": "Lee captured the cable.",
            }],
            "awards": [{
                "member": "Lee",
                "title": "Cable Scout",
                "reason": "Captured the included cable moment.",
            }],
            "closing": "The indoor expedition was complete.",
        }
        ai_client = mock_openai_client(json.dumps(model_story))

        with patch.object(trailquest, "get_client", return_value=ai_client):
            response = self.client.post("/api/story", json=payload)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["chapters"][0]["challenge_id"], 0)
        system_prompt = ai_client.chat.completions.create.call_args.kwargs["messages"][0]
        self.assertIn("Epic expedition", system_prompt["content"])

    def test_global_error_handler_does_not_leak_exception_details(self):
        with trailquest.app.test_request_context():
            response, status = trailquest.handle_error(
                RuntimeError("secret image and API details")
            )

        self.assertEqual(status, 500)
        body = response.get_json()
        self.assertEqual(body, {"error": "Something went wrong. Please try again."})
        self.assertNotIn("secret", json.dumps(body))

        with trailquest.app.test_request_context():
            response, status = trailquest.handle_error(RequestEntityTooLarge())
        self.assertEqual(status, 413)
        self.assertEqual(
            response.get_json(),
            {"error": "The request is too large. Try using smaller photos."},
        )


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""
Hollywood VOX Cinema - Text to Speech Web Server
Powered by ElevenLabs API with multi-character & gender Hollywood actor voices.
"""

import http.server
import socketserver
import json
import os
import sys
import hashlib
import time
import urllib.request
import urllib.error
from urllib.parse import urlparse, parse_qs

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

PORT = int(os.environ.get("PORT", 5000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, "audio_cache")
HISTORY_FILE = os.path.join(BASE_DIR, "history.json")
API_KEY = "sk_8ed90fecbdca74356ad12a603828c9d8897445a434d7c6ef"

os.makedirs(CACHE_DIR, exist_ok=True)

VOICES = [
    {
        "id": "pNInz6obpgDQGcFmaJgB",
        "name": "Morgan Freeman",
        "gender": "male",
        "title": "The Iconic Narrator",
        "tagline": "Deep, calm, god-like wisdom",
        "archetype": "Cinematic Storyteller & Epic Narrator",
        "avatar": "/assets/morgan.jpg",
        "accentColor": "#F59E0B",
        "accentGlow": "rgba(245, 158, 11, 0.4)",
        "elevenVoice": "Adam",
        "quote": "Hope is a good thing, maybe the best of things, and no good thing ever dies. I find I am so excited, I can barely sit still.",
        "movieRole": "The Shawshank Redemption / Bruce Almighty",
        "tags": ["Baritone", "Warm", "Wise", "Epic"]
    },
    {
        "id": "EXAVITQu4vr4xnSDxMaL",
        "name": "Scarlett Johansson",
        "gender": "female",
        "title": "The Alluring AI Companion",
        "tagline": "Intimate, sultry, velvety timbre",
        "archetype": "Sentient AI & Melodic Confidante",
        "avatar": "/assets/scarlett.jpg",
        "accentColor": "#EC4899",
        "accentGlow": "rgba(236, 72, 153, 0.4)",
        "elevenVoice": "Bella",
        "quote": "The heart's not like a box that gets filled up. It expands in size the more you love. I am right here with you.",
        "movieRole": "Her / Lost in Translation",
        "tags": ["Husky", "Intimate", "Sultry", "Emotive"]
    },
    {
        "id": "VR6AewLTigWG4xSOukaG",
        "name": "Arnold Schwarzenegger",
        "gender": "male",
        "title": "The Action Terminator",
        "tagline": "Commanding, explosive, legendary power",
        "archetype": "Cybernetic Warrior & Blockbuster Titan",
        "avatar": "/assets/arnold.jpg",
        "accentColor": "#06B6D4",
        "accentGlow": "rgba(6, 182, 212, 0.4)",
        "elevenVoice": "Arnold",
        "quote": "Hasta la vista, baby! If it bleeds, we can kill it. Remember: failure is not an option. Come with me if you want to live!",
        "movieRole": "Terminator 2 / Predator",
        "tags": ["Authoritative", "Heroic", "Intense", "Iconic"]
    },
    {
        "id": "cgSgspJ2msm6clMCkdW9",
        "name": "Emma Stone",
        "gender": "female",
        "title": "The Radiant Starlet",
        "tagline": "Vibrant, witty, emotionally captivating",
        "archetype": "Charming Dramedy & Oscar Starlet",
        "avatar": "/assets/emma.jpg",
        "accentColor": "#10B981",
        "accentGlow": "rgba(16, 185, 129, 0.4)",
        "elevenVoice": "Jessica",
        "quote": "Here's to the ones who dream, foolish as they may seem. Here's to the hearts that ache, here's to the mess we make.",
        "movieRole": "La La Land / Poor Things",
        "tags": ["Playful", "Dynamic", "Expressive", "Charming"]
    }
]

# Bonus voices that can also be accessed
BONUS_VOICES = [
    {
        "id": "JBFqnCBsd6RMkjVDRZzb",
        "name": "Matthew McConaughey",
        "gender": "male",
        "title": "The Cosmic Philosopher",
        "elevenVoice": "George",
        "quote": "Alright, alright, alright! We used to look up at the sky and wonder at our place in the stars."
    },
    {
        "id": "onwK4e9ZLuTAKqWW03F9",
        "name": "Daniel Craig",
        "gender": "male",
        "title": "The British Secret Agent",
        "elevenVoice": "Daniel",
        "quote": "The name is Bond. James Bond. We have all got our secrets, haven't we?"
    },
    {
        "id": "IKne3meq5aSn9XLyUdCD",
        "name": "Ryan Reynolds",
        "gender": "male",
        "title": "The Witty Maverick",
        "elevenVoice": "Charlie",
        "quote": "Maximum effort! With great power comes great merchandising opportunities."
    },
    {
        "id": "XrExE9yKIg1WjnnlVkGX",
        "name": "Cate Blanchett",
        "gender": "female",
        "title": "The Regal Orator",
        "elevenVoice": "Matilda",
        "quote": "The world is changed. I feel it in the water. I feel it in the earth. I smell it in the air."
    }
]

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_history(history):
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving history: {e}")

class StudioRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS and caching headers
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, xi-api-key")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/voices":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            data = {
                "featured": VOICES,
                "bonus": BONUS_VOICES
            }
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        elif path == "/api/history":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            history = load_history()
            self.wfile.write(json.dumps(history).encode("utf-8"))
            return

        elif path.startswith("/audio_cache/"):
            # Serve cached audio file
            filename = os.path.basename(path)
            file_path = os.path.join(CACHE_DIR, filename)
            if os.path.exists(file_path):
                self.send_response(200)
                self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Content-Length", str(os.path.getsize(file_path)))
                self.send_header("Accept-Ranges", "bytes")
                self.end_headers()
                with open(file_path, "rb") as f:
                    self.wfile.write(f.read())
                return
            else:
                self.send_response(404)
                self.end_headers()
                return

        # Default to static files
        super().do_GET()

    def do_DELETE(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/history/"):
            item_id = parsed.path.split("/")[-1]
            history = load_history()
            history = [h for h in history if h.get("id") != item_id]
            save_history(history)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode("utf-8"))
            return
        elif parsed.path == "/api/history":
            save_history([])
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/tts":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            try:
                payload = json.loads(body.decode("utf-8"))
            except Exception as e:
                self.send_error_response(400, f"Invalid JSON payload: {e}")
                return

            text = payload.get("text", "").strip()
            voice_id = payload.get("voiceId", "pNInz6obpgDQGcFmaJgB")
            model_id = payload.get("modelId", "eleven_turbo_v2_5")
            stability = float(payload.get("stability", 0.5))
            similarity_boost = float(payload.get("similarityBoost", 0.75))
            style = float(payload.get("style", 0.0))
            actor_name = payload.get("actorName", "Hollywood Voice")

            if not text:
                self.send_error_response(400, "Text is required")
                return

            # Compute cache key
            cache_raw = f"{voice_id}_{model_id}_{stability:.2f}_{similarity_boost:.2f}_{style:.2f}_{text}"
            cache_hash = hashlib.sha256(cache_raw.encode("utf-8")).hexdigest()
            cache_filename = f"{cache_hash}.mp3"
            cache_path = os.path.join(CACHE_DIR, cache_filename)
            audio_url = f"/audio_cache/{cache_filename}"

            # Check if cached
            if os.path.exists(cache_path) and os.path.getsize(cache_path) > 1000:
                print(f"[CACHE HIT] {cache_filename} for '{text[:30]}...'")
                self.register_and_respond(cache_path, audio_url, text, voice_id, actor_name, is_cached=True)
                return

            # Make request to ElevenLabs
            eleven_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            eleven_data = {
                "text": text,
                "model_id": model_id,
                "voice_settings": {
                    "stability": stability,
                    "similarity_boost": similarity_boost,
                    "style": style,
                    "use_speaker_boost": True
                }
            }

            req = urllib.request.Request(
                eleven_url,
                data=json.dumps(eleven_data).encode("utf-8"),
                headers={
                    "xi-api-key": API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg"
                }
            )

            try:
                print(f"[TTS GENERATING] Voice: {actor_name} ({voice_id}), Model: {model_id}, Text: '{text[:40]}...'")
                with urllib.request.urlopen(req, timeout=30) as resp:
                    audio_bytes = resp.read()
                    with open(cache_path, "wb") as f:
                        f.write(audio_bytes)
                    print(f"[TTS SUCCESS] {len(audio_bytes)} bytes written to {cache_filename}")
                    self.register_and_respond(cache_path, audio_url, text, voice_id, actor_name, is_cached=False)
                    return
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="ignore")
                print(f"[TTS HTTP ERROR] {e.code}: {err_body}")
                try:
                    err_json = json.loads(err_body)
                    msg = err_json.get("detail", {}).get("message", err_body)
                except Exception:
                    msg = err_body
                self.send_error_response(e.code, f"ElevenLabs API Error: {msg}")
                return
            except Exception as e:
                print(f"[TTS EXCEPTION] {e}")
                self.send_error_response(500, f"Server Error generating speech: {e}")
                return

        self.send_response(404)
        self.end_headers()

    def register_and_respond(self, cache_path, audio_url, text, voice_id, actor_name, is_cached=False):
        file_size = os.path.getsize(cache_path)
        item_id = str(int(time.time() * 1000))
        item = {
            "id": item_id,
            "text": text,
            "voiceId": voice_id,
            "actorName": actor_name,
            "audioUrl": audio_url,
            "fileSize": file_size,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "cached": is_cached
        }

        # Add to history (keep latest 30)
        history = load_history()
        # check if duplicate text and voice
        history = [h for h in history if not (h.get("text") == text and h.get("voiceId") == voice_id)]
        history.insert(0, item)
        save_history(history[:30])

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": True,
            "item": item
        }).encode("utf-8"))

    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": False,
            "error": message
        }).encode("utf-8"))

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    port = PORT
    for attempt in range(5):
        try:
            with socketserver.TCPServer(("", port), StudioRequestHandler) as httpd:
                print("==================================================")
                print("[VOX CINEMA] Hollywood AI TTS Studio")
                print(f"[SERVER] Running at: http://localhost:{port}")
                print(f"[SERVER] Project root: {BASE_DIR}")
                print("[SERVER] ElevenLabs API Key Active")
                print("==================================================")
                sys.stdout.flush()
                httpd.serve_forever()
                break
        except OSError as e:
            if "Address already in use" in str(e) or e.errno == 10048 or e.errno == 98:
                print(f"Port {port} in use, trying {port + 1}...")
                port += 1
            else:
                raise

if __name__ == "__main__":
    run_server()

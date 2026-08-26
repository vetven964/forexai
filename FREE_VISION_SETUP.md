# V-TRADE FREE Vision

## Goal
Screenshot upload on phone/PC -> local/self-hosted Vision model -> ICT decision engine -> BUY/SELL/WAIT.

## No OpenAI
This feature is designed with OpenAI disabled. Do not set `OPENAI_API_KEY`.

## Environment
- `AI_VISION_ENABLED=true`
- `OLLAMA_BASE_URL=http://YOUR-OLLAMA-HOST:11434`
- `OLLAMA_VISION_MODEL=qwen2.5vl:3b`
- `AI_VISION_TIMEOUT_MS=90000`
- `AI_VISION_RATE_LIMIT=6`

## Important Render note
The Render web service is the frontend/API gateway. A free Render web service should not be expected to run a large multimodal model itself. The Vision model must run on a separate machine/service that the Render app can reach, or the app must fall back to WAIT.

## Safe behavior
If the Vision provider is unavailable, the endpoint returns an error and must not invent a signal. The UI should show the provider as unavailable and keep live MT5/ICT analysis separate.

## Endpoint
`POST /api/v5/ai/vision/chart`

Input:
`{ "imageDataUrl": "data:image/jpeg;base64,..." }`

Output includes `signal`, `bias`, `confidence`, ICT fields, entry/SL/TP and blockers.

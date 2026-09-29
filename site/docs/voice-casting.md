# Character voice casting

Stigen gives each recurring character one Azure multilingual neural voice. The
same voice speaks both Swedish (`sv-SE`) and English support (`en-GB`), so the
learner recognises the speaker instead of hearing a different persona whenever
the language changes.

| Character | Teaching role | Azure voice | Normal pace | Slow pace |
|---|---|---|---:|---:|
| Alex | Learner making the first attempt | `en-US-BrianMultilingualNeural` | `0%` | `-24%` |
| Aino | Warm conversation partner | `en-US-AvaMultilingualNeural` | `+2%` | `-22%` |
| Sami | Calm teacher and default narrator | `en-US-AndrewMultilingualNeural` | `-6%` | `-28%` |

The canonical mapping lives in `lib/character-voices.ts`. Do not assign voices
inside individual lessons or components. New recurring characters must receive
one documented multilingual profile there before they appear in voiced scenes.

## Runtime behaviour

- `POST /api/speech` builds escaped SSML and calls Azure Speech from the server.
- Dialogue playback switches voices between lines in one SSML document.
- Individual Swedish lines use the speaker's `sv-SE` voice.
- Expanded English support uses the same speaker with `en-GB` pronunciation.
- Non-character vocabulary and explanation audio defaults to Sami.
- If Azure synthesis is unavailable, playback stays unavailable and the control
  shows a clear error. Stigen never substitutes a browser, operating-system,
  static, or downloaded voice.

## Configuration

Set the server-only values described in `.env.example`:

```dotenv
AZURE_SPEECH_ENDPOINT=https://YOUR_RESOURCE.services.ai.azure.com
AZURE_SPEECH_API_KEY=YOUR_KEY
AZURE_SPEECH_TTS_ENDPOINT=https://YOUR_REGION.tts.speech.microsoft.com/cognitiveservices/v1
```

The TTS endpoint must match the region of the Speech resource. Never expose the
key through a `NEXT_PUBLIC_` variable.

Azure-only playback is intentional. Do not add `window.speechSynthesis`, an
audio manifest, bundled recordings, or downloaded chapter audio as a fallback.

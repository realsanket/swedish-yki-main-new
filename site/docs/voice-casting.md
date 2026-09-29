# Character voice casting

Stigen gives each recurring character an explicit Azure voice for Swedish and
English. A multilingual voice stays with the character when its verified
Swedish output is strong; Sami uses a Swedish-native voice for Swedish after a
live pronunciation check found clearer, complete recognition.

| Character | Teaching role | Swedish voice | English voice | Normal pace | Slow pace |
|---|---|---|---|---:|---:|
| Alex | Learner making the first attempt | `en-US-BrianMultilingualNeural` with `sv-SE` | `en-US-BrianMultilingualNeural` | `0%` | `-24%` |
| Aino | Warm conversation partner | `en-US-AvaMultilingualNeural` with `sv-SE` | `en-US-AvaMultilingualNeural` | `+2%` | `-22%` |
| Sami | Calm teacher and default narrator | `sv-SE-MattiasNeural` | `en-US-AndrewMultilingualNeural` | `-6%` | `-28%` |

The canonical mapping lives in `lib/character-voices.ts`. Do not assign voices
inside individual lessons or components. New recurring characters must receive
one documented multilingual profile there before they appear in voiced scenes.

## Runtime behaviour

- `POST /api/speech` builds escaped SSML and calls Azure Speech from the server.
- Dialogue playback switches voices between lines in one SSML document.
- Individual Swedish lines use the speaker's verified Swedish voice and
  `sv-SE` locale.
- Expanded English support uses the speaker's English voice with `en-GB`
  pronunciation.
- Non-character vocabulary and explanation audio defaults to Sami.
- If Azure synthesis is unavailable, playback stays unavailable and the control
  shows a clear error. Stigen never substitutes a browser, operating-system,
  static, or downloaded voice.

## Configuration

Set the server-only values described in `.env.example`:

```dotenv
AZURE_SPEECH_ENDPOINT=https://YOUR_RESOURCE.services.ai.azure.com
AZURE_SPEECH_API_KEY=
AZURE_SPEECH_TTS_ENDPOINT=https://YOUR_RESOURCE.cognitiveservices.azure.com/
```

For a Foundry/Speech custom domain, Stigen appends
`/tts/cognitiveservices/v1` for REST synthesis. A full regional endpoint such
as `https://swedencentral.tts.speech.microsoft.com/cognitiveservices/v1` is
also accepted. `AZURE_SPEECH_API_KEY` is optional when Speech belongs to the
same Foundry resource: the server reuses `AZURE_OPENAI_API_KEY`. Never expose a
key through a `NEXT_PUBLIC_` variable.

Azure-only playback is intentional. Do not add `window.speechSynthesis`, an
audio manifest, bundled recordings, or downloaded chapter audio as a fallback.

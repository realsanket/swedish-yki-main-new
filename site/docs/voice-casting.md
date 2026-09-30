# Character voice casting

Stigen gives each recurring character an explicit Azure voice for Swedish and
English. Every Swedish line is a model the learner copies, so Swedish always
uses a native `sv-SE` voice. Azure has three: Sofie, Hillevi and Mattias. There
is no Finland-Swedish voice; real Finland-Swedish audio has to come from
recordings (for example Svenska Yle). English explanations keep multilingual
voices. Alex and Henrik share Mattias and are told apart by pitch.

| Character | Teaching role | Swedish voice | English voice | Normal pace | Slow pace | Pitch |
|---|---|---|---|---:|---:|---:|
| Alex | Learner making the first attempt | `sv-SE-MattiasNeural` | `en-US-BrianMultilingualNeural` | `+3%` | `-22%` | `+9%` |
| Elin | Warm conversation partner | `sv-SE-HilleviNeural` | `en-US-AvaMultilingualNeural` | `+2%` | `-22%` | default |
| Henrik | Calm teacher and default narrator | `sv-SE-MattiasNeural` | `en-US-AndrewMultilingualNeural` | `-6%` | `-28%` | `-4%` |
| Maja | Student viewpoint for school and youth life | `sv-SE-SofieNeural` | `en-US-EmmaMultilingualNeural` | `+2%` | `-22%` | default |

The live voice coach is separate: it defaults to the multilingual HD voice
`en-US-Andrew:DragonHDLatestNeural` because it must switch between Swedish
and English in one reply.

Both Maja previews returned valid 24 kHz mono MP3 audio from the configured
Azure resource on September 29, 2026. Her first voiced story scene remains tied
to the first verified school or youth-life lesson rather than Lecture 1.

The canonical mapping lives in `lib/character-voices.ts`. Do not assign voices
inside individual lessons or components. New recurring characters must receive
one documented profile there (a native `sv-SE` voice for Swedish) before they appear in voiced scenes.

## Runtime behaviour

- `POST /api/speech` builds escaped SSML and calls Azure Speech from the server.
- Dialogue playback switches voices between lines in one SSML document.
- Individual Swedish lines use the speaker's verified Swedish voice and
  `sv-SE` locale.
- Expanded English support uses the speaker's English voice with `en-GB`
  pronunciation.
- Non-character vocabulary and explanation audio defaults to Henrik.
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

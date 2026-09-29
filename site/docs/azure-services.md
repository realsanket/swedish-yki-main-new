# Azure services for Stigen

This is the durable service map for the Swedish learning app. Keep provider
credentials server-only and do not add a `NEXT_PUBLIC_` key.

## Connected now

| Learning capability | Azure service | Server configuration |
|---|---|---|
| Writing and transcript feedback | Azure OpenAI / Microsoft Foundry | `AZURE_OPENAI_BASE_URL`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_FEEDBACK_MODEL` |
| Recorded-speech transcription | Azure Speech fast transcription | `AZURE_SPEECH_ENDPOINT`, the shared resource key, `AZURE_SPEECH_API_VERSION` |
| Chapter and character audio | Azure Speech text to speech | `AZURE_SPEECH_TTS_ENDPOINT`, the shared resource key |
| Live speaking partner | Azure Speech Voice Live | `AZURE_VOICELIVE_ENDPOINT`, the shared resource key, `AZURE_VOICELIVE_MODEL`, `AZURE_VOICELIVE_VOICE` |

All connected services use the `main-azure-backup-resource` Foundry resource.
Its resource key is reused by Speech when `AZURE_SPEECH_API_KEY` is empty. Do
not duplicate the secret unless Speech is later moved to a different resource.

The project-management endpoint is:

```text
https://main-azure-backup-resource.services.ai.azure.com/api/projects/main-azure-backup
```

Runtime model calls use the resource endpoint rather than the project path:

```text
https://main-azure-backup-resource.openai.azure.com/openai/v1
```

## Voice Live endpoint decision

Live conversation uses Azure Speech Voice Live at the resource root:

```text
https://main-azure-backup-resource.services.ai.azure.com
```

The browser opens Stigen's same-origin `/api/live/ws` WebSocket. The custom
Next.js server then opens the Azure Voice Live session with the official
JavaScript SDK. This keeps the long-lived resource key and trusted lesson
prompt on the server while still carrying small 24 kHz PCM audio packets in
both directions.

The deployed voice session uses:

- `gpt-realtime-2.1-mini` for the realtime conversation;
- `sv-SE-MattiasNeural` with preferred output locales `sv-SE` and `en-IN`, so
  Swedish remains Swedish and English explanations use an Indian-English accent;
- patient server VAD (1.1 seconds for conversation, 1.4 seconds for sound
  practice) with response interruption and automatic truncation;
- Azure deep noise suppression and server echo cancellation; and
- multilingual Whisper transcription for Swedish practice and English questions.

Voice Live automatically detects the language of generated text when no single
output locale is enforced. Its `preferLocales` setting changes each language's
accent without forcing the entire session into one language. Likewise, leaving
the Whisper input language unset allows Swedish and English turns in the same
conversation.

Azure's multilingual semantic VAD currently rejects `sv-SE` with this realtime
model. Azure Speech transcription inside Voice Live also requires semantic VAD.
Stigen therefore uses the accepted `server_vad` plus `whisper-1` combination for
Swedish. This is an observed provider compatibility constraint, not a UI
fallback.

## Text-to-speech endpoint decision

Azure Speech transcription uses the resource-level endpoint (without the
project path):

```text
https://main-azure-backup-resource.services.ai.azure.com
```

Text-to-speech uses the matching custom-domain base endpoint:

```text
https://main-azure-backup-resource.cognitiveservices.azure.com/
```

Stigen normalizes that base to the REST synthesis endpoint:

```text
https://main-azure-backup-resource.cognitiveservices.azure.com/tts/cognitiveservices/v1
```

The consolidated resource returned valid Swedish audio, and its speech service
recognized the complete loopback sentence “Hej, jag heter Alex och jag bor i
Finland.” Alex and Aino retain their multilingual voices because earlier Azure
pronunciation checks recognized their sample lines completely with 98/100 word
accuracy. Sami uses native `sv-SE-MattiasNeural` for Swedish and keeps
`en-US-AndrewMultilingualNeural` for English; Mattias achieved 96/100 word
accuracy and complete recognition on Sami's Swedish sample. The Settings voice
previews remain the source of truth for the currently configured resource.

These scores validate recognition and word accuracy, not human-perceived voice
quality. Azure Speech does not currently support prosody assessment for Swedish,
so the Settings voice previews remain the final listening check.

## Configuration and live checks

The Azure settings tab deliberately separates these states:

- **Configured** means every required server variable is present.
- **Live verified** means a user-triggered request completed against Azure.
- The feedback check sends a small Swedish prompt to the configured Foundry
  model.
- The transcription check synthesizes Swedish with Azure Speech and sends that
  WAV back through Azure Speech transcription.
- The character voice check requests Swedish audio from the native Mattias
  voice.
- The live conversation test uses the real browser-to-Stigen-to-Azure Voice Live flow. It is
  user initiated because starting it asks for microphone permission and streams
  microphone audio to Azure until the session ends.

## Reusable episode and module integration

The reusable UI entry point is `components/learning/AzureVoiceTools.tsx`. It
checks live capability availability once and can render conversation,
pronunciation, or both:

```tsx
<AzureVoiceTools contextId="lecture-01" />
<AzureVoiceTools contextId="module-01" tools={["conversation"]} />
```

The lower-level `LiveVoice` component accepts the same `contextId` when a
practice screen already owns its AI capability state or needs transcript
callbacks. Accepted IDs are `lecture-XX`, its `episode-XX` alias, and
`module-XX`.

`lib/voice-live-context.mjs` resolves those IDs against server-owned curriculum
files and places strict limits on aggregated objectives, phrases, dialogue, and
pronunciation material. The browser cannot supply raw instructions or a file
path. This keeps future episode and module reuse convenient without moving the
Azure key or trusted system prompt into client code.

The public, non-secret capability descriptions live in
`lib/azure-capabilities.ts`. Settings and future modules should import that
registry rather than duplicating service names, environment-variable names, or
test labels.

## Best next services

1. **Pronunciation Assessment** — highest teaching value. Swedish `sv-SE` is
   supported, and this can add accuracy, fluency, completeness, and miscue feedback
   to the current record-and-review flow. Keep it formative and never present
   the result as an official YKI grade. Prosody assessment is currently limited
   to `en-US` and must not be presented for Swedish.
2. **Content Understanding `prebuilt-layout` or `prebuilt-read`** — useful as an
   authoring tool for importing teacher worksheets, scanned homework, and new
   textbook references while preserving paragraphs and tables. It should not
   automatically publish extracted content into lessons.
3. **Text PII redaction** — useful before sending free-form learner writing or
   transcripts to feedback models. Add it when accounts or shared deployments
   make learner privacy more important.
4. **Azure Translator text translation** — useful for optional learner-requested
   support languages. Keep the authored Swedish and English teaching copy as
   the source of truth instead of automatically translating lessons.
5. **Speech translation and language detection** — optional for later
   multilingual conversation support. They are not required when an exercise
   already declares Swedish as the input language.

## Not a current fit

- Invoice, tax, and call-center analyzers do not serve the Swedish course.
- Text-to-speech avatars add presentation cost and complexity without improving
  the first lesson's teaching loop.
- Document translation should not replace the source-mapping and editorial
  review process.

## Official references

- [Text-to-speech REST API](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Text-to-speech quickstart](https://learn.microsoft.com/azure/ai-services/speech-service/get-started-text-to-speech)
- [Speech language and voice support](https://learn.microsoft.com/azure/ai-services/speech-service/language-support)
- [Language learning with Azure Speech](https://learn.microsoft.com/Azure/ai-services/speech-service/language-learning-overview)
- [Pronunciation Assessment](https://learn.microsoft.com/azure/ai-services/speech-service/how-to-pronunciation-assessment)
- [Azure Speech Voice Live overview](https://learn.microsoft.com/azure/ai-services/speech-service/voice-live)
- [Microsoft Voice Live JavaScript samples](https://github.com/microsoft-foundry/voicelive-samples/tree/main/javascript)
- [Content Understanding prebuilt analyzers](https://learn.microsoft.com/azure/ai-services/content-understanding/concepts/prebuilt-analyzers)
- [Azure Translator overview](https://learn.microsoft.com/azure/ai-services/translator/text-translation/overview)
- [Text PII redaction](https://learn.microsoft.com/azure/ai-services/language-service/personally-identifiable-information/how-to/redact-text-pii)
- [Azure Speech SDK samples](https://github.com/Azure-Samples/cognitive-services-speech-sdk)

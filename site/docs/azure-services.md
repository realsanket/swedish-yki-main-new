# Azure services for Stigen

This is the durable service map for the Swedish learning app. Keep provider
credentials server-only and do not add a `NEXT_PUBLIC_` key.

## Connected now

| Learning capability | Azure service | Server configuration |
|---|---|---|
| Writing and transcript feedback | Azure OpenAI / Microsoft Foundry | `AZURE_OPENAI_BASE_URL`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_FEEDBACK_MODEL` |
| Recorded-speech transcription | Azure Speech fast transcription | `AZURE_SPEECH_ENDPOINT`, the shared resource key, `AZURE_SPEECH_API_VERSION` |
| Chapter and character audio | Azure Speech text to speech | `AZURE_SPEECH_TTS_ENDPOINT`, the shared resource key |
| Live speaking partner | Azure OpenAI Realtime over WebRTC | `AZURE_OPENAI_BASE_URL`, the shared resource key, `AZURE_OPENAI_VOICE_MODEL` |

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

## Realtime endpoint decision

The deployed server-to-server WebSocket address is:

```text
wss://main-azure-backup-resource.openai.azure.com/openai/v1/realtime?model=gpt-realtime-2.1-mini
```

Stigen is a browser application, so it uses the lower-latency GA WebRTC form on
the same resource instead:

```text
https://main-azure-backup-resource.openai.azure.com/openai/v1/realtime/calls
```

The trusted `/api/live` route creates a short-lived Realtime client secret,
keeps it server-side, and proxies the SDP negotiation. It also enables
`webrtcfilter=on`, so the Azure key, ephemeral secret, lesson prompt, and
unfiltered provider events do not reach the browser. Keep only the shared
`/openai/v1` base URL and
`AZURE_OPENAI_VOICE_MODEL=gpt-realtime-2.1-mini` in the environment; do not add
a duplicate WebSocket URL variable.

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
- The live conversation test uses the real browser-to-Azure WebRTC flow. It is
  user initiated because starting it asks for microphone permission and streams
  microphone audio to Azure until the session ends.

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
- [Azure OpenAI Realtime with WebRTC](https://learn.microsoft.com/azure/foundry/openai/how-to/realtime-audio-webrtc)
- [Azure OpenAI Realtime REST reference](https://learn.microsoft.com/rest/api/microsoft-foundry/azureopenai/realtime)
- [Content Understanding prebuilt analyzers](https://learn.microsoft.com/azure/ai-services/content-understanding/concepts/prebuilt-analyzers)
- [Azure Translator overview](https://learn.microsoft.com/azure/ai-services/translator/text-translation/overview)
- [Text PII redaction](https://learn.microsoft.com/azure/ai-services/language-service/personally-identifiable-information/how-to/redact-text-pii)
- [Azure Speech SDK samples](https://github.com/Azure-Samples/cognitive-services-speech-sdk)

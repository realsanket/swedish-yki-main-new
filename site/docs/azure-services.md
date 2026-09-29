# Azure services for Stigen

This is the durable service map for the Swedish learning app. Keep provider
credentials server-only and do not add a `NEXT_PUBLIC_` key.

## Connected now

| Learning capability | Azure service | Server configuration |
|---|---|---|
| Writing and transcript feedback | Azure OpenAI / Microsoft Foundry | `AZURE_OPENAI_BASE_URL`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_FEEDBACK_MODEL` |
| Recorded-speech transcription | Azure Speech fast transcription | `AZURE_SPEECH_ENDPOINT`, the shared resource key, `AZURE_SPEECH_API_VERSION` |
| Chapter and character audio | Azure Speech text to speech | `AZURE_SPEECH_TTS_ENDPOINT`, the shared resource key |
| Live speaking partner | Azure GPT Live | `AZURE_OPENAI_BASE_URL`, the shared resource key, `AZURE_OPENAI_VOICE_MODEL` |

The Foundry resource key is reused by Speech when `AZURE_SPEECH_API_KEY` is
empty. Do not duplicate the secret unless Speech is later moved to a different
resource.

## Text-to-speech endpoint decision

The Speech SDK accepts the custom-domain base endpoint:

```text
https://main-ai-foundry-3103.cognitiveservices.azure.com/
```

Stigen calls the REST API, so it normalizes that base to:

```text
https://main-ai-foundry-3103.cognitiveservices.azure.com/tts/cognitiveservices/v1
```

The custom-domain voice catalog uses:

```text
https://main-ai-foundry-3103.cognitiveservices.azure.com/tts/cognitiveservices/voices/list
```

The live resource check returned 787 voices and confirmed the assigned Alex,
Aino, and Sami multilingual voices. A Swedish synthesis request returned a
valid 24 kHz MP3. The shorter custom-domain path `/cognitiveservices/v1`
returned 404 and must not be used for this resource.

## Best next services

1. **Pronunciation Assessment** — highest teaching value. Swedish `sv-SE` is
   supported, and this can add accuracy, fluency, prosody, and miscue feedback
   to the current record-and-review flow. Keep it formative and never present
   the result as an official YKI grade.
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
- [Content Understanding prebuilt analyzers](https://learn.microsoft.com/azure/ai-services/content-understanding/concepts/prebuilt-analyzers)
- [Azure Translator overview](https://learn.microsoft.com/azure/ai-services/translator/text-translation/overview)
- [Text PII redaction](https://learn.microsoft.com/azure/ai-services/language-service/personally-identifiable-information/how-to/redact-text-pii)
- [Azure Speech SDK samples](https://github.com/Azure-Samples/cognitive-services-speech-sdk)

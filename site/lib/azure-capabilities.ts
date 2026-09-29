/**
 * Public metadata for the Azure-backed learning tools.
 *
 * This registry intentionally contains variable names, never secret values.
 * Settings, episodes, and modules can share the same capability vocabulary
 * without duplicating provider configuration details in UI components.
 */
export const azureCapabilities = [
  {
    key: "feedback",
    service: "Azure OpenAI / Microsoft Foundry",
    title: "Writing & speaking feedback",
    description: "Coaching on submitted text and speaking transcripts.",
    variables: [
      "AZURE_OPENAI_BASE_URL",
      "AZURE_OPENAI_API_KEY",
      "AZURE_OPENAI_FEEDBACK_MODEL",
    ],
    testLabel: "Send Swedish test",
  },
  {
    key: "transcription",
    service: "Azure Speech transcription",
    title: "Recording transcription",
    description: "Turn a Swedish recording into editable text.",
    variables: [
      "AZURE_SPEECH_ENDPOINT",
      "AZURE_SPEECH_API_KEY or AZURE_OPENAI_API_KEY",
      "AZURE_SPEECH_API_VERSION",
    ],
    testLabel: "Run Swedish loopback",
  },
  {
    key: "characterVoices",
    service: "Azure Speech text to speech",
    title: "Character voices",
    description:
      "Alex, Elin, and Henrik keep their own voice in Swedish and English.",
    variables: [
      "AZURE_SPEECH_TTS_ENDPOINT",
      "AZURE_SPEECH_API_KEY or AZURE_OPENAI_API_KEY",
    ],
    testLabel: "Generate Swedish audio",
  },
  {
    key: "liveVoice",
    service: "Azure Speech Voice Live",
    title: "Live voice conversation",
    description: "Talk in Swedish and ask for help in Indian English.",
    variables: [
      "AZURE_VOICELIVE_ENDPOINT",
      "AZURE_OPENAI_API_KEY",
      "AZURE_VOICELIVE_MODEL",
      "AZURE_VOICELIVE_VOICE",
    ],
    testLabel: "Open live conversation test",
  },
] as const;

export type AzureCapabilityKey = (typeof azureCapabilities)[number]["key"];
export type CheckableAzureCapability = Exclude<
  AzureCapabilityKey,
  "liveVoice"
>;

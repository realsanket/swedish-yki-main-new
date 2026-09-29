const OUTPUT_RATE = 24_000;
const CAPTURE_FRAMES = 1_200;

export class VoiceLiveAudio {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private capture: AudioWorkletNode | null = null;
  private silentGain: GainNode | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private nextStart = 0;

  async initialize(onAudio: (bytes: Uint8Array<ArrayBuffer>) => void, onMicrophoneEnded: () => void) {
    this.context = new AudioContext({ latencyHint: "interactive" });
    await this.context.audioWorklet.addModule("/voice-live-capture-worklet.js");
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    const [track] = this.stream.getAudioTracks();
    if (!track) throw new DOMException("No microphone was found.", "NotFoundError");
    track.onended = onMicrophoneEnded;
    const input = this.context.createMediaStreamSource(this.stream);
    this.capture = new AudioWorkletNode(this.context, "stigen-voice-capture", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: { targetRate: OUTPUT_RATE, chunkFrames: CAPTURE_FRAMES },
    });
    this.capture.port.onmessage = ({ data }: MessageEvent<ArrayBuffer>) => {
      if (data instanceof ArrayBuffer) onAudio(new Uint8Array(data));
    };
    this.silentGain = this.context.createGain();
    this.silentGain.gain.value = 0;
    input.connect(this.capture);
    this.capture.connect(this.silentGain);
    this.silentGain.connect(this.context.destination);
    await this.resume();
  }

  async resume() {
    if (!this.context) return;
    if (this.context.state === "suspended") await this.context.resume();
  }

  setMuted(muted: boolean) {
    this.stream?.getAudioTracks().forEach((track) => { track.enabled = !muted; });
  }

  async playPcm16(bytes: Uint8Array) {
    const context = this.context;
    if (!context || bytes.byteLength < 2) return;
    await this.resume();
    const evenLength = bytes.byteLength - (bytes.byteLength % 2);
    const view = new DataView(bytes.buffer, bytes.byteOffset, evenLength);
    const frames = evenLength / 2;
    const audio = context.createBuffer(1, frames, OUTPUT_RATE);
    const channel = audio.getChannelData(0);
    for (let index = 0; index < frames; index += 1) channel[index] = view.getInt16(index * 2, true) / 32768;
    const source = context.createBufferSource();
    source.buffer = audio;
    source.connect(context.destination);
    const startAt = Math.max(context.currentTime + 0.015, this.nextStart);
    this.nextStart = startAt + audio.duration;
    this.sources.add(source);
    source.onended = () => { this.sources.delete(source); source.disconnect(); };
    source.start(startAt);
  }

  stopPlayback() {
    for (const source of this.sources) {
      source.onended = null;
      try { source.stop(); } catch { /* already stopped */ }
      source.disconnect();
    }
    this.sources.clear();
    this.nextStart = this.context?.currentTime ?? 0;
  }

  async close() {
    this.stopPlayback();
    if (this.capture) {
      this.capture.port.onmessage = null;
      this.capture.disconnect();
      this.capture = null;
    }
    this.silentGain?.disconnect();
    this.silentGain = null;
    this.stream?.getTracks().forEach((track) => { track.onended = null; track.stop(); });
    this.stream = null;
    const context = this.context;
    this.context = null;
    if (context && context.state !== "closed") await context.close();
  }
}

export function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

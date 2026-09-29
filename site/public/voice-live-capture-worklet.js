class StigenVoiceCapture extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const configured = options.processorOptions || {};
    this.targetRate = configured.targetRate || 24000;
    this.chunkFrames = configured.chunkFrames || 1200;
    this.ratio = sampleRate / this.targetRate;
    this.source = new Float32Array(0);
    this.position = 0;
    this.output = new Int16Array(this.chunkFrames);
    this.outputLength = 0;
  }

  append(input) {
    const combined = new Float32Array(this.source.length + input.length);
    combined.set(this.source);
    combined.set(input, this.source.length);
    this.source = combined;
  }

  emit(sample) {
    const limited = Math.max(-1, Math.min(1, sample));
    this.output[this.outputLength++] = limited < 0 ? limited * 0x8000 : limited * 0x7fff;
    if (this.outputLength === this.output.length) {
      const packet = this.output;
      this.port.postMessage(packet.buffer, [packet.buffer]);
      this.output = new Int16Array(this.chunkFrames);
      this.outputLength = 0;
    }
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input?.length) return true;
    this.append(input);
    while (this.position + 1 < this.source.length) {
      const index = Math.floor(this.position);
      const fraction = this.position - index;
      const value = this.source[index] + (this.source[index + 1] - this.source[index]) * fraction;
      this.emit(value);
      this.position += this.ratio;
    }
    const consumed = Math.floor(this.position);
    if (consumed > 0) {
      this.source = this.source.slice(consumed);
      this.position -= consumed;
    }
    return true;
  }
}

registerProcessor("stigen-voice-capture", StigenVoiceCapture);

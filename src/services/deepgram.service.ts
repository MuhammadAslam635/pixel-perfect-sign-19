// Deepgram real-time speech-to-text streaming service via backend proxy
export interface DeepgramMessage {
  type: string;
  channel_index?: number[];
  duration?: number;
  start?: number;
  is_final?: boolean;
  speech_final?: boolean;
  channel?: {
    alternatives: Array<{
      transcript: string;
      confidence: number;
    }>;
  };
  metadata?: {
    request_id: string;
    model_info: any;
    model_uuid: string;
  };
  message?: string;
}

export class DeepgramTranscriptionService {
  private socket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private isListening = false;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  // Callbacks
  private onTranscriptCallback:
    | ((text: string, isFinal: boolean) => void)
    | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  private getBackendWebSocketUrl(): string {
    const userData = localStorage.getItem("user");
    let token = null;
    if (userData) {
      try {
        const user = JSON.parse(userData);
        token = user.token;
      } catch (error) {
        console.error("Error parsing user data for WebSocket auth:", error);
      }
    }

    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
    const backendUrl =
      import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:5111/api";
    const url = new URL(backendUrl);
    const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";

    return `${wsProtocol}//${url.host}/api/deepgram/stream${tokenParam}`;
  }

  private setupWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.getBackendWebSocketUrl());

      this.socket.onopen = () => {
        console.log("Backend WebSocket connected");
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const data: DeepgramMessage | string = JSON.parse(event.data);

          if (typeof data === "object" && data.type === "connected") {
            console.log("Deepgram streaming ready");
            return;
          }

          if (typeof data === "object" && data.type === "error") {
            if (this.onErrorCallback) {
              this.onErrorCallback(
                data.message || "Transcription service error"
              );
            }
            return;
          }

          if (typeof data === "object" && data.type === "Results") {
            const transcript =
              data.channel?.alternatives?.[0]?.transcript || "";
            const isFinal = data.is_final || false;

            if (this.onTranscriptCallback && transcript) {
              this.onTranscriptCallback(transcript, isFinal);
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (this.onErrorCallback) {
          this.onErrorCallback("WebSocket connection error");
        }
        reject(error);
      };

      this.socket.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        this.isListening = false;
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      };
    });
  }

  // Convert Float32Array to Int16Array (PCM format)
  private convertFloat32ToInt16(buffer: Float32Array): Int16Array {
    const int16Buffer = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Buffer;
  }

  // Setup audio processing using Web Audio API for raw PCM
  private setupAudioProcessing(stream: MediaStream): void {
    // Create audio context with 16kHz sample rate
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.source = this.audioContext.createMediaStreamSource(stream);

    // Create script processor for raw audio data
    const bufferSize = 4096;
    this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    this.processor.onaudioprocess = (event) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const inputData = event.inputBuffer.getChannelData(0);
        const int16Data = this.convertFloat32ToInt16(inputData);

        // Send raw PCM data
        if (int16Data.length > 0) {
          this.socket.send(int16Data.buffer);
          console.log("Sent audio data:", int16Data.length * 2, "bytes");
        }
      }
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  async startListening(
    onTranscript: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ): Promise<boolean> {
    if (this.isListening) {
      return false;
    }

    try {
      this.onTranscriptCallback = onTranscript;
      this.onErrorCallback = onError || null;
      this.onEndCallback = onEnd || null;

      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Setup WebSocket connection to backend
      await this.setupWebSocket();

      // Setup audio processing with Web Audio API
      this.setupAudioProcessing(this.stream);

      this.isListening = true;
      console.log("Started listening with raw PCM audio");

      return true;
    } catch (error) {
      console.error("Error starting transcription:", error);

      if (error instanceof Error) {
        if (this.onErrorCallback) {
          if (error.message.includes("permission")) {
            this.onErrorCallback(
              "Microphone permission denied. Please allow microphone access."
            );
          } else {
            this.onErrorCallback(
              `Failed to start transcription: ${error.message}`
            );
          }
        }
      }

      this.cleanup();
      return false;
    }
  }

  stopListening(): void {
    this.isListening = false;
    this.cleanup();
  }

  private cleanup(): void {
    // Disconnect audio processing
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Close WebSocket
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }

    // Stop media stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    this.socket = null;
    this.stream = null;
  }

  isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.WebSocket &&
      window.AudioContext
    );
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

// Global instance
export const deepgramTranscription = new DeepgramTranscriptionService();

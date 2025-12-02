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

  // Callbacks
  private onTranscriptCallback:
    | ((text: string, isFinal: boolean) => void)
    | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  private getBackendWebSocketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/deepgram/stream`;
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

          // Handle connection confirmation
          if (typeof data === "object" && data.type === "connected") {
            console.log("Deepgram streaming ready");
            return;
          }

          // Handle error messages
          if (typeof data === "object" && data.type === "error") {
            if (this.onErrorCallback) {
              this.onErrorCallback(
                data.message || "Transcription service error"
              );
            }
            return;
          }

          // Handle transcription results
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

  async startListening(
    onTranscript: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ): Promise<boolean> {
    if (this.isListening) {
      return false;
    }

    try {
      // Set callbacks
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
        },
      });

      // Setup WebSocket connection to backend
      await this.setupWebSocket();

      // Setup MediaRecorder to stream audio to backend
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (
          event.data.size > 0 &&
          this.socket &&
          this.socket.readyState === WebSocket.OPEN
        ) {
          // Send audio data directly to backend (it will handle Deepgram proxying)
          this.socket.send(event.data);
        }
      };

      // Start recording and streaming
      this.mediaRecorder.start(100); // Send data every 100ms
      this.isListening = true;

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
    // Stop MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    // Close WebSocket
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }

    // Stop media stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    this.mediaRecorder = null;
    this.socket = null;
    this.stream = null;
  }

  isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.WebSocket
    );
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

// Global instance
export const deepgramTranscription = new DeepgramTranscriptionService();

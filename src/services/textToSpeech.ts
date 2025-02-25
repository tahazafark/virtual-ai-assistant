import { TextToSpeechClient } from '@google-cloud/text-to-speech';

interface TTSResponse {
  audioContent: string;
  error?: string;
}

export class TextToSpeechService {
  private static instance: TextToSpeechService;
  private client: TextToSpeechClient;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  private constructor() {
    this.client = new TextToSpeechClient({
      credentials: {
        client_email: import.meta.env.VITE_GOOGLE_TTS_EMAIL,
        private_key: import.meta.env.VITE_GOOGLE_TTS_ID,
      },
    });
    
    // Initialize Web Audio API
    this.initAudioContext();
  }

  static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.error('Web Audio API is not supported in this browser');
    }
  }

  async synthesizeSpeech(text: string): Promise<TTSResponse> {
    try {
      const [response] = await this.client.synthesizeSpeech({
        input: { text },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Neural2-C',
          ssmlGender: 'FEMALE',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0,
        },
      });

      return {
        audioContent: response.audioContent as string,
      };
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      return {
        audioContent: '',
        error: error instanceof Error ? error.message : 'Failed to synthesize speech',
      };
    }
  }

  async speak(text: string, onEnd?: () => void): Promise<void> {
    if (!this.audioContext) {
      console.error('Audio context not available');
      return;
    }

    try {
      // Stop any currently playing audio
      this.stop();

      const response = await this.synthesizeSpeech(text);
      
      if (response.error || !response.audioContent) {
        console.error('Failed to get audio content:', response.error);
        return;
      }

      // Convert base64 to ArrayBuffer
      const audioData = Uint8Array.from(atob(response.audioContent), c => c.charCodeAt(0));
      
      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.buffer);
      
      // Create and configure source
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);
      
      // Handle completion
      if (onEnd) {
        this.currentSource.onended = onEnd;
      }

      // Start playback
      this.currentSource.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      onEnd?.();
    }
  }

  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
      this.currentSource = null;
    }
  }

  isSupported(): boolean {
    return !!(window.AudioContext || window.webkitAudioContext);
  }
}

export const textToSpeech = TextToSpeechService.getInstance();
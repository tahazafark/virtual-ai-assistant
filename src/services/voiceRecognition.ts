export class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
  }

  startListening(onResult: (text: string) => void, onError: (error: string) => void) {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser');
      return;
    }

    if (this.isListening) return;

    this.isListening = true;
    
    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      if (event.results[0].isFinal) {
        onResult(transcript);
        this.stopListening();
      }
    };

    this.recognition.onerror = (event) => {
      onError(`Error occurred in recognition: ${event.error}`);
      this.stopListening();
    };

    this.recognition.start();
  }

  stopListening() {
    if (!this.recognition || !this.isListening) return;
    
    this.isListening = false;
    this.recognition.stop();
  }

  isSupported(): boolean {
    return !!this.recognition;
  }
}

export const voiceRecognition = new VoiceRecognitionService();
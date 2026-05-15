import React from 'react';

export const useSpeechControl = (onCommand: (cmd: string) => void) => {
  const [isListening, setIsListening] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const startListening = React.useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => setError(event.error);
    
    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      onCommand(command);
    };

    recognition.start();
  }, [onCommand]);

  return { isListening, error, startListening };
};

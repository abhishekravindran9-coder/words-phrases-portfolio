import { useCallback, useState } from 'react';

/**
 * Thin wrapper around the Web Speech API (SpeechSynthesis).
 * Returns { speak, stop, speaking, supported }.
 */
export function useSpeech(lang = 'en-US') {
  const supported = 'speechSynthesis' in window;
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    utt.onstart  = () => setSpeaking(true);
    utt.onend    = () => setSpeaking(false);
    utt.onerror  = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [supported, lang]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { speak, stop, speaking, supported };
}

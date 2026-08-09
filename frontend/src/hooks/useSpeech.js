import { useCallback, useState } from 'react';

/**
 * Thin wrapper around the Web Speech API (SpeechSynthesis).
 * Returns { speak, stop, pause, resume, speaking, paused, supported }.
 */
export function useSpeech(lang = 'en-US') {
  const supported = 'speechSynthesis' in window;
  const [speaking, setSpeaking] = useState(false);
  const [paused,   setPaused]   = useState(false);

  const speak = useCallback((text) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    utt.rate = 0.95; // slightly slower for comfortable listening
    utt.onstart  = () => { setSpeaking(true);  setPaused(false); };
    utt.onend    = () => { setSpeaking(false); setPaused(false); };
    utt.onerror  = () => { setSpeaking(false); setPaused(false); };
    window.speechSynthesis.speak(utt);
  }, [supported, lang]);

  const pause = useCallback(() => {
    if (!supported || !window.speechSynthesis.speaking) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setPaused(false);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, [supported]);

  return { speak, stop, pause, resume, speaking, paused, supported };
}

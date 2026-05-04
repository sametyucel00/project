export function speakText(text: string, lang: string) {
  const synth = globalThis?.speechSynthesis;
  if (!synth || !text.trim()) return;

  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  synth.speak(utterance);
}

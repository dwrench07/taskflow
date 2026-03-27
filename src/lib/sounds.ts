// Sound utility for gamification audio cues
// Uses Web Audio API — no external dependencies

type SoundType = 'complete' | 'achievement' | 'streak' | 'levelUp';

const SOUND_ENABLED_KEY = 'dash-sounds-enabled';

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  return new AC();
}

function playTone(ctx: AudioContext, freq: number, startTime: number, duration: number, volume: number = 0.08) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playSound(type: SoundType): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;

  switch (type) {
    case 'complete':
      // Short pleasant ding — two ascending notes
      playTone(ctx, 523, t, 0.15);        // C5
      playTone(ctx, 659, t + 0.12, 0.2);  // E5
      break;

    case 'achievement':
      // Triumphant three-note fanfare
      playTone(ctx, 523, t, 0.15);         // C5
      playTone(ctx, 659, t + 0.15, 0.15);  // E5
      playTone(ctx, 784, t + 0.3, 0.3);    // G5
      break;

    case 'streak':
      // Rising arpeggio
      playTone(ctx, 440, t, 0.12);         // A4
      playTone(ctx, 554, t + 0.1, 0.12);   // C#5
      playTone(ctx, 659, t + 0.2, 0.12);   // E5
      playTone(ctx, 880, t + 0.3, 0.25);   // A5
      break;

    case 'levelUp':
      // Big ascending sweep
      playTone(ctx, 392, t, 0.12, 0.1);       // G4
      playTone(ctx, 523, t + 0.1, 0.12, 0.1); // C5
      playTone(ctx, 659, t + 0.2, 0.12, 0.1); // E5
      playTone(ctx, 784, t + 0.3, 0.12, 0.1); // G5
      playTone(ctx, 1047, t + 0.4, 0.4, 0.1); // C6
      break;
  }
}

/**
 * 原创的冰雪氛围声景。使用 Web Audio 实时合成，不依赖外部音频文件，
 * 也不会触发版权或跨域问题。浏览器要求声音由用户手势开启。
 */
export function createSoundscape() {
  let context = null;
  let master = null;
  let timer = null;
  let wind = null;
  let enabled = false;
  let mode = 'world';
  let worldBus = null;
  let gameBus = null;

  const notes = [
    [261.63, 329.63, 392.0],
    [220.0, 293.66, 392.0],
    [174.61, 261.63, 349.23],
    [196.0, 293.66, 392.0],
  ];

  function ensure() {
    if (context) return;
    context = new (window.AudioContext || window.webkitAudioContext)();
    master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    worldBus = context.createGain();
    gameBus = context.createGain();
    worldBus.gain.value = 1;
    gameBus.gain.value = 0;
    worldBus.connect(master);
    gameBus.connect(master);
  }

  function tone(frequency, at, duration, volume = 0.035, type = 'sine', destination = master) {
    if (!context || !destination) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain).connect(destination);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.05);
  }

  function schedulePhrase() {
    if (!enabled || !context) return;
    const start = context.currentTime + 0.08;
    notes.forEach((chord, index) => {
      const at = start + index * 1.6;
      chord.forEach((note, layer) => tone(note / 2, at, 1.45, 0.015 - layer * 0.002, 'sine', worldBus));
      tone(chord[2] * 2, at + 0.12, 0.7, 0.022, 'triangle', worldBus);
      tone(chord[1] * 2, at + 0.72, 0.55, 0.014, 'sine', worldBus);
    });
    const beat = [392, 493.88, 587.33, 783.99, 587.33, 493.88, 440, 349.23];
    for (let i = 0; i < 16; i += 1) {
      const at = start + i * 0.4;
      tone(beat[i % beat.length], at, 0.22, 0.026, 'triangle', gameBus);
      if (i % 2 === 0) tone(i % 8 === 0 ? 130.81 : 196, at, 0.22, 0.04, 'sine', gameBus);
      if (i % 2 === 1) tone(1100, at, 0.045, 0.008, 'triangle', gameBus);
    }
  }

  function startWind() {
    const length = context.sampleRate * 2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      last = last * 0.985 + (Math.random() * 2 - 1) * 0.015;
      data[i] = last;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 720;
    gain.gain.value = 0.055;
    source.connect(filter).connect(gain).connect(worldBus);
    source.start();
    wind = source;
  }

  async function setEnabled(next) {
    ensure();
    enabled = Boolean(next);
    if (context.state === 'suspended') await context.resume();
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(enabled ? 0.72 : 0.0001, now + 0.35);
    if (enabled) {
      if (!wind) startWind();
      setMode(mode);
      if (!timer) {
        schedulePhrase();
        timer = window.setInterval(schedulePhrase, 6400);
      }
    } else if (timer) {
      clearInterval(timer);
      timer = null;
    }
    return enabled;
  }

  function playUi() {
    if (!enabled || !context) return;
    const now = context.currentTime;
    tone(620, now, 0.09, 0.025, 'sine');
    tone(930, now + 0.045, 0.12, 0.018, 'triangle');
  }

  function playTravel() {
    if (!enabled || !context) return;
    const now = context.currentTime;
    [392, 493.88, 587.33].forEach((note, index) => tone(note, now + index * 0.08, 0.2, 0.026, 'triangle'));
  }

  function playSuccess() {
    if (!enabled || !context) return;
    const now = context.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((note, index) => tone(note, now + index * 0.09, 0.48, 0.032, index % 2 ? 'sine' : 'triangle'));
  }

  function setMode(next) {
    mode = next === 'game' ? 'game' : 'world';
    if (!context) return;
    const now = context.currentTime;
    for (const [bus, value] of [[worldBus, mode === 'world' ? 1 : 0.0001], [gameBus, mode === 'game' ? 1 : 0.0001]]) {
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), now);
      bus.gain.exponentialRampToValueAtTime(value, now + 0.35);
    }
  }

  return { get enabled() { return enabled; }, get mode() { return mode; }, setEnabled, setMode, playUi, playTravel, playSuccess };
}

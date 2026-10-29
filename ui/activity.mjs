const choices = {
  gentle: ['peek', 'stretch', 'shuffle', 'wave'],
  playful: ['peek', 'stretch', 'shuffle', 'wave', 'hop'],
  quiet: ['peek', 'sway'],
};
const delays = { gentle: [14000, 28000], playful: [8000, 15000], quiet: [35000, 60000] };
const durations = { peek: 1900, stretch: 2300, shuffle: 3000, wave: 2300, hop: 1800, sway: 2200 };

// Autonomous actions are local visual feedback. They never generate messages,
// change the selected mode, add affection, or move the actual desktop window.
export class ActivityDirector {
  constructor({ now = Date.now(), random = Math.random } = {}) {
    this.random = random; this.current = null; this.last = null; this.blocked = false;
    this.nextAt = now + this.between(3500, 5500);
  }
  between(min, max) {
    const value = Number(this.random());
    const unit = Number.isFinite(value) ? Math.max(0, Math.min(.999999, value)) : .5;
    return min + Math.floor(unit * (max - min));
  }
  step({ now = Date.now(), personality = 'gentle', allowed = true } = {}) {
    if (!allowed) { this.current = null; this.blocked = true; return null; }
    if (this.blocked) { this.blocked = false; this.nextAt = now + this.between(3500, 6500); }
    if (this.current && now < this.current.until) return this.current;
    if (this.current) this.current = null;
    if (now < this.nextAt) return null;
    const pool = (choices[personality] || choices.gentle).filter(kind => kind !== this.last);
    const kind = pool[this.between(0, pool.length)];
    const duration = durations[kind];
    this.current = { kind, duration, until: now + duration };
    this.last = kind;
    const [min, max] = delays[personality] || delays.gentle;
    this.nextAt = now + duration + this.between(min, max);
    return this.current;
  }
}

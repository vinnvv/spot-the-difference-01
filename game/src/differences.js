// The eight temporal glitches: one clear job, the data the game plays with.
// Coordinates are in the scene's own 640 by 460 space; the game converts
// them to screen positions so the same data drives both panels, the markers,
// the hint highlight and the keyboard crosshair.
export const SCENE_WIDTH = 640;
export const SCENE_HEIGHT = 460;

export const DIFFERENCES = [
  {
    id: 1,
    name: 'The Cuckoo Pendulum',
    x: 104,
    y: 152,
    r: 27,
    log: 'Glitch Repaired: The pendulum swung the wrong way.',
  },
  {
    id: 2,
    name: 'The Moon Over the Canal',
    x: 330,
    y: 74,
    r: 27,
    log: 'Glitch Repaired: The moon slipped from crescent to full.',
  },
  {
    id: 3,
    name: 'The Shelf Vessel',
    x: 557,
    y: 80,
    r: 29,
    log: 'Glitch Repaired: The apothecary bottle became an hourglass.',
  },
  {
    id: 4,
    name: 'The Pegboard Tool',
    x: 112,
    y: 248,
    r: 27,
    log: 'Glitch Repaired: The wrench turned into a magnifying glass.',
  },
  {
    id: 5,
    name: 'The Desk Clock',
    x: 320,
    y: 350,
    r: 35,
    log: 'Glitch Repaired: The desk clock slipped from 10:10 to 3:45.',
  },
  {
    id: 6,
    name: 'The Fern Blossoms',
    x: 496,
    y: 212,
    r: 25,
    log: 'Glitch Repaired: The fern blossoms bloomed, then vanished.',
  },
  {
    id: 7,
    name: 'The Sleeping Cat',
    x: 118,
    y: 392,
    r: 36,
    log: 'Glitch Repaired: The cat’s tail curled up, then hung down.',
  },
  {
    id: 8,
    name: 'The Brass Key',
    x: 494,
    y: 415,
    r: 23,
    log: 'Glitch Repaired: The brass key beside the teacup went missing.',
  },
];

// Distance in scene space inside which a click counts as a find.
export function findDifferenceAt(x, y) {
  for (const d of DIFFERENCES) {
    const dx = x - d.x;
    const dy = y - d.y;
    if (dx * dx + dy * dy <= d.r * d.r) return d;
  }
  return null;
}

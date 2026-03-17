/**
 * Seeded pseudo-random number generator
 * For reproducible "tattered" edge patterns
 */

export class SeededRNG {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  /**
   * Returns next random number in range [0, 1)
   * Uses simple linear congruential generator (LCG)
   */
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  /**
   * Returns random integer in range [min, max)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Returns random number in range [min, max)
   */
  nextRange(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Resets the seed for reproducibility
   */
  reset(seed: number): void {
    this.seed = seed;
  }
}

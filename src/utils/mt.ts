/**
 * Mersenne Twister simplificado para Pokémon Gen 5
 * Implementación básica del algoritmo MT19937
 */
export class MersenneTwister {
  private mt: number[] = new Array(624)
  private index = 624

  constructor(seed: number) {
    this.init(seed >>> 0)
  }

  private init(seed: number): void {
    this.mt[0] = seed
    for (let i = 1; i < 624; i++) {
      this.mt[i] = (0x6C078965 * ((this.mt[i - 1] ^ (this.mt[i - 1] >>> 30)) >>> 0) + i) >>> 0
    }
  }

  private generate(): void {
    for (let i = 0; i < 624; i++) {
      const y = ((this.mt[i] & 0x80000000) + (this.mt[(i + 1) % 624] & 0x7fffffff)) >>> 0
      this.mt[i] = (this.mt[(i + 397) % 624] ^ (y >>> 1)) >>> 0
      if (y % 2 !== 0) this.mt[i] = (this.mt[i] ^ 0x9908b0df) >>> 0
    }
    this.index = 0
  }

  next(): number {
    if (this.index >= 624) this.generate()
    let y = this.mt[this.index++]
    y ^= y >>> 11
    y ^= (y << 7) & 0x9d2c5680
    y ^= (y << 15) & 0xefc60000
    y ^= y >>> 18
    return y >>> 0
  }
}

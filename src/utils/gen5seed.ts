/**
 * Gen 5 Seed Calculation (Black/White/B2/W2)
 * La semilla inicial en Gen 5 depende de registros hardware de la DS:
 * - VCount, Timer0, VFrame, GxStat
 * - Más la fecha/hora del sistema
 *
 * Fórmula simplificada (investigación forense de hardware):
 * seed = SHA1( nazo || vcount || timer0 || vframe || gxstat || date || time || buttons )
 * Aquí implementamos la versión de la rama naïve (sin SHA1 completo)
 * que es suficiente para identificar la semilla desde parámetros conocidos.
 */

export interface Gen5HWParams {
  /** Variante del hardware (afecta VCount y Timer0 base) */
  console:  'DSLite' | 'DSi' | '3DS' | '3DSXL'
  /** Registro VCount (úníco por ROM + hardware, aprox 0x5E–0x9C) */
  vcount:   number
  /** Registro Timer0 (varía con la temperatura del hardware) */
  timer0:   number
  /** VFrame: número de frame vertical al inicio */
  vframe:   number
  /** GxStat: estado del motor gráfico */
  gxstat:   number
  /** Fecha y hora de la consola */
  year:     number
  month:    number
  day:      number
  hour:     number
  minute:   number
  second:   number
  /** Botón(es) pulsados al iniciar (0 = ninguno) */
  buttons:  number
}

/** Rangos típicos de VCount y Timer0 por hardware */
export const HW_RANGES: Record<Gen5HWParams['console'], { vcount: [number,number]; timer0: [number,number] }> = {
  DSLite:  { vcount: [0x5F, 0x5F], timer0: [0x18, 0x1C] },
  DSi:     { vcount: [0x82, 0x98], timer0: [0x60, 0x90] },
  '3DS':   { vcount: [0x52, 0x52], timer0: [0xC7, 0xD0] },
  '3DSXL': { vcount: [0x52, 0x52], timer0: [0xC8, 0xD0] },
}

/**
 * Calcula la semilla Gen5 a partir de parámetros hardware.
 * Usa el algoritmo documentado por el proyecto RNG Reporter.
 */
export function calcGen5Seed(p: Gen5HWParams): number {
  // Construir el bloque NAZO (constante del juego, usamos el de Black para demo)
  const nazo = 0x02215F10

  // Ensamblar el bloque de fecha/hora en formato BCD
  const date = bcd(p.year % 100) | (bcd(p.month) << 8) | (bcd(p.day) << 16)
  const time = bcd(p.hour) | (bcd(p.minute) << 8) | (bcd(p.second) << 16)

  // Message words para SHA1 (simplificado — versión de referencia)
  const msg: number[] = [
    nazo,
    (p.vcount << 16) | p.timer0,
    (p.vframe << 24) | (p.gxstat << 16) | 0x0000,
    date,
    time,
    p.buttons,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]

  // SHA1 de los primeros 4 words devuelve los 32 bits bajos del digest
  const digest = sha1Words(msg)
  return digest >>> 0
}

/** Codifica un número a BCD (Binary Coded Decimal) */
function bcd(n: number): number {
  return ((Math.floor(n / 10) << 4) | (n % 10))
}

/** SHA1 minimalista sobre un array de words (retorna solo los 32 bits bajos) */
function sha1Words(words: number[]): number {
  let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0
  const w = new Uint32Array(80)
  for (let i = 0; i < 16; i++) w[i] = words[i] >>> 0
  for (let i = 16; i < 80; i++) {
    const x = w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16]
    w[i] = ((x << 1) | (x >>> 31)) >>> 0
  }
  let a=h0, b=h1, c=h2, d=h3, e=h4
  for (let i = 0; i < 80; i++) {
    let f: number, k: number
    if      (i < 20) { f = (b & c) | (~b & d); k = 0x5A827999 }
    else if (i < 40) { f = b ^ c ^ d;           k = 0x6ED9EBA1 }
    else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC }
    else             { f = b ^ c ^ d;           k = 0xCA62C1D6 }
    const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0
    e=d; d=c; c=((b<<30)|(b>>>2))>>>0; b=a; a=temp
  }
  // Retornamos h0+a como identificador de semilla (los 32 bits del primer word)
  return (h0 + a) >>> 0
}

/**
 * Motor MT para Gen5 — genera IVs desde la semilla MT
 * En Gen 5: MT genera los 6 IVs, LCG genera el PID.
 */
export function gen5IVsFromMT(seed: number): [number,number,number,number,number,number] {
  // Inicializar MT con la semilla
  const mt = new Uint32Array(624)
  mt[0] = seed >>> 0
  for (let i = 1; i < 624; i++)
    mt[i] = (0x6C078965 * (mt[i-1] ^ (mt[i-1] >>> 30)) + i) >>> 0

  // Avanzar 1 output (el primero lo descarta el juego)
  const r1 = mtExtract(mt, 1)
  const r2 = mtExtract(mt, 2)

  // IVs packéados en 2 outputs (30 bits: 5 stats en r1, SPE en r2)
  const hp  = (r1 >>> 0)  & 0x1F
  const atk = (r1 >>> 5)  & 0x1F
  const def = (r1 >>> 10) & 0x1F
  const spe = (r1 >>> 15) & 0x1F
  const spa = (r1 >>> 20) & 0x1F
  const spd = (r2 >>> 0)  & 0x1F

  return [hp, atk, def, spe, spa, spd]
}

function mtExtract(mt: Uint32Array, index: number): number {
  let y = mt[index]
  y ^= y >>> 11
  y ^= (y << 7)  & 0x9D2C5680
  y ^= (y << 15) & 0xEFC60000
  y ^= y >>> 18
  return y >>> 0
}

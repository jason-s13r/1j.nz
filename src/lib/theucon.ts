export function theuconEncrypt(text: string) {
  return theuconScrambleArray(text.split(''), isPrime).join('');
}

export function theuconDecrypt(text: string) {
  return theuconUnscrambleArray(text.split(''), isPrime).join('');
}

export function theuconEncryptPreserveSpaces(text: string) {
  return preserveSpaces(text, theuconScrambleArray, isPrime);
}

export function theuconDecryptPreserveSpaces(text: string) {
  return preserveSpaces(text, theuconUnscrambleArray, isPrime);
}

export function fibonacciEncrypt(text: string) {
  return theuconScrambleArray(text.split(''), isFib).join('');
}

export function fibonacciDecrypt(text: string) {
  return theuconUnscrambleArray(text.split(''), isFib).join('');
}

export function fibonacciEncryptPreserveSpaces(text: string) {
  return preserveSpaces(text, theuconScrambleArray, isFib);
}

export function fibonacciDecryptPreserveSpaces(text: string) {
  return preserveSpaces(text, theuconUnscrambleArray, isFib);
}

function preserveSpaces(text: string, scrambler: (_: string[], isInSequence: (n: number) => boolean) => string[], isInSequence: (n: number) => boolean) {
  const textArray = text.split('');
  const spaceless = text.replace(/[\s]/g, '');
  let spacelessArray = spaceless.split('');
  let characters = scrambler(spacelessArray, isInSequence);

  return textArray.map((c) => (/\s/.test(c) ? c : characters.shift())).join('');
}

function isPrime(n: number): boolean {
  if (n < 2 || (n % 2 === 0 && n > 2)) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function isFib(n: number): boolean {
  if (n < 0) return false;
  return isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4);
}

function isPerfectSquare(n: number): boolean {
  const s = Math.round(Math.sqrt(n));
  return s * s === n;
}

function sequenceUntil(n: number, isInSequence: (n: number) => boolean): number[] {
  return Array.from({ length: n - 1 }, (_, i) => i + 1).filter(isInSequence);
}

function theuconScrambleArray(remaining: string[], isInSequence: (n: number) => boolean) {
  let output: string[] = [];
  while (remaining.length > 0) {
    let primeIndexed: string[] = [];
    remaining = remaining.filter((r, i) => {
      let accepted = i === 0 || isInSequence(i);
      if (accepted) {
        primeIndexed.push(r);
      }
      return !accepted;
    });
    output = output.concat(primeIndexed);
  }
  return output;
}

function theuconUnscrambleArray(remaining: string[], isInSequence: (n: number) => boolean) {
  let output: string[] = [];
  while (remaining.length) {
    const primes = [0, ...sequenceUntil(remaining.length, isInSequence)];
    const currentOutput: string[] = Array(remaining.length).fill('');
    const current = remaining.splice(0, primes.length);

    primes.forEach((p, i) => {
      currentOutput[p] = current[i];
    });

    if (output.length === 0) {
      output = currentOutput;
    } else {
      output = output.map((o) => (o === '' ? (currentOutput.shift() ?? o) : o));
    }
  }
  return output;
}

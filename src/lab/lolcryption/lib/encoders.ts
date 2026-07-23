import {
  fibonacciDecrypt,
  fibonacciDecryptPreserveSpaces,
  fibonacciEncrypt,
  fibonacciEncryptPreserveSpaces,
  theuconDecrypt,
  theuconDecryptPreserveSpaces,
  theuconEncrypt,
  theuconEncryptPreserveSpaces,
} from './theucon';
import {
  decodeKeyboardShift,
  delolcrypt,
  encodeKeyboardShift,
  enlolcrypt,
  rot13,
} from './lolcryption';

type Encoder = {
  id: string,
  label: string,
  encode: (text: string) => string,
  decode: (text: string) => string,
  symmetric?: boolean
}

export const encodingAlgorithms: Record<string, Encoder> = {
  lolcryption: {
    id: 'lolcryption',
    label: 'LOLcryption',
    encode: (text: string) => enlolcrypt(text),
    decode: (text: string) => delolcrypt(text),
  },
  rot13: {
    id: 'rot13',
    label: 'ROT 13',
    symmetric: true,
    encode: (text: string) => rot13(text),
    decode: (text: string) => rot13(text),
  },
  keyboardShift: {
    id: 'keyboardShift',
    label: 'Keyboard Shift',
    encode: (text: string) => encodeKeyboardShift(text),
    decode: (text: string) => decodeKeyboardShift(text),
  },
  theucon: {
    id: 'theucon',
    label: 'Theucon Prime',
    encode: (text: string) => theuconEncrypt(text),
    decode: (text: string) => theuconDecrypt(text),
  },
  theuconPreserved: {
    id: 'theuconPreserved',
    label: 'Theucon Prime (preserve whitespace)',
    encode: (text: string) => theuconEncryptPreserveSpaces(text),
    decode: (text: string) => theuconDecryptPreserveSpaces(text),
  },
  theuconFibonacci: {
    id: 'theuconFibonacci',
    label: 'Theucon Fibonacci',
    encode: (text: string) => fibonacciEncrypt(text),
    decode: (text: string) => fibonacciDecrypt(text),
  },
  theuconFibonacciPreserved: {
    id: 'theuconFibonacciPreserved',
    label: 'Theucon Fibonacci (preserve whitespace)',
    encode: (text: string) => fibonacciEncryptPreserveSpaces(text),
    decode: (text: string) => fibonacciDecryptPreserveSpaces(text),
  },
  base64: {
    id: 'base64',
    label: 'Base64',
    encode: (text: string) => btoa(text),
    decode: (text: string) => atob(text),
  },
};

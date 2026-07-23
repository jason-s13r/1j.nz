export function trNatural(text: string, inAlphabet: string, outAlphabet: string) {
  return text.replace(new RegExp(`([${inAlphabet}])`, 'g'), function (value) {
    var index = inAlphabet.indexOf(value);
    return outAlphabet[index] || value;
  });
}

export function tr(text: string, inAlphabet: string, outAlphabet: string) {
  return trNatural(
    text,
    inAlphabet + inAlphabet.toUpperCase(),
    outAlphabet + outAlphabet.toUpperCase()
  );
}

export const enlolcrypt = (text: string) =>
  tr(text, 'aeioubcdfghjklmnpqrstvwxyz', 'iouaenpqrstvwxyzbcdfghjklm');

export const delolcrypt = (text: string) =>
  tr(text, 'iouaenpqrstvwxyzbcdfghjklm', 'aeioubcdfghjklmnpqrstvwxyz');
export const rot13 = (text: string) =>
  tr(text, 'abcdefghijklmnopqrstuvwxyz', 'nopqrstuvwxyzabcdefghijklm');

export const encodeKeyboardShift = (text: string) =>
  tr(
    text,
    "1234567890-=qwertyuiopasdfghjkl;'zxcvbnm,./",
    "/1234567890-=qwertyuiopasdfghjkl;'zxcvbnm,."
  );

export const decodeKeyboardShift = (text: string) =>
  tr(
    text,
    "/1234567890-=qwertyuiopasdfghjkl;'zxcvbnm,.",
    "1234567890-=qwertyuiopasdfghjkl;'zxcvbnm,./"
  );

export function createAnswerMask(answer: string): string {
  return Array.from(answer.normalize('NFC'), character =>
    /[\p{L}\p{N}]/u.test(character) ? '_' : character,
  ).join('');
}

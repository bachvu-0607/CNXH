export function getAnswerWordLengths(answer: string): number[] {
  const words = answer.normalize('NFC').match(/[\p{L}\p{N}]+/gu) || [];
  return words.map(word => Array.from(word).length);
}

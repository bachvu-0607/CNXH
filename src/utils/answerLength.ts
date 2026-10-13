export function getAnswerWordLengths(answer: string): number[] {
  const words = answer.normalize('NFC').match(/[\p{L}\p{N}]+/gu) || [];
  return words.map(word => Array.from(word).length);
}

export function getAnswerWordMasks(answer: string): string[] {
  return getAnswerWordLengths(answer).map(length => Array.from({ length }, () => '_').join(' '));
}

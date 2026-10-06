export function generateMaskedHint(answer: string): string {
  if (!answer) return '';
  // Split into words and mask middle characters
  const words = answer.split(' ');
  return words
    .map((word) => {
      // Remove trailing punctuation for masking length
      const match = word.match(/^([\p{L}\p{N}]+)(.*)$/u);
      if (!match) return word;
      const core = match[1];
      const punctuation = match[2] || '';

      if (core.length <= 2) {
        return core + punctuation;
      }
      // First character + underscores + punctuation
      return core[0] + '_'.repeat(Math.max(1, core.length - 1)) + punctuation;
    })
    .join(' ');
}

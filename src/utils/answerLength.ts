export function getAnswerWordLengths(answer: string): number[] {
  const words = answer.normalize('NFC').match(/[\p{L}\p{N}]+/gu) || [];
  return words.map(word => Array.from(word).length);
}

export function getAnswerWordMasks(answer: string): string[] {
  return getAnswerWordLengths(answer).map(length => Array.from({ length }, () => '_').join(''));
}

function splitAnswerPhrases(answer: string): string[] {
  return answer.split(/[,;]|\s+(?:và|va)\s+|\s*\/\s*/i).map(phrase => phrase.trim()).filter(Boolean);
}

function getBlankPhrases(template: string, answer: string, blankCount: number): string[] {
  const splitPhrases = splitAnswerPhrases(answer);
  if (splitPhrases.length === blankCount) return splitPhrases;

  const blanks = [...template.matchAll(/_{2,}/g)];
  const lowercaseAnswer = answer.toLocaleLowerCase('vi');
  const phrases: string[] = [];
  let cursor = 0;
  const prefix = template.slice(0, blanks[0].index).toLocaleLowerCase('vi');
  if (prefix && lowercaseAnswer.startsWith(prefix)) cursor = prefix.length;

  for (let index = 0; index < blanks.length; index++) {
    const afterBlank = (blanks[index].index || 0) + blanks[index][0].length;
    const nextBlankStart = blanks[index + 1]?.index ?? template.length;
    const followingText = template.slice(afterBlank, nextBlankStart);
    const nextLiteral = followingText.trim();
    if (!nextLiteral) {
      phrases.push(answer.slice(cursor).trim());
      cursor = answer.length;
      continue;
    }
    const literalPosition = lowercaseAnswer.indexOf(nextLiteral.toLocaleLowerCase('vi'), cursor);
    if (literalPosition < 0) {
      if (index === blanks.length - 1) {
        phrases.push(answer.slice(cursor).trim());
        cursor = answer.length;
        continue;
      }
      break;
    }
    phrases.push(answer.slice(cursor, literalPosition).trim());
    cursor = literalPosition + nextLiteral.length;
  }

  if (phrases.length === blankCount && phrases.every(Boolean)) return phrases;
  if (splitPhrases.length === blankCount) return splitPhrases;
  if (blankCount === 1) return [answer.trim()];
  return Array.from({ length: blankCount }, (_, index) => splitPhrases[index] || answer.trim());
}

export function formatAnswerTemplate(template: string, answer: string): string {
  const blanks = [...template.matchAll(/_{2,}/g)];
  if (!blanks.length) return template;
  const phrases = getBlankPhrases(template, answer, blanks.length);
  const masks = phrases.map(phrase => ({
    length: getAnswerWordLengths(phrase).reduce((total, wordLength) => total + wordLength, 0),
    mask: getAnswerWordMasks(phrase).join(' '),
  }));
  let blankIndex = 0;
  return template.split(';').map(part => {
    const partBlanks = [...part.matchAll(/_{2,}/g)];
    if (partBlanks.length === 1) {
      const mask = masks[blankIndex];
      blankIndex++;
      return `${mask.length} chữ: ${part.replace(/_{2,}/, mask.mask).trim()}`;
    }
    return part.replace(/_{2,}/g, () => {
      const mask = masks[blankIndex++];
      return `${mask.length} chữ: ${mask.mask}`;
    });
  }).join('; ');
}

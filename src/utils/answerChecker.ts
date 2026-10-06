// Normalize text by removing punctuation, lowercasing, and normalizing whitespace
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”‘’\\+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Remove Vietnamese diacritics for flexible accentless matching
export function removeDiacritics(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function isAnswerCorrect(
  userAnswer: string,
  officialAnswer: string,
  acceptedAnswers?: string[]
): boolean {
  const normUser = normalizeText(userAnswer);
  if (!normUser) return false;

  const allAcceptable = [officialAnswer, ...(acceptedAnswers || [])];

  for (const acc of allAcceptable) {
    const normAcc = normalizeText(acc);
    if (!normAcc) continue;

    // Exact normalized match
    if (normUser === normAcc) {
      return true;
    }

    // Accent-insensitive match
    if (removeDiacritics(normUser) === removeDiacritics(normAcc)) {
      return true;
    }

    // Substring / core match if user answer is at least 70% length and contains/is contained
    if (normUser.length >= 6 && normAcc.length >= 6) {
      if (normAcc.includes(normUser) && normUser.length / normAcc.length > 0.7) {
        return true;
      }
      if (normUser.includes(normAcc) && normAcc.length / normUser.length > 0.7) {
        return true;
      }
    }
  }

  return false;
}

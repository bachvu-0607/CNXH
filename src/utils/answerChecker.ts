export function normalizeText(text: string): string {
  return (text || '').toLowerCase().normalize('NFC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
export function removeDiacritics(text: string): string {
  return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}
function canonical(text: string): string {
  return removeDiacritics(normalizeText(text))
    .replace(/\bxhcn\b/g, 'xa hoi chu nghia').replace(/\bvn\b/g, 'viet nam')
    .replace(/\btlsx\b/g, 'tu lieu san xuat').replace(/\bdcs\b/g, 'dang cong san')
    .replace(/\bnn\b/g, 'nha nuoc').replace(/\bnd\b/g, 'nhan dan');
}
// Accept only curated equivalents, or complete permutations of an explicit list.
// No substring/partial keyword matching: it accepts missing items and negations.
export function isAnswerCorrect(userAnswer: string, officialAnswer: string, acceptedAnswers: string[] = []): boolean {
  const user = canonical(userAnswer);
  if (!user) return false;
  return [officialAnswer, ...acceptedAnswers].some(answer => {
    if (user === canonical(answer)) return true;
    const items = answer.split(/[,;]|\s+(?:và|va)\s+/i).map(canonical).filter(Boolean);
    if (items.length < 2 || items.length > 6) return false;
    // Match whole phrases in any order, consuming every word exactly once.
    const consume = (remaining: string, rest: string[]): boolean => {
      if (!rest.length) return remaining === '';
      return rest.some((item, i) => {
        if (remaining !== item && !remaining.startsWith(item + ' ')) return false;
        const tail = remaining.slice(item.length).trim().replace(/^va\s+/, '');
        return consume(tail, rest.filter((_, j) => i !== j));
      });
    };
    return consume(user, items);
  });
}

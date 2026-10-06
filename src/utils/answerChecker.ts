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

// Expand common political & educational acronyms in Vietnam
function expandAcronyms(text: string): string {
  return text
    .replace(/\bxhcn\b/gi, 'xa hoi chu nghia')
    .replace(/\bvn\b/gi, 'viet nam')
    .replace(/\btlsx\b/gi, 'tu lieu san xuat')
    .replace(/\bdcs\b/gi, 'dang cong san')
    .replace(/\bnn\b/gi, 'nha nuoc')
    .replace(/\bnd\b/gi, 'nhan dan');
}

// Stopwords that don't carry core semantic meaning in answer checking
const STOP_WORDS = new Set([
  'la',
  'va',
  'cua',
  'nhung',
  'cac',
  'mot',
  'hai',
  'ba',
  'trong',
  'duoc',
  'theo',
  'boi',
  've',
  'cho',
  'den',
  'khi',
  'do',
  'thi',
  'o',
  'nhu',
  'toan',
  'the',
  'nhung',
  'cung',
  'voi',
  'nhung',
]);

function extractKeywords(text: string): string[] {
  const norm = removeDiacritics(normalizeText(text));
  const words = norm.split(/\s+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  return words;
}

export function isAnswerCorrect(
  userAnswer: string,
  officialAnswer: string,
  acceptedAnswers?: string[]
): boolean {
  if (!userAnswer || !userAnswer.trim()) return false;

  const normUserRaw = normalizeText(userAnswer);
  const normUserNoAccent = removeDiacritics(normUserRaw);
  const normUserExpanded = expandAcronyms(normUserNoAccent);

  if (!normUserRaw) return false;

  const allAcceptable = [officialAnswer, ...(acceptedAnswers || [])];

  for (const acc of allAcceptable) {
    if (!acc) continue;
    const normAccRaw = normalizeText(acc);
    const normAccNoAccent = removeDiacritics(normAccRaw);
    const normAccExpanded = expandAcronyms(normAccNoAccent);

    // 1. Exact normalized match (e.g. "Dân là chủ và dân làm chủ")
    if (normUserRaw === normAccRaw) {
      return true;
    }

    // 2. Accent-insensitive match (e.g. "Dan la chu va dan lam chu")
    if (normUserNoAccent === normAccNoAccent) {
      return true;
    }

    // 3. Acronym-expanded match
    if (normUserExpanded === normAccExpanded) {
      return true;
    }

    // 4. Substring containment:
    // If user answer is contained within official answer and has meaningful length (>= 4 chars)
    // E.g. user typed "nhân dân" -> contained in "thuộc về toàn thể nhân dân"
    // E.g. user typed "Đảng Cộng sản" -> contained in "Đảng Cộng sản Việt Nam"
    // E.g. user typed "nhà nước pháp quyền" -> contained in "nhà nước pháp quyền xã hội chủ nghĩa..."
    if (normUserNoAccent.length >= 4 && normAccNoAccent.includes(normUserNoAccent)) {
      return true;
    }
    if (normUserExpanded.length >= 4 && normAccExpanded.includes(normUserExpanded)) {
      return true;
    }

    // 5. Official answer contained within user answer
    // E.g. user typed a longer explanation containing the official answer
    if (normAccNoAccent.length >= 4 && normUserNoAccent.includes(normAccNoAccent)) {
      return true;
    }

    // 6. List & Enumeration Permutation Matching:
    // If the target answer is a list of items (e.g. "kinh tế; chính trị; xã hội", "kỷ luật; kỷ cương", "vật chất và tinh thần"),
    // check if user provided all items regardless of ordering!
    const listDelimiters = /[;,/–\-]|\s+(?:và|va)\s+/;
    const rawItems = acc
      .split(listDelimiters)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (rawItems.length >= 2) {
      const allItemsMatched = rawItems.every((item) => {
        const normItem = removeDiacritics(normalizeText(item));
        const itemWords = extractKeywords(item);
        if (normItem.length >= 2 && (normUserNoAccent.includes(normItem) || normUserExpanded.includes(normItem))) {
          return true;
        }
        if (itemWords.length > 0) {
          const userKeywords = new Set(extractKeywords(userAnswer));
          return itemWords.every((w) => userKeywords.has(w));
        }
        return false;
      });

      if (allItemsMatched) {
        return true;
      }
    }

    // 7. Semantic keyword matching:
    // Check if the user answer contains the key nouns/verbs of the official answer
    const userKeywords = new Set(extractKeywords(userAnswer));
    const targetKeywords = extractKeywords(acc);

    if (targetKeywords.length > 0 && userKeywords.size > 0) {
      const matchCount = targetKeywords.filter((k) => userKeywords.has(k)).length;
      const matchRatio = matchCount / targetKeywords.length;

      // If at least 50% of the core keywords match (or >= 2 keywords match for multi-keyword answers)
      if (matchRatio >= 0.5 || (targetKeywords.length >= 2 && matchCount >= 2)) {
        return true;
      }
    }
  }

  return false;
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has",
  "have", "he", "her", "his", "i", "in", "is", "it", "its", "of", "on",
  "or", "she", "that", "the", "they", "this", "to", "was", "were", "will",
  "with", "you", "your", "my", "me", "we", "us", "our", "but", "not", "no",
  "do", "does", "did", "get", "got", "go", "just", "so", "if", "then",
  "than", "when", "where", "what", "why", "how", "who", "which", "also",
  "all", "any", "can", "had", "him", "into", "like", "look", "make",
  "more", "much", "now", "only", "out", "see", "some", "such", "them",
  "there", "these", "those", "too", "use", "want", "way", "well", "would",
  // Dropshipping / TikTok meta noise
  "viral", "fyp", "foryou", "foryoupage", "tiktok", "amazon", "ebay",
  "shopify", "store", "shop", "link", "bio", "check", "new", "best", "top",
  "love", "need", "please", "follow", "share", "comment", "video", "watch",
  "must", "amazing", "cool", "awesome", "insane", "crazy", "trending",
  "tip", "tips", "trick", "tricks", "hack", "hacks", "secret", "secrets",
  "winning", "winner", "product", "products", "dropshipping", "dropship",
  "ecom", "ecommerce", "online", "business", "money", "rich", "viral",
]);

const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;

export function extractKeywords(caption: string, limit = 8): string[] {
  if (!caption) return [];

  const cleaned = caption
    .toLowerCase()
    .replace(EMOJI_REGEX, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/#\S+/g, " ")
    .replace(/@\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ");

  const tokens = cleaned
    .split(/\s+/)
    .filter(
      (t) => t.length >= 3 && !STOP_WORDS.has(t) && !/^\d+$/.test(t),
    );

  const counts = new Map<string, number>();
  for (const t of tokens) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}

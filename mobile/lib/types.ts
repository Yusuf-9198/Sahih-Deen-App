export type Verdict = 'authentic' | 'altered' | 'fabricated';

export type MatchResult = {
  arabic_text: string;
  english_text: string;
  source: string;
  collection: string;
  reference: string;
  grading: string;
  similarity: number;
};

export type VerifyResponse = {
  verdict: Verdict;
  similarity: number;
  query: string;
  match: MatchResult | null;
  summary: string;
  color: string;
};

export type RecentVerification = VerifyResponse & {
  id: string;
  createdAt: string;
};

export const VERDICT_LABELS: Record<Verdict, string> = {
  authentic: 'Verified / Sahih',
  altered: "Altered / Weak (Da'if)",
  fabricated: "Fabricated (Mawdu') / No Match",
};

export const VERDICT_COLORS: Record<Verdict, string> = {
  authentic: '#22c55e',
  altered: '#eab308',
  fabricated: '#ef4444',
};

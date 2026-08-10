import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RecentVerification, VerifyResponse } from './types';

const KEY = 'veritasai.recent.v1';
const MAX = 20;

export async function loadRecent(): Promise<RecentVerification[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentVerification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveVerification(result: VerifyResponse): Promise<RecentVerification[]> {
  const item: RecentVerification = {
    ...result,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const existing = await loadRecent();
  const next = [item, ...existing].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearRecent(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

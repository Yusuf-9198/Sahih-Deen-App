import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { VerifyResponse } from './types';

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  // Android emulator → host machine loopback
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';

  // iOS simulator / web
  return 'http://127.0.0.1:8000';
}

export const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

export async function verifyQuote(query: string): Promise<VerifyResponse> {
  const { data } = await api.post<VerifyResponse>('/verify', { query });
  return data;
}

export async function checkHealth(): Promise<{ status: string; points?: number | null }> {
  const { data } = await api.get('/health');
  return data;
}

export function getDevHostHint(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri ? `Expo host: ${hostUri}` : `API: ${API_BASE_URL}`;
}

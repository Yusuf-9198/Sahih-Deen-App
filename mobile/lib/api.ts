import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { VerifyResponse } from './types';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, '');
}

function inferBackendBaseUrl(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  const match = hostUri.match(/^(?:https?:\/\/)?([^/:]+)(?::\d+)?/);
  const host = match?.[1];
  if (!host) return null;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return null;

  return `http://${host}:8000`;
}

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv?.trim()) return normalizeBaseUrl(fromEnv.trim());

  const inferred = inferBackendBaseUrl();
  if (inferred) return inferred;

  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://127.0.0.1:8000';
}

export const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (err.code === 'ECONNABORTED') return 'Request timed out. The embedding model may still be loading.';
    if (err.message === 'Network Error') {
      return `Cannot reach API at ${API_BASE_URL}. Start the backend and set EXPO_PUBLIC_API_URL if needed.`;
    }
    return err.message;
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Verification failed';
}

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

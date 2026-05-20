export interface KeyInfo {
  background: string | null;
  corePain: string;
  specificEvent: string | null;
  emotion: string;
  realFear: string;
  triedButFailed: string | null;
  pathType: string;
  microButtons: string[];
}

export interface UserJourney {
  input: string;
  keyInfo?: KeyInfo;
  diagnosisResult: string;
  microAnswer?: string;
  analysisResult: string;
  directionResult: string;
  chosenDirection?: string;
  planResult: string;
  createdAt: number;
}

const KEY = 'future-lab-journey';

export function getJourney(): UserJourney | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveJourney(data: Partial<UserJourney>): UserJourney {
  const existing = getJourney() ?? {
    input: '',
    diagnosisResult: '',
    analysisResult: '',
    directionResult: '',
    planResult: '',
    createdAt: Date.now(),
  };
  const updated = { ...existing, ...data };
  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export function clearJourney() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}

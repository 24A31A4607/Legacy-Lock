import {
  User,
  Asset,
  Beneficiary,
  LegacyInstruction,
  CheckInSettings,
  CheckInEvent,
  InheritanceRequest,
  AuditLog,
  InAppNotification,
} from '../types/index.js';

const TOKEN_KEY = 'legacylock_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.error('Failed to update local token', err);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(body: { email: string; password: string; fullName: string; role?: string }) {
    const res = await request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(body: { email: string; password: string }) {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  // Assets
  async getAssets() {
    return request<{ assets: Asset[] }>('/api/assets');
  },

  async createAsset(formData: FormData) {
    return request<{ asset: Asset }>('/api/assets', {
      method: 'POST',
      body: formData,
    });
  },

  async updateAsset(id: string, updates: Partial<Asset>) {
    return request<{ asset: Asset }>(`/api/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteAsset(id: string) {
    return request<{ success: boolean }>(`/api/assets/${id}`, {
      method: 'DELETE',
    });
  },

  // Beneficiaries
  async getBeneficiaries() {
    return request<{ beneficiaries: Beneficiary[] }>('/api/beneficiaries');
  },

  async createBeneficiary(body: Partial<Beneficiary>) {
    return request<{ beneficiary: Beneficiary }>('/api/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateBeneficiary(id: string, updates: Partial<Beneficiary>) {
    return request<{ beneficiary: Beneficiary }>(`/api/beneficiaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteBeneficiary(id: string) {
    return request<{ success: boolean }>(`/api/beneficiaries/${id}`, {
      method: 'DELETE',
    });
  },

  // Legacy Instructions
  async getInstructions() {
    return request<{ instructions: LegacyInstruction[] }>('/api/instructions');
  },

  async createInstruction(body: Partial<LegacyInstruction>) {
    return request<{ instruction: LegacyInstruction }>('/api/instructions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateInstruction(id: string, updates: Partial<LegacyInstruction>) {
    return request<{ instruction: LegacyInstruction }>(`/api/instructions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteInstruction(id: string) {
    return request<{ success: boolean }>(`/api/instructions/${id}`, {
      method: 'DELETE',
    });
  },

  // Check-In
  async getCheckIn() {
    return request<{ settings: CheckInSettings | null; events: CheckInEvent[] }>('/api/checkin');
  },

  async confirmCheckIn() {
    return request<{ success: boolean; settings: CheckInSettings; event: CheckInEvent }>('/api/checkin/confirm', {
      method: 'POST',
    });
  },

  async updateCheckInSettings(settings: Partial<CheckInSettings>) {
    return request<{ settings: CheckInSettings }>('/api/checkin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async simulateMissedCheckIn() {
    return request<{ settings: CheckInSettings }>('/api/checkin/simulate-missed', {
      method: 'POST',
    });
  },

  // Workflow
  async getWorkflow() {
    return request<{ requests: InheritanceRequest[]; isReviewer: boolean }>('/api/workflow');
  },

  async submitWorkflowRequest(body: {
    beneficiaryId: string;
    declarationType: string;
    legalAttestationNotes: string;
    certificateReference?: string;
  }) {
    return request<{ request: InheritanceRequest }>('/api/workflow/submit', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async reviewWorkflowRequest(id: string, body: { decision: string; notes: string }) {
    return request<{ request: InheritanceRequest }>(`/api/workflow/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async revokeWorkflowAccess(id: string) {
    return request<{ request: InheritanceRequest }>(`/api/workflow/${id}/revoke`, {
      method: 'POST',
    });
  },

  // Audit Logs
  async getAuditLogs() {
    return request<{ logs: AuditLog[] }>('/api/audit');
  },

  // Notifications
  async getNotifications() {
    return request<{ notifications: InAppNotification[] }>('/api/notifications');
  },

  async markNotificationRead(id: string) {
    return request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  // System
  async getSystemMode() {
    return request<{ mode: string; isSupabaseConfigured: boolean; localUploadDirExists: boolean }>('/api/system/mode');
  },

  async resetDemo() {
    return request<{ success: boolean; message: string }>('/api/system/reset-demo', {
      method: 'POST',
    });
  },
};

// API client with automatic authentication header injection
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export class ApiClient {
  private baseUrl: string;
  private apiKey: string | null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.apiKey = null;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  clearApiKey() {
    this.apiKey = null;
  }

  private getHeaders(isFormData: boolean = false): HeadersInit {
    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        return { error: errorData.error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const isFormData = body instanceof FormData;
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(isFormData),
        body: isFormData ? (body as FormData) : (body ? JSON.stringify(body) : undefined),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        return { error: errorData.error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const isFormData = body instanceof FormData;
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(isFormData),
        body: isFormData ? (body as FormData) : (body ? JSON.stringify(body) : undefined),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        return { error: errorData.error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        return { error: errorData.error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }
}

// Singleton instance
export const apiClient = new ApiClient();

import fetch, { RequestInit, Response } from 'node-fetch';
import FormData from 'form-data';

const DEFAULT_API_BASE = 'https://api.dramac.io';

function getApiBase(): string {
  return process.env.DRAMAC_API_URL || DEFAULT_API_BASE;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: T;
  
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await response.json() as T;
  } else {
    data = await response.text() as unknown as T;
  }
  
  return {
    data,
    status: response.status,
    ok: response.ok,
  };
}

export const apiClient = {
  async get<T = any>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${getApiBase()}${path}`, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'dramac-cli/1.0.0',
        ...options.headers,
      },
    });
    
    return handleResponse<T>(response);
  },
  
  async post<T = any>(path: string, body: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    
    const headers: Record<string, string> = {
      'User-Agent': 'dramac-cli/1.0.0',
      ...options.headers as Record<string, string>,
    };
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    // For FormData, merge the headers from form-data
    if (isFormData) {
      const formHeaders = body.getHeaders();
      Object.assign(headers, formHeaders);
    }
    
    const response = await fetch(`${getApiBase()}${path}`, {
      ...options,
      method: 'POST',
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });
    
    return handleResponse<T>(response);
  },
  
  async put<T = any>(path: string, body: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${getApiBase()}${path}`, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'dramac-cli/1.0.0',
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
    
    return handleResponse<T>(response);
  },
  
  async delete<T = any>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${getApiBase()}${path}`, {
      ...options,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'dramac-cli/1.0.0',
        ...options.headers,
      },
    });
    
    return handleResponse<T>(response);
  },
};

export function getApiBaseUrl(): string {
  return getApiBase();
}

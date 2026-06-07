// src/services/api.ts - Versão Corrigida com Tipagem Completa
import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://SEU_IP:8080/api'; // Substitua pelo IP da sua API Java/.NET

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros global com tipagem correta
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Interceptor para adicionar token se necessário (opcional)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Adicione headers de autenticação aqui se necessário
    // config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Tipos de dados
export interface Plantation {
  id: number;
  name: string;
  cropType: string;
  area: number;
  plantingDate: string;
  soilMoisture: number;
  temperature: number;
  irrigationStatus: 'active' | 'inactive' | 'blocked';
  lastIrrigation: string;
}

export interface Alert {
  id: number;
  title: string;
  description: string;
  type: 'frost' | 'pest' | 'drought' | 'optimal_planting';
  severity: 'high' | 'medium' | 'low';
  createdAt: string;
  read: boolean;
  plantationId?: number;
}

export interface SensorData {
  id: number;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  timestamp: string;
  satelliteRainPrediction: number;
  irrigationRecommended: boolean;
}

// Tipo para resposta da API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

// CRUD para Plantações com tipagem completa
export const plantationAPI = {
  getAll: (): Promise<AxiosResponse<Plantation[]>> => api.get<Plantation[]>('/plantations'),
  
  getById: (id: number): Promise<AxiosResponse<Plantation>> => 
    api.get<Plantation>(`/plantations/${id}`),
  
  create: (data: Omit<Plantation, 'id'>): Promise<AxiosResponse<Plantation>> => 
    api.post<Plantation>('/plantations', data),
  
  update: (id: number, data: Partial<Plantation>): Promise<AxiosResponse<Plantation>> => 
    api.put<Plantation>(`/plantations/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<void>> => 
    api.delete(`/plantations/${id}`),
};

// API para Alertas com tipagem completa
export const alertAPI = {
  getAll: (): Promise<AxiosResponse<Alert[]>> => api.get<Alert[]>('/alerts'),
  
  getUnread: (): Promise<AxiosResponse<Alert[]>> => api.get<Alert[]>('/alerts/unread'),
  
  getById: (id: number): Promise<AxiosResponse<Alert>> => 
    api.get<Alert>(`/alerts/${id}`),
  
  markAsRead: (id: number): Promise<AxiosResponse<void>> => 
    api.patch(`/alerts/${id}/read`),
  
  create: (data: Omit<Alert, 'id' | 'createdAt' | 'read'>): Promise<AxiosResponse<Alert>> => 
    api.post<Alert>('/alerts', data),
};

// API para Dados de Sensores com tipagem completa
export const sensorAPI = {
  getLatest: (): Promise<AxiosResponse<SensorData>> => 
    api.get<SensorData>('/sensors/latest'),
  
  getHistory: (days: number = 7): Promise<AxiosResponse<SensorData[]>> => 
    api.get<SensorData[]>(`/sensors/history?days=${days}`),
  
  getByPlantation: (plantationId: number): Promise<AxiosResponse<SensorData[]>> => 
    api.get<SensorData[]>(`/sensors/plantation/${plantationId}`),
};

// Função auxiliar para tratamento de erros com tipagem
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.data) {
      const data = axiosError.response.data as { message?: string };
      return data.message || 'Erro na comunicação com o servidor';
    }
    if (axiosError.request) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    }
    return axiosError.message || 'Erro desconhecido';
  }
  return 'Ocorreu um erro inesperado';
};
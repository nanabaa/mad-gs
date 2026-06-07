// src/services/api.ts - Versão com API real
import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL correta para sua API
const API_BASE_URL = 'http://localhost:8080/api/agro';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token se necessário
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    console.log(`📡 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ Response: ${response.status} - ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// ========== TIPOS DE DADOS ==========
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

export interface SensorData {
  id: number;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  timestamp: string;
  satelliteRainPrediction: number;
  irrigationRecommended: boolean;
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

// ========== API DE SOLO (CRUD completo) ==========
// URLs baseadas no padrão: /api/agro/solo
export const soloAPI = {
  // Criar registro de solo
  create: (data: Omit<SensorData, 'id'>): Promise<AxiosResponse<SensorData>> => 
    api.post<SensorData>('/solo', data),
  
  // Buscar todos os registros
  getAll: (): Promise<AxiosResponse<SensorData[]>> => 
    api.get<SensorData[]>('/solo'),
  
  // Buscar por ID
  getById: (id: number): Promise<AxiosResponse<SensorData>> => 
    api.get<SensorData>(`/solo/${id}`),
  
  // Atualizar registro
  update: (id: number, data: Partial<SensorData>): Promise<AxiosResponse<SensorData>> => 
    api.put<SensorData>(`/solo/${id}`, data),
  
  // Deletar registro
  delete: (id: number): Promise<AxiosResponse<void>> => 
    api.delete(`/solo/${id}`),
  
  // Última leitura
  getLatest: (): Promise<AxiosResponse<SensorData>> => 
    api.get<SensorData>('/solo/ultima'),
  
  // Histórico por período
  getHistory: (days: number = 7): Promise<AxiosResponse<SensorData[]>> => 
    api.get<SensorData[]>(`/solo/historico?dias=${days}`),
};

// ========== API DE PLANTAÇÕES ==========
export const plantacaoAPI = {
  // CREATE
  create: (data: Omit<Plantation, 'id'>): Promise<AxiosResponse<Plantation>> => 
    api.post<Plantation>('/plantacoes', data),
  
  // READ - todas
  getAll: (): Promise<AxiosResponse<Plantation[]>> => 
    api.get<Plantation[]>('/plantacoes'),
  
  // READ - por id
  getById: (id: number): Promise<AxiosResponse<Plantation>> => 
    api.get<Plantation>(`/plantacoes/${id}`),
  
  // UPDATE
  update: (id: number, data: Partial<Plantation>): Promise<AxiosResponse<Plantation>> => 
    api.put<Plantation>(`/plantacoes/${id}`, data),
  
  // DELETE
  delete: (id: number): Promise<AxiosResponse<void>> => 
    api.delete(`/plantacoes/${id}`),
};

// ========== API DE ALERTAS ==========
export const alertaAPI = {
  // CREATE
  create: (data: Omit<Alert, 'id' | 'createdAt'>): Promise<AxiosResponse<Alert>> => 
    api.post<Alert>('/alertas', data),
  
  // READ - todos
  getAll: (): Promise<AxiosResponse<Alert[]>> => 
    api.get<Alert[]>('/alertas'),
  
  // READ - não lidos
  getUnread: (): Promise<AxiosResponse<Alert[]>> => 
    api.get<Alert[]>('/alertas/nao-lidos'),
  
  // UPDATE - marcar como lido
  markAsRead: (id: number): Promise<AxiosResponse<void>> => 
    api.patch(`/alertas/${id}/marcar-lido`),
  
  // DELETE
  delete: (id: number): Promise<AxiosResponse<void>> => 
    api.delete(`/alertas/${id}`),
};

// Função auxiliar para tratar erros
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data) {
      const data = error.response.data as { mensagem?: string; message?: string };
      return data.mensagem || data.message || 'Erro na comunicação com o servidor';
    }
    if (error.request) {
      return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:8080';
    }
    return error.message || 'Erro desconhecido';
  }
  return 'Ocorreu um erro inesperado';
};

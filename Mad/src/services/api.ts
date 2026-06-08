// src/services/api.ts - DELETE usando fetch com tipo correto
import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base URL da API no Render
const API_BASE_URL = 'https://agrotech-api-gs-java.onrender.com/api/agro';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptors
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

// ========== TIPO DE DADOS ==========

export interface LeituraSoloAPI {
  id: number;
  umidade: number;
  temperatura: number;
  dataLeitura: string;
  dispositivoId: string;
}

export interface LeituraSolo {
  id: number;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  timestamp: string;
  satelliteRainPrediction: number;
  irrigationRecommended: boolean;
  dispositivoId: string;
}

// Função para converter dados da API para o formato do frontend
const converterParaFrontend = (apiData: LeituraSoloAPI): LeituraSolo => {
  const humidity = 50 + Math.random() * 30;
  const rainPrediction = 20 + Math.random() * 60;
  const irrigationRecommended = apiData.umidade < 40;
  
  return {
    id: apiData.id,
    soilMoisture: apiData.umidade,
    temperature: apiData.temperatura,
    humidity: Math.round(humidity),
    timestamp: apiData.dataLeitura,
    satelliteRainPrediction: Math.round(rainPrediction),
    irrigationRecommended: irrigationRecommended,
    dispositivoId: apiData.dispositivoId,
  };
};

// ========== API DE LEITURAS DO SOLO ==========
export const leituraAPI = {
  create: async (data: Omit<LeituraSolo, 'id'>): Promise<AxiosResponse<LeituraSolo>> => {
    const apiData = {
      umidade: data.soilMoisture,
      temperatura: data.temperature,
      dataLeitura: data.timestamp,
      dispositivoId: data.dispositivoId || 'ESP32-FAZENDA-01',
    };
    const response = await api.post<LeituraSoloAPI>('/solo', apiData);
    return {
      ...response,
      data: converterParaFrontend(response.data),
    };
  },
  
  getAll: async (): Promise<AxiosResponse<LeituraSolo[]>> => {
    const response = await api.get<LeituraSoloAPI[]>('/solo');
    const convertedData = response.data.map(converterParaFrontend);
    return {
      ...response,
      data: convertedData,
    };
  },
  
  getById: async (id: number): Promise<AxiosResponse<LeituraSolo>> => {
    const response = await api.get<LeituraSoloAPI>(`/solo/${id}`);
    return {
      ...response,
      data: converterParaFrontend(response.data),
    };
  },
  
  update: async (id: number, data: Partial<LeituraSolo>): Promise<AxiosResponse<LeituraSolo>> => {
    const apiData: any = {};
    if (data.soilMoisture !== undefined) apiData.umidade = data.soilMoisture;
    if (data.temperature !== undefined) apiData.temperatura = data.temperature;
    if (data.timestamp !== undefined) apiData.dataLeitura = data.timestamp;
    if (data.dispositivoId !== undefined) apiData.dispositivoId = data.dispositivoId;
    
    const response = await api.put<LeituraSoloAPI>(`/solo/${id}`, apiData);
    return {
      ...response,
      data: converterParaFrontend(response.data),
    };
  },
  
  // DELETE - Usando fetch com retorno compatível com AxiosResponse
  delete: async (id: number): Promise<AxiosResponse<void>> => {
    console.log(`📡 [FETCH] Enviando DELETE para /solo/${id}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/solo/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`📡 [FETCH] Resposta status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Criar um objeto compatível com AxiosResponse
      const axiosResponse: AxiosResponse<void> = {
        data: undefined,
        status: response.status,
        statusText: response.statusText,
        headers: {} as any,
        config: {} as any,
      };
      
      return axiosResponse;
      
    } catch (error) {
      console.error('❌ [FETCH] Erro no DELETE:', error);
      throw error;
    }
  },
};

// ========== FUNÇÕES AUXILIARES ==========

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
};

export const getMoistureColor = (moisture: number): string => {
  if (moisture < 30) return '#F44336';
  if (moisture < 50) return '#FF9800';
  if (moisture < 70) return '#4CAF50';
  return '#2196F3';
};

export const getMoistureStatus = (moisture: number): { text: string; icon: string } => {
  if (moisture < 30) return { text: 'Crítico - Solo Seco', icon: '🔥' };
  if (moisture < 50) return { text: 'Atenção - Solo Baixo', icon: '⚠️' };
  if (moisture < 70) return { text: 'Ideal', icon: '✅' };
  return { text: 'Excesso de Umidade', icon: '💧' };
};

export const getLatestLeitura = async (): Promise<LeituraSolo | null> => {
  try {
    const response = await leituraAPI.getAll();
    const data = response.data;
    if (data && data.length > 0) {
      const sorted = [...data].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      return sorted[0];
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar última leitura:', error);
    return null;
  }
};

// ========== API DE ALERTAS ==========
export interface Alert {
  id: number;
  title: string;
  description: string;
  type: string;
  severity: string;
  createdAt: string;
  read: boolean;
}

export const alertaAPI = {
  getAll: async (): Promise<Alert[]> => {
    try {
      const response = await leituraAPI.getAll();
      const leituras = response.data;
      const alerts: Alert[] = [];
      
      for (const leitura of leituras) {
        if (leitura.soilMoisture < 25) {
          alerts.push({
            id: leitura.id * 100,
            title: '🔥 Alerta de Seca',
            description: `Umidade do solo em ${leitura.soilMoisture}%. Irrigação necessária!`,
            type: 'drought',
            severity: 'high',
            createdAt: leitura.timestamp,
            read: false,
          });
        }
        
        if (leitura.temperature > 35) {
          alerts.push({
            id: leitura.id * 100 + 1,
            title: '🌡️ Calor Extremo',
            description: `Temperatura atingiu ${leitura.temperature}°C. Risco para as plantas.`,
            type: 'drought',
            severity: 'high',
            createdAt: leitura.timestamp,
            read: false,
          });
        }
      }
      
      return alerts;
    } catch (error) {
      return [];
    }
  },
  
  getUnread: async (): Promise<Alert[]> => {
    const alerts = await alertaAPI.getAll();
    return alerts.filter(a => !a.read);
  },
  
  markAsRead: async (id: number): Promise<void> => {
    console.log('Marcar como lido:', id);
  },
  
  delete: async (id: number): Promise<void> => {
    console.log('Deletar alerta:', id);
  },
};

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data) {
      const data = error.response.data as { mensagem?: string; message?: string };
      return data.mensagem || data.message || 'Erro na comunicação com o servidor';
    }
    if (error.request) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    }
    return error.message || 'Erro desconhecido';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro inesperado';
};
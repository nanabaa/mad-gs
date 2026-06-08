// src/services/api.ts - Versão híbrida (plantações local, sensores API)
import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    if (error.message === 'Network Error') {
      console.error('🚨 Possível erro de CORS. Verifique o backend.');
    }
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

export interface SateliteData {
  id: number;
  predictionDate: string;
  rainProbability: number;
  temperatureMin: number;
  temperatureMax: number;
  alertType?: string;
  description?: string;
  createdAt: string;
}

// ========== API DE SOLO (Endpoints reais do backend) ==========
export const soloAPI = {
  create: (data: Omit<SensorData, 'id'>): Promise<AxiosResponse<SensorData>> => 
    api.post<SensorData>('/solo', data),
  
  getAll: (): Promise<AxiosResponse<SensorData[]>> => 
    api.get<SensorData[]>('/solo'),
  
  getById: (id: number): Promise<AxiosResponse<SensorData>> => 
    api.get<SensorData>(`/solo/${id}`),
  
  update: (id: number, data: Partial<SensorData>): Promise<AxiosResponse<SensorData>> => 
    api.put<SensorData>(`/solo/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<void>> => 
    api.delete(`/solo/${id}`),
};

// ========== API DE SATÉLITE (Endpoints reais do backend) ==========
export const sateliteAPI = {
  create: (data: Omit<SateliteData, 'id' | 'createdAt'>): Promise<AxiosResponse<SateliteData>> => 
    api.post<SateliteData>('/satelite', data),
  
  getAll: (): Promise<AxiosResponse<SateliteData[]>> => 
    api.get<SateliteData[]>('/satelite'),
};

// ========== STORAGE LOCAL PARA PLANTAÇÕES ==========
const STORAGE_KEYS = {
  PLANTATIONS: '@AgroOrbit:plantations',
};

// Salvar plantações
const savePlantations = async (plantations: Plantation[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(plantations);
    await AsyncStorage.setItem(STORAGE_KEYS.PLANTATIONS, jsonValue);
    console.log('✅ Plantações salvas localmente:', plantations.length);
  } catch (error) {
    console.error('❌ Erro ao salvar plantações:', error);
  }
};

// GET todas as plantações
export const getPlantations = async (): Promise<Plantation[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PLANTATIONS);
    if (jsonValue !== null) {
      const data = JSON.parse(jsonValue);
      console.log('✅ Plantações carregadas do storage:', data.length);
      return data;
    }
    // Dados iniciais
    const initialData: Plantation[] = [
      {
        id: 1,
        name: 'Talhão Norte',
        cropType: 'Soja',
        area: 10.5,
        plantingDate: new Date().toISOString().split('T')[0],
        soilMoisture: 65,
        temperature: 24,
        irrigationStatus: 'inactive',
        lastIrrigation: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Talhão Sul',
        cropType: 'Milho',
        area: 8.2,
        plantingDate: new Date().toISOString().split('T')[0],
        soilMoisture: 45,
        temperature: 26,
        irrigationStatus: 'blocked',
        lastIrrigation: new Date().toISOString(),
      },
    ];
    await savePlantations(initialData);
    return initialData;
  } catch (error) {
    console.error('❌ Erro ao carregar plantações:', error);
    return [];
  }
};

// CREATE plantação
export const createPlantation = async (plantation: Omit<Plantation, 'id'>): Promise<Plantation> => {
  console.log('📝 Criando nova plantação...');
  const plantations = await getPlantations();
  const newId = plantations.length > 0 ? Math.max(...plantations.map(p => p.id)) + 1 : 1;
  const newPlantation: Plantation = { ...plantation, id: newId };
  plantations.push(newPlantation);
  await savePlantations(plantations);
  console.log('✅ Plantação criada ID:', newId);
  return newPlantation;
};

// UPDATE plantação
export const updatePlantation = async (id: number, updates: Partial<Plantation>): Promise<Plantation> => {
  console.log('📝 Atualizando plantação ID:', id);
  const plantations = await getPlantations();
  const index = plantations.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Plantação não encontrada');
  
  plantations[index] = { ...plantations[index], ...updates };
  await savePlantations(plantations);
  console.log('✅ Plantação atualizada ID:', id);
  return plantations[index];
};

// DELETE plantação - CORRIGIDA
export const deletePlantation = async (id: number): Promise<boolean> => {
  try {
    console.log('🗑️ [DELETE] Iniciando exclusão da plantação ID:', id);
    
    const plantations = await getPlantations();
    console.log('📊 [DELETE] Total antes:', plantations.length);
    
    const exists = plantations.some(p => p.id === id);
    if (!exists) {
      console.warn('⚠️ [DELETE] Plantação não encontrada ID:', id);
      return false;
    }
    
    const updatedPlantations = plantations.filter(p => p.id !== id);
    console.log('📊 [DELETE] Total depois:', updatedPlantations.length);
    
    await savePlantations(updatedPlantations);
    console.log('✅ [DELETE] Exclusão realizada com sucesso!');
    
    return true;
  } catch (error) {
    console.error('❌ [DELETE] Erro:', error);
    return false;
  }
};

// ========== FUNÇÕES AUXILIARES ==========

// Buscar última leitura do solo da API real
export const getLatestSensorData = async (): Promise<SensorData | null> => {
  try {
    const response = await soloAPI.getAll();
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

// Buscar histórico de sensores
export const getSensorHistory = async (days: number = 7): Promise<SensorData[]> => {
  try {
    const response = await soloAPI.getAll();
    const data = response.data;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return data.filter(item => new Date(item.timestamp) >= cutoffDate);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
};

// Atualizar plantações com dados reais dos sensores
export const updatePlantationsWithRealData = async (): Promise<Plantation[]> => {
  try {
    const latestSensor = await getLatestSensorData();
    const plantations = await getPlantations();
    
    if (latestSensor) {
      const updatedPlantations = plantations.map(p => ({
        ...p,
        soilMoisture: latestSensor.soilMoisture,
        temperature: latestSensor.temperature,
        irrigationStatus: (latestSensor.irrigationRecommended ? 'active' : 'inactive') as 'active' | 'inactive' | 'blocked',
        lastIrrigation: new Date().toISOString(),
      }));
      await savePlantations(updatedPlantations);
      return updatedPlantations;
    }
    return plantations;
  } catch (error) {
    console.error('❌ Erro ao atualizar plantações:', error);
    return await getPlantations();
  }
};

// Gerar alertas baseados em dados de satélite
export const generateAlertsFromSatellite = async (): Promise<any[]> => {
  try {
    const sateliteResponse = await sateliteAPI.getAll();
    const sateliteData = sateliteResponse.data;
    const alerts: any[] = [];
    
    for (const satData of sateliteData) {
      if (satData.temperatureMin < 0) {
        alerts.push({
          id: Date.now() + alerts.length,
          title: '❄️ Alerta de Geada',
          description: `Temperaturas podem atingir ${satData.temperatureMin}°C. Proteja suas plantações!`,
          type: 'frost',
          severity: 'high',
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
      
      if (satData.rainProbability < 20) {
        alerts.push({
          id: Date.now() + alerts.length,
          title: '🔥 Alerta de Seca',
          description: 'Baixa probabilidade de chuva. Irrigação recomendada!',
          type: 'drought',
          severity: 'high',
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    }
    
    return alerts;
  } catch (error) {
    console.error('Erro ao gerar alertas:', error);
    return [];
  }
};

// API de alertas (usando dados gerados)
export const alertaAPI = {
  getAll: async (): Promise<any[]> => {
    return generateAlertsFromSatellite();
  },
  getUnread: async (): Promise<any[]> => {
    const alerts = await generateAlertsFromSatellite();
    return alerts.filter(a => !a.read);
  },
  markAsRead: async (id: number): Promise<void> => {
    console.log('Marcar como lido:', id);
  },
};

// Função para tratar erros
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
  return 'Ocorreu um erro inesperado';
};
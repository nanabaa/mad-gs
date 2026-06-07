// src/services/storage.ts - Versão com logs detalhados
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const STORAGE_KEYS = {
  PLANTATIONS: '@AgroOrbit:plantations',
};

// Salvar plantações
const savePlantations = async (plantations: Plantation[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(plantations);
    await AsyncStorage.setItem(STORAGE_KEYS.PLANTATIONS, jsonValue);
    console.log('✅ Plantações salvas com sucesso:', plantations.length);
  } catch (error) {
    console.error('❌ Erro ao salvar plantações:', error);
  }
};

// Carregar plantações
export const getPlantations = async (): Promise<Plantation[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PLANTATIONS);
    if (jsonValue !== null) {
      const data = JSON.parse(jsonValue);
      console.log('✅ Plantações carregadas:', data.length);
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

// Função para gerar próximo ID
const getNextId = async (): Promise<number> => {
  const plantations = await getPlantations();
  const maxId = plantations.length > 0 ? Math.max(...plantations.map(p => p.id)) : 0;
  return maxId + 1;
};

// Criar nova plantação
export const createPlantation = async (plantation: Omit<Plantation, 'id'>): Promise<Plantation> => {
  console.log('📝 Criando nova plantação...');
  const plantations = await getPlantations();
  const newId = await getNextId();
  const newPlantation: Plantation = {
    ...plantation,
    id: newId,
  };
  plantations.push(newPlantation);
  await savePlantations(plantations);
  console.log('✅ Plantação criada ID:', newId);
  return newPlantation;
};

// Atualizar plantação
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

// Deletar plantação - VERSÃO SIMPLIFICADA E ROBUSTA
export const deletePlantation = async (id: number): Promise<boolean> => {
  try {
    console.log('🗑️ Iniciando exclusão da plantação ID:', id);
    
    // Carrega todas as plantações
    const plantations = await getPlantations();
    console.log('📊 Total antes da exclusão:', plantations.length);
    
    // Verifica se a plantação existe
    const exists = plantations.some(p => p.id === id);
    if (!exists) {
      console.warn('⚠️ Plantação não encontrada ID:', id);
      return false;
    }
    
    // Filtra removendo a plantação com o ID especificado
    const updatedPlantations = plantations.filter(p => p.id !== id);
    console.log('📊 Total depois da exclusão:', updatedPlantations.length);
    
    // Salva a lista atualizada
    await savePlantations(updatedPlantations);
    
    // Verifica se salvou corretamente
    const verify = await getPlantations();
    console.log('✅ Verificação pós-exclusão:', verify.length);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar plantação:', error);
    return false;
  }
};
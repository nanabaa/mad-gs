// src/screens/PlantationFormScreen.tsx - Versão COMPLETA com todos os estilos
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { 
  getPlantations, 
  deletePlantation, 
  createPlantation, 
  updatePlantation, 
  getLatestSensorData,
  handleApiError 
} from '../services/api';

type RouteParams = {
  plantationId?: number;
};

export default function PlantationFormScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { plantationId } = route.params as RouteParams;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defaultSensorData, setDefaultSensorData] = useState({ moisture: 50, temperature: 25 });
  const [formData, setFormData] = useState({
    name: '',
    cropType: '',
    area: '',
    plantingDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadDefaultSensorData();
    if (plantationId) {
      loadPlantation();
    }
  }, [plantationId]);

  const loadDefaultSensorData = async () => {
    try {
      const latestSensor = await getLatestSensorData();
      if (latestSensor) {
        setDefaultSensorData({
          moisture: latestSensor.soilMoisture,
          temperature: latestSensor.temperature,
        });
      }
    } catch (error) {
      console.log('Usando dados padrão do sensor');
    }
  };

  const loadPlantation = async () => {
    setLoading(true);
    try {
      console.log(`📝 Carregando plantação ID: ${plantationId}`);
      const plantations = await getPlantations();
      const plantation = plantations.find(p => p.id === plantationId);
      if (plantation) {
        setFormData({
          name: plantation.name,
          cropType: plantation.cropType,
          area: plantation.area.toString(),
          plantingDate: plantation.plantingDate.split('T')[0],
        });
      } else {
        Alert.alert('Erro', 'Plantação não encontrada');
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar plantação:', error);
      Alert.alert('Erro', handleApiError(error));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.cropType || !formData.area || !formData.plantingDate) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        cropType: formData.cropType,
        area: parseFloat(formData.area),
        plantingDate: formData.plantingDate,
        soilMoisture: defaultSensorData.moisture,
        temperature: defaultSensorData.temperature,
        irrigationStatus: 'inactive' as const,
        lastIrrigation: new Date().toISOString(),
      };

      if (plantationId) {
        await updatePlantation(plantationId, payload);
        Alert.alert('Sucesso', 'Plantação atualizada com sucesso');
      } else {
        await createPlantation(payload);
        Alert.alert('Sucesso', 'Plantação cadastrada com sucesso');
      }
      navigation.goBack();
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      Alert.alert('Erro', handleApiError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formCard}>
        <Text style={styles.label}>🌾 Nome da Plantação *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Ex: Talhão Norte, Fazenda Principal"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>🌱 Tipo de Cultura *</Text>
        <TextInput
          style={styles.input}
          value={formData.cropType}
          onChangeText={(text) => setFormData({ ...formData, cropType: text })}
          placeholder="Ex: Soja, Milho, Café, Trigo"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>📐 Área (hectares) *</Text>
        <TextInput
          style={styles.input}
          value={formData.area}
          onChangeText={(text) => setFormData({ ...formData, area: text })}
          placeholder="Ex: 10.5"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>📅 Data de Plantio *</Text>
        <TextInput
          style={styles.input}
          value={formData.plantingDate}
          onChangeText={(text) => setFormData({ ...formData, plantingDate: text })}
          placeholder="YYYY-MM-DD (Ex: 2024-03-20)"
          placeholderTextColor="#999"
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📡 Dados do Sensor Atual</Text>
          <Text style={styles.infoText}>
            💧 Umidade do solo: {defaultSensorData.moisture}%{'\n'}
            🌡️ Temperatura: {defaultSensorData.temperature}°C{'\n'}
            *Dados atualizados automaticamente pela estação meteorológica
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? '💾 Salvando...' : plantationId ? '📝 Atualizar Plantação' : '✅ Cadastrar Plantação'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>💡 Dicas de Monitoramento</Text>
        <Text style={styles.tipsText}>
          • O sistema monitora a umidade do solo em tempo real{'\n'}
          • Dados de satélite preveem chuva e otimizam a irrigação{'\n'}
          • Alertas serão enviados em condições climáticas extremas{'\n'}
          • A economia de água é calculada automaticamente
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsBox: {
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
});
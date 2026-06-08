// src/screens/LeituraFormScreen.tsx - Create/Update via API
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
  Switch,
} 

from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { leituraAPI, LeituraSolo, handleApiError } from '../services/api';

type RouteParams = {
  leituraId?: number;
};

export default function LeituraFormScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { leituraId } = route.params as RouteParams;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    soilMoisture: '',
    temperature: '',
    humidity: '',
    satelliteRainPrediction: '',
    irrigationRecommended: false,
    dispositivoId: 'ESP32-FAZENDA-01',
  });

  useEffect(() => {
    if (leituraId && leituraId > 0) {
      loadLeitura(leituraId);
    }
  }, [leituraId]);

  const loadLeitura = async (id: number) => {
    setLoading(true);
    try {
      console.log(`📝 Carregando leitura ID: ${id}`);
      const response = await leituraAPI.getById(id);
      const leitura = response.data;
      
      setFormData({
        soilMoisture: leitura.soilMoisture?.toString() || '0',
        temperature: leitura.temperature?.toString() || '0',
        humidity: leitura.humidity?.toString() || '50',
        satelliteRainPrediction: leitura.satelliteRainPrediction?.toString() || '30',
        irrigationRecommended: leitura.irrigationRecommended || false,
        dispositivoId: leitura.dispositivoId || 'ESP32-FAZENDA-01',
      });
      
      console.log('✅ Dados carregados:', formData);
    } catch (error) {
      console.error('❌ Erro ao carregar leitura:', error);
      Alert.alert('Erro', handleApiError(error));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.soilMoisture || !formData.temperature) {
      Alert.alert('Atenção', 'Por favor, preencha os campos obrigatórios (Umidade e Temperatura)');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        soilMoisture: parseFloat(formData.soilMoisture),
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity || '50'),
        satelliteRainPrediction: parseFloat(formData.satelliteRainPrediction || '30'),
        irrigationRecommended: formData.irrigationRecommended,
        timestamp: new Date().toISOString(),
        dispositivoId: formData.dispositivoId,
      };

      if (leituraId && leituraId > 0) {
        console.log(`📝 Atualizando leitura ID: ${leituraId}`);
        await leituraAPI.update(leituraId, payload);
        Alert.alert('Sucesso', 'Leitura atualizada com sucesso');
      } else {
        console.log('📝 Criando nova leitura');
        await leituraAPI.create(payload);
        Alert.alert('Sucesso', 'Leitura cadastrada com sucesso');
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
        <Text style={styles.loadingText}>Carregando leitura...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formCard}>
        <Text style={styles.title}>
          {leituraId && leituraId > 0 ? '📝 Editar Leitura' : 'Nova Leitura'}
        </Text>

        <Text style={styles.label}>Umidade do Solo (%) *</Text>
        <TextInput
          style={styles.input}
          value={formData.soilMoisture}
          onChangeText={(text) => setFormData({ ...formData, soilMoisture: text })}
          placeholder="Ex: 45"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Temperatura (°C) *</Text>
        <TextInput
          style={styles.input}
          value={formData.temperature}
          onChangeText={(text) => setFormData({ ...formData, temperature: text })}
          placeholder="Ex: 24"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>ID do Dispositivo</Text>
        <TextInput
          style={styles.input}
          value={formData.dispositivoId}
          onChangeText={(text) => setFormData({ ...formData, dispositivoId: text })}
          placeholder="Ex: ESP32-FAZENDA-01"
          placeholderTextColor="#999"
        />

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Recomendação de Irrigação</Text>
          <Switch
            value={formData.irrigationRecommended}
            onValueChange={(value) => setFormData({ ...formData, irrigationRecommended: value })}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={formData.irrigationRecommended ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? '💾 Salvando...' : (leituraId && leituraId > 0) ? '📝 Atualizar' : 'Cadastrar'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Sobre as Leituras</Text>
        <Text style={styles.infoText}>
          • Umidade do solo: valores entre 0-100%{'\n'}
          • Temperatura: em graus Celsius{'\n'}
          • Umidade do ar: valores entre 0-100%{'\n'}
          • Previsão de chuva: probabilidade de 0-100%{'\n'}
          • A recomendação de irrigação é calculada automaticamente se umidade {'<'} 40%
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#2E7D32',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
    textAlign: 'center',
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});
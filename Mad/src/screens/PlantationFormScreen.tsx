// src/screens/PlantationFormScreen.tsx - Create/Update via API
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
import { plantacaoAPI, Plantation, handleApiError } from '../services/api';

type RouteParams = {
  plantationId?: number;
};

export default function PlantationFormScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { plantationId } = route.params as RouteParams;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cropType: '',
    area: '',
    plantingDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (plantationId) {
      loadPlantation();
    }
  }, [plantationId]);

  const loadPlantation = async () => {
    setLoading(true);
    try {
      console.log(`📝 Carregando plantação ID: ${plantationId}`);
      const response = await plantacaoAPI.getById(plantationId);
      const plantation = response.data;
      setFormData({
        name: plantation.name,
        cropType: plantation.cropType,
        area: plantation.area.toString(),
        plantingDate: plantation.plantingDate.split('T')[0],
      });
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
        soilMoisture: Math.random() * 50 + 30, // Simulado
        temperature: Math.random() * 15 + 20,  // Simulado
        irrigationStatus: 'inactive' as const,
        lastIrrigation: new Date().toISOString(),
      };

      if (plantationId) {
        // UPDATE via API
        console.log(`📝 Atualizando plantação ID: ${plantationId}`);
        await plantacaoAPI.update(plantationId, payload);
        Alert.alert('Sucesso', 'Plantação atualizada com sucesso');
      } else {
        // CREATE via API
        console.log('📝 Criando nova plantação');
        await plantacaoAPI.create(payload);
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
        <Text style={styles.label}>Nome da Plantação *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Ex: Talhão Norte"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Tipo de Cultura *</Text>
        <TextInput
          style={styles.input}
          value={formData.cropType}
          onChangeText={(text) => setFormData({ ...formData, cropType: text })}
          placeholder="Ex: Soja, Milho, Café"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Área (hectares) *</Text>
        <TextInput
          style={styles.input}
          value={formData.area}
          onChangeText={(text) => setFormData({ ...formData, area: text })}
          placeholder="Ex: 10.5"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Data de Plantio *</Text>
        <TextInput
          style={styles.input}
          value={formData.plantingDate}
          onChangeText={(text) => setFormData({ ...formData, plantingDate: text })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Salvando...' : plantationId ? 'Atualizar' : 'Cadastrar'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Sobre o monitoramento</Text>
        <Text style={styles.infoText}>
          Ao cadastrar sua plantação, o AgroOrbit Link começará a monitorar a umidade do solo
          e cruzará com dados de satélite para otimizar a irrigação e prever riscos.
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
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
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
    lineHeight: 18,
  },
});

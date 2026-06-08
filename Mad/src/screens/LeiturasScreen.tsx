import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} 

from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { 
  leituraAPI, 
  LeituraSolo, 
  formatDate, 
  getMoistureColor, 
  getMoistureStatus,
  handleApiError 
} from '../services/api';

type LeiturasScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Leituras'>;

export default function LeiturasScreen() {
  const navigation = useNavigation<LeiturasScreenNavigationProp>();
  const [leituras, setLeituras] = useState<LeituraSolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeituras = useCallback(async () => {
    try {
      console.log('Buscando leituras da API...');
      const response = await leituraAPI.getAll();
      console.log('Leituras carregadas:', response.data.length);
      setLeituras(response.data);
    } catch (error) {
      console.error('❌ Erro ao buscar leituras:', error);
      Alert.alert('Erro', handleApiError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLeituras();
    }, [fetchLeituras])
  );

  
  const DeleteWithFetch = async (id: number) => {
    console.log('========================================');
    console.log('🧪 DIRETO COM FETCH');
    console.log(`📡 URL: https://agrotech-api-gs-java.onrender.com/api/agro/solo/${id}`);
    console.log('========================================');
    
    try {
      const response = await fetch(`https://agrotech-api-gs-java.onrender.com/api/agro/solo/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`📡 Status da resposta: ${response.status}`);
      console.log(`📡 Status text: ${response.statusText}`);
      
      if (response.status === 200 || response.status === 204) {
        console.log('✅ DELETE funcionou via fetch!');
        Alert.alert('Sucesso', 'Leitura excluída com sucesso via fetch!');
        await fetchLeituras();
      } else {
        const text = await response.text();
        console.log('❌ Resposta de erro:', text);
        Alert.alert('Erro', `Falha na exclusão. Status: ${response.status}`);
      }
    } catch (err) {
      const error = err as Error;
      console.error('❌ Erro no fetch:', error);
      Alert.alert('Erro', `Erro: ${error.message}`);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    fetchLeituras();
  };

  const renderItem = ({ item }: { item: LeituraSolo }) => {
    const moistureStatus = getMoistureStatus(item.soilMoisture);
    const moistureColor = getMoistureColor(item.soilMoisture);
    
    return (
      <View style={styles.leituraCard}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => navigation.navigate('LeituraForm', { leituraId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Leitura #{item.id}</Text>
            <View style={[styles.irrigationBadge, { 
              backgroundColor: item.irrigationRecommended ? '#3c885b' : '#c53d3d' 
            }]}>
              <Text style={styles.irrigationText}>
                {item.irrigationRecommended ? '💧 Irrigar' : '⛔ Bloquear'}
              </Text>
            </View>
          </View>

          <View style={styles.sensorGrid}>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Umidade Solo</Text>
              <Text style={[styles.sensorValue, { color: moistureColor }]}>
                {item.soilMoisture}%
              </Text>
            </View>
            
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Temperatura</Text>
              <Text style={styles.sensorValue}>{item.temperature}°C</Text>
            </View>
            
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Umidade Ar</Text>
              <Text style={styles.sensorValue}>{item.humidity}%</Text>
            </View>
            
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Previsão Chuva</Text>
              <Text style={styles.sensorValue}>{item.satelliteRainPrediction}%</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(item.soilMoisture, 100)}%`,
                    backgroundColor: moistureColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.moistureStatus, { color: moistureColor }]}>
              {moistureStatus.icon} {moistureStatus.text}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.timestamp}>
              {formatDate(item.timestamp)}
            </Text>
            <Text style={styles.deviceId}>
              {item.dispositivoId || 'ESP32-FAZENDA-01'}
            </Text>
          </View>
        </TouchableOpacity>
        
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => DeleteWithFetch(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.testText}>Deletar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Carregando leituras...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('LeituraForm', {})}
      >
        <Text style={styles.addButtonText}>Nova Leitura</Text>
      </TouchableOpacity>

      <FlatList
        data={leituras}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}></Text>
            <Text style={styles.emptyText}>Nenhuma leitura encontrada</Text>
            <Text style={styles.emptySubtext}>
              Toque em "Nova Leitura" para adicionar dados do sensor
            </Text>
          </View>
        }
        contentContainerStyle={leituras.length === 0 ? styles.emptyList : styles.list}
      />
    </View>
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
  addButton: {
    backgroundColor: '#2E7D32',
    margin: 16,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leituraCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  irrigationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  irrigationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sensorItem: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  sensorLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  sensorValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressSection: {
    marginVertical: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  moistureStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
    marginTop: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  deviceId: {
    fontSize: 10,
    color: '#BBB',
    textAlign: 'center',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FFCDD2',
  },
  deleteText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#c53d3d',
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#BBDEFB',
  },
  testText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
  },
});
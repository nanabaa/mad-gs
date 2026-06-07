// src/screens/PlantationsScreen.tsx - Versão completamente reformulada
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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getPlantations, deletePlantation, Plantation } from '../services/storage';

type PlantationsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Plantations'>;

export default function PlantationsScreen() {
  const navigation = useNavigation<PlantationsScreenNavigationProp>();
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlantations = useCallback(async () => {
    try {
      console.log('🔄 Buscando plantações...');
      const data = await getPlantations();
      console.log('📊 Plantações carregadas:', data.length);
      setPlantations(data);
    } catch (error) {
      console.error('❌ Erro ao buscar plantações:', error);
      Alert.alert('Erro', 'Não foi possível carregar as plantações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlantations();
    }, [fetchPlantations])
  );

  const handleDelete = async (id: number, name: string) => {
    console.log('🗑️ Botão excluir pressionado para:', name, 'ID:', id);
    
    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja excluir a plantação "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Executando exclusão...');
              const success = await deletePlantation(id);
              
              if (success) {
                console.log('✅ Exclusão bem sucedida');
                // Atualiza a lista local imediatamente
                setPlantations(prev => prev.filter(p => p.id !== id));
                Alert.alert('Sucesso', 'Plantação excluída com sucesso');
              } else {
                console.log('❌ Falha na exclusão');
                Alert.alert('Erro', 'Plantação não encontrada');
              }
            } catch (error) {
              console.error('❌ Erro na exclusão:', error);
              Alert.alert('Erro', 'Não foi possível excluir a plantação');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlantations();
  };

  const getIrrigationStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'inactive': return '#9E9E9E';
      case 'blocked': return '#F44336';
      default: return '#666';
    }
  };

  const getIrrigationStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'inactive': return 'Inativa';
      case 'blocked': return 'Bloqueada (Chuva prevista)';
      default: return status;
    }
  };

  const renderItem = ({ item }: { item: Plantation }) => (
    <View style={styles.plantationCard}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigation.navigate('PlantationForm', { plantationId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.plantationName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getIrrigationStatusColor(item.irrigationStatus) }]}>
            <Text style={styles.statusText}>{getIrrigationStatusText(item.irrigationStatus)}</Text>
          </View>
        </View>
        
        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Cultura:</Text>
            <Text style={styles.detailValue}>{item.cropType}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Área:</Text>
            <Text style={styles.detailValue}>{item.area} ha</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Umidade:</Text>
            <Text style={styles.detailValue}>{item.soilMoisture}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Temperatura:</Text>
            <Text style={styles.detailValue}>{item.temperature}°C</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.plantingDate}>
            Plantio: {new Date(item.plantingDate).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id, item.name)}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteText}>🗑️ Excluir</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Carregando plantações...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('PlantationForm', {})}
      >
        <Text style={styles.addButtonText}>+ Nova Plantação</Text>
      </TouchableOpacity>

      <FlatList
        data={plantations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyText}>Nenhuma plantação cadastrada</Text>
            <Text style={styles.emptySubtext}>
              Toque em "+ Nova Plantação" para começar
            </Text>
          </View>
        }
        contentContainerStyle={plantations.length === 0 ? styles.emptyList : styles.list}
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
  plantationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  plantationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  },
  plantingDate: {
    fontSize: 12,
    color: '#999',
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
    fontWeight: '600',
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
  },
});
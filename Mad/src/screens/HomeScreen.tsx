// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { 
  getLatestLeitura, 
  leituraAPI,
  alertaAPI,
  LeituraSolo, 
  formatDate,
  getMoistureColor,
  getMoistureStatus,
  handleApiError 
} from '../services/api';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [latestLeitura, setLatestLeitura] = useState<LeituraSolo | null>(null);
  const [totalLeituras, setTotalLeituras] = useState(0);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [averageMoisture, setAverageMoisture] = useState(0);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Buscando dados do dashboard...');
      
      const [latest, allLeituras, alerts] = await Promise.all([
        getLatestLeitura(),
        leituraAPI.getAll(),
        alertaAPI.getAll(),
      ]);

      setLatestLeitura(latest);
      setTotalLeituras(allLeituras.data.length);
      setUnreadAlerts(alerts.filter((a: any) => !a.read).length);
      
      const avgMoisture = allLeituras.data.length > 0
        ? allLeituras.data.reduce((sum: number, item: LeituraSolo) => sum + item.soilMoisture, 0) / allLeituras.data.length
        : 0;
      setAverageMoisture(avgMoisture);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dashboard:', error);
      Alert.alert('Erro', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Carregando dados do agro...</Text>
      </View>
    );
  }

  const moistureStatus = getMoistureStatus(averageMoisture);
  const moistureColor = getMoistureColor(averageMoisture);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>🌾 Bem-vindo, Agricultor!</Text>
        <Text style={styles.subtitle}>Monitoramento Inteligente via Satélite</Text>
      </View>

      {/* Última Leitura */}
      {latestLeitura && (
        <View style={styles.sensorCard}>
          <Text style={styles.sensorTitle}>📡 Última Leitura do Solo</Text>
          <Text style={styles.sensorTimestamp}>
            {formatDate(latestLeitura.timestamp)}
          </Text>
          <View style={styles.sensorRow}>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>💧 Umidade do Solo</Text>
              <Text style={[styles.sensorValue, { color: getMoistureColor(latestLeitura.soilMoisture) }]}>
                {latestLeitura.soilMoisture}%
              </Text>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>🌡️ Temperatura</Text>
              <Text style={styles.sensorValue}>
                {latestLeitura.temperature}°C
              </Text>
            </View>
          </View>
          <View style={styles.sensorRow}>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>💨 Umidade do Ar</Text>
              <Text style={styles.sensorValue}>
                {latestLeitura.humidity}%
              </Text>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>🌧️ Previsão de Chuva</Text>
              <Text style={styles.sensorValue}>
                {latestLeitura.satelliteRainPrediction}%
              </Text>
            </View>
          </View>
          <View style={styles.irrigationRecommendation}>
            <Text style={styles.recommendationLabel}>🚰 Recomendação de Irrigação:</Text>
            <Text style={[
              styles.recommendationValue,
              latestLeitura.irrigationRecommended ? styles.recommendActive : styles.recommendBlocked
            ]}>
              {latestLeitura.irrigationRecommended ? '✅ Irrigar agora' : '⛔ Bloquear irrigação'}
            </Text>
          </View>
        </View>
      )}

      {/* Cards de Estatísticas */}
      <View style={styles.statsGrid}>
        <TouchableOpacity 
          style={[styles.statCard, { borderTopColor: '#4CAF50' }]}
          onPress={() => navigation.navigate('Leituras')}
        >
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statTitle}>Total de Leituras</Text>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>
            {totalLeituras}
          </Text>
        </TouchableOpacity>
        
        
        
        <TouchableOpacity 
          style={[styles.statCard, { borderTopColor: '#2196F3' }]}
          onPress={() => navigation.navigate('HistoryReports')}
        >
          <Text style={styles.statIcon}>📈</Text>
          <Text style={styles.statTitle}>Relatórios</Text>
          <Text style={[styles.statValue, { color: '#2196F3' }]}>
            {">"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status da Umidade Média */}
      <View style={styles.moistureCard}>
        <Text style={styles.moistureTitle}>📊 Umidade Média das Leituras</Text>
        <View style={styles.moistureRow}>
          <Text style={[styles.moisturePercentage, { color: moistureColor }]}>
            {averageMoisture.toFixed(1)}%
          </Text>
          <Text style={[styles.moistureStatus, { color: moistureColor }]}>
            {moistureStatus.icon} {moistureStatus.text}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(averageMoisture, 100)}%`,
                backgroundColor: moistureColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Ações Rápidas */}
      <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Leituras')}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Minhas Leituras</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Alerts')}
        >
          <Text style={styles.actionIcon}>🔔</Text>
          <Text style={styles.actionText}>Alertas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('LeituraForm', {})}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>Nova Leitura</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('HistoryReports')}
        >
          <Text style={styles.actionIcon}>📈</Text>
          <Text style={styles.actionText}>Relatórios</Text>
        </TouchableOpacity>
      </View>

      {/* Informações de Satélite */}
      <View style={styles.satelliteInfo}>
        <Text style={styles.satelliteTitle}>🛰️ Integração com Satélites</Text>
        <Text style={styles.satelliteText}>
          Dados integrados com constelações NASA/ESA para previsão de microclimas, 
          alertas de geada e otimização inteligente de irrigação.
        </Text>
        <View style={styles.satelliteBadge}>
          <Text style={styles.badgeText}>🌍 NASA EARTHDATA</Text>
          <Text style={styles.badgeText}>🛰️ ESA SENTINEL</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
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
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 25,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#C8E6C9',
    marginTop: 5,
  },
  sensorCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sensorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  sensorTimestamp: {
    fontSize: 11,
    color: '#999',
    marginBottom: 12,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  sensorItem: {
    alignItems: 'center',
    flex: 1,
  },
  sensorLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  sensorValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  irrigationRecommendation: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    alignItems: 'center',
  },
  recommendationLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  recommendationValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  recommendActive: {
    color: '#4CAF50',
  },
  recommendBlocked: {
    color: '#F44336',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 10,
    borderTopWidth: 3,
    alignItems: 'center',
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  moistureCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  moistureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  moistureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moisturePercentage: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  moistureStatus: {
    fontSize: 14,
    fontWeight: '500',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    width: '23%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
  },
  satelliteInfo: {
    backgroundColor: '#E8EAF6',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  satelliteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3949AB',
    marginBottom: 8,
  },
  satelliteText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginBottom: 12,
  },
  satelliteBadge: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3949AB',
    backgroundColor: '#C5CAE9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
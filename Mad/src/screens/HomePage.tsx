// src/screens/HomeScreen.tsx - Versão atualizada com a nova API
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
import { RootStackParamList } from '../types/navigation';
import { 
  getLatestSensorData, 
  getPlantations, 
  generateAlertsFromSatellite,
  SensorData, 
  Plantation,
  handleApiError 
} from '../services/api';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface DashboardData {
  sensor: SensorData | null;
  activePlantations: number;
  unreadAlerts: number;
  waterSaved: number;
  averageMoisture: number;
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    sensor: null,
    activePlantations: 0,
    unreadAlerts: 0,
    waterSaved: 0,
    averageMoisture: 0,
  });

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Buscando dados do dashboard...');
      
      // Busca dados das APIs e armazenamento local
      const [latestSensor, plantations, alerts] = await Promise.all([
        getLatestSensorData(),
        getPlantations(),
        generateAlertsFromSatellite(),
      ]);

      const activeCount = plantations.length;
      
      // Calcula água economizada (cada irrigação bloqueada economiza 150L)
      const waterSaved = plantations.filter(p => p.irrigationStatus === 'blocked').length * 150;
      
      // Calcula umidade média
      const avgMoisture = plantations.length > 0
        ? plantations.reduce((sum, p) => sum + p.soilMoisture, 0) / plantations.length
        : 0;

      const unreadCount = alerts.filter(a => !a.read).length;

      setDashboardData({
        sensor: latestSensor,
        activePlantations: activeCount,
        unreadAlerts: unreadCount,
        waterSaved,
        averageMoisture: avgMoisture,
      });
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

  const getMoistureStatus = (moisture: number) => {
    if (moisture < 30) return { text: 'Crítico', color: '#F44336' };
    if (moisture < 50) return { text: 'Atenção', color: '#FF9800' };
    if (moisture < 70) return { text: 'Ideal', color: '#4CAF50' };
    return { text: 'Excesso', color: '#2196F3' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Carregando dados do agro...</Text>
      </View>
    );
  }

  const moistureStatus = getMoistureStatus(dashboardData.averageMoisture);

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

      {/* Card de Dados do Solo (API Real) */}
      {dashboardData.sensor && (
        <View style={styles.sensorCard}>
          <Text style={styles.sensorTitle}>📡 Última Leitura do Solo</Text>
          <Text style={styles.sensorTimestamp}>
            {new Date(dashboardData.sensor.timestamp).toLocaleString('pt-BR')}
          </Text>
          <View style={styles.sensorRow}>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>💧 Umidade do Solo</Text>
              <Text style={styles.sensorValue}>
                {dashboardData.sensor.soilMoisture}%
              </Text>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>🌡️ Temperatura</Text>
              <Text style={styles.sensorValue}>
                {dashboardData.sensor.temperature}°C
              </Text>
            </View>
          </View>
          <View style={styles.sensorRow}>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>💨 Umidade do Ar</Text>
              <Text style={styles.sensorValue}>
                {dashboardData.sensor.humidity}%
              </Text>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>🌧️ Previsão de Chuva</Text>
              <Text style={styles.sensorValue}>
                {dashboardData.sensor.satelliteRainPrediction}%
              </Text>
            </View>
          </View>
          <View style={styles.irrigationRecommendation}>
            <Text style={styles.recommendationLabel}>🚰 Recomendação de Irrigação:</Text>
            <Text style={[
              styles.recommendationValue,
              dashboardData.sensor.irrigationRecommended ? styles.recommendActive : styles.recommendBlocked
            ]}>
              {dashboardData.sensor.irrigationRecommended ? '✅ Irrigar agora' : '⛔ Bloquear irrigação (chuva prevista)'}
            </Text>
          </View>
        </View>
      )}

      {/* Cards de Estatísticas */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderTopColor: '#4CAF50' }]}>
          <Text style={styles.statIcon}>🌱</Text>
          <Text style={styles.statTitle}>Leituras do solo e plantações</Text>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>
            {dashboardData.activePlantations}
          </Text>
        </View>
        
        <View style={[styles.statCard, { borderTopColor: '#FF9800' }]}>
          <Text style={styles.statIcon}>⚠️</Text>
          <Text style={styles.statTitle}>Alertas</Text>
          <Text style={[styles.statValue, { color: '#FF9800' }]}>
            {dashboardData.unreadAlerts}
          </Text>
        </View>
        
        <View style={[styles.statCard, { borderTopColor: '#2196F3' }]}>
          <Text style={styles.statIcon}>💧</Text>
          <Text style={styles.statTitle}>Água Economizada</Text>
          <Text style={[styles.statValue, { color: '#2196F3' }]}>
            {dashboardData.waterSaved}
            <Text style={styles.statUnit}>L</Text>
          </Text>
        </View>
      </View>

      {/* Status da Umidade Média */}
      <View style={styles.moistureCard}>
        <Text style={styles.moistureTitle}>📊 Umidade Média das Plantações</Text>
        <View style={styles.moistureRow}>
          <Text style={[styles.moisturePercentage, { color: moistureStatus.color }]}>
            {dashboardData.averageMoisture.toFixed(1)}%
          </Text>
          <Text style={[styles.moistureStatus, { color: moistureStatus.color }]}>
            {moistureStatus.text}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(dashboardData.averageMoisture, 100)}%`,
                backgroundColor: moistureStatus.color,
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
          onPress={() => navigation.navigate('Plantations')}
        >
          <Text style={styles.actionIcon}>🌾</Text>
          <Text style={styles.actionText}>Plantações</Text>
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
          onPress={() => navigation.navigate('PlantationForm', {})}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>Nova</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('HistoryReports')}
        >
          <Text style={styles.actionIcon}>📊</Text>
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
  statUnit: {
    fontSize: 10,
    fontWeight: 'normal',
    color: '#999',
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
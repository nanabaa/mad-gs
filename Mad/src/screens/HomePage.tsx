// src/screens/HomeScreen.tsx - Versão Corrigida com Tipagem
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert as RNAlert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { sensorAPI, plantationAPI, SensorData, Plantation } from '../services/api';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface DashboardData {
  sensor: SensorData | null;
  activePlantations: number;
  unreadAlerts: number;
  waterSaved: number;
}

// Interface para as props do StatCard
interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  color: string;
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
  });

  const fetchDashboardData = async () => {
    try {
      const [sensorRes, plantationsRes] = await Promise.all([
        sensorAPI.getLatest(),
        plantationAPI.getAll(),
      ]);

      const plantations: Plantation[] = plantationsRes.data;
      const activeCount = plantations.length;
      
      // CORREÇÃO AQUI: Tipagem explícita do parâmetro 'p'
      const waterSaved = plantations.filter((p: Plantation) => p.irrigationStatus === 'blocked').length * 150;

      setDashboardData({
        sensor: sensorRes.data,
        activePlantations: activeCount,
        unreadAlerts: 3,
        waterSaved,
      });
    } catch (error) {
      RNAlert.alert('Erro', 'Não foi possível carregar os dados do dashboard');
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

  // Componente StatCard com tipagem correta
  const StatCard: React.FC<StatCardProps> = ({ title, value, unit, color }) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>
        {value}
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bem-vindo, Agricultor!</Text>
        <Text style={styles.subtitle}>Monitoramento Inteligente via Satélite</Text>
      </View>

      {dashboardData.sensor && (
        <View style={styles.sensorCard}>
          <Text style={styles.sensorTitle}>📡 Condições Atuais do Solo</Text>
          <View style={styles.sensorRow}>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Umidade do Solo</Text>
              <Text style={styles.sensorValue}>
                {dashboardData.sensor.soilMoisture}%
              </Text>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Temperatura</Text>
              <Text style={styles.sensorValue}>
                {dashboardData.sensor.temperature}°C
              </Text>
            </View>
          </View>
          <View style={styles.sensorRow}>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Previsão de Chuva</Text>
              <Text style={styles.sensorValue}>
                {dashboardData.sensor.satelliteRainPrediction}%
              </Text>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Irrigação</Text>
              <Text style={[
                styles.sensorValue,
                dashboardData.sensor.irrigationRecommended ? styles.activeText : styles.blockedText
              ]}>
                {dashboardData.sensor.irrigationRecommended ? 'Recomendada' : 'Bloqueada'}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.statsGrid}>
        <StatCard
          title="Plantações Ativas"
          value={dashboardData.activePlantations}
          color="#4CAF50"
        />
        <StatCard
          title="Alertas Não Lidos"
          value={dashboardData.unreadAlerts}
          color="#FF9800"
        />
        <StatCard
          title="Água Economizada"
          value={dashboardData.waterSaved}
          unit="L"
          color="#2196F3"
        />
      </View>

      <Text style={styles.sectionTitle}>Ações Rápidas</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Plantations')}
        >
          <Text style={styles.actionIcon}>🌱</Text>
          <Text style={styles.actionText}>Minhas Plantações</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Alerts')}
        >
          <Text style={styles.actionIcon}>⚠️</Text>
          <Text style={styles.actionText}>Alertas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PlantationForm', {})}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>Nova Plantação</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.satelliteInfo}>
        <Text style={styles.satelliteTitle}>🛰️ Dados Orbitais</Text>
        <Text style={styles.satelliteText}>
          Integrado com constelações de satélites NASA/ESA para previsão de microclimas e otimização de irrigação.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#2E7D32',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  sensorItem: {
    alignItems: 'center',
  },
  sensorLabel: {
    fontSize: 12,
    color: '#666',
  },
  sensorValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 4,
  },
  activeText: {
    color: '#4CAF50',
  },
  blockedText: {
    color: '#F44336',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '31%',
    padding: 12,
    borderRadius: 10,
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statTitle: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  },
});
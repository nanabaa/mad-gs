// src/screens/HistoryReportsScreen.tsx - Versão corrigida com a nova API
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { 
  soloAPI, 
  getPlantations, 
  getSensorHistory,
  SensorData, 
  Plantation,
  handleApiError 
} from '../services/api';

interface ReportData {
  totalWaterSaved: number;
  averageMoisture: number;
  totalIrrigationBlocks: number;
  estimatedSaving: number;
  totalReadings: number;
}

export default function HistoryReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [reportData, setReportData] = useState<ReportData>({
    totalWaterSaved: 0,
    averageMoisture: 0,
    totalIrrigationBlocks: 0,
    estimatedSaving: 0,
    totalReadings: 0,
  });

  const fetchData = async () => {
    try {
      const daysMap = { week: 7, month: 30, year: 365 };
      const days = daysMap[selectedPeriod];
      
      console.log(`🔄 Buscando histórico dos últimos ${days} dias...`);
      
      // Busca histórico de sensores e plantações
      const [historyData, plantationsData] = await Promise.all([
        getSensorHistory(days),
        getPlantations(),
      ]);

      setSensorHistory(historyData);
      setPlantations(plantationsData);

      // Calcular relatórios
      const blockedCount = plantationsData.filter(
        (p: Plantation) => p.irrigationStatus === 'blocked'
      ).length;
      
      const avgMoisture = historyData.length > 0
        ? historyData.reduce((sum: number, item: SensorData) => sum + item.soilMoisture, 0) / historyData.length
        : 0;

      // Cada irrigação bloqueada economiza aproximadamente 150 litros
      const waterSaved = blockedCount * 150;
      const estimatedSaving = waterSaved * 2.5; // R$ 2.50 por 1000 litros economizados

      setReportData({
        totalWaterSaved: waterSaved,
        averageMoisture: avgMoisture,
        totalIrrigationBlocks: blockedCount,
        estimatedSaving: estimatedSaving,
        totalReadings: historyData.length,
      });
    } catch (error) {
      console.error('❌ Erro ao carregar dados históricos:', error);
      Alert.alert('Erro', handleApiError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const getAverageMoistureStatus = (moisture: number) => {
    if (moisture < 30) return { text: 'Crítico - Solo seco', color: '#F44336', icon: '🔥' };
    if (moisture < 50) return { text: 'Atenção - Solo baixo', color: '#FF9800', icon: '⚠️' };
    if (moisture < 70) return { text: 'Ideal', color: '#4CAF50', icon: '✅' };
    return { text: 'Excesso de umidade', color: '#2196F3', icon: '💧' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const PeriodButton = ({ period, label }: { period: 'week' | 'month' | 'year'; label: string }) => (
    <TouchableOpacity
      style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text style={[styles.periodButtonText, selectedPeriod === period && styles.periodButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, unit, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <Text style={styles.statUnit}>{unit}</Text>}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Carregando relatórios...</Text>
      </View>
    );
  }

  const moistureStatus = getAverageMoistureStatus(reportData.averageMoisture);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Histórico e Relatórios</Text>
        <Text style={styles.headerSubtitle}>
          Análise completa do seu sistema de irrigação
        </Text>
      </View>

      <View style={styles.periodContainer}>
        <PeriodButton period="week" label="Semana" />
        <PeriodButton period="month" label="Mês" />
        <PeriodButton period="year" label="Ano" />
      </View>

      {/* Cards de Estatísticas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Economia e Sustentabilidade</Text>
        <StatCard
          icon="💧"
          title="Água Economizada"
          value={reportData.totalWaterSaved}
          unit=" L"
          color="#2196F3"
        />
        <StatCard
          icon="💰"
          title="Economia Estimada"
          value={`R$ ${reportData.estimatedSaving.toFixed(2)}`}
          color="#4CAF50"
        />
        <StatCard
          icon="🚫"
          title="Irrigações Bloqueadas"
          value={reportData.totalIrrigationBlocks}
          unit=" vezes"
          color="#FF9800"
        />
        <StatCard
          icon="📈"
          title="Total de Leituras"
          value={reportData.totalReadings}
          unit=" registros"
          color="#9C27B0"
        />
      </View>

      {/* Saúde do Solo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌱 Saúde do Solo</Text>
        <View style={styles.moistureCard}>
          <View style={styles.moistureHeader}>
            <Text style={styles.moistureTitle}>Umidade Média do Solo</Text>
            <Text style={[styles.moistureValue, { color: moistureStatus.color }]}>
              {reportData.averageMoisture.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.moistureStatusRow}>
            <Text style={styles.moistureStatusIcon}>{moistureStatus.icon}</Text>
            <Text style={[styles.moistureStatus, { color: moistureStatus.color }]}>
              {moistureStatus.text}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(reportData.averageMoisture, 100)}%`,
                  backgroundColor: moistureStatus.color,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Plantações Cadastradas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Plantações Cadastradas</Text>
        {plantations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma plantação cadastrada</Text>
          </View>
        ) : (
          plantations.map((plantation) => (
            <View key={plantation.id} style={styles.plantationReportCard}>
              <View style={styles.plantationHeader}>
                <Text style={styles.plantationName}>{plantation.name}</Text>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        plantation.irrigationStatus === 'active'
                          ? '#4CAF50'
                          : plantation.irrigationStatus === 'blocked'
                          ? '#F44336'
                          : '#9E9E9E',
                    },
                  ]}
                />
              </View>
              <View style={styles.plantationDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🌾 Cultura:</Text>
                  <Text style={styles.detailValue}>{plantation.cropType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>📐 Área:</Text>
                  <Text style={styles.detailValue}>{plantation.area} ha</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>💧 Umidade:</Text>
                  <Text style={styles.detailValue}>{plantation.soilMoisture}%</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🌡️ Temperatura:</Text>
                  <Text style={styles.detailValue}>{plantation.temperature}°C</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🚰 Status Irrigação:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color:
                          plantation.irrigationStatus === 'active'
                            ? '#4CAF50'
                            : plantation.irrigationStatus === 'blocked'
                            ? '#F44336'
                            : '#666',
                      },
                    ]}
                  >
                    {plantation.irrigationStatus === 'active'
                      ? '✅ Ativa'
                      : plantation.irrigationStatus === 'blocked'
                      ? '⛔ Bloqueada (Chuva)'
                      : '⏸️ Inativa'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Histórico de Leituras */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Histórico de Leituras</Text>
        {sensorHistory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma leitura disponível no período</Text>
          </View>
        ) : (
          sensorHistory.slice(0, 10).map((reading, index) => (
            <View key={reading.id || index} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>{formatDate(reading.timestamp)}</Text>
                <View
                  style={[
                    styles.irrigationBadge,
                    {
                      backgroundColor: reading.irrigationRecommended
                        ? '#4CAF50'
                        : '#F44336',
                    },
                  ]}
                >
                  <Text style={styles.irrigationBadgeText}>
                    {reading.irrigationRecommended ? '💧 Irrigar' : '⛔ Bloquear'}
                  </Text>
                </View>
              </View>
              <View style={styles.historyDetails}>
                <View style={styles.historyItem}>
                  <Text style={styles.historyLabel}>💧 Umidade:</Text>
                  <Text style={styles.historyValue}>{reading.soilMoisture}%</Text>
                </View>
                <View style={styles.historyItem}>
                  <Text style={styles.historyLabel}>🌡️ Temp:</Text>
                  <Text style={styles.historyValue}>{reading.temperature}°C</Text>
                </View>
                <View style={styles.historyItem}>
                  <Text style={styles.historyLabel}>💨 Umidade Ar:</Text>
                  <Text style={styles.historyValue}>{reading.humidity}%</Text>
                </View>
                <View style={styles.historyItem}>
                  <Text style={styles.historyLabel}>🌧️ Previsão Chuva:</Text>
                  <Text style={styles.historyValue}>{reading.satelliteRainPrediction}%</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🌾 AgroOrbit Link - Agricultura de Precisão com Dados Orbitais
        </Text>
        <Text style={styles.footerSubtext}>
          Dados integrados com satélites NASA/ESA
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
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 25,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#C8E6C9',
    marginTop: 5,
  },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 8,
    borderRadius: 12,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#2E7D32',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#999',
  },
  moistureCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  moistureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moistureTitle: {
    fontSize: 14,
    color: '#666',
  },
  moistureValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  moistureStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moistureStatusIcon: {
    fontSize: 16,
    marginRight: 6,
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
  plantationReportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },
  plantationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  plantationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  plantationDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  irrigationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  irrigationBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  historyItem: {
    alignItems: 'center',
    minWidth: 70,
    marginVertical: 4,
  },
  historyLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  historyValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    backgroundColor: '#2E7D32',
    marginTop: 20,
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 10,
    color: '#C8E6C9',
    marginTop: 5,
    textAlign: 'center',
  },
});
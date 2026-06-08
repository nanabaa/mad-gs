// src/screens/AlertsScreen.tsx - Versão sem status de lido/não lido
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';

interface AlertData {
  id: number;
  title: string;
  description: string;
  type: 'frost' | 'pest' | 'drought' | 'optimal_planting';
  severity: 'high' | 'medium' | 'low';
  createdAt: string;
  plantationId?: number;
}

// Mock da API (sem o campo 'read')
const alertAPI = {
  getAll: () => {
    return Promise.resolve({
      data: [
        {
          id: 1,
          title: 'Risco de Geada',
          description: 'Temperaturas abaixo de 0°C previstas para as próximas 48h. Proteja suas plantações.',
          type: 'frost' as const,
          severity: 'high' as const,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Melhor Época de Plantio',
          description: 'Condições climáticas ideais para plantio de soja nos próximos 7 dias.',
          type: 'optimal_planting' as const,
          severity: 'low' as const,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 3,
          title: 'Alerta de Pragas',
          description: 'Aumento da umidade pode favorecer o aparecimento de fungos. Monitore suas plantações.',
          type: 'pest' as const,
          severity: 'medium' as const,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ],
    });
  },
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await alertAPI.getAll();
      setAlerts(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os alertas');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getSeverityText = (severity: string): string => {
    switch (severity) {
      case 'high': return 'Alta Prioridade';
      case 'medium': return 'Média Prioridade';
      case 'low': return 'Baixa Prioridade';
      default: return 'Prioridade';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'frost': return '❄️';
      case 'pest': return '🐛';
      case 'drought': return '🔥';
      case 'optimal_planting': return '🌱';
      default: return '⚠️';
    }
  };

  const getTypeText = (type: string): string => {
    switch (type) {
      case 'frost': return 'Risco de Geada';
      case 'pest': return 'Alerta de Praga';
      case 'drought': return 'Risco de Seca';
      case 'optimal_planting': return 'Melhor Época de Plantio';
      default: return 'Alerta Geral';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const showAlertDetails = (alert: AlertData) => {
    Alert.alert(
      alert.title,
      `${alert.description}\n\n📋 Tipo: ${getTypeText(alert.type)}\n⚡ ${getSeverityText(alert.severity)}\n📅 Data: ${formatDate(alert.createdAt)}`,
      [{ text: 'Fechar', style: 'cancel' }]
    );
  };

  const renderItem = ({ item }: { item: AlertData }) => (
    <TouchableOpacity
      style={styles.alertCard}
      onPress={() => showAlertDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertTitleRow}>
          <Text style={styles.alertIcon}>{getTypeIcon(item.type)}</Text>
          <Text style={styles.alertTitle}>{item.title}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{getSeverityText(item.severity)}</Text>
        </View>
      </View>
      
      <Text style={styles.alertDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.alertFooter}>
        <Text style={styles.alertType}>{getTypeText(item.type)}</Text>
        <Text style={styles.alertDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Carregando alertas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2E7D32']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>Nenhum alerta no momento</Text>
            <Text style={styles.emptyMessage}>
              Seu sistema está funcionando normalmente
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
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
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  alertDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  },
  alertType: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  alertDate: {
    fontSize: 11,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
  },
});
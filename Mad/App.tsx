// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Telas
import HomeScreen from './src/screens/HomeScreen';
import LeiturasScreen from './src/screens/LeiturasScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import LeituraFormScreen from './src/screens/LeituraFormScreen';
import HistoryReportsScreen from './src/screens/HistoryReportsScreen';

// Exportando o tipo corretamente
export type RootStackParamList = {
  Home: undefined;
  Leituras: undefined;
  Alerts: undefined;
  LeituraForm: { leituraId?: number };
  HistoryReports: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0a460d',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'AgroOrbit Link' }}
          />
          <Stack.Screen 
            name="Leituras" 
            component={LeiturasScreen} 
            options={{ title: 'Minhas Leituras' }}
          />
          <Stack.Screen 
            name="Alerts" 
            component={AlertsScreen} 
            options={{ title: 'Alertas Preditivos' }}
          />
          <Stack.Screen 
            name="LeituraForm" 
            component={LeituraFormScreen} 
            options={{ title: 'Nova Leitura' }}
          />
          <Stack.Screen 
            name="HistoryReports" 
            component={HistoryReportsScreen} 
            options={{ title: 'Histórico e Relatórios' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
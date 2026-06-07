// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Telas
import HomeScreen from './src/screens/HomePage';
import PlantationsScreen from './src/screens/PlantationsScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import PlantationFormScreen from './src/screens/PlantationFormScreen';
import HistoryReportsScreen from './src/screens/HistoryReportsScreen';

// Exportando o tipo corretamente
export type RootStackParamList = {
  Home: undefined;
  Plantations: undefined;
  Alerts: undefined;
  PlantationForm: { plantationId?: number };
  HistoryReports: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2E7D32',
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
            name="Plantations" 
            component={PlantationsScreen} 
            options={{ title: 'Minhas Plantações' }}
          />
          <Stack.Screen 
            name="Alerts" 
            component={AlertsScreen} 
            options={{ title: 'Alertas Preditivos' }}
          />
          <Stack.Screen 
            name="PlantationForm" 
            component={PlantationFormScreen} 
            options={{ title: 'Cadastrar Plantação' }}
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
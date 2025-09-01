import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import EventsScreen from '../screens/EventsScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import EventStagesScreen from '../screens/EventStagesScreen';
import CompetitionOptionsScreen from '../screens/CompetitionOptionsScreen';
import CompetitionMatchesScreen from '../screens/CompetitionMatchesScreen';
import CompetitionPositionsScreen from '../screens/CompetitionPositionsScreen';
import CompetitionSeriesScreen from '../screens/CompetitionSeriesScreen';
import CompetitionOrdenScreen from '../screens/CompetitionOrdenScreen';
import CompetitionMedalsScreen from '../screens/CompetitionMedalsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
        {user ? (
          // Stack screens para usuarios autenticados
          <>
            <Stack.Screen 
          name="Events" 
          component={EventsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="EventStages" 
          component={EventStagesScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="CompetitionOptions" 
          component={CompetitionOptionsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="CompetitionMatches" 
          component={CompetitionMatchesScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="CompetitionPositions" 
          component={CompetitionPositionsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="CompetitionSeries" 
          component={CompetitionSeriesScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="CompetitionOrden" 
          component={CompetitionOrdenScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="CompetitionMedals" 
          component={CompetitionMedalsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="EventDetails" 
          component={EventDetailsScreen} 
          options={{ headerShown: false }} 
        />
          </>
        ) : (
          // Stack screens para usuarios no autenticados
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ 
              title: 'Iniciar Sesión',
              headerShown: false
            }} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
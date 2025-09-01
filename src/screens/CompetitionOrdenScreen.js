import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { getCompetenciaOrden } from '../services/eventService';

const CompetitionOrdenScreen = ({ route, navigation }) => {
  const { competenciaId, competenciaNombre, eventId } = route.params;
  const [competidores, setCompetidores] = useState([]);
  const [loading, setLoading] = useState(true);

  const renderEventNumber = () => {
    return (
      <View style={styles.eventNumberContainer}>
        <MaterialIcons name="vpn-key" size={16} color="#fff" />
        <Text style={styles.eventNumberText}>{eventId}</Text>
      </View>
    );
  };

  useEffect(() => {
    fetchOrden();
  }, []);

  const fetchOrden = async () => {
    try {
      setLoading(true);
      const response = await getCompetenciaOrden(competenciaId);
      if (response.success && response.data) {
        setCompetidores(response.data);
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error al cargar orden:', error);
      alert('Error al cargar el orden de competidores');
    } finally {
      setLoading(false);
    }
  };

  const renderCompetidor = ({ item, index }) => {
    return (
      <View style={styles.competitorCard}>
        <View style={styles.competitorHeader}>
          <View style={styles.orderNumberContainer}>
            <Text style={styles.orderNumber}>{index + 1}</Text>
          </View>
          <Text style={styles.competitorName}>{item.nombre}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando orden...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{competenciaNombre}</Text>
          {renderEventNumber()}
        </View>
        <Text style={styles.subtitle}>Orden de Competidores</Text>
      </View>

      <View style={styles.contentContainer}>
        <FlatList
          data={competidores}
          renderItem={renderCompetidor}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.competidoresContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  eventNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 5,
    borderRadius: 15,
    marginLeft: 10,
  },
  eventNumberText: {
    marginLeft: 5,
    color: '#fff',
    fontSize: 14,
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
  },
  competidoresContainer: {
    padding: 15,
  },
  competitorCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  competitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderNumberContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  competitorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
});

export default CompetitionOrdenScreen;
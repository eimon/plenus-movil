import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getEvento } from '../services/eventService';

export default function EventDetailsScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventDetails();
  }, []);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const data = await getEvento(eventId);
      setEvent(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los detalles del evento');
      console.error('Error loading event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompetenciaPress = (competencia) => {
    if (!competencia) return;
    console.log('eventId en EventDetailsScreen:', eventId);
    console.log('Tipo competencia:', competencia.tipo);

    const screenMap = {
      'Serie': 'CompetitionSeries',
      'Orden': 'CompetitionOrden',
      'Liga': 'CompetitionOptions',
      'EliminacionDirecta': 'CompetitionMatches',
      'Medallero': 'CompetitionMedals'
    };

    const screen = screenMap[competencia.tipo];
    if (screen) {
      navigation.navigate(screen, {
        competenciaId: competencia.id,
        competenciaNombre: competencia.nombre,
        tipo: competencia.tipo,
        eventId: eventId
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00bcd4" />
        <Text style={styles.loadingText}>Cargando detalles...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar el evento</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del Evento</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.eventTitle}>{event.nombre}</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>ID del Evento:</Text>
            <Text style={styles.value}>{event.id}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Etapas del Evento</Text>
          {event.etapas.map((etapa, index) => (
            <TouchableOpacity
              key={index}
              style={styles.etapaContainer}
              onPress={() => handleCompetenciaPress(etapa.competencia)}
              disabled={!etapa.competencia}
            >
              <View style={styles.etapaHeader}>
                <Text style={styles.etapaNombre}>{etapa.nombre}</Text>
                {etapa.competencia && (
                  <View style={styles.competenciaInfo}>
                    <Text style={styles.competenciaTipo}>{etapa.competencia.tipo}</Text>
                    <Text style={styles.arrowIcon}>→</Text>
                  </View>
                )}
              </View>
              {etapa.competencia && (
                <Text style={styles.competenciaNombre}>{etapa.competencia.nombre}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00bcd4',
  },
  header: {
    backgroundColor: '#00bcd4',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  etapaContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  etapaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  etapaNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  competenciaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  competenciaTipo: {
    fontSize: 14,
    color: '#00bcd4',
    marginRight: 8,
  },
  competenciaNombre: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  arrowIcon: {
    fontSize: 16,
    color: '#00bcd4',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
  },
});
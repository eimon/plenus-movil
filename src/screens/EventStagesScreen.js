import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEventoEtapas } from '../services/eventService';
import ToastService from '../services/toastService';

export default function EventStagesScreen({ route, navigation }) {
  const { eventId, event } = route.params;
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStages = async () => {
    try {
      setLoading(true);
      const data = await getEventoEtapas(eventId);
      // Ordenar las etapas por el campo 'orden'
      const sortedStages = data.sort((a, b) => a.orden - b.orden);
      setStages(sortedStages);
    } catch (error) {
      ToastService.showError('Error', 'No se pudieron cargar las etapas del evento');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStages();
    setRefreshing(false);
  };

  useEffect(() => {
    loadStages();
  }, []);

  const handleViewDetails = () => {
    navigation.navigate('EventDetails', { eventId, event });
  };

  const getStageTypeColor = (tipo) => {
    const colors = {
      'municipal': '#4CAF50',
      'regional': '#2196F3',
      'clasificación': '#FF9800',
      'final': '#F44336',
      'medallero': '#9C27B0',
    };
    return colors[tipo] || '#757575';
  };

  const getStageTypeIcon = (tipo) => {
    const icons = {
      'municipal': '🏘️',
      'regional': '🌍',
      'clasificación': '📊',
      'final': '🏆',
      'medallero': '🥇',
    };
    return icons[tipo] || '📋';
  };

  const handleCompetitionPress = (competition) => {
    if (competition.tipo === 'Liga') {
      navigation.navigate('CompetitionOptions', {
        competenciaId: competition.id,
        competenciaNombre: competition.nombre,
        eventId: eventId,
        competitionType: competition.tipo
      });
    } else if (competition.tipo === 'Serie') {
      navigation.navigate('CompetitionSeries', {
        competenciaId: competition.id,
        competenciaNombre: competition.nombre,
        eventId: eventId
      });
    } else if (competition.tipo === 'Orden') {
      navigation.navigate('CompetitionOrden', {
        competenciaId: competition.id,
        competenciaNombre: competition.nombre,
        eventId: eventId
      });
    } else if (competition.tipo === 'Medallero') {
      navigation.navigate('CompetitionMedals', {
        competenciaId: competition.id,
        competenciaNombre: competition.nombre,
        eventId: eventId
      });
    } else {
      // Tipo no reconocido, mostrar alerta
      ToastService.showInfo('Tipo no soportado', `El tipo de competencia "${competition.tipo}" no está soportado aún.`);
    }
  };

  const renderStageCard = ({ item }) => (
    <View style={styles.stageCard}>
      <View style={styles.stageHeader}>
        <View style={styles.stageTypeContainer}>
          <Text style={styles.stageIcon}>{getStageTypeIcon(item.tipo)}</Text>
          <View style={[styles.stageTypeBadge, { backgroundColor: getStageTypeColor(item.tipo) }]}>
            <Text style={styles.stageTypeText}>{item.tipo.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.stageOrder}>#{item.orden + 1}</Text>
      </View>
      
      <Text style={styles.stageName}>{item.nombre}</Text>
      <Text style={styles.stageDescription}>{item.descripcion}</Text>
      
      {item.competencia && item.competencia.id && (
        <TouchableOpacity 
          style={styles.competitionContainer}
          onPress={() => handleCompetitionPress(item.competencia)}
          activeOpacity={0.7}
        >
          <Text style={styles.competitionLabel}>Competencia:</Text>
          <Text style={styles.competitionName}>{item.competencia.nombre}</Text>
          <Text style={styles.competitionType}>Tipo: {item.competencia.tipo}</Text>
          <Text style={styles.clickHint}>Toca para ver detalles →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Cargando etapas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleViewDetails} style={styles.detailButton}>
          <Text style={styles.detailButtonText}>Ver detalle</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.eventInfo}>
          <Text style={styles.disciplineTitle}>{event.disciplina}</Text>
          <Text style={styles.eventTitle}>
            {`${event.categoria} - ${event.genero} - ${event.modalidad}`}
          </Text>
          <Text style={styles.tournamentTitle}>{event.torneoNombre}</Text>
        </View>
        
        <Text style={styles.sectionTitle}>Etapas del Evento ({stages.length})</Text>
        
        {stages.map((stage, index) => (
          <View key={stage.id}>
            {renderStageCard({ item: stage })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4511e',
  },
  header: {
    backgroundColor: '#f4511e',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  backText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  detailButtonText: {
    color: '#f4511e',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4511e',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  eventInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
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
  disciplineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f4511e',
    marginBottom: 5,
  },
  tournamentTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  eventTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  stageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stageTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  stageTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stageTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stageOrder: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  stageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  stageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  competitionContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f4511e',
  },
  competitionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 2,
  },
  competitionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  competitionType: {
    fontSize: 12,
    color: '#666',
  },
  clickHint: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 5,
  },
});
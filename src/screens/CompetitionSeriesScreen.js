import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { getCompetenciaSeries, guardarMarcaSerie, swapCompetidoresSerie, getEvento } from '../services/eventService';
import CircularProgress from '../components/CircularProgress';
import SerieMarkModal from '../components/SerieMarkModal';

const CompetitionSeriesScreen = ({ route, navigation }) => {
  const { competenciaId, competenciaNombre, eventId } = route.params;
  console.log('eventId recibido:', eventId);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedSeries, setGroupedSeries] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  const [firstSelectedCompetitor, setFirstSelectedCompetitor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSerieTipo, setSelectedSerieTipo] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);

  const renderEventNumber = () => {
    return (
      <View style={styles.eventNumberContainer}>
        <MaterialIcons name="vpn-key" size={16} color="#fff" />
        <Text style={styles.eventNumberText}>{eventId}</Text>
      </View>
    );
  };

  // Función para crear un retardo
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    const loadDataSequentially = async () => {
      try {
        // Cargar series primero
        await fetchSeries();
        
        // Esperar 500ms antes de la siguiente petición
        await delay(500);
        
        // Cargar datos del evento
        await fetchEventData();
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    loadDataSequentially();
  }, []);

  const fetchEventData = async () => {
    try {
      const eventData = await getEvento(eventId);
      setCurrentEvent(eventData);
    } catch (error) {
      console.error('Error al cargar datos del evento:', error);
    }
  };

  // Función para actualizar el porcentaje del evento
  const updateEventPercentage = async () => {
    try {
      const eventData = await getEvento(eventId);
      setCurrentEvent(eventData);
    } catch (error) {
      console.error('Error actualizando porcentaje del evento:', error);
    }
  };

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const response = await getCompetenciaSeries(competenciaId);
      if (response.success && response.data) {
        setSeries(response.data);
        groupSeriesByName(response.data);
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las series');
      console.error('Error al cargar series:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupSeriesByName = (seriesData) => {
    // Agrupar por nombre
    const grouped = seriesData.reduce((acc, serie) => {
      const groupName = serie.nombre;
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(serie);
      return acc;
    }, {});

    // Convertir a array
    const groupedArray = Object.keys(grouped).map(groupName => ({
      groupName,
      series: grouped[groupName].sort((a, b) => a.id - b.id)
    }));

    setGroupedSeries(groupedArray);
  };

  const handleSaveMark = async (mark, observacion) => {
    try {
      const response = await guardarMarcaSerie(selectedCompetitor.id, mark, observacion);
      if (response.success) {
        await fetchSeries();
        await updateEventPercentage(); // Actualizar porcentaje del evento
        setModalVisible(false);
        setSelectedCompetitor(null);
        setSelectedSerieTipo(null);
      } else {
        throw new Error('Error al guardar la marca');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la marca');
      console.error('Error al guardar marca:', error);
    }
  };

  const handleCompetitorPress = (competitor, serieTipo) => {
    setSelectedCompetitor(competitor);
    setSelectedSerieTipo(serieTipo);
    setModalVisible(true);
  };

  const handleCompetitorLongPress = async (competitor) => {
    if (!firstSelectedCompetitor) {
      setFirstSelectedCompetitor(competitor);
    } else if (firstSelectedCompetitor.id !== competitor.id) {
      Alert.alert(
        'Confirmar intercambio',
        `¿Desea intercambiar a ${firstSelectedCompetitor.nombre} con ${competitor.nombre}?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setFirstSelectedCompetitor(null)
          },
          {
            text: 'Aceptar',
            onPress: async () => {
              try {
                const response = await swapCompetidoresSerie(firstSelectedCompetitor.id, competitor.id);
                if (response.success) {
                  await fetchSeries();
                  Alert.alert(
                    'Éxito',
                    `Se intercambió a ${firstSelectedCompetitor.nombre} con ${competitor.nombre} correctamente`
                  );
                } else {
                  throw new Error('Error al intercambiar competidores');
                }
              } catch (error) {
                console.error('Error al intercambiar:', error);
                 Alert.alert(
                   'Error',
                   `No se pudo intercambiar a ${firstSelectedCompetitor.nombre} con ${competitor.nombre}. ${error.message}`
                 );
              } finally {
                setFirstSelectedCompetitor(null);
              }
            }
          }
        ]
      );
    }
  };

  const renderCompetitor = ({ item, serieTipo }) => {
    const isSelected = firstSelectedCompetitor?.id === item.id;
    
    return (
    <View style={[styles.competitorCard, isSelected && styles.selectedCompetitorCard]}>
      <TouchableOpacity 
        style={{flex: 1}}
        onPress={() => firstSelectedCompetitor ? handleCompetitorLongPress(item) : handleCompetitorPress(item, serieTipo)}
        onLongPress={() => handleCompetitorLongPress(item)}
        delayLongPress={350}
      >
        <View style={styles.competitorHeader}>
          <Text style={styles.competitorName}>{item.nombre}</Text>
        </View>
        <View style={styles.competitorDetails}>
          <Text style={styles.competitorMark}>Marca: {item.marca || 'Sin marca'}</Text>
          {item.observacion && (
            <Text style={[styles.competitorObservation, 
              item.observacion === 'NULO' && styles.competitorObservationNulo,
              item.observacion === 'D' && styles.competitorObservationD
            ]}>
              {item.observacion}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

  const renderSerie = ({ item }) => (
  <View style={styles.serieCard}>
    <View style={styles.serieHeader}>
      <Text style={styles.serieName}>{item.nombre}</Text>
      <Text style={styles.serieTipo}>{item.tipo}</Text>
    </View>
    
    <Text style={styles.competitorsTitle}>
      Competidores ({item.competidores?.length || 0})
    </Text>
    
    <FlatList
      data={item.competidores || []}
      renderItem={({ item: competitor }) => {
        return renderCompetitor({
          item: competitor,
          serieTipo: item.tipo
        });
      }}
      keyExtractor={(competitor) => competitor?.id?.toString() || Math.random().toString()}
      scrollEnabled={false}
    />
  </View>
);

  const renderTabButton = (group, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.tabButton,
        activeTab === index && styles.activeTabButton
      ]}
      onPress={() => setActiveTab(index)}
    >
      <Text style={[
        styles.tabButtonText,
        activeTab === index && styles.activeTabButtonText
      ]}>
        {group.groupName}
      </Text>
    </TouchableOpacity>
  );

  const renderActiveGroup = () => {
    if (groupedSeries.length === 0) return null;
    const activeGroup = groupedSeries[activeTab];
    if (!activeGroup) return null;

    return (
      <FlatList
        data={activeGroup.series}
        renderItem={renderSerie}
        keyExtractor={(serie) => serie.id.toString()}
        contentContainerStyle={styles.seriesContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando series...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SerieMarkModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedCompetitor(null);
          setSelectedSerieTipo(null);
        }}
        onSave={handleSaveMark}
        tipo={selectedSerieTipo}
        initialMark={selectedCompetitor?.marca || ''}
        initialObservacion={selectedCompetitor?.observacion || null}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <View style={styles.titleAndEventContainer}>
            <Text style={styles.title}>{competenciaNombre}</Text>
            {renderEventNumber()}
          </View>
          {currentEvent?.porcentaje !== undefined && (
            <CircularProgress 
              percentage={currentEvent.porcentaje}
              size={40}
              width={4}
              tintColor="#4CAF50"
              backgroundColor="rgba(255, 255, 255, 0.3)"
            />
          )}
        </View>
        <Text style={styles.subtitle}>Series</Text>
      </View>
      
      {groupedSeries.length > 1 && (
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContainer}
          >
            {groupedSeries.map((group, index) => renderTabButton(group, index))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.contentContainer}>
        {renderActiveGroup()}
      </View>
    </SafeAreaView>
  );

};


  const styles = StyleSheet.create({
  competitorDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  competitorObservation: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  competitorObservationNulo: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
  },
  competitorObservationD: {
    backgroundColor: '#fff3e0',
    color: '#ef6c00',
  },
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
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
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  titleAndEventContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  progressContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabsScrollContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    minWidth: 80,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
  },
  seriesContainer: {
    padding: 15,
  },
  serieCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
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
  serieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serieName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  serieTipo: {
    fontSize: 13,
    color: '#fff',
    backgroundColor: '#2196f3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '500',
  },
  competitorsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  competitorCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  selectedCompetitorCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  competitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  competitorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  competitorPosition: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  competitorMark: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});


export default CompetitionSeriesScreen;
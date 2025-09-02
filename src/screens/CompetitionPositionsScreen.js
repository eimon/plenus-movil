import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCompetenciaPosiciones, getEvento } from '../services/eventService';
import { MaterialIcons } from '@expo/vector-icons';
import CircularProgress from '../components/CircularProgress';

const CompetitionPositionsScreen = ({ route, navigation }) => {
  const { competenciaId, competenciaNombre, eventId } = route.params;
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState([]);
  const [activeZone, setActiveZone] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);

  // Función para crear un retardo
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    const loadDataSequentially = async () => {
      try {
        // Cargar posiciones primero
        await fetchPositions();
        
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

  useEffect(() => {
    if (positions.length > 0) {
      const uniqueZones = [...new Set(positions.map(pos => pos.nombre))];
      setZones(uniqueZones);
      if (!activeZone && uniqueZones.length > 0) {
        setActiveZone(uniqueZones[0]);
      }
    }
  }, [positions]);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const data = await getCompetenciaPosiciones(competenciaId);
      setPositions(data);
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEventNumber = () => {
    if (!eventId) return null;
    return (
      <View style={styles.eventNumberContainer}>
        <MaterialIcons name="vpn-key" size={16} color="#fff" />
        <Text style={styles.eventNumberText}>{eventId}</Text>
      </View>
    );
  };

  const renderZoneTab = (zone) => (
    <TouchableOpacity
      key={zone}
      style={[
        styles.tabButton,
        activeZone === zone && styles.activeTabButton
      ]}
      onPress={() => setActiveZone(zone)}
    >
      <Text style={[
        styles.tabButtonText,
        activeZone === zone && styles.activeTabButtonText
      ]}>
        {zone}
      </Text>
    </TouchableOpacity>
  );

  const handleTeamPress = async (team) => {
    if (!selectedTeam) {
      setSelectedTeam(team);
    } else if (selectedTeam.id !== team.id) {
      Alert.alert(
        'Confirmar intercambio',
        `¿Desea intercambiar ${selectedTeam.equipo} con ${team.equipo}?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setSelectedTeam(null)
          },
          {
            text: 'Aceptar',
            onPress: async () => {
              try {
                const response = await swapPosiciones(selectedTeam.id, team.id);
                if (response.success) {
                  await fetchPositions();
                  await updateEventPercentage(); // Actualizar porcentaje del evento
                  Alert.alert(
                    'Éxito',
                    `Se intercambió ${selectedTeam.equipo} con ${team.equipo} correctamente`
                  );
                } else {
                  throw new Error('Error al intercambiar posiciones');
                }
              } catch (error) {
                console.error('Error al intercambiar:', error);
                Alert.alert(
                  'Error',
                  `No se pudo intercambiar ${selectedTeam.equipo} con ${team.equipo}. ${error.message}`
                );
              } finally {
                setSelectedTeam(null);
              }
            }
          }
        ]
      );
    } else {
      setSelectedTeam(null);
    }
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.posColumn]}>#</Text>
      <Text style={[styles.tableHeaderText, styles.teamColumn]}>Equipo</Text>
      <Text style={[styles.tableHeaderText, styles.statColumn]}>PTS</Text>
      <Text style={[styles.tableHeaderText, styles.statColumn]}>PJ</Text>
      <Text style={[styles.tableHeaderText, styles.statColumn]}>PG</Text>
      <Text style={[styles.tableHeaderText, styles.statColumn]}>PE</Text>
      <Text style={[styles.tableHeaderText, styles.statColumn]}>PP</Text>
      <Text style={[styles.tableHeaderText, styles.statColumn]}>GF</Text>
      <Text style={[styles.tableHeaderText, styles.statColumn]}>GC</Text>
      <Text style={[styles.tableHeaderText, styles.statColumn]}>DG</Text>
    </View>
  );

  const renderPositionItem = ({ item, index }) => {
    const [pts, pj, pg, pe, pp, gf, gc, dg] = item.detalle;
    const isValidPosition = item.posicion !== 99;
    const isSelected = selectedTeam?.id === item.id;
    
    return (
      <TouchableOpacity
        onPress={() => selectedTeam ? handleTeamPress(item) : null}
        onLongPress={() => !selectedTeam ? handleTeamPress(item) : null}
        delayLongPress={1000}
        style={[
          styles.tableRow,
          !isValidPosition && styles.invalidRow,
          index % 2 === 0 && styles.evenRow,
          isSelected && styles.selectedRow
        ]}
      >
        <Text style={[styles.tableCell, styles.posColumn]}>
          {isValidPosition ? item.posicion + 1 : '-'}
        </Text>
        <Text style={[styles.tableCell, styles.teamColumn]}>{item.equipo}</Text>
        <Text style={[styles.tableCell, styles.statColumn, styles.boldText]}>{pts}</Text>
        <Text style={[styles.tableCell, styles.statColumn]}>{pj}</Text>
        <Text style={[styles.tableCell, styles.statColumn]}>{pg}</Text>
        <Text style={[styles.tableCell, styles.statColumn]}>{pe}</Text>
        <Text style={[styles.tableCell, styles.statColumn]}>{pp}</Text>
        <Text style={[styles.tableCell, styles.statColumn]}>{gf}</Text>
        <Text style={[styles.tableCell, styles.statColumn]}>{gc}</Text>
        <Text style={[styles.tableCell, styles.statColumn, dg > 0 ? styles.positive : dg < 0 ? styles.negative : null]}>
          {dg > 0 ? '+' : ''}{dg}
        </Text>
      </TouchableOpacity>
    );
  };

  const filteredPositions = positions
    .filter(pos => pos.nombre === activeZone)
    .sort((a, b) => {
      if (a.posicion === 99 && b.posicion === 99) return 0;
      if (a.posicion === 99) return 1;
      if (b.posicion === 99) return -1;
      return a.posicion - b.posicion;
    });

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando posiciones...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.subtitle}>Tabla de Posiciones</Text>
      </View>

      {zones.length > 1 && (
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContainer}
          >
            {zones.map(zone => renderZoneTab(zone))}
          </ScrollView>
        </View>
      )}

      <View style={styles.tableContainer}>
        {renderTableHeader()}
        <FlatList
          data={filteredPositions}
          renderItem={renderPositionItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.positionsContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
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
  tableContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: '#f8f9fa',
  },
  invalidRow: {
    opacity: 0.6,
    backgroundColor: '#fff3cd',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  posColumn: {
    width: 40,
    fontWeight: 'bold',
  },
  teamColumn: {
    flex: 1,
    textAlign: 'left',
    paddingLeft: 8,
    fontWeight: '600',
  },
  statColumn: {
    width: 35,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  positionsContainer: {
    paddingBottom: 15,
  },
  positive: {
    color: '#28a745',
  },
  negative: {
    color: '#dc3545',
  },
  selectedRow: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
});

export default CompetitionPositionsScreen;
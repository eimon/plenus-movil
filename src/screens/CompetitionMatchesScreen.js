import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCompetenciaPartidos, resetPartidoResultado, getEvento } from '../services/eventService';
import EditMatchModal from '../components/EditMatchModal';
import { MaterialIcons } from '@expo/vector-icons';
import CircularProgress from '../components/CircularProgress';
import ToastService from '../services/toastService';

const CompetitionMatchesScreen = ({ route, navigation }) => {
  const { competenciaId, competenciaNombre, eventId } = route.params;

  const renderEventNumber = () => {
    if (!eventId) return null;
    return (
      <View style={styles.eventNumberContainer}>
        <MaterialIcons name="vpn-key" size={16} color="#fff" />
        <Text style={styles.eventNumberText}>{eventId}</Text>
      </View>
    );
  };
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedMatches, setGroupedMatches] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [openTooltipId, setOpenTooltipId] = useState(null);

  // Función para crear un retardo
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    const loadDataSequentially = async () => {
      try {
        // Cargar partidos primero
        await fetchMatches();
        
        // Esperar 500ms antes de la siguiente petición
        await delay(50);
        
        // Cargar datos del evento
        await fetchEventData();
      } catch (error) {
        ToastService.showError('Error', 'No se pudieron cargar los datos');
      }
    };

    loadDataSequentially();
  }, []);

  // Cerrar tooltip al cambiar de pestaña
  useEffect(() => {
    setOpenTooltipId(null);
  }, [activeTab]);

  const fetchEventData = async () => {
    try {
      const eventData = await getEvento(eventId);
      setCurrentEvent(eventData);
    } catch (error) {
      ToastService.showError('Error', 'No se pudieron cargar los datos del evento');
    }
  };

  // Función para actualizar el porcentaje del evento
  const updateEventPercentage = async () => {
    try {
      const eventData = await getEvento(eventId);
      setCurrentEvent(eventData);
    } catch (error) {
      ToastService.showError('Error', 'No se pudo actualizar el porcentaje del evento');
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const data = await getCompetenciaPartidos(competenciaId);
      setMatches(data);
      navigation.setOptions({
        title: `${data.nombre} (${data.tipo})`
      });
      groupMatchesByName(data);
    } catch (error) {
      ToastService.showError('Error', 'No se pudieron cargar los partidos');
    } finally {
      setLoading(false);
    }
  };

  const groupMatchesByName = (matchesData) => {
    if (!matchesData || !matchesData.partidos) return;

    // Agrupar por zona
    const grouped = matchesData.partidos.reduce((acc, match) => {
      const groupName = match.zona || 'Sin Zona';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(match);
      return acc;
    }, {});

    // Ordenar cada grupo por ID y convertir a array
    const groupedArray = Object.entries(grouped).map(([groupName, matches]) => ({
      groupName,
      matches: matches.sort((a, b) => a.id - b.id)
    }));

    setGroupedMatches(groupedArray);
  };

  const handleEditMatch = (match) => {
    // El tipo viene en la respuesta del API que está en matches
    setSelectedMatch({
      ...match,
      tipo: matches?.tipo
    });
    setEditModalVisible(true);
  };

  const handleResetMatch = async (match) => {
    Alert.alert(
      'Confirmar Reset',
      `¿Está seguro que desea resetear el resultado del partido ${match.equipoLocal} vs ${match.equipoVisitante}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(match.id);
              const result = await resetPartidoResultado(match.id);
              await fetchMatches();
              await updateEventPercentage(); // Actualizar porcentaje
              ToastService.showSuccess('Éxito', 'Resultado reseteado correctamente');
            } catch (error) {
              ToastService.showError('Error', error.response?.data?.message || 'No se pudo resetear el resultado. Por favor, verifica tu conexión.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleModalUpdate = async () => {
    await fetchMatches();
    
    // Esperar 500ms antes de la siguiente petición
    await delay(50);
    
    await updateEventPercentage(); // Actualizar porcentaje después de editar partido
  };

  const handleCloseModal = () => {
    setEditModalVisible(false);
    setSelectedMatch(null);
  };

  const openMap = (escenario) => {
    try {
      if (!escenario || !escenario.latlng) return;
      const parts = escenario.latlng.split(',');
      if (!parts || parts.length < 2) return;
      const lat = parts[0].trim();
      const lng = parts[1].trim();
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
      Linking.openURL(url);
    } catch (error) {
      ToastService.showError('Error', 'No se pudo abrir el mapa');
    }
  };

  const toggleScenarioTooltip = (matchId) => {
    setOpenTooltipId(prev => (prev === matchId ? null : matchId));
  };

  const renderMatch = ({ item }) => {
    const isLoading = actionLoading === item.id;

    return (
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <View style={styles.matchHeaderSectionLeft}>
            <Text style={styles.matchId}>#{item.partido}</Text>
          </View>
          <View style={styles.matchHeaderSectionCenter}>
            {item.escenario?.nombre && (
              <TouchableOpacity onPress={() => toggleScenarioTooltip(item.id)} activeOpacity={0.7} style={styles.matchScenarioContainer}>
                <MaterialIcons name="location-on" size={14} color="#007AFF" style={styles.matchScenarioIcon} />
                <Text style={styles.matchScenario} numberOfLines={2} ellipsizeMode="tail">
                  {item.escenario.nombre}
                </Text>
              </TouchableOpacity>
            )}
            {openTooltipId === item.id && (
              <View style={styles.tooltipContainer}>
                <Text style={styles.tooltipTitle}>
                  {item.escenario?.nombre}
                </Text>
                <TouchableOpacity onPress={() => openMap(item.escenario)} activeOpacity={0.7}>
                  <Text style={styles.tooltipLink}>Ir al mapa</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.matchHeaderSectionRight}>
            {item.fecha && (
              <Text style={styles.matchDate}>
                {new Date(item.fecha).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short'
                }).replace(' de', '') + ' - ' + 
                new Date(item.fecha).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.teamsContainer}>
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{item.equipoLocal}</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.primaryScore}>
                {item.resultadoLocal !== null ? item.resultadoLocal : '-'}
                {matches.tipo === 'Puntos' && item.resultadoSecundarioLocal !== null && (
                  <Text style={styles.secondaryScore}> ({item.resultadoSecundarioLocal})</Text>
                )}
              </Text>
            </View>
          </View>
          
          {matches.tipo === 'Tantos' && item.tanteador ? (
            <View style={styles.tanteadorContainer}>
              {item.tanteador.split(',').map((set, index) => {
                const [local, visitor] = set.split('/');
                return (
                  <Text key={index} style={styles.tanteadorText}>
                    {local}-{visitor}
                  </Text>
                );
              })}
            </View>
          ) : (
            <Text style={styles.vs}>VS</Text>
          )}
          
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{item.equipoVisitante}</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.primaryScore}>
                {item.resultadoVisitante !== null ? item.resultadoVisitante : '-'}
                {matches.tipo === 'Puntos' && item.resultadoSecundarioVisitante !== null && (
                  <Text style={styles.secondaryScore}> ({item.resultadoSecundarioVisitante})</Text>
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditMatch(item)}
            disabled={isLoading}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton]}
            onPress={() => handleResetMatch(item)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.resetButtonText}>Resetear</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTabButton = (group, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.tabButton,
        activeTab === index && styles.activeTabButton
      ]}
      onPress={() => {
        setActiveTab(index);
        setOpenTooltipId(null);
      }}
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
    if (groupedMatches.length === 0) return null;
    const activeGroup = groupedMatches[activeTab];
    if (!activeGroup) return null;

    return (
      <FlatList
        data={activeGroup.matches}
        renderItem={renderMatch}
        keyExtractor={(match) => match.id.toString()}
        contentContainerStyle={styles.matchesContainer}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => openTooltipId && setOpenTooltipId(null)}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando partidos...</Text>
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
        <Text style={styles.subtitle}>Partidos</Text>
      </View>
      
      {groupedMatches.length > 1 && (
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContainer}
          >
            {groupedMatches.map((group, index) => renderTabButton(group, index))}
          </ScrollView>
        </View>
      )}
      
      <TouchableWithoutFeedback onPress={() => openTooltipId && setOpenTooltipId(null)}>
        <View style={styles.contentContainer}>
          {renderActiveGroup()}
        </View>
      </TouchableWithoutFeedback>
      
      <EditMatchModal
        visible={editModalVisible}
        match={selectedMatch ? { ...selectedMatch, tipo: matches.tipo } : null}
        onClose={handleCloseModal}
        onUpdate={handleModalUpdate}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#007AFF',
    },
  tanteadorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  tanteadorText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
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
  matchesContainer: {
    padding: 15,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  matchHeaderSectionLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  matchHeaderSectionCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    position: 'relative',
  },
  matchHeaderSectionRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  matchId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  matchScenario: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  matchScenarioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  matchScenarioIcon: {
    marginRight: 6,
  },
  tooltipContainer: {
    position: 'absolute',
    top: '100%',
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    maxWidth: '90%',
    zIndex: 10,
  },
  tooltipTitle: {
    fontSize: 12,
    color: '#333',
    marginBottom: 6,
  },
  tooltipLink: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  matchDate: {
    fontSize: 12,
    color: '#666',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  secondaryScore: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  vs: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginHorizontal: 15,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  resetButton: {
    backgroundColor: '#dc3545',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CompetitionMatchesScreen;
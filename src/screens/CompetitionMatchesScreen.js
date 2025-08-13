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
import { getCompetenciaPartidos, resetPartidoResultado } from '../services/eventService';
import EditMatchModal from '../components/EditMatchModal';

const CompetitionMatchesScreen = ({ route, navigation }) => {
  const { competenciaId, competenciaNombre } = route.params;
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedMatches, setGroupedMatches] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

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
      Alert.alert('Error', 'No se pudieron cargar los partidos');
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
    setSelectedMatch(match);
    setEditModalVisible(true);
  };

  const handleResetMatch = async (match) => {
    Alert.alert(
      'Confirmar Reset',
      `¿Está seguro que desea resetear el resultado del partido ${match.local} vs ${match.visitante}?`,
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
              await resetPartidoResultado(match.id);
              await fetchMatches();
              Alert.alert('Éxito', 'Resultado reseteado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo resetear el resultado');
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
  };

  const handleCloseModal = () => {
    setEditModalVisible(false);
    setSelectedMatch(null);
  };

  const renderMatch = ({ item }) => {
    const isLoading = actionLoading === item.id;

    return (
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchId}>#{item.id}</Text>
          {item.fecha && (
            <Text style={styles.matchDate}>{item.fecha}</Text>
          )}
        </View>
        
        <View style={styles.teamsContainer}>
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{item.equipoLocal}</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.primaryScore}>
                {item.resultadoLocal !== null ? item.resultadoLocal : '-'}
              </Text>
              {item.tanteador && (
                <Text style={styles.secondaryScore}>
                  ({item.tanteador})
                </Text>
              )}
            </View>
          </View>
          
          <Text style={styles.vs}>VS</Text>
          
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{item.equipoVisitante}</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.primaryScore}>
                {item.resultadoVisitante !== null ? item.resultadoVisitante : '-'}
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
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando partidos...</Text>
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
        <Text style={styles.title}>{competenciaNombre}</Text>
        <Text style={styles.subtitle}>Partidos</Text>
      </View>
      
      {groupedMatches.length > 0 && (
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
      
      <View style={styles.contentContainer}>
        {renderActiveGroup()}
      </View>
      
      <EditMatchModal
        visible={editModalVisible}
        match={selectedMatch}
        onClose={handleCloseModal}
        onUpdate={handleModalUpdate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
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
  matchId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
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
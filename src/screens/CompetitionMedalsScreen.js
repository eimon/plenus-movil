import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getCompetenciaMedallero, getEquiposDisponibles, editarPlazaMedallero, getEvento } from '../services/eventService';
import CircularProgress from '../components/CircularProgress';

export default function CompetitionMedalsScreen({ route, navigation }) {
  const { competenciaId, competenciaNombre, eventId } = route.params;
  const [medallero, setMedallero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlaza, setSelectedPlaza] = useState(null);
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
        // Cargar medallero primero
        await loadMedallero();
        
        // Esperar 500ms antes de la siguiente petición
        await delay(50);
        
        // Cargar equipos disponibles
        await loadEquiposDisponibles();
        
        // Esperar 500ms antes de la siguiente petición
        await delay(50);
        
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

  const loadEquiposDisponibles = async () => {
    try {
      const data = await getEquiposDisponibles(competenciaId);
      setEquiposDisponibles(data);
    } catch (error) {
      console.error('Error loading equipos:', error);
    }
  };

  const handleMedalPress = (plaza) => {
    setSelectedPlaza(plaza);
    setModalVisible(true);
  };

  const handleEquipoSelect = async (equipo) => {
    try {
      await editarPlazaMedallero(selectedPlaza.id, equipo.id);
      setModalVisible(false);
      
      // Recargar medallero para mostrar cambios
      await loadMedallero();
      
      // Esperar 500ms antes de la siguiente petición
      await delay(50);
      
      // Recargar equipos disponibles
      await loadEquiposDisponibles();
      
      // Esperar 500ms antes de la siguiente petición
      await delay(50);
      
      // Actualizar porcentaje del evento
      await updateEventPercentage();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el medallero');
    }
  };

  const loadMedallero = async () => {
    try {
      setLoading(true);
      const data = await getCompetenciaMedallero(competenciaId);
      setMedallero(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el medallero');
      console.error('Error loading medallero:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00bcd4" />
        <Text style={styles.loadingText}>Cargando medallero...</Text>
      </SafeAreaView>
    );
  }

  if (!medallero || !medallero.success) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar el medallero</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <View style={styles.titleAndEventContainer}>
            <Text style={styles.headerTitle}>Medallero
            {renderEventNumber()}</Text>
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
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.competitionTitle}>{competenciaNombre}</Text>
          
          {medallero.data.sort((a, b) => a.orden - b.orden).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.medalRow}
              onPress={() => handleMedalPress(item)}
            >
              <Image 
                source={{ uri: `http://192.168.160.79:8080/${item.medalla}` }}
                style={styles.medalImage}
              />
              <View style={styles.medalInfo}>
                <Text style={styles.medalName}>{item.nombre}</Text>
                {item.equipo && (
                  <Text style={styles.equipoName}>{item.equipo}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Equipo</Text>
            <FlatList
              data={[{ id: null, municipio: 'Sin equipo', region: '' }, ...equiposDisponibles]}
              keyExtractor={(item) => (item.id ? item.id.toString() : 'empty')}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.equipoItem}
                  onPress={() => handleEquipoSelect(item)}
                >
                  <Text style={styles.equipoItemText}>
                    {item.id === null ? item.municipio : `${item.municipio} (Región ${item.region})`}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}



  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00bcd4',
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
    backgroundColor: '#00bcd4',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleAndEventContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginBottom: 10,
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
  progressContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
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
  competitionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  medalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medalImage: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  medalInfo: {
    flex: 1,
  },
  medalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  equipoName: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00bcd4',
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
    backgroundColor: '#00bcd4',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  equipoItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  equipoItemText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#00bcd4',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
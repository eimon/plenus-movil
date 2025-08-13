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
import { getCompetenciaMedallero, getEquiposDisponibles, editarPlazaMedallero } from '../services/eventService';

export default function CompetitionMedalsScreen({ route, navigation }) {
  const { competenciaId, competenciaNombre } = route.params;
  const [medallero, setMedallero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlaza, setSelectedPlaza] = useState(null);

  useEffect(() => {
    loadMedallero();
    loadEquiposDisponibles();
  }, []);

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
      await loadMedallero(); // Recargar medallero para mostrar cambios
      await loadEquiposDisponibles(); // Recargar equipos disponibles
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Cargando medallero...</Text>
      </View>
    );
  }

  if (!medallero || !medallero.success) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar el medallero</Text>
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
        <Text style={styles.headerTitle}>Medallero</Text>
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
              data={equiposDisponibles}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.equipoItem}
                  onPress={() => handleEquipoSelect(item)}
                >
                  <Text style={styles.equipoItemText}>
                    {item.municipio} (Región {item.region})
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#f4511e',
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
    backgroundColor: '#f4511e',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
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
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Picker} from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { getEventos, getEvento } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import ToastService from '../services/toastService';

export default function EventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [eventId, setEventId] = useState('');
  const [directAccessError, setDirectAccessError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    categoria: '',
    modalidad: '',
    genero: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    categorias: [],
    modalidades: [],
    generos: []
  });


  const { logout } = useAuth();

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getEventos();
      setEvents(data);
    } catch (error) {
      // Si es un 403 del listado de eventos, dejar que el interceptor se encargue (deslogueo)
      if (error.response && error.response.status === 403) {
        return;
      }
      
      // Para otros errores, establecer events como array vacío
      setEvents([]);
      ToastService.showError('Error', 'No se pudieron cargar los eventos');

    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (events && Array.isArray(events) && events.length > 0) {
      const options = events.reduce((acc, torneo) => {
        torneo.eventos.forEach(evento => {
          if (!acc.categorias.includes(evento.categoria)) {
            acc.categorias.push(evento.categoria);
          }
          if (!acc.modalidades.includes(evento.modalidad)) {
            acc.modalidades.push(evento.modalidad);
          }
          if (!acc.generos.includes(evento.genero)) {
            acc.generos.push(evento.genero);
          }
        });
        return acc;
      }, { categorias: [], modalidades: [], generos: [] });

      setFilterOptions({
        categorias: options.categorias.sort(),
        modalidades: options.modalidades.sort(),
        generos: options.generos.sort()
      });
    } else {
      // Si events está vacío o es undefined, limpiar las opciones de filtro
      setFilterOptions({
        categorias: [],
        modalidades: [],
        generos: []
      });
    }
  }, [events]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value === prev[filterType] ? '' : value
    }));
  };

  const filteredEvents = (events && Array.isArray(events)) ? events.map(torneo => ({
    ...torneo,
    eventos: torneo.eventos.filter(evento => {
      const matchCategoria = !filters.categoria || evento.categoria === filters.categoria;
      const matchModalidad = !filters.modalidad || evento.modalidad === filters.modalidad;
      const matchGenero = !filters.genero || evento.genero === filters.genero;
      const matchSearch = !searchText || evento.disciplina.toLowerCase().includes(searchText.toLowerCase());
      return matchCategoria && matchModalidad && matchGenero && matchSearch;
    })
  })).filter(torneo => torneo.eventos.length > 0) : [];

  const handleEventPress = async (event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  const handleDirectAccess = async () => {
    if (!eventId.trim()) {
      setDirectAccessError('Por favor, ingresa un ID de evento');
      return;
    }

    try {
      const event = await getEvento(eventId);
      setModalVisible(false);
      setEventId('');
      setDirectAccessError('');
      navigation.navigate('EventDetails', { eventId: parseInt(eventId) });
    } catch (error) {
      const message = (error?.response?.status === 403)
        ? 'No posee permisos para acceder a este evento'
        : (error?.response?.data?.error || 'No se pudo acceder al evento');
      setDirectAccessError(message);
    }
  };



  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const renderEventCard = ({ item }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.disciplineTitle} numberOfLines={1}>
            {item.disciplina}
          </Text>
          <View style={styles.headerRight}>
            {item.porcentaje !== undefined && (
              <View style={styles.percentageBadge}>
                <Text style={styles.percentageText}>{item.porcentaje}%</Text>
              </View>
            )}
            <View style={styles.iconContainer}>
              <Text style={styles.eventIcon}>🏆</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID:</Text>
            <Text style={styles.detailValue}>{item.id}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Categoría:</Text>
            <Text style={styles.detailValue}>{item.categoria}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Género:</Text>
            <Text style={styles.detailValue}>{item.genero}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Modalidad:</Text>
            <Text style={styles.detailValue}>{item.modalidad}</Text>
          </View>
        </View>


      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00bcd4" />
        <Text style={styles.loadingText}>Cargando eventos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Eventos Deportivos</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de búsqueda con botón de filtros */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre del evento..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#666"
          />
          <TouchableOpacity 
            style={styles.filterIconButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialIcons 
              name="filter-list" 
              size={24} 
              color="#00bcd4" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros desplegables */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Categoría</Text>
            <Picker
              selectedValue={filters.categoria}
              style={styles.picker}
              onValueChange={(value) => handleFilterChange('categoria', value)}
              dropdownIconColor="#666"
              mode="dropdown"
            >
              <Picker.Item label="Todas" value="" />
              {filterOptions.categorias.map((categoria) => (
                <Picker.Item key={categoria} label={categoria} value={categoria} />
              ))}
            </Picker>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Modalidad</Text>
            <Picker
              selectedValue={filters.modalidad}
              style={styles.picker}
              onValueChange={(value) => handleFilterChange('modalidad', value)}
              dropdownIconColor="#666"
              mode="dropdown"
            >
              <Picker.Item label="Todas" value="" />
              {filterOptions.modalidades.map((modalidad) => (
                <Picker.Item key={modalidad} label={modalidad} value={modalidad} />
              ))}
            </Picker>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Género</Text>
            <Picker
              selectedValue={filters.genero}
              style={styles.picker}
              onValueChange={(value) => handleFilterChange('genero', value)}
              dropdownIconColor="#666"
              mode="dropdown"
            >
              <Picker.Item label="Todos" value="" />
              {filterOptions.generos.map((genero) => (
                <Picker.Item key={genero} label={genero} value={genero} />
              ))}
            </Picker>
          </View>
        </View>
      )}

    <View style={styles.listWrapper}>
      <FlatList
        data={filteredEvents}
        renderItem={({ item: torneo }) => (
          <View style={styles.tournamentSection}>
            <Text style={styles.tournamentTitle}>{torneo.torneoNombre}</Text>
            <FlatList
              data={torneo.eventos}
              renderItem={renderEventCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}
        keyExtractor={(item) => item.torneoId.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.floatingButtonIcon}>🔑</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Acceso Directo a Evento</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa el ID del evento"
              value={eventId}
              onChangeText={(text) => {
                setEventId(text);
                if (directAccessError) setDirectAccessError('');
              }}
              keyboardType="numeric"
            />
            {directAccessError ? (
              <Text style={styles.errorText}>{directAccessError}</Text>
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setEventId('');
                  setDirectAccessError('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.accessButton]}
                onPress={handleDirectAccess}
              >
                <Text style={styles.modalButtonText}>Acceder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#00bcd4',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  filterIconButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#00bcd4',
    marginBottom: 10,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#00bcd4',
    marginBottom: 10,
  },
  filterItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  filterLabel: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  picker: {
    backgroundColor: '#fff',
    height: 60,
    marginVertical: 2,
    color: '#333',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00bcd4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingButtonIcon: {
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  accessButton: {
    backgroundColor: '#00bcd4',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    marginBottom: 10,
    textAlign: 'center',
  },

  listWrapper: {
    flex: 1,
  },
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  listContainer: {
    padding: 15,
  },
  tournamentSection: {
    marginBottom: 25,
  },
  tournamentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  cardContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  disciplineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00bcd4',
    flex: 1,
    marginRight: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentageBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 45,
    alignItems: 'center',
  },
  percentageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  iconContainer: {
    backgroundColor: '#fff2e6',
    borderRadius: 20,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00bcd4',
  },
  eventIcon: {
    fontSize: 16,
  },
  eventDetails: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
});
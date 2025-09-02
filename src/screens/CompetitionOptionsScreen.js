import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const CompetitionOptionsScreen = ({ route, navigation }) => {
  const { competenciaId, competenciaNombre, eventId, competitionType } = route.params;

  const navigateToMatches = () => {
    navigation.navigate('CompetitionMatches', {
      competenciaId,
      competenciaNombre,
      eventId,
      competitionType
    });
  };

  const navigateToPositions = () => {
    navigation.navigate('CompetitionPositions', {
      competenciaId,
      competenciaNombre,
      eventId,
      competitionType
    });
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
          <Text style={styles.title}>{competenciaNombre}</Text>
          {renderEventNumber()}
        </View>
        <Text style={styles.subtitle}>Selecciona una opción</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionCard} onPress={navigateToMatches}>
          <View style={styles.optionIcon}>
            <MaterialIcons name="sports-soccer" size={40} color="#007AFF" />
          </View>
          <Text style={styles.optionTitle}>Partidos</Text>
          <Text style={styles.optionDescription}>Ver y gestionar los partidos de la competencia</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={navigateToPositions}>
          <View style={styles.optionIcon}>
            <MaterialIcons name="leaderboard" size={40} color="#28a745" />
          </View>
          <Text style={styles.optionTitle}>Posiciones</Text>
          <Text style={styles.optionDescription}>Ver la tabla de posiciones por zona</Text>
        </TouchableOpacity>
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
  optionsContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionIcon: {
    marginBottom: 15,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CompetitionOptionsScreen;
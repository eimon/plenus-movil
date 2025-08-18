import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import SetScoreInput from './SetScoreInput';
import { updatePartidoResultado } from '../services/eventService';

const EditMatchModal = ({ visible, match, onClose, onUpdate }) => {
  const [resultadoLocal, setResultadoLocal] = useState('');
  const [resultadoVisitante, setResultadoVisitante] = useState('');
  const [resultadoSecundarioLocal, setResultadoSecundarioLocal] = useState('');
  const [resultadoSecundarioVisitante, setResultadoSecundarioVisitante] = useState('');
  const [sets, setSets] = useState([{ local: '', visitor: '' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (match) {
      if (match.tipo === 'Tantos') {
        setResultadoLocal(match.resultadoLocal?.toString() || '');
        setResultadoVisitante(match.resultadoVisitante?.toString() || '');
        setResultadoSecundarioLocal(match.resultadoSecundarioLocal?.toString() || '');
        setResultadoSecundarioVisitante(match.resultadoSecundarioVisitante?.toString() || '');
        
        if (match.tanteador) {
          const setsArray = match.tanteador.split(',').map(set => {
            const [local, visitor] = set.split('/');
            return { local, visitor };
          });
          setSets(setsArray.length > 0 ? setsArray : [{ local: '', visitor: '' }]);
        } else {
          setSets([{ local: '', visitor: '' }]);
        }
      } else {
        setResultadoLocal(match.resultadoLocal?.toString() || '');
        setResultadoVisitante(match.resultadoVisitante?.toString() || '');
        setResultadoSecundarioLocal(match.resultadoSecundarioLocal?.toString() || '');
        setResultadoSecundarioVisitante(match.resultadoSecundarioVisitante?.toString() || '');
        setSets([{ local: '', visitor: '' }]);
      }
    }
  }, [match]);

  const isSecondaryEnabled = () => {
    if (match.tipo === 'puntos' || match.tipo === 'Liga' || match.tipo === 'Tantos') return false;
    const localScore = parseInt(resultadoLocal);
    const visitanteScore = parseInt(resultadoVisitante);
    return !isNaN(localScore) && !isNaN(visitanteScore) && localScore === visitanteScore;
  };

  const handleAddSet = () => {
    setSets([...sets, { local: '', visitor: '' }]);
  };

  const handleRemoveSet = (index) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const handleSetScoreChange = (index, team, value) => {
    const newSets = [...sets];
    newSets[index] = {
      ...newSets[index],
      [team]: value
    };
    setSets(newSets);
  };

  const calculateResults = () => {
    let localWins = 0;
    let visitorWins = 0;
    let totalLocal = 0;
    let totalVisitor = 0;
    let tanteador = [];

    sets.forEach(set => {
      // Ya validamos que los valores existen y son válidos en handleSave
      const localScore = parseInt(set.local);
      const visitorScore = parseInt(set.visitor);
      
      totalLocal += localScore;
      totalVisitor += visitorScore;
      
      if (localScore > visitorScore) localWins++;
      if (visitorScore > localScore) visitorWins++;
      
      tanteador.push(`${localScore}/${visitorScore}`);
    });

    return {
      resultadoLocal: localWins,
      resultadoVisitante: visitorWins,
      resultadoSecundarioLocal: totalLocal,
      resultadoSecundarioVisitante: totalVisitor,
      tanteador: tanteador.join(',')
    };
  };

  const handleSave = async () => {
    if (match.tipo !== 'Tantos' && (!resultadoLocal || !resultadoVisitante)) {
      Alert.alert('Error', 'Los resultados principales son obligatorios');
      return;
    }

    let localScore = 0;
    let visitanteScore = 0;

    if (match.tipo === 'Tantos') {
      // Para tipo Tantos, validamos los sets
      if (sets.length === 0) {
        Alert.alert('Error', 'Debe ingresar al menos un set');
        return;
      }

      for (let i = 0; i < sets.length; i++) {
        if (!sets[i].local || !sets[i].visitor) {
          Alert.alert('Error', `Set ${i + 1}: Debe completar ambos puntajes`);
          return;
        }

        const localSetScore = parseInt(sets[i].local);
        const visitorSetScore = parseInt(sets[i].visitor);
        
        if (isNaN(localSetScore) || isNaN(visitorSetScore)) {
          Alert.alert('Error', `Set ${i + 1}: Los puntajes deben ser números válidos`);
          return;
        }
        
        if (localSetScore < 0 || visitorSetScore < 0) {
          Alert.alert('Error', `Set ${i + 1}: Los puntajes no pueden ser negativos`);
          return;
        }
      }
    } else {
      // Para otros tipos, validamos los resultados principales
      localScore = parseInt(resultadoLocal);
      visitanteScore = parseInt(resultadoVisitante);

      if (isNaN(localScore) || isNaN(visitanteScore)) {
        Alert.alert('Error', 'Los resultados deben ser números válidos');
        return;
      }

      if (localScore < 0 || visitanteScore < 0) {
        Alert.alert('Error', 'Los resultados no pueden ser negativos');
        return;
      }
    }

    // Validar resultados secundarios si están habilitados y no es tipo Tantos
    let secondaryLocal = null;
    let secondaryVisitante = null;

    if (match.tipo !== 'Tantos' && isSecondaryEnabled() && (resultadoSecundarioLocal || resultadoSecundarioVisitante)) {
      if (!resultadoSecundarioLocal || !resultadoSecundarioVisitante) {
        Alert.alert('Error', 'Si ingresa un resultado secundario, debe completar ambos');
        return;
      }

      secondaryLocal = parseInt(resultadoSecundarioLocal);
      secondaryVisitante = parseInt(resultadoSecundarioVisitante);

      if (isNaN(secondaryLocal) || isNaN(secondaryVisitante)) {
        Alert.alert('Error', 'Los resultados secundarios deben ser números válidos');
        return;
      }

      if (secondaryLocal < 0 || secondaryVisitante < 0) {
        Alert.alert('Error', 'Los resultados secundarios no pueden ser negativos');
        return;
      }

      if (secondaryLocal === secondaryVisitante) {
        Alert.alert('Error', 'Los resultados secundarios no pueden ser iguales');
        return;
      }
    }

    try {
      setLoading(true);
      let resultados;
      
      if (match.tipo === 'Tantos') {
        // Calcular resultados para partidos tipo Tantos
        resultados = calculateResults();
      } else {
        resultados = {
          resultadoLocal: localScore,
          resultadoVisitante: visitanteScore,
          resultadoSecundarioLocal: secondaryLocal,
          resultadoSecundarioVisitante: secondaryVisitante,
          tanteador: match.tipo === 'puntos' ? null : `${secondaryLocal}/${secondaryVisitante}`
        };
      }

      await updatePartidoResultado(match.id, resultados);
      onUpdate();
      onClose();
      Alert.alert('Éxito', 'Resultado actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el resultado');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (match) {
      setResultadoLocal(match.resultadoLocal?.toString() || '');
      setResultadoVisitante(match.resultadoVisitante?.toString() || '');
      setResultadoSecundarioLocal(match.resultadoSecundarioLocal?.toString() || '');
      setResultadoSecundarioVisitante(match.resultadoSecundarioVisitante?.toString() || '');
      
      if (match.tipo === 'Tantos' && match.tanteador) {
        const setsArray = match.tanteador.split(',').map(set => {
          const [local, visitor] = set.split('/');
          return { local, visitor };
        });
        setSets(setsArray.length > 0 ? setsArray : [{ local: '', visitor: '' }]);
      } else {
        setSets([{ local: '', visitor: '' }]);
      }
    }
    onClose();
  };

  if (!match) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Editar Resultado</Text>
          <Text style={styles.matchInfo}>
            {match.equipoLocal} vs {match.equipoVisitante}
          </Text>

          {match.tipo === 'Tantos' ? (
            <View style={styles.setsContainer}>
              <View style={styles.teamsHeader}>
                <Text style={styles.teamLabel}>{match.equipoLocal}</Text>
                <Text style={styles.teamLabel}>{match.equipoVisitante}</Text>
              </View>
              
              {sets.map((set, index) => (
                <SetScoreInput
                  key={index}
                  index={index}
                  localScore={set.local}
                  visitorScore={set.visitor}
                  onScoreChange={handleSetScoreChange}
                  onRemoveSet={handleRemoveSet}
                />
              ))}
              
              <TouchableOpacity
                style={styles.addSetButton}
                onPress={handleAddSet}
              >
                <Text style={styles.addSetButtonText}>+ Agregar Set</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.scoresContainer}>
              <View style={styles.teamSection}>
                <Text style={styles.teamLabel}>{match.local}</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={resultadoLocal}
                  onChangeText={setResultadoLocal}
                  placeholder="0"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              <Text style={styles.vs}>VS</Text>

              <View style={styles.teamSection}>
                <Text style={styles.teamLabel}>{match.visitante}</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={resultadoVisitante}
                  onChangeText={setResultadoVisitante}
                  placeholder="0"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>
          )}

          {isSecondaryEnabled() && (
            <View style={styles.secondarySection}>
              <Text style={styles.secondaryTitle}>Resultados Secundarios (Penales)</Text>
              <View style={styles.scoresContainer}>
                <View style={styles.teamSection}>
                  <TextInput
                    style={[styles.scoreInput, styles.secondaryInput]}
                    value={resultadoSecundarioLocal}
                    onChangeText={setResultadoSecundarioLocal}
                    placeholder="0"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>
          )}

          {!isSecondaryEnabled() && !['puntos', 'Liga'].includes(match.tipo) && (
            <Text style={styles.secondaryDisabledText}>
              Los resultados secundarios se habilitan cuando los principales son iguales
            </Text>
          )}

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  setsContainer: {
    marginBottom: 20,
  },
  teamsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  addSetButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addSetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  matchInfo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  scoresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  scoreInput: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 80,
    backgroundColor: '#f8f9fa',
  },
  vs: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginHorizontal: 15,
  },
  secondarySection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  secondaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  secondaryInput: {
    borderColor: '#28a745',
    fontSize: 18,
    minWidth: 60,
  },
  secondaryDisabledText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditMatchModal;
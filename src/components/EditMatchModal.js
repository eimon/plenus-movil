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
} from 'react-native';
import { updatePartidoResultado } from '../services/eventService';

const EditMatchModal = ({ visible, match, onClose, onUpdate }) => {
  const [resultadoLocal, setResultadoLocal] = useState('');
  const [resultadoVisitante, setResultadoVisitante] = useState('');
  const [resultadoSecundarioLocal, setResultadoSecundarioLocal] = useState('');
  const [resultadoSecundarioVisitante, setResultadoSecundarioVisitante] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (match) {
      setResultadoLocal(match.resultadoLocal?.toString() || '');
      setResultadoVisitante(match.resultadoVisitante?.toString() || '');
      setResultadoSecundarioLocal(match.tanteador?.toString() || '');
    }
  }, [match]);

  const isSecondaryEnabled = () => {
    if (match.tipo === 'puntos' || match.tipo === 'Liga') return false;
    const localScore = parseInt(resultadoLocal);
    const visitanteScore = parseInt(resultadoVisitante);
    return !isNaN(localScore) && !isNaN(visitanteScore) && localScore === visitanteScore;
  };

  const handleSave = async () => {
    if (!resultadoLocal || !resultadoVisitante) {
      Alert.alert('Error', 'Los resultados principales son obligatorios');
      return;
    }

    const localScore = parseInt(resultadoLocal);
    const visitanteScore = parseInt(resultadoVisitante);

    if (isNaN(localScore) || isNaN(visitanteScore)) {
      Alert.alert('Error', 'Los resultados deben ser números válidos');
      return;
    }

    if (localScore < 0 || visitanteScore < 0) {
      Alert.alert('Error', 'Los resultados no pueden ser negativos');
      return;
    }

    // Validar resultados secundarios si están habilitados
    let secondaryLocal = null;
    let secondaryVisitante = null;

    if (isSecondaryEnabled() && (resultadoSecundarioLocal || resultadoSecundarioVisitante)) {
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
      const resultados = {
        resultadoLocal: localScore,
        resultadoVisitante: visitanteScore,
        tanteador: match.tipo === 'puntos' ? null : secondaryLocal
      };

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
      setResultadoLocal(match.resultado_local?.toString() || '');
      setResultadoVisitante(match.resultado_visitante?.toString() || '');
      setResultadoSecundarioLocal(match.resultado_secundario_local?.toString() || '');
      setResultadoSecundarioVisitante(match.resultado_secundario_visitante?.toString() || '');
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
          <Text style={styles.title}>Editar Resultado</Text>
          <Text style={styles.matchInfo}>
            {match.local} vs {match.visitante}
          </Text>

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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
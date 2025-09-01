import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const SerieMarkModal = ({ visible, onClose, onSave, tipo, initialMark = '', initialObservacion = null }) => {
  const [mark, setMark] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [observacion, setObservacion] = useState(null);

  const observacionOptions = [
    { label: 'Sin observación', value: null },
    { label: 'D', value: 'D' },
    { label: 'DQ', value: 'DQ' },
    { label: 'DNS', value: 'DNS' },
    { label: 'DNF', value: 'DNF' },
    { label: 'NULO', value: 'NULO' },
    { label: 'No presentación', value: 'No presentacion' },
    { label: 'No completó equipo', value: 'No completo equipo' },
  ];

  useEffect(() => {
    if (visible) {
      setMark(initialMark);
      setObservacion(initialObservacion);
      setIsValid(initialMark ? true : false);
    } else {
      setMark('');
      setIsValid(false);
      setObservacion(null);
    }
  }, [visible, initialMark, initialObservacion]);

  const validateTimeMark = (value) => {
    const timeRegex = /^[0-5][0-9]:[0-5][0-9]:[0-9][0-9]$/;
    return timeRegex.test(value);
  };

  const validatePointsMark = (value) => {
    const pointsRegex = /^\d{1,5}[.,]?\d{0,3}$/;
    return pointsRegex.test(value);
  };

  const formatTimeMark = (value) => {
    value = value.replace(/\D/g, '');
    if (value.length > 6) value = value.slice(0, 6);
    
    const parts = [];
    for (let i = 0; i < value.length; i += 2) {
      parts.push(value.slice(i, i + 2));
    }
    
    return parts.join(':');
  };

  const formatPointsMark = (value) => {
    // Reemplazar coma por punto y eliminar caracteres no numéricos excepto el punto
    value = value.replace(',', '.').replace(/[^\d.]/g, '');
    
    // Separar parte entera y decimal
    let [intPart, decPart = ''] = value.split('.');
    
    // Limitar la parte entera a 5 dígitos
    intPart = intPart.slice(0, 5);
    // Limitar la parte decimal a 3 dígitos
    decPart = decPart.slice(0, 3);
    
    // Formatear la parte entera con ceros a la izquierda
    intPart = intPart.padStart(5, '0');
    // Formatear la parte decimal con ceros a la derecha
    decPart = decPart.padEnd(3, '0');
    
    return `${intPart}.${decPart}`;
  };

  const handleMarkChange = (value) => {
    if (tipo === 'Tiempo') {
      const formattedValue = formatTimeMark(value);
      setIsValid(validateTimeMark(formattedValue));
      setMark(formattedValue);
    } else if (tipo === 'Puntos') {
      setMark(value);
      setIsValid(true);
    }
  };

  const handleSave = () => {
    if (tipo === 'Puntos' && !observacion) {
      try {
        const formattedValue = formatPointsMark(mark);
        if (!validatePointsMark(formattedValue)) {
          Alert.alert(
            'Error',
            'El formato debe ser PPPPP.DDD (puntos.decimales)'
          );
          return;
        }
        onSave(formattedValue, observacion);
      } catch (error) {
        Alert.alert(
          'Error',
          'El formato debe ser PPPPP.DDD (puntos.decimales)'
        );
        return;
      }
    } else if (tipo === 'Tiempo' && !isValid && !observacion) {
      Alert.alert(
        'Error',
        'El formato debe ser MM:SS:CC (minutos:segundos:centésimas)'
      );
      return;
    } else {
      onSave(mark, observacion);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>
            Ingresar Marca ({tipo === 'Tiempo' ? 'MM:SS:CC' : 'PPPPP.DDD'})
          </Text>
          
          <TextInput
            style={styles.input}
            value={mark}
            onChangeText={handleMarkChange}
            placeholder={tipo === 'Tiempo' ? '00:00:00' : '00000.000'}
            keyboardType="numeric"
            maxLength={tipo === 'Tiempo' ? 8 : 9}
            editable={!observacion}
            selectTextOnFocus={true}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Observación:</Text>
            <Picker
              selectedValue={observacion}
              onValueChange={(value) => {
                setObservacion(value);
                if (value) {
                  const defaultMark = tipo === 'Tiempo' ? '00:00:00' : '00000.000';
                  setMark(defaultMark);
                  setIsValid(true);
                } else {
                  setMark('');
                  setIsValid(false);
                }
              }}
              style={styles.picker}
              dropdownIconColor="#666"
              mode="dropdown"
            >
              {observacionOptions.map((option) => (
                <Picker.Item 
                  key={option.value || 'null'} 
                  label={option.label} 
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.saveButton, !isValid && styles.disabledButton]}
              onPress={handleSave}
              disabled={!isValid}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  picker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    color: '#fff',
  },
});

export default SerieMarkModal;
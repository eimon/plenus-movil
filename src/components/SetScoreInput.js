import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const SetScoreInput = ({ index, localScore, visitorScore, onScoreChange, onRemoveSet }) => {
  return (
    <View style={styles.setContainer}>
      <View style={styles.setHeader}>
        <Text style={styles.setTitle}>Set {index + 1}</Text>
        {index > 0 && (
          <TouchableOpacity onPress={() => onRemoveSet(index)} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>X</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.scoresContainer}>
        <View style={styles.teamSection}>
          <TextInput
            style={styles.scoreInput}
            value={localScore}
            onChangeText={(value) => onScoreChange(index, 'local', value)}
            // placeholder="0"
            keyboardType="numeric"
            maxLength={3}
          />
        </View>
        <Text style={styles.separator}>/</Text>
        <View style={styles.teamSection}>
          <TextInput
            style={styles.scoreInput}
            value={visitorScore}
            onChangeText={(value) => onScoreChange(index, 'visitor', value)}
            // placeholder="0"
            keyboardType="numeric"
            maxLength={3}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  setContainer: {
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  setTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    padding: 5,
  },
  removeButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    width: 60,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  separator: {
    fontSize: 20,
    marginHorizontal: 10,
    color: '#666',
  },
});

export default SetScoreInput;
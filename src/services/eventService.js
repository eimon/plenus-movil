import api from '../api/axios';

export const getEventos = async () => {
  try {
    const response = await api.get('/api/eventos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    throw error;
  }
};

export const getEventoEtapas = async (eventId) => {
  try {
    const response = await api.get(`/api/eventos/${eventId}/etapas`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener etapas del evento:', error);
    throw error;
  }
};

export const getCompetenciaPartidos = async (competenciaId) => {
  try {
    const response = await api.get(`/api/competencia/${competenciaId}/partidos`);
    return response.data;
  } catch (error) {
    console.error('Error fetching competition matches:', error);
    throw error;
  }
};

export const getCompetenciaSeries = async (competenciaId) => {
  try {
    const response = await api.get(`/api/competencia/${competenciaId}/series`);
    return response.data;
  } catch (error) {
    console.error('Error fetching competition series:', error);
    throw error;
  }
};

export const updatePartidoResultado = async (partidoId, resultados) => {
  try {
    const response = await api.put(`/api/partido/${partidoId}/resultado`, resultados);
    return response.data;
  } catch (error) {
    console.error('Error updating match result:', error);
    throw error;
  }
};

export const resetPartidoResultado = async (partidoId) => {
  try {
    const response = await api.put(`/api/partido/${partidoId}/resultado/reset`);
    return response.data;
  } catch (error) {
    console.error('Error resetting match result:', error);
    throw error;
  }
};

export const getEvento = async (eventId) => {
  try {
    const response = await api.get(`/api/evento/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener evento:', error);
    throw error;
  }
};

export const getCompetenciaMedallero = async (competenciaId) => {
  try {
    const response = await api.get(`/api/competencia/${competenciaId}/medallero`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener medallero:', error);
    throw error;
  }
};

export const getEquiposDisponibles = async (competenciaId) => {
  try {
    const response = await api.get(`/api/competencia/${competenciaId}/equipos-disponibles`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener equipos disponibles:', error);
    throw error;
  }
};

export const editarPlazaMedallero = async (plazaId, equipo) => {
  try {
    const response = await api.put(`/api/plaza-medallero/${plazaId}/editar`, { equipo });
    return response.data;
  } catch (error) {
    console.error('Error al editar plaza de medallero:', error);
    throw error;
  }
};
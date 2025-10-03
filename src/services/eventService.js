import api from '../api/axios';

export const getEventos = async () => {
  try {
    const response = await api.get('/api/eventos');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getEventoEtapas = async (eventoId) => {
  try {
    const response = await api.get(`/api/evento/${eventoId}/etapas`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getEvento = async (eventoId) => {
  try {
    const response = await api.get(`/api/evento/${eventoId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCompetenciaPartidos = async (competenciaId) => {
  try {
    const response = await api.get(`/api/competencia/${competenciaId}/partidos`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCompetenciaSeries = async (competenciaId) => {
  try {
    const response = await api.get(`/api/competencia/${competenciaId}/series`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCompetenciaOrden = async (competenciaId) => {
  try {
    const response = await api.get(`/api/competencia/${competenciaId}/orden`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCompetenciaPosiciones = async (competenciaId) => {
  try {
    const response = await api.get(`/api/competencia/${competenciaId}/posiciones`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePartidoResultado = async (partidoId, resultado) => {
  try {
    const response = await api.put(`/api/partido/${partidoId}/resultado`, resultado);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPartidoResultado = async (partidoId) => {
  try {
    const response = await api.put(`/api/partido/${partidoId}/resultado/reset`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCompetenciaMedallero = async (competenciaId) => {
  try {
    const response = await api.get(`/api/competencia/${competenciaId}/medallero`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getEquiposDisponibles = async (competenciaId) => {
  try {
    const response = await api.get(`/api/competencia/${competenciaId}/equipos-disponibles`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const editarPlazaMedallero = async (plazaId, equipo) => {
  try {
    const response = await api.put(`/api/plaza-medallero/${plazaId}/editar`, { equipo });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const guardarMarcaSerie = async (competidorId, marca, observacion = null) => {
  try {
    const response = await api.put(`/api/plaza-serie/${competidorId}/marca`, {
      marca,
      observacion,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const obtenerMarcaSerie = async (competidorId) => {
  try {
    const response = await api.get(`/api/plaza-serie/${competidorId}/marca`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const swapCompetidoresSerie = async (competidor1Id, competidor2Id) => {
  try {
    const response = await api.put(`/api/plaza-serie/${competidor1Id}/swap/${competidor2Id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const swapPosiciones = async (id1, id2) => {
  try {
    const response = await api.put(`/api/plaza-zona/${id1}/swap/${id2}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// export { swapCompetidoresSerie };

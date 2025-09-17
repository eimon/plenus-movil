import Toast from 'react-native-toast-message';

/**
 * Servicio centralizado para manejar notificaciones toast
 * Reemplaza las alertas nativas de React Native con toasts más elegantes
 */
class ToastService {
  /**
   * Muestra un toast de éxito
   * @param {string} title - Título del toast
   * @param {string} message - Mensaje del toast (opcional)
   */
  static showSuccess(title, message = '') {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
    });
  }

  /**
   * Muestra un toast de error
   * @param {string} title - Título del toast
   * @param {string} message - Mensaje del toast (opcional)
   */
  static showError(title, message = '') {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
    });
  }

  /**
   * Muestra un toast informativo
   * @param {string} title - Título del toast
   * @param {string} message - Mensaje del toast (opcional)
   */
  static showInfo(title, message = '') {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
    });
  }

  /**
   * Muestra un toast de advertencia
   * @param {string} title - Título del toast
   * @param {string} message - Mensaje del toast (opcional)
   */
  static showWarning(title, message = '') {
    Toast.show({
      type: 'error', // react-native-toast-message no tiene tipo 'warning' por defecto
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3500,
      autoHide: true,
      topOffset: 60,
    });
  }

  /**
   * Oculta todos los toasts activos
   */
  static hide() {
    Toast.hide();
  }
}

export default ToastService;
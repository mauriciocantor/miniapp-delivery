// SDK que usa cualquier mini-app para hablar con el host Flutter
declare global {
  interface Window {
    flutter_inappwebview: any;
    SuperApp: typeof SuperAppSDK;
  }
}

const SuperAppSDK = {
  call: function (action: string, payload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        window.flutter_inappwebview
          .callHandler('SuperAppBridge', { action, payload })
          .then(resolve)
          .catch(reject);
      } catch (e) {
        // Si no está en el WebView, devuelve datos de prueba
        resolve(mockResponses[action] || { error: 'Unknown action' });
      }
    });
  },

  auth: {
    getUser: () => SuperAppSDK.call('auth.getUser'),
  },

  ui: {
    showToast: (message: string) =>
      SuperAppSDK.call('ui.showToast', { message }),
    showAlert: (title: string, message: string) =>
      SuperAppSDK.call('ui.showAlert', { title, message }),
  },

  storage: {
    get: (key: string) =>
      SuperAppSDK.call('storage.get', { key }),
    set: (key: string, value: string) =>
      SuperAppSDK.call('storage.set', { key, value }),
  },
};

// Datos mock para desarrollo en navegador
const mockResponses: Record<string, any> = {
  'auth.getUser': {
    id: 'usr_001',
    name: 'Mauricio Cantor',
    email: 'mauricio@superapp.com',
    avatar_url: 'https://i.pravatar.cc/150?img=8',
    role: 'admin',
  },
};

export default SuperAppSDK;
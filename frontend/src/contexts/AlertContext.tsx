import React, { createContext, useContext, useState } from 'react';
import Alert from '../components/Alert/Alert';

interface AlertContextType {
  showAlert: (message: string, type: 'success' | 'error') => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' }>>([]);

  const showAlert = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type }]);
  };

  const removeAlert = (id: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          message={alert.message}
          type={alert.type}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};
import { useEffect, useState } from 'react';
import styles from './Alert.module.css';

interface AlertProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Alert({ message, type, onClose }: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 1000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.alert} ${styles[type]} ${!isVisible ? styles.fadeOut : ''}`}>
      <span>{message}</span>
      <button onClick={() => setIsVisible(false)} className={styles.closeBtn}>×</button>
    </div>
  );
}

export default Alert;
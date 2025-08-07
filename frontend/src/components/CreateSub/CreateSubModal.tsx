// CreateSubModal.tsx
import styles from "./CreateSubModal.module.css";
import React, { useState } from "react";
import { fetchApi } from "../../utils/fetchApi";

interface CreateSubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateSubModal({ isOpen, onClose }: CreateSubModalProps) {
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    thumbnailUrl: '/images/cat.jpg',
  });

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    
    setCreating(true);
    try {
      const res = await fetchApi('createSub', {}, formData);
      if (res.success) {
        onClose();
        setFormData({ name: '', description: '', thumbnailUrl: '/images/cat.jpg' });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.SubCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.profileSection}>
          <div className={styles.profilePicWrapper}>
            <img
              src={formData.thumbnailUrl}
              alt="Sub thumbnail"
              className={styles.profilePic}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setFormData(prev => ({ ...prev, thumbnailUrl: e.target?.result as string }));
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className={styles.fileInput}
              id="subPicInput"
            />
            <label htmlFor="subPicInput" className={styles.overlay}>
              <span className={styles.plusIcon}>＋</span>
            </label>
          </div>
          <div className={styles.profileInfo}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter sub name"
            />
          </div>
        </div>

        <div className={styles.detailsSection}>
          
          
          <div className={styles.info}>
            <span className={styles.label}>Description:</span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.input}
              rows={3}
              placeholder="Enter description"
            />
          </div>
        </div>

        <div className={styles.actionsSection}>
          <button className={styles.primaryButton} onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create Sub'}
          </button>
          <button className={styles.secondaryButton} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default CreateSubModal;

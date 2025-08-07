// AccountModal.tsx
import styles from "./AccountModal.module.css";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useActorInfo } from "../../hooks/UseActorInfo";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  actorName?: string;
}

function AccountModal({ isOpen, onClose, actorName }: AccountModalProps) {
  const { actor, loading, updating, updateActor } = useActorInfo(actorName);
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState({
    description: '',
    thumbnailUrl: '/images/cat.jpg',
  });

  // Update tempData when actor loads
  useEffect(() => {
    if (actor) {
      setTempData({
        description: actor.description || '',
        thumbnailUrl: actor.thumbnailUrl,
      });
    }
  }, [actor]);

  if (!isOpen) return null;

  function handleLogout() {
    navigate("/login");
    onClose();
  }

  const handleEditProfile = () => setEditMode(true);
  const handleCancel = () => {
    if (actor) {
      setTempData({
        description: actor.description || '',
        thumbnailUrl: actor.thumbnailUrl || '/images/cat.jpg',
      });
    }
    setEditMode(false);
  };

  const handleSave = async () => {
    const success = await updateActor({
      description: tempData.description,
      thumbnailUrl: tempData.thumbnailUrl
    });
    if (success) {
      setEditMode(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.accountCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className={styles.profileSection}>
        <div className={styles.profilePicWrapper}>
          <img
            src={tempData.thumbnailUrl}
            alt="Profile"
            className={styles.profilePic}
          />
          {editMode && (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setTempData(prev => ({ ...prev, thumbnailUrl: e.target?.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className={styles.fileInput}
                id="profilePicInput"
              />
              <label htmlFor="profilePicInput" className={styles.overlay}>
                <span className={styles.plusIcon}>＋</span>
              </label>
            </>
          )}
        </div>
        <div className={styles.profileInfo}>
          <h2 className={styles.accountTitle}>{actor?.name || 'User'}</h2>
          <p className={styles.userRole}>{actor?.type || 'User'}</p>
        </div>
      </div>

            <div className={styles.detailsSection}>
              <div className={styles.info}>
                <span className={styles.label}>Description:</span>
                {editMode ? (
                  <textarea
                    name="description"
                    value={tempData.description}
                    onChange={handleChange}
                    className={styles.input}
                    rows={3}
                  />
                ) : (
                  <span className={styles.value}>{actor?.description || 'No description'}</span>
                )}
              </div>
            </div>

            <div className={styles.actionsSection}>
              {editMode ? (
                <>
                  <button className={styles.primaryButton} onClick={handleSave} disabled={updating}>
                    {updating ? 'Saving...' : 'Save'}
                  </button>
                  <button className={styles.secondaryButton} onClick={handleCancel}>Cancel</button>
                </>
              ) : (
                <>
                  <button className={styles.primaryButton} onClick={handleEditProfile}>Edit Profile</button>
                  <button className={styles.secondaryButton} onClick={handleLogout}>Logout</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AccountModal;

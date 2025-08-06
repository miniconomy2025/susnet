// AccountModal.tsx
import styles from "./AccountModal.module.css";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState({
    name: "Jane Doe",
    role: "Admin",
    username: "janedoe99",
    email: "jane.doe@example.com",
    memberSince: "February 2022",
    status: "Active",
    profilePic: "/images/cat.jpg",
  });
  const [tempData, setTempData] = useState(userData);

  if (!isOpen) return null;

  function handleLogout() {
    navigate("/login");
    onClose();
  }

  const handleEditProfile = () => setEditMode(true);
  const handleCancel = () => {
    setTempData(userData);
    setEditMode(false);
  };

  const handleSave = () => {
    console.log("Saving profile data:", { username: tempData.username, profilePic: tempData.profilePic });
    setEditMode(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTempData((prev) => ({ ...prev, profilePic: url }));
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.accountCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.profileSection}>
          <div className={styles.profilePicWrapper}>
            <img
              src={editMode ? tempData.profilePic : userData.profilePic}
              alt="Profile"
              className={styles.profilePic}
            />
            {editMode && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
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
            <h2 className={styles.accountTitle}>{userData.name}</h2>
            <p className={styles.userRole}>{userData.role}</p>
          </div>
        </div>

        <div className={styles.detailsSection}>
          <h3 className={styles.sectionTitle}>Account Details</h3>
          <div className={styles.infoRow}>
            <span className={styles.label}>Username:</span>
            {editMode ? (
              <input
                type="text"
                name="username"
                value={tempData.username}
                onChange={handleChange}
                className={styles.input}
              />
            ) : (
              <span className={styles.value}>{userData.username}</span>
            )}
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Email:</span>
            <span className={styles.value}>{userData.email}</span>
          </div>
        </div>

        <div className={styles.actionsSection}>
          {editMode ? (
            <>
              <button className={styles.primaryButton} onClick={handleSave}>Save</button>
              <button className={styles.secondaryButton} onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <>
              <button className={styles.primaryButton} onClick={handleEditProfile}>Edit Profile</button>
              <button className={styles.secondaryButton} onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountModal;

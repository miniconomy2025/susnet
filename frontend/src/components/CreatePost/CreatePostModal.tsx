import { useEffect, useState } from 'react';
import styles from './CreatePostModal.module.css';
import { createBase64 } from "../../utils/createBase64.ts";
import { useAlert } from '../../contexts/AlertContext';

function CreatePostModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [textBody, setTextBody] = useState('');
  const [attachments, setAttachments] = useState([]);

const handleImageUpload = async (event) => {
  const files = Array.from(event.target.files);
  const urls = await Promise.all(files.map((file) => createBase64(file)));
  setAttachments((prev) => [...prev, ...urls]);
};

  const { showAlert } = useAlert();

  const handleSubmit = async () => {
    try {
      await onSubmit?.({ title, textBody, attachments });
      showAlert('Post created successfully!', 'success');
      onClose();
    } catch (error) {
      showAlert('An error occurred while creating post', 'error');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setTextBody('');
      setAttachments([]);
    }
  }, [isOpen]);

  return (
    isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContainer}>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>

            <h2 className={styles.modalTitle}>Create a Post</h2>

            <input
              type="text"
              maxLength={50}
              placeholder="Title"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className={styles.charCounter}>
              {title.length}/50
            </div>

            <textarea
              placeholder="Text Body"
              className={styles.textarea}
              maxLength={500}
              value={textBody}
              onChange={(e) => setTextBody(e.target.value)}
            />
            <div className={styles.charCounter}>
              {textBody.length}/500
            </div>

            <label htmlFor="image-upload" className={styles.uploadButton}>
              + Add Images
            </label>
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className={styles.fileInput}
            />

            <div className={styles.previewGrid}>
              {attachments.map((url, idx) => (
                <div key={idx} className={styles.previewWrapper}>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() =>
                      setAttachments((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    ×
                  </button>
                  <img
                    src={url}
                    alt={`upload-${idx}`}
                    className={styles.previewImage}
                  />
                </div>
              ))}
            </div>

            <button className={styles.submitButton} onClick={handleSubmit}>
              Post
            </button>
          </div>
        </div>
      )
  );
}

export default CreatePostModal;

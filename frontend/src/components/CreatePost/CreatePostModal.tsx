import { useEffect, useState } from 'react';
import styles from './CreatePostModal.module.css';

function CreatePostModal({ buttonLabel = "Create Post", onSubmit }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [textBody, setTextBody] = useState('');
  const [attachments, setAttachments] = useState([]);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setAttachments((prev) => [...prev, ...urls]);
  };

  const handleSubmit = () => {
    onSubmit?.({ title, textBody, attachments });
    handleClose(); // Closes modal after submission
  };

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setTextBody('');
      setAttachments([]);
    }
  }, [isOpen]);

  return (
    <>
      <button onClick={handleOpen} className={styles.launchButton}>
        {buttonLabel}
      </button>

      {isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContainer}>
            <button className={styles.closeButton} onClick={handleClose}>
              ×
            </button>

            <h2 className={styles.modalTitle}>Create a Post</h2>

            <input
              type="text"
              placeholder="Title"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Text Body"
              className={styles.textarea}
              value={textBody}
              onChange={(e) => setTextBody(e.target.value)}
            />

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
      )}
    </>
  );
}

export default CreatePostModal;

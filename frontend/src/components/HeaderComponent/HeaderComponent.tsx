import React, { useState } from 'react'
import styles from './HeaderComponent.module.css'
import CreateSubModal from '../CreateSub/CreateSubModal';

function HeaderComponent({ menuOpen, setMenuOpen }) {
  

  return (
    <header className={styles.headerContainer}>
      <div className={styles.logo}>SusNet</div>
      <button
        className={styles.hamburgerButton}
        onClick={() => setMenuOpen(prev => !prev)}
        aria-label="Toggle menu"
      >
        ☰
      </button>
    </header>
  )
}

export default HeaderComponent
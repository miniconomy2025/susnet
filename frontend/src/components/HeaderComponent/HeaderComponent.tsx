import React from 'react'
import styles from './HeaderComponent.module.css'
import SearchBar from '../SearchBar/SearchBar'

function HeaderComponent({ menuOpen, setMenuOpen, showSearch }: { menuOpen: boolean; setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>; showSearch: boolean }) {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.logo}>SusNet</div>
      {showSearch && <SearchBar />}
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

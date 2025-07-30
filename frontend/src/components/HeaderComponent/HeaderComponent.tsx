import React from 'react'
import styles from './HeaderComponent.module.css'

function HeaderComponent() {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.logo}>SusNet</div>
    </header>
  )
}

export default HeaderComponent
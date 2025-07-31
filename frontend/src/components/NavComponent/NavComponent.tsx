import React, { useState } from 'react'
import styles from './NavComponent.module.css'
import { Link, NavLink, useLocation } from 'react-router-dom'

function NavComponent({ menuOpen, setMenuOpen }) {

    const location = useLocation()

    const hideOnPaths = ['/', '/login']

    if (hideOnPaths.includes(location.pathname)) {
        return null
    }
    return (
    <div className={`${styles.sideBar} ${menuOpen ? styles.open : ''}`}>
        <button className={styles.closeButton} onClick={() => setMenuOpen(false)}>
          &times;
        </button>
      <nav className={styles.navLinks}>
        <NavLink
          to="/home"
          className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
          onClick={() => setMenuOpen(false)}
        >
          Home
        </NavLink>
        <NavLink
          to="/account"
          className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
          onClick={() => setMenuOpen(false)}
        >
          Account
        </NavLink>
        <NavLink
          to="/login"
          className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
          onClick={() => setMenuOpen(false)}
        >
          Logout
        </NavLink>
      </nav>
    </div>
  )
}

export default NavComponent
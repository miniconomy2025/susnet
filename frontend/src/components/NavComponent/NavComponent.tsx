import React, { useState } from "react";
import styles from "./NavComponent.module.css";
import { NavLink, useLocation } from "react-router-dom";
import { useUserSubs } from "../../hooks/UseUserSubs";

function NavComponent({ menuOpen, setMenuOpen }) {
  const location = useLocation();
  const { userSubs, loading } = useUserSubs("shiny_symbol_316");
  const hideOnPaths = ["/", "/login"];

  if (hideOnPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <div className={`${styles.sideBar} ${menuOpen ? styles.open : ""}`}>
      <button className={styles.closeButton} onClick={() => setMenuOpen(false)}>
        &times;
      </button>
      <nav className={styles.navLinks}>
        <NavLink
          to="/home"
          className={({ isActive }) =>
            isActive ? styles.activeLink : styles.link
          }
          onClick={() => setMenuOpen(false)}
        >
          Home
        </NavLink>
        {/* <NavLink
          to="/explore"
          className={({ isActive }) =>
            isActive ? styles.activeLink : styles.link
          }
          onClick={() => setMenuOpen(false)}
        >
          Explore
        </NavLink> */}
        <NavLink
          to="/account"
          className={({ isActive }) =>
            isActive ? styles.activeLink : styles.link
          }
          onClick={() => setMenuOpen(false)}
        >
          User
        </NavLink>
        <div className={styles.collapsibleSection}>
          <input type="checkbox" className={styles.listCheckbox} id="subs-toggle" />
          <label htmlFor="subs-toggle" className={styles.link}>
            Your Subs
            <span className="material-icons dropdownIcon">chevron_right</span>
          </label>
          <div className={styles.subLinks}>
            {loading ? (
              <div className={styles.link}>Loading...</div>
            ) : (
              userSubs.map(sub => (
                <NavLink
                  key={sub.name}
                  to={`/r/${sub.name}`}
                  className={({ isActive }) => isActive ? styles.activeLink : styles.link}
                  onClick={() => setMenuOpen(false)}
                >
                  {sub.name}
                </NavLink>
              ))
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default NavComponent;
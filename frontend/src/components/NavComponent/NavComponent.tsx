import React, { useState } from "react";
import styles from "./NavComponent.module.css";
import { Link, NavLink, useLocation } from "react-router-dom";
import { get } from "../../utils/requests.ts";

function NavComponent({ menuOpen, setMenuOpen }) {
  const location = useLocation();

  const hideOnPaths = ["/", "/login"];
  const [sectionOpen, setSectionOpen] = useState(false);

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
            isActive ? styles.activeLink : styles.link}
          onClick={() => setMenuOpen(false)}
        >
          Home
        </NavLink>
        <NavLink
          to="/explore"
          className={({ isActive }) =>
            isActive ? styles.activeLink : styles.link}
          onClick={() => setMenuOpen(false)}
        >
          Explore
        </NavLink>
        <NavLink
          to="/account"
          className={({ isActive }) =>
            isActive ? styles.activeLink : styles.link}
          onClick={() => setMenuOpen(false)}
        >
          User
        </NavLink>
        <div className={styles.collapsibleSection}>
          <input
            type="checkbox"
            className={styles.listCheckbox}
            id="subs-toggle"
          />
          <label htmlFor="subs-toggle" className={styles.link}>
            Your Subs
            <span className="material-icons dropdownIcon">chevron_right</span>
          </label>
          <div className={styles.subLinks}>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link}
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </NavLink>
            <NavLink
              to="/help"
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link}
              onClick={() => setMenuOpen(false)}
            >
              Help
            </NavLink>
            {/* Add more sub-links as needed */}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default NavComponent;

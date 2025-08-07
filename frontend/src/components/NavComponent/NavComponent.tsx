import React from "react";
import styles from "./NavComponent.module.css";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/UseAuth";
import { ActorData } from "../../../../types/api";

interface NavComponentProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  userSubs: ActorData[];
  subsLoading: boolean;
}

function NavComponent({ menuOpen, setMenuOpen, userSubs, subsLoading }: NavComponentProps) {
  const location = useLocation();
  const { loading: authLoading } = useAuth();

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
            {authLoading || subsLoading ? (
              <div className={styles.link}>Loading...</div>
            ) : (
              userSubs.map(sub => (
                <NavLink
                  key={sub.name}
                  to={`/subreddit/${sub.name}`}
                  caseSensitive={true}
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

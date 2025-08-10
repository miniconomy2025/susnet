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
  authLoading: boolean;
}

function NavComponent({ menuOpen, setMenuOpen, userSubs, subsLoading, authLoading }: NavComponentProps) {
  const location = useLocation();

  const hideOnPaths = ["/", "/login"];

  if (hideOnPaths.includes(location.pathname)) {
    return null;
  }

  // Separate users and subreddits
  const users = userSubs.filter(sub => sub.type === 'user');
  const subreddits = userSubs.filter(sub => sub.type === 'sub');

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
        
        {/* Subreddits Section */}
        <div className={styles.collapsibleSection}>
          <input type="checkbox" className={styles.listCheckbox} id="subs-toggle" />
          <label htmlFor="subs-toggle" className={styles.link}>
            Subreddits
            <span className="material-icons dropdownIcon">chevron_right</span>
          </label>
          <div className={styles.subLinks}>
            {authLoading || subsLoading ? (
              <div className={styles.link}>Loading...</div>
            ) : (
              subreddits.map(sub => (
                <NavLink
                  key={sub.name}
                  to={`/subreddit/${encodeURIComponent(sub.name)}`}
                  className={({ isActive }) => isActive ? styles.activeLink : styles.link}
                  onClick={() => setMenuOpen(false)}
                >
                  r/{sub.name}
                </NavLink>
              ))
            )}
          </div>
        </div>

        {/* Users Section */}
        <div className={styles.collapsibleSection}>
          <input type="checkbox" className={styles.listCheckbox} id="users-toggle" />
          <label htmlFor="users-toggle" className={styles.link}>
            Following
            <span className="material-icons dropdownIcon">chevron_right</span>
          </label>
          <div className={styles.subLinks}>
            {authLoading || subsLoading ? (
              <div className={styles.link}>Loading...</div>
            ) : (
              users.map(user => (
                <NavLink
                  key={user.name}
                  to={`/user/${encodeURIComponent(user.name)}`}
                  className={({ isActive }) => isActive ? styles.activeLink : styles.link}
                  onClick={() => setMenuOpen(false)}
                >
                  u/{user.name}
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

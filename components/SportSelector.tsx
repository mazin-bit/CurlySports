"use client";

import { useActiveSport, SPORT_CONFIGS } from "@/contexts/SportContext";
import styles from "./sport-selector.module.css";

export default function SportSelector() {
  const { activeSport, setActiveSport, activeSportConfig } = useActiveSport();

  return (
    <div className={styles.wrap}>
      <div className={styles.strip}>
        {SPORT_CONFIGS.map((s) => {
          const isActive = activeSport === s.slug;
          return (
            <button
              key={s.slug}
              className={`${styles.chip}${isActive ? " " + styles.active : ""}`}
              onClick={() => setActiveSport(s.slug)}
              style={isActive ? ({ "--sport-color": s.color } as React.CSSProperties) : {}}
            >
              <span className={styles.icon}>{s.icon}</span>
              <span className={styles.label}>{s.label}</span>
            </button>
          );
        })}
      </div>
      <div className={styles.indicator} style={{ background: activeSportConfig.color }} />
    </div>
  );
}

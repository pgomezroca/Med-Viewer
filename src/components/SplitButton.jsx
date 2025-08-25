import React, { useEffect, useRef, useState } from 'react';
import styles from "../styles/SplitButton.module.css";
export default function SplitButton({

  label = 'Continuar caso',
  items = [],           
  classNameBtn = ""    
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cerrar al click afuera
  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const run = (fn) => () => {
    setOpen(false);
    if (typeof fn === 'function') fn();
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className={`${styles.Btn} ${classNameBtn}`} 
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
      >
        {label}
      </button>

      {open && (
        <div
          role="menu"
          className={styles.menu}
          onClick={(e) => e.stopPropagation()}
         
        >
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              onClick={run(it.onClick)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

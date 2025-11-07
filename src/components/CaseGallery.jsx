import React, { useEffect, useState } from 'react';
import styles from '../styles/CaseGallery.module.css';
import { useAuth } from '../context/AuthContext';
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function CaseGallery({ open, caseId, title,diagnostico, region, dni, onClose }) {
  const { token } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const navigate = useNavigate();
  const openGalleryByCase = (
    caseId,
    diagnostico,
    fecha,
    regionValue,
    dniPaciente
  ) => {
    setGalleryCaseId(caseId);
    setGalleryTitle(`Caso ${caseId} — ${fecha} — ${diagnostico}`);
    setGalleryRegion(regionValue || "");     // ✅ usa el parámetro regionValue
    setGalleryDiagnostico(diagnostico || ""); 
    setGalleryDni(dniPaciente || "");
    setGalleryOpen(true);
  };
  useEffect(() => {
    if (!open || !caseId) return;
    const ac = new AbortController();
    setLoading(true);
    setError('');
    setItems([]);

    fetch(`${apiUrl}/api/images/cases/${encodeURIComponent(caseId)}/images`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: ac.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.text()) || 'Error al cargar imágenes');
        return r.json();
      })
      .then((res) => setItems(res.data.images)) 
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message || 'Error'); })
      .finally(() => setLoading(false));

    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    console.log('items:',items);
    document.addEventListener('keydown', onKey);
    return () => { ac.abort(); document.removeEventListener('keydown', onKey); };
  }, [open, caseId, apiUrl, token, onClose]);

  if (!open) return null;

  const isVideo = (it) =>
    /video/i.test(it?.mimetype || it?.mimeType || '') ||
    /\.(mp4|mov|webm|mkv)$/i.test(it?.filename || it?.name || '');

  const srcFrom = (it) =>
    it?.thumbnailUrl ||
    it?.thumbUrl ||
    it?.url ||
    it?.imageUrl ||
    (it?.path ? `${apiUrl}/uploads/${it.path}` : '');

    return (
      <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h3 className={styles.title}>{title || 'Galería del caso'}</h3>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>
    
          {loading && <div className={styles.empty}>Cargando imágenes…</div>}
          {!loading && error && <div className={styles.empty}>Error: {error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className={styles.empty}>No hay imágenes para este caso.</div>
          )}
          {!loading && !error && items.length > 0 && (
            <div className={styles.grid}>
              {items.map((it) => {
                const isVideo =
                  it.url.endsWith(".mp4") ||
                  it.url.endsWith(".webm") ||
                  it.url.endsWith(".mov");
    
                return (
                  <figure key={it.id} className={styles.item}>
                    {isVideo ? (
                      <video
                        src={it.url}
                        className={styles.thumbVideo}
                        muted
                        loop
                        autoPlay
                        playsInline
                        controls
                      />
                    ) : (
                      <img
                        src={it.url}
                        alt={`img-${it.id}`}
                        className={styles.thumb}
                        loading="lazy"
                      />
                    )}
                    {it.fase && (
                      <figcaption className={styles.caption}>Fase: {it.fase}</figcaption>
                    )}
                  </figure>
                );
              })}
            </div>
          )}
    
          {/* ➕ Botón dentro del modal */}
          <button
            className={styles.plusButton}
            title="Agregar nueva imagen"
            onClick={() => {
              const qs = new URLSearchParams({
                dni: dni || "",
                region: region || "",
               dx: diagnostico || "",
               caseId: String(caseId),
               mode: "foto",
               autostart: "1",
               from: "gallery",
              }).toString();
              onClose(); // 🔹 cierra la galería
              navigate(`/welcome/take-photo?${qs}`); 
            }}
          >
            <Plus size={40} />
          </button>
        </div>
      </div>
    );
    
    
  
}
import React, { useEffect, useMemo, useState } from "react";
import styles from "../styles/CompleteImageLabels.module.css";
import { Folder, FolderOpen, Filter, Save, X, RefreshCw } from "lucide-react";
import FormularioJerarquico from "./FormularioJerarquico";
function guessExt(url = "") {
  try {
    const clean = url.split("?")[0].toLowerCase();
    const parts = clean.split(".");
    return parts.length > 1 ? parts.pop() : "";
  } catch { return ""; }
}

function guessMimeFromUrl(url = "") {
  const ext = guessExt(url);
  // Videos comunes
  if (["mp4","m4v","mov"].includes(ext)) return "video/mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "ogv" || ext === "ogg") return "video/ogg";
  // Imágenes comunes
  if (["jpg","jpeg"].includes(ext)) return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "avif") return "image/avif";
  return ""; // desconocido
}

function getMediaType(m = {}) {
  const mime = m.mimeType || m.contentType || "";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  // fallback por extensión
  const ext = guessExt(m.url || "");
  if (["mp4","m4v","mov","webm","ogv","ogg"].includes(ext)) return "video";
  if (["jpg","jpeg","png","gif","webp","avif","bmp","tiff","heic","heif"].includes(ext)) return "image";
  return "image"; // por defecto lo mostramos como imagen
}
// Normalizador: sin tildes, lowercase, trim
const normalizeStr = (s) =>
  (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

/**
 * CompleteImageLabels
 * 
 *  - GET  {apiBase}/incomplete
 *  - GET  {apiBase}/cases/:caseId/images
 *  - PUT  {apiBase}/:caseId
 *
 * Props:
 *  - apiBase: string (default: `${import.meta.env.VITE_API_URL}/api`)
 *  - authToken?: string (si usas Authorization Bearer; si usas cookie, con credentials: 'include' alcanza)
 */
export default function CompleteImageLabels({
  apiBase = `${import.meta.env.VITE_API_URL}`,
  authToken = localStorage.getItem("token"),
}) {
  
  const [filters, setFilters] = useState({ region: "", diagnostico: "" });
  const [hasSearched, setHasSearched] = useState(false);
  // lista de casos
  const [cases, setCases] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");
  // detalle
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  // edición
  const [formVals, setFormVals] = useState({ region: "",
  etiologia: "",
  tejido: "",
  diagnostico: "",
  tratamiento: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const canSearch = useMemo(
    () => (filters.region?.length || filters.diagnostico?.length),
    [filters]
  );

  // ---- fetch lista de incompletos ----
  const fetchIncomplete = async () => {
    setLoadingList(true);
    setListError("");
    setCases([]);

    try {
      const headers = authToken
        ? { Authorization: `Bearer ${authToken}` }: {};
      const baseDefault = `${import.meta.env.VITE_API_URL}/api/patients`;
      const base = (apiBase && !apiBase.includes("undefined") ? apiBase : baseDefault).replace(/\/+$/,"");
      const url = `${base}/api/images/incomplete`;
      console.log("[GET] ", url);
      const res = await fetch(url, {
          headers,
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();

      //  distintos formatos: array directo, {items}, {data}
      const list = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];

      // Caso 1: el backend ya devuelve CASOS [{id, dni, region, diagnostico, fase, ...}]
      const looksLikeCases =
        list.length > 0 &&
        ("id" in list[0] || "caseId" in list[0]) &&
        (
          "region" in list[0] ||
          "diagnostico" in list[0] ||
          "fase" in list[0] ||
          "etiologia" in list[0] ||
          "tejido" in list[0] ||
          "tratamiento" in list[0]
        );

      let aggregated = [];
      if (looksLikeCases) {
        aggregated = list.map((c) => ({
          id: c.id ?? c.caseId ?? c.case_id,
          dni: c.dni ?? c.patientDni ?? c.patient?.dni ?? null,
          region: c.region ?? "",
          etiologia: c.etiologia ?? "",
          tejido: c.tejido ?? "",
          tratamiento: c.tratamiento ?? "",
          diagnostico: c.diagnostico ?? c.dx ?? "",
          fase: c.fase ?? c.stage ?? "",
          thumbUrl: c.thumbUrl ?? c.thumbnail ?? null,
        }));
      } else {
        // Caso 2: el backend devuelve IMÁGENES INCOMPLETAS (getIncompleteImages)
        // Necesitamos agrupar por caseId
        const byCase = new Map();
        for (const img of list) {
          const caseId = img.caseId ?? img.case_id ?? img.case?.id;
          if (!caseId) continue;
          const prev = byCase.get(caseId) || {
            id: caseId,
            dni: img.dni ?? img.patientDni ?? img.case?.dni ?? null,
            region: img.region ?? img.case?.region ?? "",
            diagnostico: img.diagnostico ?? img.dx ?? img.case?.diagnostico ?? "",
            fase: img.fase ?? img.case?.fase ?? "",
            etiologia: img.etiologia ?? img.case?.etiologia ?? "",
            tejido: img.tejido ?? img.case?.tejido ?? "",
            tratamiento: img.tratamiento ?? img.case?.tratamiento ?? "",
            thumbUrl: img.thumbUrl ?? img.thumbnail ?? img.url ?? null,
          };
          // Si aparece un valor “más completo”, lo priorizamos
          prev.region ||= img.region || img.case?.region || "";
          prev.diagnostico ||= img.diagnostico || img.dx || img.case?.diagnostico || "";
          prev.fase ||= img.fase || img.case?.fase || "";
          prev.etiologia ||= img.etiologia || img.case?.etiologia || "";
          prev.tejido ||= img.tejido || img.case?.tejido || "";
          prev.tratamiento ||= img.tratamiento || img.case?.tratamiento || "";
          byCase.set(caseId, prev);
        }
        aggregated = Array.from(byCase.values());
      }
       // Filtrar por: al menos UNA de estas está vacía (requisito)
      const onlyMissingETT = (c) =>
      !c.etiologia || c.etiologia === "" ||
      !c.tejido || c.tejido === "" ||
      !c.tratamiento || c.tratamiento === "";
      // Filtro “incompletos” y por filtros UI (region/diagnostico) de forma robusta
      const nRegion = normalizeStr(filters.region);
      const nDx = normalizeStr(filters.diagnostico);
      const filtered = aggregated.filter((c) => {
      const incompleto = !c.region || !c.diagnostico || !c.fase ;
  
        if (!incompleto) return false;

      const cRegion = normalizeStr(c.region);
      const cDx = normalizeStr(c.diagnostico);
      const passRegion = nRegion ? cRegion.includes(nRegion) : true;
      const passDx = nDx ? cDx.includes(nDx) : true;
        return passRegion && passDx;
      });
      setCases(filtered);
       console.debug("incomplete fetched", { total: list.length, aggregated: aggregated.length, filtered: filtered.length });

    } catch (e) {
      console.error(e);
      setListError("No se pudo obtener la lista de casos incompletos.");
    } finally {
      setLoadingList(false);
      setHasSearched(true);
    }
  };
  // ---- abrir caso: GET /cases/:caseId/images ----
  const openCase = async (caseId) => {
    setOpenId(caseId);
    setDetail(null);
    setDetailError("");
    setLoadingDetail(true);
    setSaveMsg("");

    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` }: {};
      const res = await fetch(`${apiBase}/api/images/cases/${caseId}/images`, {
        headers,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      // Normalizo formato
      // Espero: { id, dni, region, diagnostico, fase, media: [{id,type,url,thumbUrl}] }
     const norm = {
        id: data.id ?? caseId,
        dni: data.dni ?? data.patient?.dni ?? null,
        region: data.region ?? "",
        diagnostico: data.diagnostico ?? "",
        fase: data.fase ?? data.stage ?? "",
        etiologia: data.etiologia ?? "",
        tejido: data.tejido ?? "",
        tratamiento: data.tratamiento ?? "",
        media: Array.isArray(data.images)
  ? data.images.map((m) => {
      const type = getMediaType(m);
      return {
        id: m.id,
        type, // 👈 ahora sí: "video" o "image"
        url: m.url,
        mimeType: m.mimeType || m.contentType || guessMimeFromUrl(m.url),
        thumbUrl: m.thumbUrl ?? m.thumbnail ?? null,
        fase: m.fase ?? "",
        etiologia: m.etiologia ?? "",
        tejido: m.tejido ?? "",
        tratamiento: m.tratamiento ?? "",
      };
    })
  : [],
      };
      setDetail(norm);
      setFormVals({
        region: norm.region || "",
        diagnostico: norm.diagnostico || "",
        fase: norm.fase || "",
        etiologia: norm.etiologia || "",
        tejido: norm.tejido || "",
        tratamiento: norm.tratamiento || "",
      });
    } catch (e) {
      console.error(e);
      setDetailError("No se pudo cargar el detalle del caso.");
    } finally {
      setLoadingDetail(false);
    }
  };

  // ---- guardar etiquetas: PUT /:caseId ----
  const saveLabels = async () => {
    if (!detail?.id) return;
    setSaving(true);
    setSaveMsg("");

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      };

      const payload = {
        region: formVals.region || "",
        diagnostico: formVals.diagnostico || "",
        fase: formVals.fase || "",
        etiologia: formVals.etiologia || "",
        tejido: formVals.tejido || "",
        tratamiento: formVals.tratamiento || "",
      };

      const res = await fetch(`${apiBase}/api/images/${detail.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setSaveMsg("Etiquetas guardadas correctamente.");
      await openCase(detail.id);      // refresco detalle
      await fetchIncomplete();        // refresco lista
    } catch (e) {
      console.error(e);
      setSaveMsg("Hubo un error al guardar etiquetas.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2400);
    }
  };

  const closeDetail = () => {
    setOpenId(null);
    setDetail(null);
    setFormVals({ region: "", diagnostico: "", fase: "",etiologia: "",
    tejido: "",
    tratamiento: "",
   });
    setSaveMsg("");
  };

  const hasResults = cases.length > 0;

  return (
    <div className={styles.wrapper}>
      {/* FILTROS */}
      <section className={styles.filters}>
        <div className={styles.filtersHeader}>
          <h2 className={styles.title}><Filter size={18} /> Completar etiquetas</h2>
          <button
            className={styles.refreshBtn}
            onClick={fetchIncomplete}
            disabled={loadingList}
          >
            <RefreshCw size={16} />
            <span>Buscar</span>
          </button>
        </div>

        {/* formulario jerárquico simple (region + diagnostico) */}
        <FormularioJerarquico
          campos={["region", "diagnostico"]}
          valores={filters}
          onChange={(vals) => setFilters((f) => ({ ...f, ...vals }))}
        />

        {!canSearch && (
          <p className={styles.helperText}>
            Tip: podés filtrar por <strong>Región</strong>, por <strong>Diagnóstico</strong> o por ambos (opcional).
          </p>
        )}
        {listError && <p className={styles.errorMsg}>{listError}</p>}
      </section>

      {/* LISTA + DETALLE */}
      <section className={styles.content}>
        {/* LISTA */}
        <div className={styles.caseList}>
        {loadingList ? (
          <div className={styles.skeletonList}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
              ))}
          </div> ) : !hasSearched? (
          
            <div className={styles.empty}>
              <Folder size={28} />
              <p>Usá los filtros y tocá <strong>Buscar</strong> para ver casos con etiquetas incompletas.</p>
            </div>
          ) : !hasResults ? (
            <div className={styles.empty}>
              <Folder size={28} />
              <p>No hay casos con <em>etiología/tejido/tratamiento</em> incompletos para este filtro.</p>
            </div>
          ) : (
            <ul className={styles.grid}>
              {cases.map((c) => (
                <li key={c.id} className={styles.card}>
                  <button className={styles.folderBtn} onClick={() => openCase(c.id)}>
                    {openId === c.id ? <FolderOpen size={22} /> : <Folder size={22} />}
                    <div className={styles.cardBody}>
                      <div className={styles.cardLine}>
                        <span className={styles.cardLabel}>Caso</span>
                        <span className={styles.cardValue}>#{c.id}</span>
                      </div>
                      {c.dni && (
                        <div className={styles.cardLine}>
                          <span className={styles.cardLabel}>DNI</span>
                          <span className={styles.cardValue}>{c.dni}</span>
                        </div>
                      )}
                      <div className={styles.badges}>
                        <Badge label="Región" value={c.region} />
                        <Badge label="Dx" value={c.diagnostico} />
                        <Badge label="Fase" value={c.fase} />
                        <Badge label="Etiología" value={c.etiologia} />
                        <Badge label="Tejido" value={c.tejido} />
                        <Badge label="Tratamiento" value={c.tratamiento} />
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* DETALLE */}
        <div className={`${styles.detail} ${openId ? styles.detailOpen : ""}`} role="dialog" aria-modal="false">
          {!openId ? (
            <div className={styles.detailEmpty}>
              <p>Seleccioná un caso para ver sus imágenes y completar etiquetas.</p>
            </div>
          ) : loadingDetail ? (
            <div className={styles.detailLoading}>Cargando caso…</div>
          ) : detailError ? (
            <div className={styles.errorMsg}>{detailError}</div>
          ) : detail ? (
            <div className={styles.detailInner}>
              <div className={styles.detailHeader}>
                <button className={styles.closeBtn} onClick={closeDetail} aria-label="Cerrar panel">
                  <X size={18} />
                </button>
                <h3 className={styles.detailTitle}>Caso #{detail.id}{detail.dni ? ` · DNI ${detail.dni}` : ""}</h3>
              </div>

              {/* Galería */}
              <div className={styles.mediaGrid}>
                {detail.media?.length ? (
                  detail.media.map((m) => (
                    <figure key={m.id} className={styles.mediaItem}>
                      {m.type === "video" ? (
  <video
    className={styles.mediaThumb}
    controls
    playsInline
    preload="metadata"
    poster={m.thumbUrl || undefined}
  >
    <source src={m.url} type={m.mimeType || guessMimeFromUrl(m.url)} />
    {/* Fallback accesible */}
    Tu navegador no puede reproducir este video.
  </video>
) : (
  <img
    className={styles.mediaThumb}
    src={m.thumbUrl || m.url}
    alt={`Media ${m.id}`}
    loading="lazy"
  />
)}
                    </figure>
                  ))
                ) : (
                  <div className={styles.noMedia}>
                    <ImagePlaceholder />
                    <p>Este caso no tiene archivos visibles.</p>
                  </div>
                )}
              </div>

              {/* Editor de etiquetas */}
              <div className={styles.formBlock}>
                <h4 className={styles.blockTitle}>Completar etiquetas</h4>
                <FormularioJerarquico
                  campos={["region", "diagnostico", "fase", "etiologia", "tejido", "tratamiento"]}
                  valores={formVals}
                  onChange={(vals) => setFormVals((p) => ({ ...p, ...vals }))}
                />
                <div className={styles.actions}>
                  <button className={styles.primaryBtn} onClick={saveLabels} disabled={saving}>
                    <Save size={16} />
                    {saving ? "Guardando..." : "Guardar etiquetas"}
                  </button>
                </div>
                {saveMsg && <p className={styles.saveMsg}>{saveMsg}</p>}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Badge({ label, value }) {
  const isEmpty = !value || value === "";
  return (
    <span className={`${styles.badge} ${isEmpty ? styles.badgeEmpty : styles.badgeOk}`}>
      <strong>{label}:</strong> {isEmpty ? "—" : value}
    </span>
  );
}

function ImagePlaceholder() {
  return (
    <div className={styles.placeholder}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14m18 0H3m18 0l-5-6-4 5-3-4-6 5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

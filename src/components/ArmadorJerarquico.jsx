import React, { useEffect, useState } from "react";
import styles from "../styles/Settings.module.css";
import { useNavigate } from "react-router-dom";

const niveles = ["region", "etiologia", "tejido", "diagnostico", "tratamiento"];

const ArmadorJerarquico = () => {
  const navigate = useNavigate();
  const [estructura, setEstructura] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nivel: "region",
    nombre: "",
    region_id: "",
    etiologia_id: "",
    tejido_id: "",
    diagnostico_id: "",
  });
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetchEstructura();
  }, []);

  const fetchEstructura = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/formulario-jerarquico`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();
      setEstructura(data.structure || []);
    } catch (error) {
      console.error("Error al cargar estructura:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nivel = form.nivel;
    const body = { nombre: form.nombre };
    if (nivel === "etiologia") body.region_id = form.region_id;
    if (nivel === "tejido") body.etiologia_id = form.etiologia_id;
    if (nivel === "diagnostico") body.tejido_id = form.tejido_id;
    if (nivel === "tratamiento") body.diagnostico_id = form.diagnostico_id;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/formulario-jerarquico/${nivel}s`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) throw new Error("Error al crear elemento");
      setMensaje(`✅ ${nivel} creado correctamente`);
      setForm({ ...form, nombre: "" });
      fetchEstructura();
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error al guardar");
    }
  };

  const handleDelete = async (nivel, id) => {
    if (!confirm(`¿Eliminar ${nivel}?`)) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/formulario-jerarquico/${nivel}s/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!res.ok) throw new Error("Error al eliminar");
      fetchEstructura();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  const renderPrevisualizacion = (data) => {
    return (
      <ul className={styles.treeList}>
        {data.map((region) => (
          <li key={`r-${region.id}`}>
            <strong>{region.nombre}</strong>
            <button
              onClick={() => handleDelete("region", region.id)}
              className={styles.deleteBtn}
            >
              🗑️
            </button>

            {region.etiologias?.length > 0 && (
              <ul>
                {region.etiologias.map((eti) => (
                  <li key={`e-${eti.id}`}>
                    {eti.nombre}
                    <button
                      onClick={() => handleDelete("etiologia", eti.id)}
                      className={styles.deleteBtn}
                    >
                      🗑️
                    </button>

                    {eti.tejidos?.length > 0 && (
                      <ul>
                        {eti.tejidos.map((tej) => (
                          <li key={`t-${tej.id}`}>
                            {tej.nombre}
                            <button
                              onClick={() => handleDelete("tejido", tej.id)}
                              className={styles.deleteBtn}
                            >
                              🗑️
                            </button>

                            {tej.diagnosticos?.length > 0 && (
                              <ul>
                                {tej.diagnosticos.map((diag) => (
                                  <li key={`d-${diag.id}`}>
                                    {diag.nombre}
                                    <button
                                      onClick={() =>
                                        handleDelete("diagnostico", diag.id)
                                      }
                                      className={styles.deleteBtn}
                                    >
                                      🗑️
                                    </button>

                                    {diag.tratamientos?.length > 0 && (
                                      <ul>
                                        {diag.tratamientos.map((tra) => (
                                          <li key={`tra-${tra.id}`}>
                                            {tra.nombre}
                                            <button
                                              onClick={() =>
                                                handleDelete("tratamiento", tra.id)
                                              }
                                              className={styles.deleteBtn}
                                            >
                                              🗑️
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={styles.armadorContainer}>
      <h2>🧩 Armador del Formulario Jerárquico</h2>
      <p className={styles.description}>
        Creá o editá los niveles del formulario jerárquico (regiones, etiologías,
        tejidos, diagnósticos y tratamientos). Cada nivel depende del anterior.
      </p>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div className={styles.formGrid}>
          <select
            name="nivel"
            value={form.nivel}
            onChange={handleChange}
            className={styles.input}
          >
            {niveles.map((n) => (
              <option key={n} value={n}>
                {n.charAt(0).toUpperCase() + n.slice(1)}
              </option>
            ))}
          </select>

          {form.nivel !== "region" && (
            <select
              name={`${form.nivel === "etiologia"
                ? "region_id"
                : form.nivel === "tejido"
                ? "etiologia_id"
                : form.nivel === "diagnostico"
                ? "tejido_id"
                : "diagnostico_id"
                }`}
              value={
                form[
                  form.nivel === "etiologia"
                    ? "region_id"
                    : form.nivel === "tejido"
                    ? "etiologia_id"
                    : form.nivel === "diagnostico"
                    ? "tejido_id"
                    : "diagnostico_id"
                ] || ""
              }
              onChange={handleChange}
              className={styles.input}
              required
            >
              <option value="">Seleccionar padre</option>
              {form.nivel === "etiologia" &&
                estructura.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}

              {form.nivel === "tejido" &&
                estructura.flatMap((r) =>
                  r.etiologias.map((e) => (
                    <option key={e.id} value={e.id}>
                      {`${r.nombre} → ${e.nombre}`}
                    </option>
                  ))
                )}

              {form.nivel === "diagnostico" &&
                estructura.flatMap((r) =>
                  r.etiologias.flatMap((e) =>
                    e.tejidos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {`${r.nombre} → ${e.nombre} → ${t.nombre}`}
                      </option>
                    ))
                  )
                )}

              {form.nivel === "tratamiento" &&
                estructura.flatMap((r) =>
                  r.etiologias.flatMap((e) =>
                    e.tejidos.flatMap((t) =>
                      t.diagnosticos.map((d) => (
                        <option key={d.id} value={d.id}>
                          {`${r.nombre} → ${e.nombre} → ${t.nombre} → ${d.nombre}`}
                        </option>
                      ))
                    )
                  )
                )}
            </select>
          )}

          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre del elemento"
            required
            className={styles.input}
          />

          <button type="submit" className={styles.btnPrimary}>
            Agregar
          </button>
        </div>
      </form>

      {mensaje && <p className={styles.feedback}>{mensaje}</p>}

      {/* PREVISUALIZACIÓN */}
      <div className={styles.previewSection}>
        <h4>Previsualización del formulario</h4>
        {loading ? (
          <p>Cargando...</p>
        ) : estructura.length === 0 ? (
          <p>No hay elementos aún.</p>
        ) : (
          renderPrevisualizacion(estructura)
        )}
      </div>

      <div className="mt-4">
        <button onClick={()=> navigate('/settings')} className={styles.btnPrimary}>Volver a configuraciones</button>
      </div>
    </div>
  );
};

export default ArmadorJerarquico;

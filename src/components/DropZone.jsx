import React, { useState, useRef, useCallback } from "react";
import styles from "../styles/DropZone.module.css";

export default function DropZone({
  onFilesSelected,
  accept = "image/*",
  multiple = true,
  label = "Arrastrá o soltá tus imágenes aquí",
  hint = "o hacé clic para buscarlas",
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleClick = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Evita falsos negativos cuando pasás por hijos
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const processFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      if (files.length && onFilesSelected) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleChange = (e) => {
    processFiles(e.target.files);
    e.target.value = ""; // para poder volver a elegir el mismo archivo
  };

  return (
    <div
      className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
      aria-label="Zona para arrastrar o seleccionar imágenes"
    >
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden>
          📥
        </div>
        <p className={styles.label}>{label}</p>
        <p className={styles.hint}>{hint}</p>
        <p className={styles.small}>
          Formatos: JPG, PNG, HEIC. {multiple ? "Podés seleccionar varias." : ""}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className={styles.hiddenInput}
        onChange={handleChange}
        aria-hidden
      />
    </div>
  );
}

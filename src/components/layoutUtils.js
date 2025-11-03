// src/utils/layoutUtils.js
export function calcularDisposicion(cantidadNodos, ANCHO_VISTA = 1800, ALTO_VISTA = 700) {
  const MARGEN_X = 120, MARGEN_Y = 80;
  
  // Determinar columnas según cantidad de nodos
  let columnas;
  if (cantidadNodos <= 9) columnas = 3;
  else if (cantidadNodos <= 12) columnas = 3;
  else columnas = 4;
  
  const filas = Math.ceil(cantidadNodos / columnas);
  
  const anchoInterior = ANCHO_VISTA - MARGEN_X * 2;
  const altoInterior = ALTO_VISTA - MARGEN_Y * 2;
  
  const pasoX = columnas > 1 ? anchoInterior / (columnas - 1) : 0;
  const pasoY = filas > 1 ? altoInterior / (filas - 1) : 0;
  
  return { columnas, filas, MARGEN_X, MARGEN_Y, pasoX, pasoY };
}

export function calcularPosiciones(nodos, disposicion) {
  const posiciones = {};
  const { columnas, MARGEN_X, MARGEN_Y, pasoX, pasoY } = disposicion;
  
  nodos.forEach((id, indice) => {
    const columna = indice % columnas;
    const fila = Math.floor(indice / columnas);
    posiciones[id] = { 
      x: MARGEN_X + columna * pasoX, 
      y: MARGEN_Y + fila * pasoY 
    };
  });
  return posiciones;
}
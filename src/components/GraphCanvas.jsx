export default function GraphCanvas({ 
  nodos, 
  aristas, 
  fuente, 
  sumidero, 
  flujo = null, 
  caminoActual = [], 
  posiciones, 
  alClickNodo, 
  alClickDerechoNodo, 
  esInteractivo = true 
}) {
  const RADIO_NODO = 28;
  const LONGITUD_FLECHA = 3;
  const ESPACIO_INICIO = 3;
  const ESPACIO_FIN = RADIO_NODO + LONGITUD_FLECHA + 2;
  const DISTANCIA_ETIQUETA = 80;
  const DESPLAZAMIENTO_ETIQUETA = -12;

  const ANCHO_VISTA = 1800, ALTO_VISTA = 700;

  const crearClave = (origen, destino) => `${origen}->${destino}`;
  
  const estaEnCaminoAdelante = (origen, destino) =>
    caminoActual.some(segmento => segmento.direccion === "f" && segmento.origen === origen && segmento.destino === destino);

  const segmentosAtras = caminoActual.filter(segmento => segmento.direccion === "b");

  return (
    <svg
      className="w-full h-full rounded-xl"
      viewBox={`0 0 ${ANCHO_VISTA} ${ALTO_VISTA}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id="arrow" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="12" markerHeight="12" orient="auto">
          <path d="M 0 0 L 12 6 L 0 12 z" fill="#555" />
        </marker>
        <marker id="arrowBlue" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="12" markerHeight="12" orient="auto">
          <path d="M 0 0 L 12 6 L 0 12 z" fill="#2563eb" />
        </marker>
      </defs>

      {/* Aristas */}
      {aristas.map((arista) => {
        const puntoA = posiciones[arista.origen], puntoB = posiciones[arista.destino];
        if (!puntoA || !puntoB) return null;

        const deltaX = puntoB.x - puntoA.x, deltaY = puntoB.y - puntoA.y;
        const longitud = Math.hypot(deltaX, deltaY) || 1;
        const unitarioX = deltaX / longitud, unitarioY = deltaY / longitud;
        const normalX = -unitarioY, normalY = unitarioX;

        const inicioX = puntoA.x + unitarioX * (RADIO_NODO + ESPACIO_INICIO);
        const inicioY = puntoA.y + unitarioY * (RADIO_NODO + ESPACIO_INICIO);
        const finX = puntoB.x - unitarioX * ESPACIO_FIN;
        const finY = puntoB.y - unitarioY * ESPACIO_FIN;

        const etiquetaX = puntoA.x + unitarioX * DISTANCIA_ETIQUETA + normalX * DESPLAZAMIENTO_ETIQUETA;
        const etiquetaY = puntoA.y + unitarioY * DISTANCIA_ETIQUETA + normalY * DESPLAZAMIENTO_ETIQUETA;

        const flujoActual = flujo ? (flujo.get(crearClave(arista.origen, arista.destino)) || 0) : null;
        const enCamino = flujo ? estaEnCaminoAdelante(arista.origen, arista.destino) : false;

        const textoCapacidad = flujoActual !== null ? `${flujoActual}/${arista.capacidad}` : `${arista.capacidad}`;
        const anchoChip = Math.max(32, 16 + textoCapacidad.length * 8);
        const altoChip = 22;

        return (
          <g key={arista.id}>
            <line
              x1={inicioX} y1={inicioY} x2={finX} y2={finY}
              stroke={enCamino ? "#2563eb" : "#555"}
              strokeWidth={enCamino ? 3.5 : 2}
              markerEnd={`url(#${enCamino ? "arrowBlue" : "arrow"})`}
            />
            <rect
              x={etiquetaX - anchoChip / 2}
              y={etiquetaY - altoChip / 2 - 1}
              width={anchoChip}
              height={altoChip}
              rx="5" ry="5"
              fill={enCamino ? "#DBEAFE" : "#F8FAFC"}
              stroke={enCamino ? "#2563eb" : "#CBD5E1"}
              strokeWidth={enCamino ? 1.5 : 1}
            />
            <text
              x={etiquetaX} y={etiquetaY + 4} textAnchor="middle"
              className={`select-none ${enCamino ? "fill-blue-700" : "fill-gray-800"}`}
              style={{ fontSize: 15, fontWeight: 700 }}
            >
              {textoCapacidad}
            </text>
          </g>
        );
      })}

      {/* Segmentos hacia atrás */}
      {segmentosAtras.map((segmento, indice) => {
        const puntoA = posiciones[segmento.origen], puntoB = posiciones[segmento.destino];
        if (!puntoA || !puntoB) return null;

        const deltaX = puntoB.x - puntoA.x, deltaY = puntoB.y - puntoA.y;
        const longitud = Math.hypot(deltaX, deltaY) || 1;
        const unitarioX = deltaX / longitud, unitarioY = deltaY / longitud;

        const inicioX = puntoA.x + unitarioX * (RADIO_NODO + ESPACIO_INICIO);
        const inicioY = puntoA.y + unitarioY * (RADIO_NODO + ESPACIO_INICIO);
        const finX = puntoB.x - unitarioX * ESPACIO_FIN;
        const finY = puntoB.y - unitarioY * ESPACIO_FIN;

        return (
          <line
            key={`atras-${indice}`}
            x1={inicioX} y1={inicioY} x2={finX} y2={finY}
            stroke="#2563eb" strokeWidth="3.5"
            strokeDasharray="8,4"
            markerEnd="url(#arrowBlue)"
          />
        );
      })}

      {/* Nodos */}
      {nodos.map((id) => {
        const posicion = posiciones[id];
        if (!posicion) return null;
        
        const esFuente = id === fuente;
        const esSumidero = id === sumidero;
        const colorRelleno = esFuente ? "#D3CEF2" : esSumidero ? "#295BF2" : "#91B2F2";
        const colorBorde = esFuente ? "#8B5CF6" : esSumidero ? "#1E40AF" : "#3B82F6";

        return (
          <g 
            key={id} 
            className={esInteractivo ? "cursor-pointer" : "cursor-default"}
            onClick={esInteractivo ? () => alClickNodo?.(id) : undefined}
            onContextMenu={esInteractivo ? (evento) => alClickDerechoNodo?.(evento, id) : undefined}
          >
            <circle 
              cx={posicion.x} 
              cy={posicion.y} 
              r={RADIO_NODO} 
              fill={colorRelleno} 
              stroke={colorBorde}
              strokeWidth={esFuente || esSumidero ? 3 : 2}
            />
            <text 
              x={posicion.x} 
              y={posicion.y + 6} 
              textAnchor="middle"
              className="fill-black select-none pointer-events-none"
              style={{ fontSize: 17, fontWeight: 700 }}
            >
              {id}
            </text>
            {esFuente && (
              <text 
                x={posicion.x} 
                y={posicion.y - RADIO_NODO - 8} 
                textAnchor="middle"
                className="fill-purple-600 select-none pointer-events-none"
                style={{ fontSize: 14, fontWeight: 600 }}
              >
                Fuente
              </text>
            )}
            {esSumidero && (
              <text 
                x={posicion.x} 
                y={posicion.y - RADIO_NODO - 8} 
                textAnchor="middle"
                className="fill-blue-800 select-none pointer-events-none"
                style={{ fontSize: 14, fontWeight: 600 }}
              >
                Sumidero
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
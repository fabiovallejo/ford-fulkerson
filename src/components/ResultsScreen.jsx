export default function ResultsScreen({
  flujoMaximo,
  nodos,
  aristas,
  fuente,
  sumidero,
  corteMinimo,
  alVolver,
}) {
  if (!corteMinimo) {
    return (
      <div className="w-screen min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-700 mb-4">
            No hay datos de corte mínimo disponibles
          </p>
          <button
            className="rounded-lg bg-[#0511F2] px-6 py-3 text-white text-lg font-medium hover:bg-[#234bc4] transition-all duration-300"
            onClick={alVolver}
          >
            Volver al menú
          </button>
        </div>
      </div>
    );
  }

  const { aristasCorte, capacidadCorte, flujoCorte, conjuntoFuente, conjuntoSumidero } =
    corteMinimo;

  return (
    <div className="w-screen min-h-screen bg-[#F2F2F2] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center bg-[#295BF2] w-full py-6">
        <div className="text-[#F2F2F2] text-[25px] font-bold text-center px-4">
          NODO FUENTE: {fuente}
          <span className="mx-8">|</span>
          NODO SUMIDERO: {sumidero}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-13">
        <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl p-12">
          {/* Mensaje de finalización */}
          <div className="text-center mb-8">
            <p className="text-[23px] text-gray-700 mb-2">
              Ya no hay más caminos por explorar.
            </p>
            <h2 className="text-[30px] font-bold text-gray-900 mb-2">
              RESULTADOS DEL ALGORITMO
            </h2>
          </div>

          {/* Ecuaciones y resultados */}
          <div className="space-y-4 mb-7">
            {/* Flujo neto */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
              <p className="text-xl text-[#0511F2] mb-2 font-semibold">
                Flujo neto a través del corte (S, T)
              </p>
              <p className="text-2xl text-gray-900 mb-2">
                f(S, T) = {aristasCorte.map((a) => a.flujo).join(" + ")} ={" "}
                <span className="font-bold text-[#295BF2]">{flujoCorte}</span>
              </p>
            </div>

            {/* Capacidad del corte */}
            <div className="bg-blue-50  border-l-4 border-blue-600 p-6 rounded-lg">
              <p className="text-xl text-[#0511F2] mb-2 font-semibold">
                Capacidad del corte (S, T)
              </p>
              <p className="text-2xl text-gray-900 mb-2">
                c(S, T) = {aristasCorte.map((a) => a.capacidad).join(" + ")} ={" "}
                <span className="font-bold text-[#295BF2]">{capacidadCorte}</span>
              </p>
            </div>

            {/* Conjuntos S y T */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
              <p className="text-xl text-[#0511F2] mb-2 font-semibold">
                Partición del corte mínimo:
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-lg font-semibold text-[#295BF2] mb-2">
                    Conjunto S:
                  </p>
                  <p className="text-2xl font-mono text-[#295BF2]">{`{${conjuntoFuente.join(
                    ", "
                  )}}`}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-lg font-semibold text-[#295BF2] mb-2">
                    Conjunto T:
                  </p>
                  <p className="text-2xl font-mono text-[#295BF2]">{`{${conjuntoSumidero.join(
                    ", "
                  )}}`}</p>
                </div>
              </div>
              <div className="mt-4 bg-white p-4 rounded-lg">
                <p className="text-lg font-semibold text-[#295BF2] mb-2">
                  Aristas del corte:
                </p>
                <p className="text-xl font-mono text-[#295BF2]">
                  {aristasCorte
                    .map((a) => `(${a.origen} → ${a.destino})`)
                    .join(", ")}
                </p>
              </div>
            </div>
          </div>

          {/* Flujo Máximo Final */}
          <div className="bg-[linear-gradient(135deg,_#295BF2_20%,_#0511F2_100%)] rounded-[20px] p-6 text-center shadow-xl">
            <p className="text-white text-[22px] font-semibold mb-2">
              FLUJO MÁXIMO
            </p>
            <p className="text-white text-[45px] font-bold">
              |f| = {flujoMaximo}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-center bg-[#295BF2] px-10 py-6">
        <button
          className="rounded-lg bg-[#0511F2] px-8 py-4 text-[#F2F2F2] text-xl font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300 shadow-lg"
          onClick={alVolver}
        >
          ← Volver al menú
        </button>
      </div>
    </div>
  );
}

export default function ResultsScreen({ maxFlow, onBack }) {
  return (
    <div className="rounded-xl bg-white p-8 shadow text-center">
      <h2 className="text-xl font-semibold mb-2">RESULTADOS</h2>
      <p className="mb-6">Valor del flujo máximo |f| = <b>{maxFlow}</b></p>
      <button className="rounded bg-gray-200 px-3 py-1" onClick={onBack}>Volver al menú</button>
    </div>
  );
}

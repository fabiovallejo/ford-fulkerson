import { useState } from 'react'
import MenuScreen from "./components/MenuScreen"
import ManualBuildScreen from "./components/ManualBuildScreen"
import BuildScreen from "./components/BuildScreen"
import RunScreen from "./components/RunScreen"
import ResultsScreen from "./components/ResultsScreen"
import './global.css'

function App() {
  const [screen, setScreen] = useState("MENU");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [source, setSource] = useState(null);
  const [sink, setSink] = useState(null);
  const [maxFlow, setMaxFlow] = useState(0);
  const [minCut, setMinCut] = useState(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className='min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#D3CEF2] via-[#F2F2F2] to-[#91B2F2]'>
        {screen === "MENU" && (
          <MenuScreen
            onGenerate={(ns, es) => {
              setNodes(ns); 
              setEdges(es);
              setSource(null); 
              setSink(null);
              setMaxFlow(0);
              setMinCut(null);
              setScreen("BUILD");
            }}
            onManual={(ns) => {
              setNodes(ns);
              setEdges([]);
              setSource(null); 
              setSink(null);
              setMaxFlow(0);
              setMinCut(null);
              setScreen("MANUAL_BUILD");
            }}
          />
        )}

        {screen === "MANUAL_BUILD" && (
          <ManualBuildScreen
            nodes={nodes}
            onBack={() => setScreen("MENU")}
            onContinue={(es) => {
              setEdges(es);
              setScreen("BUILD");
            }}
          />
        )}

        {screen === "BUILD" && (
          <BuildScreen
            nodes={nodes} 
            edges={edges} 
            source={source} 
            sink={sink}
            onPickS={(s) => setSource(String(s))}
            onPickT={(t) => setSink(String(t))}
            onBack={() => setScreen("MENU")}
            onRun={() => setScreen("RUN")}
          />
        )}

        {screen === "RUN" && (
          <RunScreen
            nodes={nodes} 
            edges={edges} 
            source={source} 
            sink={sink}
            onBackToMenu={() => setScreen("MENU")}
            onResults={() => setScreen("RESULTS")}
            setMaxFlow={setMaxFlow}
            setMinCut={setMinCut}
          />
        )}

        {screen === "RESULTS" && (
          <ResultsScreen
            maxFlow={maxFlow}
            nodes={nodes}
            edges={edges}
            source={source}
            sink={sink}
            minCut={minCut}
            onBack={() => setScreen("MENU")}
          />
        )}
      </div>
    </div>
  )
}

export default App
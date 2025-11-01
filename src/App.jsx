import { useState } from 'react'
import MenuScreen from "./components/MenuScreen"
import BuildScreen from "./components/BuildScreen"
import RunScreen from "./components/RunScreen"
import ResultsScreen from "./components/ResultsScreen"
import './global.css'

function App() {
  const [screen, setScreen] = useState("MENU");
  const [nodes, setNodes] = useState([]);    // ["1","2",...]
  const [edges, setEdges] = useState([]);    // [{id,source,target,capacity}]
  const [source, setSource] = useState(null);
  const [sink, setSink] = useState(null);

  const [snapshots, setSnapshots] = useState([]); // [{value, flows, caps, path}]
  const [stepIndex, setStepIndex] = useState(0);
  const [maxFlow, setMaxFlow] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F2F2]">

      <div>
        {screen === "MENU" && (
          <MenuScreen
            onGenerate={(ns, es) => {
              setNodes(ns); setEdges(es);
              setSource(null); setSink(null);
              setScreen("BUILD");
            }}
          />
        )}

        {screen === "BUILD" && (
          <BuildScreen
            nodes={nodes} edges={edges} source={source} sink={sink}
            onPickS={(s)=>setSource(String(s))}
            onPickT={(t)=>setSink(String(t))}
            onBack={()=>setScreen("MENU")}
            onRun={() => { setScreen("RUN"); }}
          />
        )}

        {screen === "RUN" && (
          <RunScreen
            nodes={nodes} edges={edges} source={source} sink={sink}
            snapshots={snapshots} stepIndex={stepIndex}
            setSnapshots={setSnapshots} setStepIndex={setStepIndex}
            setMaxFlow={setMaxFlow}
            onBackToMenu={()=>setScreen("MENU")}
            onResults={()=>setScreen("RESULTS")}
          />
        )}

        {screen === "RESULTS" && (
          <ResultsScreen
            maxFlow={maxFlow}
            onBack={()=>setScreen("MENU")}
          />
        )}
      </div>
    </div>
  )
}

export default App

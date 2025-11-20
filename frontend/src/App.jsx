import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import StorageContainers from './pages/StorageContainers'
import ComponentsLibrary from './pages/ComponentsLibrary'
import AddComponent from './pages/AddComponent'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="containers" element={<StorageContainers />} />
        <Route path="components" element={<ComponentsLibrary />} />
        <Route path="add-component" element={<AddComponent />} />
      </Route>
    </Routes>
  )
}

export default App

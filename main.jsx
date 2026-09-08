import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#08080a] text-white p-4">
      <h1 className="text-4xl font-bold text-red-600 mb-2">Movix</h1>
      <p className="text-gray-400">مرحباً بك في تطبيق Movix</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

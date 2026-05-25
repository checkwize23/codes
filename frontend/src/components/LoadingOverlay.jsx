import React from 'react'

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 backdrop-blur-lg">
      <div className="relative flex flex-col items-center">
        <img
          src="./checkwize_logo.png"
          alt="CheckWize logo"
          className="w-24 h-24 drop-shadow-xl"
          style={{ animation: 'scalePulse 1.4s ease-in-out infinite' }}
        />
        <div className="mt-4 h-1.5 w-24 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-1/3 bg-cyan-300/80 animate-pulse"></div>
        </div>
      </div>

      <style>{`
        @keyframes scalePulse {
          0% { transform: scale(0.95); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}

export default LoadingOverlay

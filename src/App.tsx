import { ChatBox } from './ChatBox';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-screen max-h-[900px] flex flex-col">
        {/* Header */}
        <div className="text-center py-8 px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span className="text-5xl">🐱</span>
            Cosmic Cat
          </h1>
          <p className="text-purple-200 text-lg">Your AI assistant with personality</p>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 min-h-0">
          <ChatBox catName="Cosmic Cat" />
        </div>
      </div>
    </div>
  );
}

export default App;

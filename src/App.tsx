import { BotSelector } from './components/BotSelector';
import { ChatInterface } from './components/ChatInterface';
import { useAIStore } from './store/useAIStore';

function App() {
  // Initialize the store
  useAIStore.getState();

  return (
    <div className="min-h-screen bg-blue-500 flex">
      <aside className="w-64 border-r bg-white">
        <BotSelector />
      </aside>
      
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b p-4">
          <h1 className="text-2xl font-bold text-gray-800">AI Assistant Platform</h1>
        </header>
        
        <div className="flex-1">
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}

export default App;
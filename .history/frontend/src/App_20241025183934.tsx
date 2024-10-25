const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState("translate");
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    model: "llama3.1-ffm-70b-32k-chat",
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0.0,
    seed: 42,
    topK_model: 0.3,
    topK_RAG: 3,
    similarityThreshold: 0.7,
  });
  
  const knowledgeBase = useKnowledgeBase();
  const fileProcessing = useFileProcessing();
  const chat = useChat();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        chatSessions={chat.chatSessions}
        onLoadSession={chat.handleLoadSession}
        onDeleteSession={chat.handleDeleteSession}
        onCreateSession={() => chat.createNewChatSession(knowledgeBase.currentKnowledgeBase)}
      />

      <div className="flex-1 ml-64 p-6">
        {currentMode === "translate" ? (
          <TranslateMode
            fileProcessing={fileProcessing}
            knowledgeBase={knowledgeBase}
          />
        ) : (
          <ChatMode
            chat={chat}
            knowledgeBase={knowledgeBase}
            modelSettings={modelSettings}
            onSettingsChange={setModelSettings}
          />
        )}
      </div>
    </div>
  );
};
import { ChatApp } from '@/chat/ChatApp'
import { I18nProvider } from '@/i18n'

function App() {
  return (
    <I18nProvider>
      <ChatApp />
    </I18nProvider>
  )
}

export default App

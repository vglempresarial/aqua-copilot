import { MainLayout } from '@/components/layout/MainLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function Index() {
  return (
    <MainLayout>
      <div className="flex-1">
        <ChatInterface />
      </div>
    </MainLayout>
  );
}

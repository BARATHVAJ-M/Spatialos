'use client';

import { RefreshCw } from 'lucide-react';
import { useExperienceEditor } from './hooks/useExperienceEditor';
import { ExperienceHeader } from './components/ExperienceHeader';
import { ExperienceTabNav } from './components/ExperienceTabNav';
import { OverviewTab } from './components/tabs/OverviewTab';
import { ContentTab } from './components/tabs/ContentTab';
import { ServicesTab } from './components/tabs/ServicesTab';
import { SpatialCanvasTab } from './components/tabs/SpatialCanvasTab';
import { ConfigurationTab } from './components/tabs/ConfigurationTab';
import { PublishingTab } from './components/tabs/PublishingTab';
import { ExperienceQrModal } from './components/modals/ExperienceQrModal';
import { ExperienceEditorModals } from './components/modals/ExperienceEditorModals';

export default function ExperienceDetailsPage() {
  const editor = useExperienceEditor();

  if (editor.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full space-y-6 p-8 relative">
      {/* Real Canvas-Generated QR Code Modal */}
      <ExperienceQrModal editor={editor} />

      {/* Header Area */}
      <ExperienceHeader editor={editor} />

      {/* Tab Navigation */}
      <ExperienceTabNav 
        activeTab={editor.activeTab} 
        onSelectTab={editor.setActiveTab} 
        spatialNodesCount={editor.nodes.length} 
      />

      {/* Tab Content Views */}
      <div className="flex-1">
        {editor.activeTab === 'overview' && <OverviewTab editor={editor} />}
        {editor.activeTab === 'content' && <ContentTab editor={editor} />}
        {editor.activeTab === 'services' && <ServicesTab editor={editor} />}
        {editor.activeTab === 'spatial' && <SpatialCanvasTab editor={editor} />}
        {editor.activeTab === 'configuration' && <ConfigurationTab editor={editor} />}
        {editor.activeTab === 'publishing' && <PublishingTab editor={editor} />}
      </div>

      {/* Shared Modals & Toasts */}
      <ExperienceEditorModals editor={editor} />
    </div>
  );
}

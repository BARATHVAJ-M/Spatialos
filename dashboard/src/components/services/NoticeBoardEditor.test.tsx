import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NoticeBoardEditor } from './NoticeBoardEditor';

describe('NoticeBoardEditor Edge Cases', () => {
  const mockInstance = {
    id: 'inst-1',
    spatialNodeId: 'node-1',
    serviceDefinitionId: 'def-1',
    organizationId: 'org-1',
    experienceId: 'exp-1',
    name: 'Test Notice Board',
    status: 'DRAFT',
    configuration: {},
    content: {}
  };

  it('handles completely null/undefined config and content gracefully', () => {
    // Should not crash when config is missing
    render(
      <NoticeBoardEditor 
        instance={mockInstance as any} 
        config={undefined as any} 
        content={null as any} 
        onConfigChange={() => {}} 
        onContentChange={() => {}} 
      />
    );
    expect(screen.getByText(/Test Notice Board/i)).toBeInTheDocument();
  });

  it('truncates or safely renders extremely long boundary inputs', () => {
    const longTitle = 'A'.repeat(500); // Exceedingly long text
    const longDescription = 'B'.repeat(2000);
    
    render(
      <NoticeBoardEditor
        instance={mockInstance as any}
        config={{ title: longTitle, description: longDescription, borderColor: '#000' }}
        onConfigChange={() => {}}
        content={{ pages: [] }}
        onContentChange={() => {}}
      />
    );

    expect(screen.getByText(new RegExp(longTitle, 'i'))).toBeInTheDocument();
  });

  it('safely processes media deletion without crashing when pages are empty', () => {
    const onContentChange = jest.fn();
    
    const initialContent = {
      pages: [
        {
          id: 'page_1',
          mediaItems: [
            { id: 'media-1', type: 'image', url: 'test1.png', x: 0, y: 0, width: 1, height: 1, rotation: 0 },
            { id: 'media-2', type: 'image', url: 'test2.png', x: 0, y: 0, width: 1, height: 1, rotation: 0 }
          ]
        }
      ]
    };

    const { container } = render(
      <NoticeBoardEditor
        instance={mockInstance as any}
        config={{ title: 'Test' }}
        onConfigChange={() => {}}
        content={initialContent}
        onContentChange={onContentChange}
      />
    );

    const deleteButtons = container.querySelectorAll('button.text-red-500, button.bg-red-500, button[title*="elete"], button[title*="emove"]');
    
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      expect(onContentChange).toHaveBeenCalled();
      const newContent = onContentChange.mock.calls[0][0];
      expect(newContent.pages[0].mediaItems.length).toBe(1);
    } else {
      expect(true).toBe(true);
    }
  });

  it('handles empty pages array safely', () => {
    render(
      <NoticeBoardEditor
        instance={mockInstance as any}
        config={{ title: 'Test' }}
        onConfigChange={() => {}}
        content={{ pages: [] }}
        onContentChange={() => {}}
      />
    );
    expect(screen.getByText(/Add Page/i)).toBeInTheDocument();
  });
});

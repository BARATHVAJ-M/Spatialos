import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoticeBoardEditor } from './NoticeBoardEditor';

describe('NoticeBoardEditor', () => {
  const mockInstance = {
    id: 'inst-1',
    spatialNodeId: 'node-1',
    serviceType: 'NOTICE_BOARD',
    name: 'Test Notice Board',
    status: 'ACTIVE'
  };

  const mockConfig = { title: 'Notices', borderColor: '#000000', description: 'Test' };
  const mockContent = {
    pages: [
      {
        id: 'page_1',
        mediaItems: [
          { id: '1', type: 'image', url: 'http://example.com/test.png', x: 0.1, y: 0.2, width: 0.5, height: 0.5, rotation: 0 }
        ]
      }
    ]
  };

  it('renders correctly with initial config and content', () => {
    const onConfigChange = jest.fn();
    const onContentChange = jest.fn();

    // The image should be rendered as a background image
    const { container } = render(
      <NoticeBoardEditor
        instance={mockInstance}
        config={mockConfig}
        onConfigChange={onConfigChange}
        content={mockContent}
        onContentChange={onContentChange}
      />
    );

    expect(screen.getByText('Notices')).toBeInTheDocument();
    
    // Check if the background image div exists
    const imageDiv = container.querySelector('div[style*="background-image"]');
    expect(imageDiv).toBeInTheDocument();
  });

  it('allows adding new media via onAddMediaRequest', () => {
    const onConfigChange = jest.fn();
    const onContentChange = jest.fn();
    const onAddMediaRequest = jest.fn((type, callback) => {
      // Simulate selecting a file
      callback('http://example.com/new.png');
    });

    render(
      <NoticeBoardEditor
        instance={mockInstance}
        config={mockConfig}
        onConfigChange={onConfigChange}
        content={mockContent}
        onContentChange={onContentChange}
        onAddMediaRequest={onAddMediaRequest}
      />
    );

    // Find "Add Image" button
    const addImageBtn = screen.getByText('Add Image');
    fireEvent.click(addImageBtn);

    expect(onAddMediaRequest).toHaveBeenCalled();
    // onContentChange should have been called with the new pages array
    expect(onContentChange).toHaveBeenCalledWith({
      pages: [
        {
          id: 'page_1',
          mediaItems: expect.arrayContaining([
            expect.objectContaining({ type: 'image' }),
            expect.objectContaining({ url: 'http://example.com/new.png' })
          ])
        }
      ]
    });
  });
});

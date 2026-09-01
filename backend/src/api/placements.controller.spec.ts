import { Test, TestingModule } from '@nestjs/testing';
import { PlacementsController } from './placements.controller';
import { ExperiencesService } from '../logic/experiences.service';
import { PrismaService } from '../database/prisma.service';

describe('PlacementsController', () => {
  let controller: PlacementsController;

  const mockExperiencesService = {
    // Just mock whatever we need
  };

  const mockPrismaService = {
    experience: {
      findFirst: jest.fn(),
    },
    place: {
      findFirst: jest.fn(),
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlacementsController],
      providers: [
        { provide: ExperiencesService, useValue: mockExperiencesService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<PlacementsController>(PlacementsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPreview', () => {
    it('should map UI_PANEL to MINIAPP and parse mediaItems properly', async () => {
      mockPrismaService.experience.findFirst.mockResolvedValue({
        id: 'test-exp-id',
        serviceInstances: [
          {
            id: 'service-1',
            spatialNodeId: 'node-1',
            configuration: {
              title: 'Test Title',
              borderColor: '#FF0000',
              description: 'Test Desc',
            },
            content: {
              mediaItems: [
                { id: 'm1', type: 'image', url: 'http://test.com/image.jpg', x: 0, y: 0, width: 1, height: 1, rotation: 0 }
              ]
            }
          }
        ],
        spatialNodes: [
          {
            id: 'node-1',
            nodeType: 'UI_PANEL',
            positionX: 0,
            positionY: 0,
            positionZ: 0,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
            serviceInstances: [
              {
                id: 'service-1',
                configuration: {
                  title: 'Test Title',
                  borderColor: '#FF0000',
                  description: 'Test Desc',
                },
                content: {
                  mediaItems: [
                    { id: 'm1', type: 'image', url: 'http://test.com/image.jpg', x: 0, y: 0, width: 1, height: 1, rotation: 0 }
                  ]
                },
                referenceId: 'service-1'
              }
            ]
          }
        ]
      });

      const req = { query: { qrCode: 'LOC-test-exp-id' } };

      const responsePayload = await controller.preview(req.query.qrCode as any);

      expect(responsePayload).toBeDefined();
      
      expect(responsePayload.success).toBe(true);
      expect(responsePayload.data.objects).toHaveLength(1);
      
      const obj = responsePayload.data.objects[0];
      expect(obj.contentType).toBe('MINIAPP');
      expect(obj.contentData.appId).toBe('NOTICE_BOARD');
      expect(obj.contentData.state.title).toBe('Test Title');
      expect(obj.contentData.state.borderColor).toBe('#FF0000');
      expect(obj.contentData.state.pages).toBeDefined();
      expect(obj.contentData.state.pages.length).toBe(1);
      expect(obj.contentData.state.pages[0].mediaItems.length).toBe(1);
      expect(obj.contentData.state.pages[0].mediaItems[0].url).toBe('/image.jpg');
    });

    it('should handle experiences without spatial nodes', async () => {
      mockPrismaService.experience.findFirst.mockResolvedValue({
        id: 'test-exp-id',
        spatialNodes: [],
        serviceInstances: []
      });

      const req = { query: { qrCode: 'LOC-test-exp-id' } };

      const responsePayload = await controller.preview(req.query.qrCode as any);

      expect(responsePayload.success).toBe(true);
      expect(responsePayload.data.objects).toHaveLength(0);
    });

    it('should return empty objects for invalid qr code', async () => {
      mockPrismaService.experience.findFirst.mockResolvedValue(null);
      mockPrismaService.place.findFirst.mockResolvedValue(null);

      const req = { query: { qrCode: 'LOC-invalid' } };

      const responsePayload = await controller.preview(req.query.qrCode as any);

      expect(responsePayload).toEqual({ success: true, data: { objects: [] } });
    });
  });
});

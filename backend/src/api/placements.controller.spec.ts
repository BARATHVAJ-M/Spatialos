import { Test, TestingModule } from '@nestjs/testing';
import { PlacementsController } from './placements.controller';
import { PlacementsService } from '../logic/placements.service';
import { IPlacementsService } from '../core/contracts/placements-service.contract';
import { IPlacementsRepository } from '../core/contracts/placements-repository.contract';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('PlacementsController', () => {
  let controller: PlacementsController;

  const mockPlacementsRepository = {
    findExperienceById: jest.fn(),
    findPublishedExperienceByQrCode: jest.fn(),
    getMiniAppData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlacementsController],
      providers: [
        { provide: IPlacementsService, useClass: PlacementsService },
        { provide: IPlacementsRepository, useValue: mockPlacementsRepository },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

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
      mockPlacementsRepository.findExperienceById.mockResolvedValue({
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
                { id: 'm1', type: 'image', url: 'http://test.com/image.jpg', x: 0, y: 0, width: 1, height: 1, rotation: 0 },
              ],
            },
          },
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
                    { id: 'm1', type: 'image', url: 'http://test.com/image.jpg', x: 0, y: 0, width: 1, height: 1, rotation: 0 },
                  ],
                },
                referenceId: 'service-1',
              },
            ],
          },
        ],
      });

      const responsePayload = await controller.preview('LOC-test-exp-id');

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
      mockPlacementsRepository.findExperienceById.mockResolvedValue({
        id: 'test-exp-id',
        spatialNodes: [],
        serviceInstances: [],
      });

      const responsePayload = await controller.preview('LOC-test-exp-id');

      expect(responsePayload.success).toBe(true);
      expect(responsePayload.data.objects).toHaveLength(0);
    });

    it('should return empty objects for invalid qr code', async () => {
      mockPlacementsRepository.findExperienceById.mockResolvedValue(null);
      mockPlacementsRepository.findPublishedExperienceByQrCode.mockResolvedValue(null);

      const responsePayload = await controller.preview('LOC-invalid');

      expect(responsePayload).toEqual({ success: true, data: { objects: [] } });
    });
  });
});

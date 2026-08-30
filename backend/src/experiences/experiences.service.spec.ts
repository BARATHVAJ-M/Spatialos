import { Test, TestingModule } from '@nestjs/testing';
import { ExperiencesService } from './experiences.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExperiencesService', () => {
  let service: ExperiencesService;

  const mockPrismaService = {
    experience: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperiencesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ExperiencesService>(ExperiencesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of experiences', async () => {
      const mockResult = [{ id: '1', name: 'Exp 1' }];
      mockPrismaService.experience.findMany.mockResolvedValue(mockResult);

      const result = await service.findAll('org-1');
      expect(result).toEqual(mockResult);
      expect(mockPrismaService.experience.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return an experience by id', async () => {
      const mockResult = { id: '1', name: 'Exp 1' };
      mockPrismaService.experience.findFirst.mockResolvedValue(mockResult);

      const result = await service.findOne('org-1', '1');
      expect(result).toEqual(mockResult);
      expect(mockPrismaService.experience.findFirst).toHaveBeenCalledWith({
        where: { id: '1', organizationId: 'org-1' },
        include: {
          place: { select: { id: true, name: true } },
          spatialNodes: true,
          serviceInstances: {
            include: {
              serviceDefinition: {
                select: { name: true, version: true, configurationSchema: true }
              }
            }
          }
        }
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ExperiencesService } from './experiences.service';
import { IExperiencesRepository } from '../core/contracts/experiences-repository.contract';
import { ContentService } from './content.service';

describe('ExperiencesService', () => {
  let service: ExperiencesService;

  const mockExperiencesRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIdBasic: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
    rollback: jest.fn(),
    replaceSpatialNodes: jest.fn(),
    replaceServiceInstances: jest.fn(),
    delete: jest.fn(),
  };

  const mockContentService = {
    deleteByUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperiencesService,
        { provide: IExperiencesRepository, useValue: mockExperiencesRepository },
        { provide: ContentService, useValue: mockContentService },
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
    it('should return an array of experiences from repository', async () => {
      const mockResult = [{ id: '1', name: 'Exp 1' }];
      mockExperiencesRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll('org-1');
      expect(result).toEqual(mockResult);
      expect(mockExperiencesRepository.findAll).toHaveBeenCalledWith('org-1');
    });
  });

  describe('findOne', () => {
    it('should return an experience by id from repository', async () => {
      const mockResult = { id: '1', name: 'Exp 1' };
      mockExperiencesRepository.findById.mockResolvedValue(mockResult);

      const result = await service.findOne('org-1', '1');
      expect(result).toEqual(mockResult);
      expect(mockExperiencesRepository.findById).toHaveBeenCalledWith('org-1', '1');
    });

    it('should throw AppError when experience not found', async () => {
      mockExperiencesRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('org-1', '999')).rejects.toThrow();
    });
  });
});

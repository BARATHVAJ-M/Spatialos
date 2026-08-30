import { IsString, IsUUID, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExperienceDto {
  @IsUUID()
  @IsNotEmpty()
  placeId: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

class SpatialNodeDto {
  @IsString()
  @IsNotEmpty()
  nodeType: string;

  @IsUUID()
  @IsNotEmpty()
  referenceId: string;

  @IsOptional()
  position?: { x: number; y: number; z: number };

  @IsOptional()
  rotation?: { x: number; y: number; z: number };

  @IsOptional()
  scale?: { x: number; y: number; z: number };
}

export class UpdateSpatialNodesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpatialNodeDto)
  nodes: SpatialNodeDto[];
}

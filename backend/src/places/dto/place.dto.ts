import { IsString, IsUUID, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePlaceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class UpdatePlaceDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

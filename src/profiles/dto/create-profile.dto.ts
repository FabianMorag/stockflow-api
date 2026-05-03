import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateProfileDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  username!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}

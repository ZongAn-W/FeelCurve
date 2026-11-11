import { Transform } from "class-transformer";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class RegisterDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: "INVALID_EMAIL" })
  email!: string;

  @IsString()
  @MinLength(8, { message: "WEAK_PASSWORD" })
  @MaxLength(72, { message: "PASSWORD_TOO_LONG" })
  password!: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(50, { message: "NAME_TOO_LONG" })
  name?: string;
}

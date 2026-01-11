import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsOptional()
    @IsString()
    twoFactorCode?: string;
}

export class Verify2FaDto {
    @IsString()
    @IsNotEmpty()
    token: string;
}

import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}

export class Verify2FaDto {
    @IsString()
    @IsNotEmpty()
    token: string;
}

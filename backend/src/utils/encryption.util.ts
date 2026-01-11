import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-cbc';
    private readonly ivLength = 16;
    private readonly encryptionKey: Buffer;

    constructor(private configService: ConfigService) {
        const key = this.configService.get<string>('ENCRYPTION_KEY');
        if (!key || key.length !== 64) {
            throw new Error('ENCRYPTION_KEY debe ser una cadena hexadecimal de 64 caracteres (32 bytes)');
        }
        this.encryptionKey = Buffer.from(key, 'hex');
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Retornar IV + encrypted separados por ':'
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedText: string): string {
        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 2) throw new Error('Formato de texto encriptado inválido');

            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];

            const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            throw new Error('Fallo en la desencriptación');
        }
    }
}

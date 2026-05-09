import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

type RawRequest = Request & { rawBody?: Buffer };

@Injectable()
export class RetellSignatureGuard implements CanActivate {
  private readonly logger = new Logger(RetellSignatureGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret =
      this.config.get<string>('RETELL_WEBHOOK_SECRET') ??
      this.config.get<string>('RETELL_API_KEY');

    if (!secret) {
      this.logger.warn(
        'No RETELL_WEBHOOK_SECRET or RETELL_API_KEY set; skipping signature verification',
      );
      return true;
    }

    const req = context.switchToHttp().getRequest<RawRequest>();
    const provided = this.extractSignature(req);
    if (!provided) {
      throw new UnauthorizedException('Missing x-retell-signature header');
    }

    if (!req.rawBody) {
      throw new UnauthorizedException('Raw body unavailable for signature verification');
    }

    const expected = createHmac('sha256', secret).update(req.rawBody).digest('hex');

    if (!this.safeEqualHex(expected, provided)) {
      throw new UnauthorizedException('Invalid Retell signature');
    }

    return true;
  }

  private extractSignature(req: RawRequest): string | undefined {
    const raw = req.headers['x-retell-signature'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return undefined;
    const parts = value.split(',').map((p) => p.trim());
    for (const part of parts) {
      if (part.startsWith('v1=')) return part.slice(3);
    }
    return value;
  }

  private safeEqualHex(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    try {
      return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
    } catch {
      return false;
    }
  }
}

import { BadRequestException, Injectable, Logger } from '@nestjs/common';

/** checks the customer's reCAPTCHA token with Google's siteverify API before every OTP is sent */
@Injectable()
export class RecaptchaService {
  private logger = new Logger('reCAPTCHA');

  async verify(token?: string) {
    if (!token) throw new BadRequestException('Please tick "I\'m not a robot".');
    const secret = process.env.RECAPTCHA_SECRET;
    if (!secret) throw new BadRequestException('reCAPTCHA is not set up on the server. Add RECAPTCHA_SECRET to backend/.env.');

    let data: { success: boolean; hostname?: string; 'error-codes'?: string[] };
    try {
      const res = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body: new URLSearchParams({ secret, response: token }) });
      data = await res.json();
    } catch {
      throw new BadRequestException('Could not reach Google to check reCAPTCHA. Please try again.');
    }
    if (!data.success) {
      const codes = data['error-codes'] || [];
      this.logger.warn(`failed: ${codes.join(', ')}`);
      throw new BadRequestException(codes.includes('timeout-or-duplicate')
        ? 'The reCAPTCHA check expired. Please tick the box again.'
        : 'reCAPTCHA check failed. Please try again.');
    }
    const host = process.env.RECAPTCHA_HOSTNAME;
    if (host && data.hostname !== host) throw new BadRequestException('reCAPTCHA check failed. Please try again.');
  }
}

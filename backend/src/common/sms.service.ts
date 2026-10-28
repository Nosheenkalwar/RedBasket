import { BadGatewayException, Injectable, Logger } from '@nestjs/common';

const API = 'https://api.sms-gate.app/3rdparty/v1/messages';

/**
 * Sends the OTP through SMS Gateway for Android (https://sms-gate.app), free and open source.
 * An Android phone with the SMSGate app in Cloud mode receives the request and sends a normal SMS from its own SIM.
 */
@Injectable()
export class SmsService {
  private logger = new Logger('SMS');

  async sendOtp(phone: string, otp: string) {
    const { SMSGATE_USERNAME: user, SMSGATE_PASSWORD: pass } = process.env;
    if (!user || !pass) throw new BadGatewayException('SMS is not set up on the server. Please contact support.');

    const res = await fetch(API, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        textMessage: { text: `${otp} is your RedBasket code. It expires in 5 minutes. Do not share it with anyone.` },
        phoneNumbers: [phone], // +923001234567
        ttl: 300, // drop the SMS if the phone could not send it within the 5 minutes the code is valid
        priority: 100, // OTPs skip the app's delay between messages
      }),
    }).catch(() => null);

    if (!res?.ok) {
      // 401 = wrong username/password from the app, 503 = phone queue problem (phone offline for long)
      this.logger.error(`SMSGate failed: ${res ? `${res.status} ${await res.text()}` : 'no internet connection'}`);
      throw new BadGatewayException('We could not send the SMS right now. Please try again in a minute.');
    }
    const { id } = (await res.json().catch(() => ({}))) as { id?: string };
    this.logger.log(`OTP queued for ${phone} (message ${id ?? 'sent'})`);
  }
}

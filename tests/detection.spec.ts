import { register, login } from '../../src/modules/auth/service';
import { detectFromSms, confirmDetection, getDetectionLogs, parseSmsText } from '../../src/modules/detection/service';
import { ValidationError, NotFoundError } from '../../src/shared/errors';

describe('Detection Service', () => {
  let user: { id: string; email: string };

  beforeEach(async () => {
    const authResult = await register({
      email: 'detect@example.com',
      password: 'password123',
    });
    user = authResult.user;
  });

  describe('parseSmsText', () => {
    it('should parse Netflix SMS correctly', () => {
      const result = parseSmsText('Your Netflix subscription of ₹499 has been charged to your card ending with 1234');
      
      expect(result.name).toBeDefined();
      expect(result.amount).toBe(499);
      expect(result.currency).toBe('INR');
      expect(result.billingCycle).toBe('monthly');
      expect(result.confidence).toBeGreaterThan(50);
    });

    it('should parse Spotify SMS with USD', () => {
      const result = parseSmsText('Spotify Premium $9.99 charged to your account');
      
      expect(result.amount).toBe(9.99);
      expect(result.currency).toBe('USD');
    });

    it('should handle ambiguous SMS with low confidence', () => {
      const result = parseSmsText('Some random message');
      
      expect(result.confidence).toBeLessThan(50);
    });

    it('should handle yearly billing cycle', () => {
      const result = parseSmsText('Your annual Netflix subscription of ₹5999 has been renewed');
      
      expect(result.billingCycle).toBe('yearly');
    });

    it('should handle weekly billing cycle', () => {
      const result = parseSmsText('Weekly gym subscription of ₹500 has been charged');
      
      expect(result.billingCycle).toBe('weekly');
    });

    it('should handle SMS without amount', () => {
      const result = parseSmsText('Your Netflix subscription has been renewed');
      
      expect(result.amount).toBeNull();
      expect(result.confidence).toBeLessThan(50);
    });

    it('should handle duplicate detection (same SMS)', async () => {
      const sms = 'Your Netflix subscription of ₹499 has been charged';
      
      const result1 = await detectFromSms(user.id, { text: sms });
      const result2 = await detectFromSms(user.id, { text: sms });
      
      expect(result1.detectionLog.id).not.toBe(result2.detectionLog.id);
    });
  });

  describe('detectFromSms', () => {
    it('should detect subscription from SMS', async () => {
      const result = await detectFromSms(user.id, {
        text: 'Your Netflix subscription of ₹499 has been charged',
      });

      expect(result.parsed.amount).toBe(499);
      expect(result.parsed.confidence).toBeGreaterThan(50);
      expect(result.suggestedAction).toBe('confirm');
    });

    it('should create detection log entry', async () => {
      const result = await detectFromSms(user.id, {
        text: 'Spotify Premium $9.99 charged',
      });

      expect(result.detectionLog.rawText).toBe('Spotify Premium $9.99 charged');
      expect(result.detectionLog.userId).toBe(user.id);
      expect(result.detectionLog.status).toBe('matched');
    });
  });

  describe('confirmDetection', () => {
    it('should create subscription when confirmed', async () => {
      const detectResult = await detectFromSms(user.id, {
        text: 'Your Netflix subscription of ₹499 has been charged',
      });

      const confirmResult = await confirmDetection(user.id, {
        detectionLogId: detectResult.detectionLog.id,
        confirmed: true,
        name: 'Netflix',
        amount: 499,
        billingCycle: 'monthly',
      });

      expect(confirmResult.message).toBe('Subscription created');
    });

    it('should reject detection without creating subscription', async () => {
      const detectResult = await detectFromSms(user.id, {
        text: 'Your Netflix subscription of ₹499 has been charged',
      });

      const confirmResult = await confirmDetection(user.id, {
        detectionLogId: detectResult.detectionLog.id,
        confirmed: false,
      });

      expect(confirmResult.message).toBe('Detection rejected');
    });

    it('should throw ValidationError when confirming without name/amount', async () => {
      const detectResult = await detectFromSms(user.id, {
        text: 'Your Netflix subscription of ₹499 has been charged',
      });

      await expect(
        confirmDetection(user.id, {
          detectionLogId: detectResult.detectionLog.id,
          confirmed: true,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for invalid log ID', async () => {
      await expect(
        confirmDetection(user.id, {
          detectionLogId: 'invalid-uuid',
          confirmed: true,
          name: 'Test',
          amount: 100,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getDetectionLogs', () => {
    it('should return all detection logs for user', async () => {
      await detectFromSms(user.id, { text: 'Netflix ₹499' });
      await detectFromSms(user.id, { text: 'Spotify $9.99' });

      const logs = await getDetectionLogs(user.id);
      expect(logs.length).toBe(2);
    });

    it('should filter logs by status', async () => {
      const result = await detectFromSms(user.id, { text: 'Netflix ₹499' });
      
      await confirmDetection(user.id, {
        detectionLogId: result.detectionLog.id,
        confirmed: false,
      });

      const logs = await getDetectionLogs(user.id, 'rejected');
      expect(logs.length).toBe(1);
      expect(logs[0].status).toBe('rejected');
    });
  });
});
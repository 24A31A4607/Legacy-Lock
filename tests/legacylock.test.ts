import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { LocalJsonRepository } from '../src/server/storage/repository.js';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  verifySessionToken,
} from '../src/server/auth.js';
import {
  RegisterSchema,
  LoginSchema,
  AssetCreateSchema,
  BeneficiarySchema,
  InstructionSchema,
  ReviewDecisionSchema,
} from '../src/types/index.js';

describe('LegacyLock Automated Test Suite', () => {
  const testDir = path.resolve(process.cwd(), 'tests_temp_data');
  let repo: LocalJsonRepository;

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    repo = new LocalJsonRepository(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('1. Authentication & Session Security', () => {
    it('hashes passwords securely and never stores plaintext', async () => {
      const plain = 'SecretPass123!';
      const hash = await hashPassword(plain);

      expect(hash).not.toBe(plain);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix

      const valid = await verifyPassword(plain, hash);
      expect(valid).toBe(true);

      const invalid = await verifyPassword('WrongPassword!', hash);
      expect(invalid).toBe(false);
    });

    it('creates a user and enforces unique email', async () => {
      const user = {
        id: 'usr_test_1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'owner' as const,
        passwordHash: await hashPassword('Pass123!'),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await repo.createUser(user);
      const retrieved = await repo.getUserByEmail('test@example.com');
      expect(retrieved?.fullName).toBe('Test User');

      // Duplicate email must throw
      await expect(repo.createUser({ ...user, id: 'usr_test_2' })).rejects.toThrow();
    });

    it('generates and verifies cryptographic session tokens with expiry', () => {
      const userId = 'usr_alice_123';
      const token = generateSessionToken(userId);
      expect(typeof token).toBe('string');

      const verified = verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(userId);

      // Corrupted token returns null
      const corrupted = token.slice(0, -4) + 'abcd';
      expect(verifySessionToken(corrupted)).toBeNull();
    });
  });

  describe('2. Digital Vault Asset Operations & Isolation', () => {
    it('creates, retrieves, and deletes assets for the owning user', async () => {
      const asset = {
        id: 'ast_100',
        userId: 'usr_owner_1',
        title: 'Last Will and Testament',
        description: 'Signed copy from 2026',
        category: 'Documents' as const,
        tags: ['legal', 'priority'],
        fileName: 'will.pdf',
        fileSize: 50000,
        mimeType: 'application/pdf',
        filePath: path.join(repo.uploadDir, 'will.pdf'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await repo.createAsset(asset);
      const userAssets = await repo.getAssetsByUser('usr_owner_1');
      expect(userAssets.length).toBe(1);
      expect(userAssets[0].title).toBe('Last Will and Testament');

      // Update asset
      await repo.updateAsset('ast_100', { title: 'Updated Will (2026 Edition)' });
      const updated = await repo.getAssetById('ast_100');
      expect(updated?.title).toBe('Updated Will (2026 Edition)');

      // Delete asset
      const deleted = await repo.deleteAsset('ast_100');
      expect(deleted).toBe(true);
      expect(await repo.getAssetById('ast_100')).toBeNull();
    });

    it('strictly isolates assets between different users (IDOR prevention)', async () => {
      await repo.createAsset({
        id: 'ast_user_a',
        userId: 'user_a',
        title: "User A's Secret Directives",
        description: 'Confidential',
        category: 'Personal Notes' as const,
        tags: [],
        fileName: 'notes.txt',
        fileSize: 100,
        mimeType: 'text/plain',
        filePath: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const userBAssets = await repo.getAssetsByUser('user_b');
      expect(userBAssets.length).toBe(0);
    });
  });

  describe('3. Beneficiary Management & Asset Allocation', () => {
    it('manages beneficiaries and records future access scopes', async () => {
      const ben = {
        id: 'ben_1',
        userId: 'user_a',
        fullName: 'Marcus Vance',
        email: 'marcus@example.com',
        relationship: 'Son',
        assignedAssetIds: ['ast_user_a'],
        assignedCategories: ['Documents' as const],
        futureAccessLevel: 'specific_assets' as const,
        status: 'confirmed' as const,
        createdAt: new Date().toISOString(),
      };

      await repo.createBeneficiary(ben);
      const list = await repo.getBeneficiariesByUser('user_a');
      expect(list.length).toBe(1);
      expect(list[0].assignedAssetIds).toContain('ast_user_a');
    });
  });

  describe('4. Legacy Instructions & Directives', () => {
    it('persists instructions with locked-until-succession state', async () => {
      const ins = {
        id: 'ins_1',
        userId: 'user_a',
        type: 'personal_message' as const,
        title: 'Letter to Marcus',
        content: 'Remember where you come from and cherish the memories.',
        isLockedUntilInheritance: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await repo.createInstruction(ins);
      const list = await repo.getInstructionsByUser('user_a');
      expect(list.length).toBe(1);
      expect(list[0].isLockedUntilInheritance).toBe(true);
    });
  });

  describe('5. Safety Cadence & Check-In Verification', () => {
    it('records check-in and refreshes next scheduled due date', async () => {
      const now = new Date();
      const settings = {
        id: 'chk_1',
        userId: 'user_a',
        frequencyDays: 30,
        gracePeriodDays: 7,
        lastCheckInAt: now.toISOString(),
        nextCheckInDue: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active' as const,
        reminderEmail: 'user_a@example.com',
        notifyBeneficiariesOnMissed: true,
      };

      await repo.saveCheckInSettings(settings);
      const loaded = await repo.getCheckInSettings('user_a');
      expect(loaded?.status).toBe('active');
      expect(loaded?.frequencyDays).toBe(30);

      // Add check-in event
      await repo.addCheckInEvent({
        id: 'evt_1',
        userId: 'user_a',
        eventType: 'user_confirmed',
        timestamp: new Date().toISOString(),
        ipOrOrigin: '127.0.0.1',
      });

      const events = await repo.getCheckInEvents('user_a');
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('user_confirmed');
    });
  });

  describe('6. Controlled Inheritance Workflow & Role Authorization', () => {
    it('progresses through submission, reviewer decision, and access revocation', async () => {
      const req = {
        id: 'req_1',
        userId: 'owner_user',
        beneficiaryId: 'ben_1',
        beneficiaryEmail: 'beneficiary@example.com',
        beneficiaryName: 'Beneficiary Name',
        status: 'Awaiting review' as const,
        evidenceMetadata: {
          declarationType: 'Simulated Incapacitation Filing',
          legalAttestationNotes: 'Demo evidence verified by doctor note',
          submittedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await repo.createRequest(req);
      const retrieved = await repo.getRequestById('req_1');
      expect(retrieved?.status).toBe('Awaiting review');

      // Authorized reviewer decision
      const updated = await repo.updateRequest('req_1', {
        status: 'Approved',
        reviewerId: 'reviewer_officer',
        reviewerNotes: 'Verified supporting attestation grounds.',
        decidedAt: new Date().toISOString(),
      });
      expect(updated?.status).toBe('Approved');

      // Revocation
      const revoked = await repo.updateRequest('req_1', {
        status: 'Access revoked',
        reviewerNotes: 'Revoked by vault owner.',
      });
      expect(revoked?.status).toBe('Access revoked');
    });
  });

  describe('7. Zod Schema Input Validation', () => {
    it('validates register inputs correctly', () => {
      const valid = RegisterSchema.safeParse({
        email: 'valid@example.com',
        password: 'ValidPass123!',
        fullName: 'John Doe',
        role: 'owner',
      });
      expect(valid.success).toBe(true);

      const invalidEmail = RegisterSchema.safeParse({
        email: 'not-an-email',
        password: 'Short',
        fullName: '',
      });
      expect(invalidEmail.success).toBe(false);
    });

    it('validates review decisions strictly', () => {
      const valid = ReviewDecisionSchema.safeParse({
        decision: 'Approved',
        notes: 'Documented rationale grounds are clear.',
      });
      expect(valid.success).toBe(true);

      const invalidDecision = ReviewDecisionSchema.safeParse({
        decision: 'RandomCustomDecision',
        notes: 'Short',
      });
      expect(invalidDecision.success).toBe(false);
    });
  });
});

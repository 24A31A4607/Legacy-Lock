import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { LegacyDbData } from './storage/repository.js';
import {
  User,
  Asset,
  Beneficiary,
  LegacyInstruction,
  CheckInSettings,
  CheckInEvent,
  InheritanceRequest,
  AuditLog,
  InAppNotification,
} from '../types/index.js';

export async function getSeedData(uploadDir: string): Promise<LegacyDbData> {
  const salt = await bcrypt.genSalt(10);
  const ownerHash = await bcrypt.hash('LegacyPass123!', salt);
  const reviewerHash = await bcrypt.hash('ReviewerPass123!', salt);
  const beneficiaryHash = await bcrypt.hash('MarcusPass123!', salt);

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const twentySevenDaysAhead = new Date(now.getTime() + 27 * 24 * 60 * 60 * 1000).toISOString();

  // Create sample physical files in uploadDir so download and preview actually work
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const sampleDocPath = path.join(uploadDir, 'estate_planning_memo.pdf');
  if (!fs.existsSync(sampleDocPath)) {
    fs.writeFileSync(
      sampleDocPath,
      `%PDF-1.4\n%LegacyLock Sample Document\n1 0 obj\n<< /Title (Estate Planning Memorandum & Asset Map) /Author (Eleanor Vance) >>\nendobj\nTRAILER\n%%EOF\nSample estate overview document created for demonstration.`
    );
  }

  const sampleNotesPath = path.join(uploadDir, 'crypto_safe_deposit_instructions.txt');
  if (!fs.existsSync(sampleNotesPath)) {
    fs.writeFileSync(
      sampleNotesPath,
      `LEGACYLOCK SAFE VAULT DIRECTIVE\nAsset: Secure Hardware Storage & Deposit Box Key\n\nLocation: First National Bank Vault, Safety Box #418.\nKey Location: Home study mahogany credenza, false drawer bottom.\nInstructions: Present original death certificate or certified legacy power of attorney along with dual-signatory verification.\n\nNote: This is simulated demo data.`
    );
  }

  const ownerUser: User = {
    id: 'usr_eleanor_vance_01',
    email: 'eleanor@example.com',
    fullName: 'Eleanor Vance',
    role: 'owner',
    passwordHash: ownerHash,
    avatarUrl: '/src/assets/images/avatar_primary_user_1791724299537.jpg',
    createdAt: new Date('2025-11-15T09:00:00Z').toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  const reviewerUser: User = {
    id: 'usr_reviewer_sterling_02',
    email: 'reviewer@example.com',
    fullName: 'Arthur Sterling (Designated Reviewer)',
    role: 'reviewer',
    passwordHash: reviewerHash,
    createdAt: new Date('2025-10-01T08:00:00Z').toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  const beneficiaryUser: User = {
    id: 'usr_marcus_vance_03',
    email: 'marcus@example.com',
    fullName: 'Marcus Vance',
    role: 'beneficiary',
    passwordHash: beneficiaryHash,
    avatarUrl: '/src/assets/images/avatar_beneficiary_marcus_1791724314584.jpg',
    createdAt: new Date('2025-12-01T10:00:00Z').toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  const assets: Asset[] = [
    {
      id: 'ast_memo_001',
      userId: ownerUser.id,
      title: 'Estate Planning Memorandum & Asset Map (2026)',
      description: 'Comprehensive overview of family trust, real estate holdings, and corporate equity directives.',
      category: 'Documents',
      tags: ['estate', 'legal', 'trust', 'priority'],
      fileName: 'estate_planning_memo.pdf',
      fileSize: 245760,
      mimeType: 'application/pdf',
      filePath: sampleDocPath,
      previewUrl: '/api/assets/ast_memo_001/download',
      createdAt: new Date('2026-01-10T14:30:00Z').toISOString(),
      updatedAt: new Date('2026-01-10T14:30:00Z').toISOString(),
    },
    {
      id: 'ast_photo_002',
      userId: ownerUser.id,
      title: 'Family Archival Photographs & 2024 Reunion Album',
      description: 'Curated high-resolution scans of family archives, childhood memories, and ancestral genealogy.',
      category: 'Photos & Memories',
      tags: ['family', 'memories', 'photos', 'archive'],
      fileName: 'avatar_primary_user.jpg',
      fileSize: 1048576,
      mimeType: 'image/jpeg',
      filePath: sampleDocPath, // fallback pointer
      previewUrl: '/src/assets/images/avatar_primary_user_1791724299537.jpg',
      createdAt: new Date('2026-01-15T11:20:00Z').toISOString(),
      updatedAt: new Date('2026-01-15T11:20:00Z').toISOString(),
    },
    {
      id: 'ast_accounts_003',
      userId: ownerUser.id,
      title: 'Primary Banking & Vanguard Portfolio Account Directives',
      description: 'Account identifiers, institution branches, and designated beneficiary transfer instructions.',
      category: 'Account Records',
      tags: ['finances', 'vanguard', 'banking'],
      fileName: 'financial_directives_summary.pdf',
      fileSize: 182400,
      mimeType: 'application/pdf',
      filePath: sampleDocPath,
      previewUrl: '/api/assets/ast_accounts_003/download',
      createdAt: new Date('2026-02-01T09:15:00Z').toISOString(),
      updatedAt: new Date('2026-02-01T09:15:00Z').toISOString(),
    },
    {
      id: 'ast_notes_004',
      userId: ownerUser.id,
      title: 'Personal Letter to Marcus & Sophia regarding the Coastal Cottage',
      description: 'Personal reflections, fond memories of summers at the coast, and wishes for future stewardship.',
      category: 'Personal Notes',
      tags: ['personal', 'letter', 'cottage'],
      fileName: 'letter_to_children.txt',
      fileSize: 34500,
      mimeType: 'text/plain',
      filePath: sampleNotesPath,
      previewUrl: '/api/assets/ast_notes_004/download',
      createdAt: new Date('2026-02-14T16:45:00Z').toISOString(),
      updatedAt: new Date('2026-02-14T16:45:00Z').toISOString(),
    },
    {
      id: 'ast_crypto_005',
      userId: ownerUser.id,
      title: 'Hardware Wallet Storage Guide & Safety Deposit Key Details',
      description: 'Physical vault coordinates and access protocols for Coldcard key backup.',
      category: 'Account Records',
      tags: ['security', 'hardware-wallet', 'deposit-box'],
      fileName: 'crypto_safe_deposit_instructions.txt',
      fileSize: 42100,
      mimeType: 'text/plain',
      filePath: sampleNotesPath,
      previewUrl: '/api/assets/ast_crypto_005/download',
      createdAt: new Date('2026-03-01T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-03-01T10:00:00Z').toISOString(),
    },
  ];

  const beneficiaries: Beneficiary[] = [
    {
      id: 'ben_marcus_01',
      userId: ownerUser.id,
      fullName: 'Marcus Vance',
      email: 'marcus@example.com',
      relationship: 'Son & Designated Executor',
      phone: '+1 (555) 234-8901',
      notes: 'Primary executor named in family trust. Authorized to initiate legacy succession review upon verified need.',
      assignedAssetIds: ['ast_memo_001', 'ast_photo_002', 'ast_notes_004'],
      assignedCategories: ['Documents', 'Photos & Memories', 'Personal Notes'],
      futureAccessLevel: 'full',
      status: 'confirmed',
      avatarUrl: '/src/assets/images/avatar_beneficiary_marcus_1791724314584.jpg',
      createdAt: new Date('2025-12-05T12:00:00Z').toISOString(),
    },
    {
      id: 'ben_sophia_02',
      userId: ownerUser.id,
      fullName: 'Dr. Sophia Lin',
      email: 'sophia.lin@example.com',
      relationship: 'Sister & Medical Trustee',
      phone: '+1 (555) 876-5432',
      notes: 'Consulting physician for healthcare directives and co-trustee of family educational fund.',
      assignedAssetIds: ['ast_memo_001', 'ast_accounts_003'],
      assignedCategories: ['Documents', 'Account Records'],
      futureAccessLevel: 'specific_assets',
      status: 'confirmed',
      avatarUrl: '/src/assets/images/avatar_beneficiary_sophia_1791724329816.jpg',
      createdAt: new Date('2025-12-10T14:30:00Z').toISOString(),
    },
  ];

  const instructions: LegacyInstruction[] = [
    {
      id: 'ins_personal_001',
      userId: ownerUser.id,
      beneficiaryId: 'ben_marcus_01',
      type: 'personal_message',
      title: 'A Message to Marcus on Integrity and Resilience',
      content:
        'Marcus, remember that wealth is not merely numbers on an account ledger; it is the time you share with those you love and the integrity with which you treat others. Take care of your sister and keep the coastal garden alive.',
      isLockedUntilInheritance: true,
      createdAt: new Date('2026-01-20T15:00:00Z').toISOString(),
      updatedAt: new Date('2026-01-20T15:00:00Z').toISOString(),
    },
    {
      id: 'ins_directive_002',
      userId: ownerUser.id,
      beneficiaryId: null,
      type: 'general_directive',
      title: 'Digital Footprint Closure & Subscription Cancellation Protocol',
      content:
        'Please execute immediate cancellation of ongoing SaaS subscriptions (AWS, GitHub, Google One, Bloomberg Terminal). Export the Google Photos archive and transfer ownership of family domains to Marcus.',
      isLockedUntilInheritance: true,
      createdAt: new Date('2026-02-05T11:00:00Z').toISOString(),
      updatedAt: new Date('2026-02-05T11:00:00Z').toISOString(),
    },
    {
      id: 'ins_distribution_003',
      userId: ownerUser.id,
      beneficiaryId: 'ben_sophia_02',
      type: 'asset_distribution',
      title: 'Allocation of Rare Book Collection & Archival Manuscripts',
      content:
        'The vintage scientific monographs and personal correspondence in the study library are bequeathed to Dr. Sophia Lin for perpetual donation to the University Rare Manuscripts reading room.',
      isLockedUntilInheritance: true,
      createdAt: new Date('2026-02-18T16:20:00Z').toISOString(),
      updatedAt: new Date('2026-02-18T16:20:00Z').toISOString(),
    },
  ];

  const checkInSettings: CheckInSettings = {
    id: 'chk_settings_01',
    userId: ownerUser.id,
    frequencyDays: 30,
    gracePeriodDays: 7,
    lastCheckInAt: threeDaysAgo,
    nextCheckInDue: twentySevenDaysAhead,
    status: 'active',
    reminderEmail: 'eleanor@example.com',
    notifyBeneficiariesOnMissed: true,
  };

  const checkInEvents: CheckInEvent[] = [
    {
      id: 'chk_evt_001',
      userId: ownerUser.id,
      eventType: 'user_confirmed',
      timestamp: threeDaysAgo,
      ipOrOrigin: '192.168.1.45 (Owner Session)',
      notes: 'Periodic check-in verified successfully. Next cycle refreshed.',
    },
    {
      id: 'chk_evt_002',
      userId: ownerUser.id,
      eventType: 'user_confirmed',
      timestamp: new Date(now.getTime() - 33 * 24 * 60 * 60 * 1000).toISOString(),
      ipOrOrigin: '192.168.1.45 (Owner Session)',
      notes: 'Check-in confirmed on schedule.',
    },
  ];

  const inheritanceRequests: InheritanceRequest[] = [
    {
      id: 'req_inheritance_demo_01',
      userId: ownerUser.id,
      beneficiaryId: 'ben_marcus_01',
      beneficiaryEmail: 'marcus@example.com',
      beneficiaryName: 'Marcus Vance',
      status: 'Awaiting review',
      evidenceMetadata: {
        declarationType: 'Simulated Incapacitation / Absence Declaration',
        legalAttestationNotes:
          'Prototype demonstration filing: Marcus Vance has submitted simulated attestation per protocol v2.4. Awaiting verification review from Arthur Sterling.',
        certificateReference: 'SIM-NOTARY-2026-7894',
        submittedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud_001',
      userId: ownerUser.id,
      userEmail: ownerUser.email,
      action: 'LOGIN_SUCCESS',
      details: 'User authenticated via local credential session',
      ip: '127.0.0.1',
      timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'aud_002',
      userId: ownerUser.id,
      userEmail: ownerUser.email,
      action: 'CHECKIN_CONFIRMED',
      details: 'User confirmed OK status. Reset cadence to 30 days.',
      ip: '127.0.0.1',
      timestamp: threeDaysAgo,
    },
    {
      id: 'aud_003',
      userId: ownerUser.id,
      userEmail: ownerUser.email,
      action: 'ASSET_UPLOAD',
      details: 'Uploaded "Estate Planning Memorandum & Asset Map (2026)" (240 KB)',
      ip: '127.0.0.1',
      timestamp: new Date('2026-01-10T14:30:00Z').toISOString(),
    },
    {
      id: 'aud_004',
      userId: beneficiaryUser.id,
      userEmail: beneficiaryUser.email,
      action: 'INHERITANCE_REQUEST_SUBMITTED',
      details: 'Beneficiary Marcus Vance submitted simulated inheritance claim for review queue',
      ip: '127.0.0.1',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const notifications: InAppNotification[] = [
    {
      id: 'notif_001',
      userId: ownerUser.id,
      title: 'Check-in Cycle Active',
      message: 'Your next periodic safety check-in is scheduled in 27 days.',
      type: 'info',
      read: false,
      createdAt: threeDaysAgo,
    },
    {
      id: 'notif_002',
      userId: ownerUser.id,
      title: 'Beneficiary Confirmed',
      message: 'Marcus Vance confirmed recipient contact details and accepted designated executor role.',
      type: 'success',
      read: true,
      createdAt: new Date('2025-12-06T09:00:00Z').toISOString(),
    },
    {
      id: 'notif_003',
      userId: reviewerUser.id,
      title: 'Review Queue Alert',
      message: 'A simulated inheritance request from Marcus Vance is awaiting review.',
      type: 'warning',
      read: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return {
    users: [ownerUser, reviewerUser, beneficiaryUser],
    assets,
    beneficiaries,
    instructions,
    checkInSettings: [checkInSettings],
    checkInEvents,
    inheritanceRequests,
    auditLogs,
    notifications,
  };
}

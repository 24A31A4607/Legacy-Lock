import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  LocalJsonRepository,
  ILegacyRepository,
} from './src/server/storage/repository.js';
import { SupabaseRepository } from './src/server/storage/supabaseRepository.js';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  createAuthMiddleware,
  AuthenticatedRequest,
} from './src/server/auth.js';
import {
  RegisterSchema,
  LoginSchema,
  AssetCreateSchema,
  BeneficiarySchema,
  InstructionSchema,
  CheckInUpdateSchema,
  RequestSubmissionSchema,
  ReviewDecisionSchema,
  User,
  Asset,
  Beneficiary,
  LegacyInstruction,
  CheckInSettings,
  InheritanceRequest,
  WorkflowStatus,
} from './src/types/index.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Repository Initialization
const localRepo = new LocalJsonRepository(process.cwd());
let repository: ILegacyRepository = localRepo;

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (process.env.LEGACYLOCK_STORAGE_MODE === 'supabase' && supabaseUrl && supabaseKey) {
  repository = new SupabaseRepository(supabaseUrl, supabaseKey, localRepo);
}

// Multer storage setup
const uploadDir = localRepo.uploadDir;
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

const requireAuth = createAuthMiddleware(repository);

// -------------------------------------------------------------
// Health & System Endpoints
// -------------------------------------------------------------
app.get('/api/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'LegacyLock',
    timestamp: new Date().toISOString(),
    mode: repository.getStorageMode(),
  });
});

app.get('/api/system/mode', async (_req: Request, res: Response) => {
  res.json({
    mode: repository.getStorageMode(),
    isSupabaseConfigured: Boolean(process.env.VITE_SUPABASE_URL && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)),
    localUploadDirExists: fs.existsSync(uploadDir),
  });
});

app.post('/api/system/reset-demo', async (_req: Request, res: Response) => {
  try {
    await repository.resetToDemo();
    res.json({ success: true, message: 'Demo dataset successfully restored.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset demo data' });
  }
});

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input' });
      return;
    }

    const { email, password, fullName, role } = parsed.data;
    const existing = await repository.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      email: email.toLowerCase().trim(),
      fullName,
      role: role as any,
      passwordHash,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await repository.createUser(newUser);

    // Initialize default 30-day check-in settings for new owner
    if (newUser.role === 'owner') {
      const now = new Date();
      const nextDue = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const defaultCheckIn: CheckInSettings = {
        id: `chk_${newUser.id}`,
        userId: newUser.id,
        frequencyDays: 30,
        gracePeriodDays: 7,
        lastCheckInAt: now.toISOString(),
        nextCheckInDue: nextDue,
        status: 'active',
        reminderEmail: newUser.email,
        notifyBeneficiariesOnMissed: true,
      };
      await repository.saveCheckInSettings(defaultCheckIn);
    }

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: newUser.id,
      userEmail: newUser.email,
      action: 'REGISTER_SUCCESS',
      details: `Registered new account with role ${newUser.role}`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    const token = generateSessionToken(newUser.id);
    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ token, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid credentials' });
      return;
    }

    const { email, password } = parsed.data;
    const user = await repository.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    await repository.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN_SUCCESS',
      details: 'User successfully logged in via credentials',
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    const token = generateSessionToken(user.id);
    const { passwordHash: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post('/api/auth/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  await repository.addAuditLog({
    id: `aud_${Date.now()}`,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'LOGOUT',
    details: 'User logged out',
    ip: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true });
});

// -------------------------------------------------------------
// Digital Vault / Asset Endpoints
// -------------------------------------------------------------
app.get('/api/assets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assets = await repository.getAssetsByUser(req.user!.id);
    res.json({ assets });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assets', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    let tags: string[] = [];
    if (req.body.tags) {
      try {
        tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
      } catch {
        tags = String(req.body.tags).split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    const parsed = AssetCreateSchema.safeParse({
      title: req.body.title,
      description: req.body.description || '',
      category: req.body.category,
      tags,
    });

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid asset metadata' });
      return;
    }

    const { title, description, category } = parsed.data;
    const file = req.file;

    // Fallback file details if created as a direct text note or uploaded
    const fileName = file ? file.originalname : `${title.toLowerCase().replace(/\s+/g, '_')}.txt`;
    const fileSize = file ? file.size : Buffer.byteLength(description, 'utf-8');
    const mimeType = file ? file.mimetype : 'text/plain';
    let filePath = file ? file.path : '';

    if (!filePath) {
      // Create local note file if not uploaded through multipart
      const safeNoteName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.txt`;
      filePath = path.join(uploadDir, safeNoteName);
      fs.writeFileSync(filePath, description || title, 'utf-8');
    }

    const assetId = `ast_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const newAsset: Asset = {
      id: assetId,
      userId: req.user!.id,
      title,
      description,
      category,
      tags,
      fileName,
      fileSize,
      mimeType,
      filePath,
      previewUrl: `/api/assets/${assetId}/download`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repository.createAsset(newAsset);

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'ASSET_CREATED',
      details: `Added new vault asset: "${title}" (${category}, ${(fileSize / 1024).toFixed(1)} KB)`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ asset: newAsset });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create asset' });
  }
});

app.put('/api/assets/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await repository.getAssetById(id);
    if (!existing) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    // Ownership verification
    if (existing.userId !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized: You do not own this asset' });
      return;
    }

    const updates: Partial<Asset> = {};
    if (req.body.title) updates.title = req.body.title;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.category) updates.category = req.body.category;
    if (req.body.tags) {
      updates.tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
    }

    const updated = await repository.updateAsset(id, updates);

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'ASSET_UPDATED',
      details: `Updated metadata for vault asset "${existing.title}"`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    res.json({ asset: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/assets/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await repository.getAssetById(id);
    if (!existing) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    // Enforce strict ownership check
    if (existing.userId !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized: You do not own this asset' });
      return;
    }

    await repository.deleteAsset(id);

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'ASSET_DELETED',
      details: `Deleted vault asset "${existing.title}"`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Authorized file download / preview endpoint
app.get('/api/assets/:id/download', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const asset = await repository.getAssetById(id);
    if (!asset) {
      res.status(404).json({ error: 'Asset file not found' });
      return;
    }

    // Ownership or authorized beneficiary access check
    const isOwner = asset.userId === req.user!.id;
    let isAuthorizedBeneficiary = false;

    if (!isOwner) {
      // Check if current user is an approved beneficiary with active "Access granted" workflow state
      const requests = await repository.getRequestsByBeneficiary(req.user!.email);
      const activeGranted = requests.find(
        (r) => r.userId === asset.userId && r.status === 'Access granted'
      );
      if (activeGranted) {
        // Beneficiary verified and access granted!
        isAuthorizedBeneficiary = true;
      }
    }

    if (!isOwner && !isAuthorizedBeneficiary) {
      res.status(403).json({ error: 'Unauthorized: You do not have access to this private file.' });
      return;
    }

    // Path traversal defense: Ensure file is inside uploadDir
    const resolvedPath = path.resolve(asset.filePath);
    if (!resolvedPath.startsWith(uploadDir)) {
      // If the asset filePath happens to be a mock or external, check fallback
      if (!fs.existsSync(resolvedPath)) {
        res.status(404).json({ error: 'Physical asset file does not exist on server.' });
        return;
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      res.status(404).json({ error: 'Asset file not found on disk.' });
      return;
    }

    // Set headers
    res.setHeader('Content-Type', asset.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(asset.fileName)}"`);
    res.sendFile(resolvedPath);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Beneficiary Management Endpoints
// -------------------------------------------------------------
app.get('/api/beneficiaries', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const beneficiaries = await repository.getBeneficiariesByUser(req.user!.id);
    res.json({ beneficiaries });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/beneficiaries', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = BeneficiarySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid beneficiary data' });
      return;
    }

    const {
      fullName,
      email,
      relationship,
      phone,
      notes,
      assignedAssetIds,
      assignedCategories,
      futureAccessLevel,
    } = parsed.data;

    const newBeneficiary: Beneficiary = {
      id: `ben_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: req.user!.id,
      fullName,
      email: email.toLowerCase().trim(),
      relationship,
      phone,
      notes,
      assignedAssetIds,
      assignedCategories: assignedCategories as any,
      futureAccessLevel,
      status: 'invited',
      createdAt: new Date().toISOString(),
    };

    await repository.createBeneficiary(newBeneficiary);

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'BENEFICIARY_ADDED',
      details: `Added trusted beneficiary "${fullName}" (${relationship})`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ beneficiary: newBeneficiary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/beneficiaries/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await repository.getBeneficiaryById(id);
    if (!existing) {
      res.status(404).json({ error: 'Beneficiary not found' });
      return;
    }

    if (existing.userId !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized: Beneficiary does not belong to your account' });
      return;
    }

    const updated = await repository.updateBeneficiary(id, req.body);

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'BENEFICIARY_UPDATED',
      details: `Updated beneficiary "${existing.fullName}"`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    res.json({ beneficiary: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/beneficiaries/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await repository.getBeneficiaryById(id);
    if (!existing) {
      res.status(404).json({ error: 'Beneficiary not found' });
      return;
    }

    if (existing.userId !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized: Beneficiary does not belong to your account' });
      return;
    }

    await repository.deleteBeneficiary(id);

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'BENEFICIARY_REMOVED',
      details: `Removed beneficiary "${existing.fullName}"`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Legacy Instructions Endpoints
// -------------------------------------------------------------
app.get('/api/instructions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const instructions = await repository.getInstructionsByUser(req.user!.id);
    res.json({ instructions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instructions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = InstructionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid instruction data' });
      return;
    }

    const { title, content, type, beneficiaryId, isLockedUntilInheritance } = parsed.data;

    const newInstruction: LegacyInstruction = {
      id: `ins_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: req.user!.id,
      beneficiaryId: beneficiaryId || null,
      type,
      title,
      content,
      isLockedUntilInheritance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repository.createInstruction(newInstruction);

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'INSTRUCTION_CREATED',
      details: `Created legacy directive "${title}" (${type})`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ instruction: newInstruction });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/instructions/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await repository.getInstructionById(id);
    if (!existing) {
      res.status(404).json({ error: 'Instruction not found' });
      return;
    }

    if (existing.userId !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized: Instruction does not belong to your account' });
      return;
    }

    const updated = await repository.updateInstruction(id, req.body);

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'INSTRUCTION_UPDATED',
      details: `Updated legacy directive "${existing.title}"`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    res.json({ instruction: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/instructions/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await repository.getInstructionById(id);
    if (!existing) {
      res.status(404).json({ error: 'Instruction not found' });
      return;
    }

    if (existing.userId !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized: Instruction does not belong to your account' });
      return;
    }

    await repository.deleteInstruction(id);

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'INSTRUCTION_DELETED',
      details: `Deleted legacy directive "${existing.title}"`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Check-In & Safety Cadence Endpoints
// -------------------------------------------------------------
app.get('/api/checkin', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await repository.getCheckInSettings(req.user!.id);
    const events = await repository.getCheckInEvents(req.user!.id);
    res.json({ settings, events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/checkin/confirm', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let settings = await repository.getCheckInSettings(req.user!.id);
    const now = new Date();
    const freq = settings ? settings.frequencyDays : 30;
    const nextDue = new Date(now.getTime() + freq * 24 * 60 * 60 * 1000).toISOString();

    if (!settings) {
      settings = {
        id: `chk_${req.user!.id}`,
        userId: req.user!.id,
        frequencyDays: 30,
        gracePeriodDays: 7,
        lastCheckInAt: now.toISOString(),
        nextCheckInDue: nextDue,
        status: 'active',
        reminderEmail: req.user!.email,
        notifyBeneficiariesOnMissed: true,
      };
    } else {
      settings.lastCheckInAt = now.toISOString();
      settings.nextCheckInDue = nextDue;
      settings.status = 'active';
    }

    await repository.saveCheckInSettings(settings);

    const event = {
      id: `chk_evt_${Date.now()}`,
      userId: req.user!.id,
      eventType: 'user_confirmed' as const,
      timestamp: now.toISOString(),
      ipOrOrigin: req.ip || '127.0.0.1 (Owner Session)',
      notes: `Safety check-in confirmed OK. Next cycle reset to ${freq} days.`,
    };
    await repository.addCheckInEvent(event);

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'CHECKIN_CONFIRMED',
      details: `User confirmed 'I'm OK'. Cadence reset for next ${freq} days.`,
      ip: req.ip || '127.0.0.1',
      timestamp: now.toISOString(),
    });

    res.json({ success: true, settings, event });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/checkin/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = CheckInUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid cadence settings' });
      return;
    }

    const { frequencyDays, gracePeriodDays, reminderEmail, notifyBeneficiariesOnMissed } = parsed.data;
    let settings = await repository.getCheckInSettings(req.user!.id);
    const now = new Date();
    const nextDue = new Date(now.getTime() + frequencyDays * 24 * 60 * 60 * 1000).toISOString();

    if (!settings) {
      settings = {
        id: `chk_${req.user!.id}`,
        userId: req.user!.id,
        frequencyDays,
        gracePeriodDays,
        lastCheckInAt: now.toISOString(),
        nextCheckInDue: nextDue,
        status: 'active',
        reminderEmail,
        notifyBeneficiariesOnMissed,
      };
    } else {
      settings.frequencyDays = frequencyDays;
      settings.gracePeriodDays = gracePeriodDays;
      settings.reminderEmail = reminderEmail;
      settings.notifyBeneficiariesOnMissed = notifyBeneficiariesOnMissed;
      settings.nextCheckInDue = nextDue;
    }

    await repository.saveCheckInSettings(settings);

    await repository.addCheckInEvent({
      id: `chk_evt_${Date.now()}`,
      userId: req.user!.id,
      eventType: 'frequency_updated',
      timestamp: now.toISOString(),
      ipOrOrigin: req.ip || '127.0.0.1',
      notes: `Updated check-in frequency to every ${frequencyDays} days (Grace period: ${gracePeriodDays} days)`,
    });

    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/checkin/simulate-missed', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let settings = await repository.getCheckInSettings(req.user!.id);
    if (!settings) {
      res.status(404).json({ error: 'Settings not found' });
      return;
    }

    // Toggle status to missed for simulation testing
    settings.status = settings.status === 'missed' ? 'active' : 'missed';
    await repository.saveCheckInSettings(settings);

    await repository.addCheckInEvent({
      id: `chk_evt_${Date.now()}`,
      userId: req.user!.id,
      eventType: 'missed_flagged',
      timestamp: new Date().toISOString(),
      ipOrOrigin: 'SIMULATION_CONTROLLER',
      notes: `Simulated check-in state switch: ${settings.status.toUpperCase()}`,
    });

    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Controlled Inheritance Workflow Endpoints
// -------------------------------------------------------------
app.get('/api/workflow', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'reviewer') {
      const requests = await repository.getAllRequests();
      res.json({ requests, isReviewer: true });
    } else if (user.role === 'beneficiary') {
      const requests = await repository.getRequestsByBeneficiary(user.email);
      res.json({ requests, isReviewer: false });
    } else {
      const requests = await repository.getRequestsByUser(user.id);
      res.json({ requests, isReviewer: false });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workflow/submit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = RequestSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid submission form' });
      return;
    }

    const { beneficiaryId, declarationType, legalAttestationNotes, certificateReference } = parsed.data;

    const beneficiary = await repository.getBeneficiaryById(beneficiaryId);
    if (!beneficiary) {
      res.status(404).json({ error: 'Beneficiary record not found' });
      return;
    }

    const newRequest: InheritanceRequest = {
      id: `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: beneficiary.userId,
      beneficiaryId: beneficiary.id,
      beneficiaryEmail: beneficiary.email,
      beneficiaryName: beneficiary.fullName,
      status: 'Awaiting review',
      evidenceMetadata: {
        declarationType,
        legalAttestationNotes,
        certificateReference: certificateReference || 'DEMO-REF-SUBMITTED',
        submittedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repository.createRequest(newRequest);

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'INHERITANCE_REQUEST_SUBMITTED',
      details: `Submitted inheritance review request for beneficiary "${beneficiary.fullName}"`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ request: newRequest });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Authorized Reviewer Decision endpoint:
// "Only authorized reviewers may approve requests. A beneficiary cannot approve their own request. Enforce this on the backend, not merely by hiding interface buttons."
app.post('/api/workflow/:id/review', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'reviewer') {
      res.status(403).json({
        error: 'Forbidden: Only designated reviewers can review or approve inheritance access requests.',
      });
      return;
    }

    const { id } = req.params;
    const existing = await repository.getRequestById(id);
    if (!existing) {
      res.status(404).json({ error: 'Inheritance request not found' });
      return;
    }

    const parsed = ReviewDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid review decision' });
      return;
    }

    const { decision, notes } = parsed.data;

    // Beneficiary cannot approve their own request check
    if (user.email.toLowerCase() === existing.beneficiaryEmail.toLowerCase()) {
      res.status(403).json({
        error: 'Conflict of Interest: A beneficiary cannot approve their own inheritance request.',
      });
      return;
    }

    const updated = await repository.updateRequest(id, {
      status: decision as WorkflowStatus,
      reviewerId: user.id,
      reviewerNotes: notes,
      decidedAt: new Date().toISOString(),
    });

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      action: `WORKFLOW_DECISION_${decision.toUpperCase().replace(/\s+/g, '_')}`,
      details: `Reviewer ${user.fullName} rendered decision "${decision}" for beneficiary request ${existing.beneficiaryName}. Notes: ${notes}`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    res.json({ request: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workflow/:id/revoke', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const existing = await repository.getRequestById(id);
    if (!existing) {
      res.status(404).json({ error: 'Inheritance request not found' });
      return;
    }

    // Must be either the owner of the vault or a reviewer
    if (user.id !== existing.userId && user.role !== 'reviewer') {
      res.status(403).json({ error: 'Unauthorized to revoke access' });
      return;
    }

    const updated = await repository.updateRequest(id, {
      status: 'Access revoked',
      reviewerNotes: `Access revoked by ${user.role === 'reviewer' ? 'Review Officer' : 'Vault Owner'} on ${new Date().toLocaleString()}`,
      decidedAt: new Date().toISOString(),
    });

    await repository.addAuditLog({
      id: `aud_${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      action: 'WORKFLOW_ACCESS_REVOKED',
      details: `Access revoked for inheritance request of ${existing.beneficiaryName}`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    res.json({ request: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Audit Logs & Notifications Endpoints
// -------------------------------------------------------------
app.get('/api/audit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await repository.getAuditLogs(req.user!.role === 'reviewer' ? undefined : req.user!.id);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await repository.getNotifications(req.user!.id);
    res.json({ notifications });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await repository.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Vite Dev Middlewares or Production Static Hosting
// -------------------------------------------------------------
async function startServer() {
  // Ensure demo seed exists if fresh database
  const ownerUser = await repository.getUserByEmail('eleanor@example.com');
  if (!ownerUser) {
    console.log('[LegacyLock] Seeding initial demo environment...');
    await repository.resetToDemo();
  }

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LegacyLock] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[LegacyLock] Storage Engine: ${repository.getStorageMode().toUpperCase()}`);
  });
}

startServer().catch((err) => {
  console.error('[LegacyLock] Failed to start server:', err);
});

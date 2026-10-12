import fs from 'fs';
import path from 'path';
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
} from '../../types/index.js';

export interface LegacyDbData {
  users: User[];
  assets: Asset[];
  beneficiaries: Beneficiary[];
  instructions: LegacyInstruction[];
  checkInSettings: CheckInSettings[];
  checkInEvents: CheckInEvent[];
  inheritanceRequests: InheritanceRequest[];
  auditLogs: AuditLog[];
  notifications: InAppNotification[];
}

export interface ILegacyRepository {
  // Users
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(user: User): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;

  // Assets
  getAssetsByUser(userId: string): Promise<Asset[]>;
  getAssetById(id: string): Promise<Asset | null>;
  createAsset(asset: Asset): Promise<Asset>;
  updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | null>;
  deleteAsset(id: string): Promise<boolean>;

  // Beneficiaries
  getBeneficiariesByUser(userId: string): Promise<Beneficiary[]>;
  getBeneficiaryById(id: string): Promise<Beneficiary | null>;
  createBeneficiary(beneficiary: Beneficiary): Promise<Beneficiary>;
  updateBeneficiary(id: string, updates: Partial<Beneficiary>): Promise<Beneficiary | null>;
  deleteBeneficiary(id: string): Promise<boolean>;

  // Legacy Instructions
  getInstructionsByUser(userId: string): Promise<LegacyInstruction[]>;
  getInstructionById(id: string): Promise<LegacyInstruction | null>;
  createInstruction(instruction: LegacyInstruction): Promise<LegacyInstruction>;
  updateInstruction(id: string, updates: Partial<LegacyInstruction>): Promise<LegacyInstruction | null>;
  deleteInstruction(id: string): Promise<boolean>;

  // Check-In
  getCheckInSettings(userId: string): Promise<CheckInSettings | null>;
  saveCheckInSettings(settings: CheckInSettings): Promise<CheckInSettings>;
  getCheckInEvents(userId: string): Promise<CheckInEvent[]>;
  addCheckInEvent(event: CheckInEvent): Promise<CheckInEvent>;

  // Inheritance Requests
  getAllRequests(): Promise<InheritanceRequest[]>;
  getRequestsByUser(userId: string): Promise<InheritanceRequest[]>;
  getRequestsByBeneficiary(beneficiaryEmail: string): Promise<InheritanceRequest[]>;
  getRequestById(id: string): Promise<InheritanceRequest | null>;
  createRequest(req: InheritanceRequest): Promise<InheritanceRequest>;
  updateRequest(id: string, updates: Partial<InheritanceRequest>): Promise<InheritanceRequest | null>;

  // Audit Logs
  getAuditLogs(userId?: string): Promise<AuditLog[]>;
  addAuditLog(log: AuditLog): Promise<AuditLog>;

  // Notifications
  getNotifications(userId: string): Promise<InAppNotification[]>;
  addNotification(notif: InAppNotification): Promise<InAppNotification>;
  markNotificationRead(id: string): Promise<boolean>;

  // Lifecycle
  resetToDemo(): Promise<void>;
  getStorageMode(): 'local' | 'supabase';
}

export class LocalJsonRepository implements ILegacyRepository {
  private dataDir: string;
  private dbPath: string;
  public uploadDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.dataDir = path.resolve(baseDir, 'data');
    this.dbPath = path.resolve(this.dataDir, 'legacylock.db.json');
    this.uploadDir = path.resolve(this.dataDir, 'uploads');

    this.ensureDirectories();
    this.ensureDatabase();
  }

  public getStorageMode(): 'local' | 'supabase' {
    return 'local';
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private ensureDatabase(): void {
    if (!fs.existsSync(this.dbPath)) {
      const initial: LegacyDbData = {
        users: [],
        assets: [],
        beneficiaries: [],
        instructions: [],
        checkInSettings: [],
        checkInEvents: [],
        inheritanceRequests: [],
        auditLogs: [],
        notifications: [],
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(initial, null, 2), 'utf-8');
    }
  }

  private readDb(): LegacyDbData {
    try {
      this.ensureDatabase();
      const content = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(content) as LegacyDbData;
    } catch {
      // In case of any read hiccup, fallback to empty structure
      return {
        users: [],
        assets: [],
        beneficiaries: [],
        instructions: [],
        checkInSettings: [],
        checkInEvents: [],
        inheritanceRequests: [],
        auditLogs: [],
        notifications: [],
      };
    }
  }

  private writeDb(data: LegacyDbData): void {
    const tempPath = `${this.dbPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, this.dbPath);
  }

  // --- Users ---
  async getUserByEmail(email: string): Promise<User | null> {
    const db = this.readDb();
    const cleanEmail = email.trim().toLowerCase();
    return db.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const db = this.readDb();
    return db.users.find((u) => u.id === id) || null;
  }

  async createUser(user: User): Promise<User> {
    const db = this.readDb();
    const existing = db.users.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (existing) {
      throw new Error('A user with this email address already exists');
    }
    db.users.push(user);
    this.writeDb(db);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const db = this.readDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...updates };
    this.writeDb(db);
    return db.users[idx];
  }

  // --- Assets ---
  async getAssetsByUser(userId: string): Promise<Asset[]>{
    const db = this.readDb();
    return db.assets.filter((a) => a.userId === userId);
  }

  async getAssetById(id: string): Promise<Asset | null> {
    const db = this.readDb();
    return db.assets.find((a) => a.id === id) || null;
  }

  async createAsset(asset: Asset): Promise<Asset> {
    const db = this.readDb();
    db.assets.push(asset);
    this.writeDb(db);
    return asset;
  }

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | null> {
    const db = this.readDb();
    const idx = db.assets.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    db.assets[idx] = { ...db.assets[idx], ...updates, updatedAt: new Date().toISOString() };
    this.writeDb(db);
    return db.assets[idx];
  }

  async deleteAsset(id: string): Promise<boolean> {
    const db = this.readDb();
    const asset = db.assets.find((a) => a.id === id);
    if (!asset) return false;

    // Delete associated physical file if it exists inside upload dir
    if (asset.filePath && fs.existsSync(asset.filePath)) {
      try {
        fs.unlinkSync(asset.filePath);
      } catch (err) {
        console.warn('Could not remove file on disk:', err);
      }
    }

    db.assets = db.assets.filter((a) => a.id !== id);
    this.writeDb(db);
    return true;
  }

  // --- Beneficiaries ---
  async getBeneficiariesByUser(userId: string): Promise<Beneficiary[]> {
    const db = this.readDb();
    return db.beneficiaries.filter((b) => b.userId === userId);
  }

  async getBeneficiaryById(id: string): Promise<Beneficiary | null> {
    const db = this.readDb();
    return db.beneficiaries.find((b) => b.id === id) || null;
  }

  async createBeneficiary(beneficiary: Beneficiary): Promise<Beneficiary> {
    const db = this.readDb();
    db.beneficiaries.push(beneficiary);
    this.writeDb(db);
    return beneficiary;
  }

  async updateBeneficiary(id: string, updates: Partial<Beneficiary>): Promise<Beneficiary | null> {
    const db = this.readDb();
    const idx = db.beneficiaries.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    db.beneficiaries[idx] = { ...db.beneficiaries[idx], ...updates };
    this.writeDb(db);
    return db.beneficiaries[idx];
  }

  async deleteBeneficiary(id: string): Promise<boolean> {
    const db = this.readDb();
    const exists = db.beneficiaries.some((b) => b.id === id);
    if (!exists) return false;
    db.beneficiaries = db.beneficiaries.filter((b) => b.id !== id);
    this.writeDb(db);
    return true;
  }

  // --- Legacy Instructions ---
  async getInstructionsByUser(userId: string): Promise<LegacyInstruction[]> {
    const db = this.readDb();
    return db.instructions.filter((i) => i.userId === userId);
  }

  async getInstructionById(id: string): Promise<LegacyInstruction | null> {
    const db = this.readDb();
    return db.instructions.find((i) => i.id === id) || null;
  }

  async createInstruction(instruction: LegacyInstruction): Promise<LegacyInstruction> {
    const db = this.readDb();
    db.instructions.push(instruction);
    this.writeDb(db);
    return instruction;
  }

  async updateInstruction(id: string, updates: Partial<LegacyInstruction>): Promise<LegacyInstruction | null> {
    const db = this.readDb();
    const idx = db.instructions.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    db.instructions[idx] = { ...db.instructions[idx], ...updates, updatedAt: new Date().toISOString() };
    this.writeDb(db);
    return db.instructions[idx];
  }

  async deleteInstruction(id: string): Promise<boolean> {
    const db = this.readDb();
    const exists = db.instructions.some((i) => i.id === id);
    if (!exists) return false;
    db.instructions = db.instructions.filter((i) => i.id !== id);
    this.writeDb(db);
    return true;
  }

  // --- Check-In Settings & Events ---
  async getCheckInSettings(userId: string): Promise<CheckInSettings | null> {
    const db = this.readDb();
    return db.checkInSettings.find((s) => s.userId === userId) || null;
  }

  async saveCheckInSettings(settings: CheckInSettings): Promise<CheckInSettings> {
    const db = this.readDb();
    const idx = db.checkInSettings.findIndex((s) => s.userId === settings.userId);
    if (idx >= 0) {
      db.checkInSettings[idx] = settings;
    } else {
      db.checkInSettings.push(settings);
    }
    this.writeDb(db);
    return settings;
  }

  async getCheckInEvents(userId: string): Promise<CheckInEvent[]> {
    const db = this.readDb();
    return db.checkInEvents.filter((e) => e.userId === userId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async addCheckInEvent(event: CheckInEvent): Promise<CheckInEvent> {
    const db = this.readDb();
    db.checkInEvents.unshift(event);
    this.writeDb(db);
    return event;
  }

  // --- Inheritance Requests ---
  async getAllRequests(): Promise<InheritanceRequest[]> {
    const db = this.readDb();
    return db.inheritanceRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getRequestsByUser(userId: string): Promise<InheritanceRequest[]> {
    const db = this.readDb();
    return db.inheritanceRequests.filter((r) => r.userId === userId);
  }

  async getRequestsByBeneficiary(beneficiaryEmail: string): Promise<InheritanceRequest[]> {
    const db = this.readDb();
    return db.inheritanceRequests.filter((r) => r.beneficiaryEmail.toLowerCase() === beneficiaryEmail.toLowerCase());
  }

  async getRequestById(id: string): Promise<InheritanceRequest | null> {
    const db = this.readDb();
    return db.inheritanceRequests.find((r) => r.id === id) || null;
  }

  async createRequest(req: InheritanceRequest): Promise<InheritanceRequest> {
    const db = this.readDb();
    db.inheritanceRequests.unshift(req);
    this.writeDb(db);
    return req;
  }

  async updateRequest(id: string, updates: Partial<InheritanceRequest>): Promise<InheritanceRequest | null> {
    const db = this.readDb();
    const idx = db.inheritanceRequests.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    db.inheritanceRequests[idx] = { ...db.inheritanceRequests[idx], ...updates, updatedAt: new Date().toISOString() };
    this.writeDb(db);
    return db.inheritanceRequests[idx];
  }

  // --- Audit Logs ---
  async getAuditLogs(userId?: string): Promise<AuditLog[]> {
    const db = this.readDb();
    if (userId) {
      return db.auditLogs.filter((l) => l.userId === userId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    return db.auditLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async addAuditLog(log: AuditLog): Promise<AuditLog> {
    const db = this.readDb();
    db.auditLogs.unshift(log);
    // Keep last 500 logs
    if (db.auditLogs.length > 500) {
      db.auditLogs = db.auditLogs.slice(0, 500);
    }
    this.writeDb(db);
    return log;
  }

  // --- Notifications ---
  async getNotifications(userId: string): Promise<InAppNotification[]> {
    const db = this.readDb();
    return db.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addNotification(notif: InAppNotification): Promise<InAppNotification> {
    const db = this.readDb();
    db.notifications.unshift(notif);
    this.writeDb(db);
    return notif;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const db = this.readDb();
    const notif = db.notifications.find((n) => n.id === id);
    if (!notif) return false;
    notif.read = true;
    this.writeDb(db);
    return true;
  }

  // --- Reset to Demo Data ---
  async resetToDemo(): Promise<void> {
    // Will be populated by the seed script
    const { getSeedData } = await import('../seed.js');
    const seed = await getSeedData(this.uploadDir);
    this.writeDb(seed);
  }
}

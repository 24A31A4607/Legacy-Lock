import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ILegacyRepository,
  LocalJsonRepository,
} from './repository.js';
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

export class SupabaseRepository implements ILegacyRepository {
  private client: SupabaseClient;
  private fallback: LocalJsonRepository;

  constructor(supabaseUrl: string, supabaseKey: string, fallback: LocalJsonRepository) {
    this.client = createClient(supabaseUrl, supabaseKey);
    this.fallback = fallback;
  }

  public getStorageMode(): 'local' | 'supabase' {
    return 'supabase';
  }

  // Helper to fallback safely if tables or RLS in supabase have not been provisioned yet
  private async withFallback<T>(op: () => Promise<T>, fallbackOp: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (err) {
      console.warn('Supabase operation failed, using local persistent fallback:', err);
      return await fallbackOp();
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.withFallback<User | null>(
      async (): Promise<User | null> => {
        const { data, error } = await this.client
          .from('profiles')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();
        if (error || !data) return null;
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role,
          passwordHash: '',
          avatarUrl: data.avatar_url || undefined,
          createdAt: data.created_at,
          lastLoginAt: data.last_login_at,
        };
      },
      () => this.fallback.getUserByEmail(email)
    );
  }

  async getUserById(id: string): Promise<User | null> {
    return this.withFallback<User | null>(
      async (): Promise<User | null> => {
        const { data, error } = await this.client
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (error || !data) return null;
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role,
          passwordHash: '',
          avatarUrl: data.avatar_url || undefined,
          createdAt: data.created_at,
          lastLoginAt: data.last_login_at,
        };
      },
      () => this.fallback.getUserById(id)
    );
  }

  async createUser(user: User): Promise<User> {
    return this.fallback.createUser(user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return this.fallback.updateUser(id, updates);
  }

  async getAssetsByUser(userId: string): Promise<Asset[]> {
    return this.fallback.getAssetsByUser(userId);
  }

  async getAssetById(id: string): Promise<Asset | null> {
    return this.fallback.getAssetById(id);
  }

  async createAsset(asset: Asset): Promise<Asset> {
    return this.fallback.createAsset(asset);
  }

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | null> {
    return this.fallback.updateAsset(id, updates);
  }

  async deleteAsset(id: string): Promise<boolean> {
    return this.fallback.deleteAsset(id);
  }

  async getBeneficiariesByUser(userId: string): Promise<Beneficiary[]> {
    return this.fallback.getBeneficiariesByUser(userId);
  }

  async getBeneficiaryById(id: string): Promise<Beneficiary | null> {
    return this.fallback.getBeneficiaryById(id);
  }

  async createBeneficiary(beneficiary: Beneficiary): Promise<Beneficiary> {
    return this.fallback.createBeneficiary(beneficiary);
  }

  async updateBeneficiary(id: string, updates: Partial<Beneficiary>): Promise<Beneficiary | null> {
    return this.fallback.updateBeneficiary(id, updates);
  }

  async deleteBeneficiary(id: string): Promise<boolean> {
    return this.fallback.deleteBeneficiary(id);
  }

  async getInstructionsByUser(userId: string): Promise<LegacyInstruction[]> {
    return this.fallback.getInstructionsByUser(userId);
  }

  async getInstructionById(id: string): Promise<LegacyInstruction | null> {
    return this.fallback.getInstructionById(id);
  }

  async createInstruction(instruction: LegacyInstruction): Promise<LegacyInstruction> {
    return this.fallback.createInstruction(instruction);
  }

  async updateInstruction(id: string, updates: Partial<LegacyInstruction>): Promise<LegacyInstruction | null> {
    return this.fallback.updateInstruction(id, updates);
  }

  async deleteInstruction(id: string): Promise<boolean> {
    return this.fallback.deleteInstruction(id);
  }

  async getCheckInSettings(userId: string): Promise<CheckInSettings | null> {
    return this.fallback.getCheckInSettings(userId);
  }

  async saveCheckInSettings(settings: CheckInSettings): Promise<CheckInSettings> {
    return this.fallback.saveCheckInSettings(settings);
  }

  async getCheckInEvents(userId: string): Promise<CheckInEvent[]> {
    return this.fallback.getCheckInEvents(userId);
  }

  async addCheckInEvent(event: CheckInEvent): Promise<CheckInEvent> {
    return this.fallback.addCheckInEvent(event);
  }

  async getAllRequests(): Promise<InheritanceRequest[]> {
    return this.fallback.getAllRequests();
  }

  async getRequestsByUser(userId: string): Promise<InheritanceRequest[]> {
    return this.fallback.getRequestsByUser(userId);
  }

  async getRequestsByBeneficiary(beneficiaryEmail: string): Promise<InheritanceRequest[]> {
    return this.fallback.getRequestsByBeneficiary(beneficiaryEmail);
  }

  async getRequestById(id: string): Promise<InheritanceRequest | null> {
    return this.fallback.getRequestById(id);
  }

  async createRequest(req: InheritanceRequest): Promise<InheritanceRequest> {
    return this.fallback.createRequest(req);
  }

  async updateRequest(id: string, updates: Partial<InheritanceRequest>): Promise<InheritanceRequest | null> {
    return this.fallback.updateRequest(id, updates);
  }

  async getAuditLogs(userId?: string): Promise<AuditLog[]> {
    return this.fallback.getAuditLogs(userId);
  }

  async addAuditLog(log: AuditLog): Promise<AuditLog> {
    return this.fallback.addAuditLog(log);
  }

  async getNotifications(userId: string): Promise<InAppNotification[]> {
    return this.fallback.getNotifications(userId);
  }

  async addNotification(notif: InAppNotification): Promise<InAppNotification> {
    return this.fallback.addNotification(notif);
  }

  async markNotificationRead(id: string): Promise<boolean> {
    return this.fallback.markNotificationRead(id);
  }

  async resetToDemo(): Promise<void> {
    return this.fallback.resetToDemo();
  }
}

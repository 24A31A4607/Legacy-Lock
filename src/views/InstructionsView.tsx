import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { LegacyInstruction, Beneficiary, InstructionType } from '../types/index.js';
import { Modal } from '../components/ui/Modal.js';
import {
  ScrollText,
  Plus,
  Lock,
  MessageSquare,
  Compass,
  Coins,
  Cpu,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface InstructionsViewProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
}

export const InstructionsView: React.FC<InstructionsViewProps> = ({ onNotify }) => {
  const [instructions, setInstructions] = useState<LegacyInstruction[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeInstruction, setActiveInstruction] = useState<LegacyInstruction | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<InstructionType>('personal_message');
  const [formBeneficiaryId, setFormBeneficiaryId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [insRes, benRes] = await Promise.all([
        api.getInstructions(),
        api.getBeneficiaries(),
      ]);
      setInstructions(insRes.instructions || []);
      setBeneficiaries(benRes.beneficiaries || []);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to load legacy instructions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setFormTitle('');
    setFormContent('');
    setFormType('personal_message');
    setFormBeneficiaryId('');
    setIsCreateOpen(true);
  };

  const openEditModal = (ins: LegacyInstruction) => {
    setActiveInstruction(ins);
    setFormTitle(ins.title);
    setFormContent(ins.content);
    setFormType(ins.type);
    setFormBeneficiaryId(ins.beneficiaryId || '');
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      onNotify('error', 'Title and directive content are required');
      return;
    }

    setSubmitting(true);
    try {
      await api.createInstruction({
        title: formTitle,
        content: formContent,
        type: formType,
        beneficiaryId: formBeneficiaryId || null,
        isLockedUntilInheritance: true,
      });

      onNotify('success', `Created legacy directive "${formTitle}".`);
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to save directive');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstruction) return;

    setSubmitting(true);
    try {
      await api.updateInstruction(activeInstruction.id, {
        title: formTitle,
        content: formContent,
        type: formType,
        beneficiaryId: formBeneficiaryId || null,
      });

      onNotify('success', `Directive updated.`);
      setIsEditOpen(false);
      loadData();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to update directive');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activeInstruction) return;
    setSubmitting(true);
    try {
      await api.deleteInstruction(activeInstruction.id);
      onNotify('success', `Directive deleted.`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to delete directive');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type: InstructionType) => {
    switch (type) {
      case 'personal_message':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'general_directive':
        return <Compass className="w-4 h-4 text-emerald-600" />;
      case 'asset_distribution':
        return <Coins className="w-4 h-4 text-amber-600" />;
      case 'digital_accounts':
        return <Cpu className="w-4 h-4 text-blue-600" />;
      default:
        return <ScrollText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeLabel = (type: InstructionType) => {
    switch (type) {
      case 'personal_message':
        return 'Personal Message';
      case 'general_directive':
        return 'General Directive';
      case 'asset_distribution':
        return 'Asset Distribution';
      case 'digital_accounts':
        return 'Digital Accounts Closure';
      default:
        return type;
    }
  };

  const filtered = instructions.filter(
    (ins) => selectedType === 'all' || ins.type === selectedType
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Legacy Instructions & Directives
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pen personal letters, account closure guidelines, and distribution wishes locked until succession.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Write Directive</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
        {[
          { id: 'all', label: 'All Directives' },
          { id: 'personal_message', label: 'Personal Messages' },
          { id: 'general_directive', label: 'General Directives' },
          { id: 'asset_distribution', label: 'Asset Distribution' },
          { id: 'digital_accounts', label: 'Digital Accounts' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedType === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <ScrollText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700">No instructions written yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Document your final thoughts, messages to children, or operational guidelines for account closures.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
          >
            Write First Directive
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ins) => {
            const ben = beneficiaries.find((b) => b.id === ins.beneficiaryId);

            return (
              <div
                key={ins.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 p-5 shadow-xs transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      {getTypeIcon(ins.type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{ins.title}</h3>
                      {/* Zero-pill metadata text */}
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span>{getTypeLabel(ins.type)}</span>
                        {ben && (
                          <>
                            <span className="mx-1.5" aria-hidden="true">·</span>
                            <span>Dedicated to: {ben.fullName}</span>
                          </>
                        )}
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          Updated {new Date(ins.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {ins.isLockedUntilInheritance && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-medium border border-indigo-200">
                        <Lock className="w-3 h-3" />
                        <span>Locked Until Succession</span>
                      </span>
                    )}

                    <button
                      onClick={() => openEditModal(ins)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveInstruction(ins);
                        setIsDeleteOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                  {ins.content}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Write Legacy Directive"
        description="Write directives for specific beneficiaries or general estate guidance."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Directive Title *</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Instructions regarding family archive preservation"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Directive Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="personal_message">Personal Message to Loved One</option>
                <option value="general_directive">General Estate Directive</option>
                <option value="asset_distribution">Asset Distribution Preference</option>
                <option value="digital_accounts">Digital Account & Subscription Closure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Beneficiary (Optional)
              </label>
              <select
                value={formBeneficiaryId}
                onChange={(e) => setFormBeneficiaryId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">General / All Trustees</option>
                {beneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.fullName} ({b.relationship})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Directive Content *</label>
            <textarea
              rows={6}
              required
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Enter your personal message, guidance, or account shutdown protocols here..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Directive'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Directive"
        description="Update guidance or reassign to a different beneficiary."
        maxWidth="xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Directive Title</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Directive Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="personal_message">Personal Message</option>
                <option value="general_directive">General Directive</option>
                <option value="asset_distribution">Asset Distribution</option>
                <option value="digital_accounts">Digital Accounts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Beneficiary</label>
              <select
                value={formBeneficiaryId}
                onChange={(e) => setFormBeneficiaryId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">General / All Trustees</option>
                {beneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.fullName} ({b.relationship})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Directive Content</label>
            <textarea
              rows={6}
              required
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      {activeInstruction && (
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title="Delete Legacy Directive"
          description="Are you sure you want to permanently remove this directive?"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Removing <strong>"{activeInstruction.title}"</strong> will erase this instruction from your vault.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

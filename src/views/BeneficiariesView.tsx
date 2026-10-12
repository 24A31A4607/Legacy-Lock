import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { Beneficiary, Asset, BeneficiaryAccessLevel } from '../types/index.js';
import { Modal } from '../components/ui/Modal.js';
import {
  Users2,
  Plus,
  Mail,
  Phone,
  ShieldCheck,
  FolderLock,
  Edit2,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface BeneficiariesViewProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
}

export const BeneficiariesView: React.FC<BeneficiariesViewProps> = ({ onNotify }) => {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeBeneficiary, setActiveBeneficiary] = useState<Beneficiary | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRelationship, setFormRelationship] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAccessLevel, setFormAccessLevel] = useState<BeneficiaryAccessLevel>('specific_assets');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [benRes, assetRes] = await Promise.all([
        api.getBeneficiaries(),
        api.getAssets(),
      ]);
      setBeneficiaries(benRes.beneficiaries || []);
      setAvailableAssets(assetRes.assets || []);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to load beneficiaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormRelationship('');
    setFormPhone('');
    setFormNotes('');
    setFormAccessLevel('specific_assets');
    setSelectedAssetIds([]);
    setIsAddOpen(true);
  };

  const openEditModal = (ben: Beneficiary) => {
    setActiveBeneficiary(ben);
    setFormName(ben.fullName);
    setFormEmail(ben.email);
    setFormRelationship(ben.relationship);
    setFormPhone(ben.phone || '');
    setFormNotes(ben.notes || '');
    setFormAccessLevel(ben.futureAccessLevel);
    setSelectedAssetIds(ben.assignedAssetIds || []);
    setIsEditOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      onNotify('error', 'Name and valid email are required');
      return;
    }

    setSubmitting(true);
    try {
      await api.createBeneficiary({
        fullName: formName,
        email: formEmail,
        relationship: formRelationship,
        phone: formPhone,
        notes: formNotes,
        futureAccessLevel: formAccessLevel,
        assignedAssetIds: selectedAssetIds,
      });

      onNotify('success', `Added "${formName}" as a designated beneficiary.`);
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to add beneficiary');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBeneficiary) return;

    setSubmitting(true);
    try {
      await api.updateBeneficiary(activeBeneficiary.id, {
        fullName: formName,
        email: formEmail,
        relationship: formRelationship,
        phone: formPhone,
        notes: formNotes,
        futureAccessLevel: formAccessLevel,
        assignedAssetIds: selectedAssetIds,
      });

      onNotify('success', `Beneficiary records updated.`);
      setIsEditOpen(false);
      loadData();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to update beneficiary');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activeBeneficiary) return;
    setSubmitting(true);
    try {
      await api.deleteBeneficiary(activeBeneficiary.id);
      onNotify('success', `Removed "${activeBeneficiary.fullName}".`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to remove beneficiary');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAssetAssignment = (assetId: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Trusted Beneficiaries
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Designate trustees and executors who may be granted conditional access via succession protocol.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Designate Beneficiary</span>
        </button>
      </div>

      {/* Critical Security Distinction Callout */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 space-y-1">
          <div className="font-semibold text-indigo-900">
            Important Access Distinction: Intended Future Access vs. Current Status
          </div>
          <p className="leading-relaxed">
            Beneficiaries on this list have <strong>zero immediate access</strong> to your files.
            Designation simply records your intended allocation. Access is only unlocked if a future
            succession request is reviewed and formally approved through the multi-party verification protocol.
          </p>
        </div>
      </div>

      {/* Beneficiaries Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : beneficiaries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Users2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700">No beneficiaries designated yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add trusted family members, executors, or attorneys who should inherit specific digital assets.
          </p>
          <button
            onClick={openAddModal}
            className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
          >
            Designate First Beneficiary
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {beneficiaries.map((ben) => {
            const assignedAssets = availableAssets.filter((a) =>
              (ben.assignedAssetIds || []).includes(a.id)
            );

            return (
              <div
                key={ben.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 p-5 shadow-xs transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {ben.avatarUrl ? (
                        <img
                          src={ben.avatarUrl}
                          alt={ben.fullName}
                          className="w-11 h-11 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                          {ben.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{ben.fullName}</h3>
                        {/* Zero-pill metadata text with bullet */}
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <span>{ben.relationship}</span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span className="capitalize text-slate-600 font-medium">{ben.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(ben)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveBeneficiary(ben);
                          setIsDeleteOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ben.email}</span>
                    </div>
                    {ben.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="tabular-nums">{ben.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {ben.notes && (
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                      "{ben.notes}"
                    </p>
                  )}
                </div>

                {/* Assigned Assets & Future Scope */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium">Designated Future Access:</span>
                    <span className="capitalize font-semibold text-indigo-700">
                      {ben.futureAccessLevel.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium">Assigned Vault Items:</span>
                    <span className="tabular-nums font-semibold text-slate-800">
                      {assignedAssets.length} records
                    </span>
                  </div>

                  {assignedAssets.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {assignedAssets.map((a) => (
                        <span
                          key={a.id}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md truncate max-w-[200px]"
                        >
                          {a.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Designate New Beneficiary"
        description="Specify trustee details and assign digital assets intended for succession."
        maxWidth="xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Marcus Vance"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="marcus@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Relationship / Title *</label>
              <input
                type="text"
                required
                value={formRelationship}
                onChange={(e) => setFormRelationship(e.target.value)}
                placeholder="e.g. Son & Designated Executor"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number (Optional)</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+1 (555) 234-8901"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Intended Future Access Level</label>
            <select
              value={formAccessLevel}
              onChange={(e) => setFormAccessLevel(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="specific_assets">Specific Assigned Assets Only</option>
              <option value="full">Full Vault Access</option>
              <option value="instructions_only">Legacy Directives & Notes Only</option>
            </select>
          </div>

          {/* Asset Selection Checkboxes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Select Assets to Allocate ({selectedAssetIds.length} chosen)
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1.5 bg-slate-50">
              {availableAssets.length === 0 ? (
                <div className="text-xs text-slate-400 p-2">No assets deposited in vault yet.</div>
              ) : (
                availableAssets.map((asset) => (
                  <label
                    key={asset.id}
                    className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.includes(asset.id)}
                      onChange={() => toggleAssetAssignment(asset.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-slate-800 truncate">{asset.title}</span>
                    <span className="text-[10px] text-slate-400">({asset.category})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Internal Trustee Notes</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Primary contact in family trust; co-signatory for safety deposit box."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Confirm Beneficiary'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Beneficiary Records"
        description="Update contact information and allocated asset permissions."
        maxWidth="xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Relationship</label>
              <input
                type="text"
                required
                value={formRelationship}
                onChange={(e) => setFormRelationship(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Future Access Level</label>
            <select
              value={formAccessLevel}
              onChange={(e) => setFormAccessLevel(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="specific_assets">Specific Assigned Assets Only</option>
              <option value="full">Full Vault Access</option>
              <option value="instructions_only">Legacy Directives & Notes Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Assigned Assets ({selectedAssetIds.length} chosen)
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1.5 bg-slate-50">
              {availableAssets.map((asset) => (
                <label
                  key={asset.id}
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAssetIds.includes(asset.id)}
                    onChange={() => toggleAssetAssignment(asset.id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium text-slate-800 truncate">{asset.title}</span>
                  <span className="text-[10px] text-slate-400">({asset.category})</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
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
              {submitting ? 'Updating...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      {activeBeneficiary && (
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title="Remove Beneficiary"
          description="Are you sure you want to remove this person from your succession list?"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Removing <strong>{activeBeneficiary.fullName}</strong> will disassociate all asset assignments and invalidate any pending succession proposals for this recipient.
              </span>
            </div>

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
                {submitting ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

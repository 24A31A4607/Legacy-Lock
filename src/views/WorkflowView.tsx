import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { User, InheritanceRequest, Beneficiary, WorkflowStatus } from '../types/index.js';
import { Modal } from '../components/ui/Modal.js';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Send,
  Eye,
  KeyRound,
  RotateCcw,
} from 'lucide-react';

interface WorkflowViewProps {
  currentUser: User;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({ currentUser, onNotify }) => {
  const [requests, setRequests] = useState<InheritanceRequest[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isReviewer, setIsReviewer] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<InheritanceRequest | null>(null);

  // Submission Form
  const [formBeneficiaryId, setFormBeneficiaryId] = useState('');
  const [formDeclarationType, setFormDeclarationType] = useState('Incapacitation Declaration');
  const [formAttestationNotes, setFormAttestationNotes] = useState('');
  const [formCertRef, setFormCertRef] = useState('');

  // Review Form
  const [reviewDecision, setReviewDecision] = useState<string>('Approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wfRes, benRes] = await Promise.all([
        api.getWorkflow(),
        api.getBeneficiaries().catch(() => ({ beneficiaries: [] })),
      ]);
      setRequests(wfRes.requests || []);
      setIsReviewer(wfRes.isReviewer);
      setBeneficiaries(benRes.beneficiaries || []);
      if (benRes.beneficiaries?.length > 0 && !formBeneficiaryId) {
        setFormBeneficiaryId(benRes.beneficiaries[0].id);
      }
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to load workflow state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBeneficiaryId) {
      onNotify('error', 'Select a designated beneficiary to initiate request');
      return;
    }
    if (!formAttestationNotes.trim()) {
      onNotify('error', 'Please provide legal attestation notes (min 10 chars)');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitWorkflowRequest({
        beneficiaryId: formBeneficiaryId,
        declarationType: formDeclarationType,
        legalAttestationNotes: formAttestationNotes,
        certificateReference: formCertRef || 'SIM-PROTOTYPE-REF-01',
      });
      onNotify('success', 'Inheritance review request submitted to queue.');
      setIsSubmitModalOpen(false);
      setFormAttestationNotes('');
      loadData();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    if (!reviewNotes.trim()) {
      onNotify('error', 'Reviewer rationale notes are required');
      return;
    }

    setSubmitting(true);
    try {
      await api.reviewWorkflowRequest(activeRequest.id, {
        decision: reviewDecision,
        notes: reviewNotes,
      });
      onNotify('success', `Decision "${reviewDecision}" rendered successfully.`);
      setIsReviewModalOpen(false);
      setReviewNotes('');
      loadData();
    } catch (err: any) {
      onNotify('error', err.message || 'Review failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (reqId: string) => {
    if (!confirm('Are you certain you want to revoke this inheritance access?')) return;
    try {
      await api.revokeWorkflowAccess(reqId);
      onNotify('warning', 'Access permissions revoked.');
      loadData();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to revoke access');
    }
  };

  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case 'Awaiting review':
      case 'Request submitted':
        return (
          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>{status}</span>
          </span>
        );
      case 'Approved':
      case 'Access granted':
        return (
          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>{status}</span>
          </span>
        );
      case 'Rejected':
      case 'Access revoked':
        return (
          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>{status}</span>
          </span>
        );
      default:
        return (
          <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Controlled Inheritance Protocol
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Multi-party review lifecycle managing succession claims and authorized asset disclosures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role !== 'reviewer' && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Succession Claim</span>
            </button>
          )}
        </div>
      </div>

      {/* Reviewer / Owner Context Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 space-y-2 text-xs text-indigo-950">
        <div className="flex items-center gap-2 font-semibold text-indigo-900">
          <ShieldCheck className="w-4 h-4 text-indigo-700" />
          <span>
            {currentUser.role === 'reviewer'
              ? 'Authorized Review Officer View Active'
              : 'Vault Owner & Beneficiary Safeguards Active'}
          </span>
        </div>
        <p className="leading-relaxed">
          {currentUser.role === 'reviewer'
            ? 'As a designated review officer, you have statutory authority to examine submitted claims and certify verification. Note that a beneficiary can never approve their own claim.'
            : 'Beneficiaries cannot unilaterally release files simply by submitting a request. Every request requires formal trustee review and rationale logging before cryptographic asset keys can be released.'}
        </p>
      </div>

      {/* 7-Step Lifecycle Diagram */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Succession State Machine (7 Stages)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          {[
            '1. No request',
            '2. Request submitted',
            '3. Awaiting review',
            '4. Approved',
            '5. Access granted',
            '6. Rejected',
            '7. Access revoked',
          ].map((s, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 text-[11px]"
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Request Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            {currentUser.role === 'reviewer' ? 'Review Officer Queue' : 'Active Succession Claims'}
          </h3>
          <span className="text-xs text-slate-400 tabular-nums">{requests.length} total</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <GitPullRequest className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No inheritance requests in queue</p>
            <p className="text-[11px] text-slate-400">
              Submit a simulated request above to demonstrate the review workflow.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => (
              <div key={req.id} className="p-5 space-y-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{req.beneficiaryName}</span>
                      <span className="text-xs text-slate-400">({req.beneficiaryEmail})</span>
                    </div>
                    {/* Zero-pill metadata text with bullet */}
                    <div className="text-[11px] text-slate-500">
                      <span>Type: {req.evidenceMetadata.declarationType}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span className="font-mono text-slate-600">
                        Ref: {req.evidenceMetadata.certificateReference || 'N/A'}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        Submitted: {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(req.status)}

                    {currentUser.role === 'reviewer' && (
                      <button
                        onClick={() => {
                          setActiveRequest(req);
                          setReviewDecision('Approved');
                          setIsReviewModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Adjudicate</span>
                      </button>
                    )}

                    {(req.status === 'Approved' || req.status === 'Access granted') && (
                      <button
                        onClick={() => handleRevoke(req.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-slate-600 text-xs font-medium transition-colors"
                        title="Revoke access"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>

                {/* Evidence notes */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 space-y-1.5">
                  <div className="font-semibold text-slate-700 text-[11px]">Attestation Details:</div>
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {req.evidenceMetadata.legalAttestationNotes}
                  </p>
                  {req.reviewerNotes && (
                    <div className="pt-2 mt-2 border-t border-slate-200 text-indigo-900">
                      <span className="font-semibold text-[11px]">Reviewer Finding: </span>
                      <span>{req.reviewerNotes}</span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        ({new Date(req.decidedAt || req.updatedAt).toLocaleString()})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Beneficiary Simulation Submission Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Simulate Succession Request"
        description="Fictional succession claim filing for testing the multi-party verification queue."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Claiming Beneficiary *
            </label>
            <select
              value={formBeneficiaryId}
              onChange={(e) => setFormBeneficiaryId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              {beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.fullName} ({b.relationship}) - {b.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Declaration Category
            </label>
            <select
              value={formDeclarationType}
              onChange={(e) => setFormDeclarationType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="Incapacitation Declaration">
                Medical Incapacitation / Power of Attorney
              </option>
              <option value="Absence Attestation">
                Extended Unreachable Absence / Missing Confirmation
              </option>
              <option value="Simulated Vital Records Claim">
                Simulated Vital Records Certificate Filing (Demo)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Simulated Reference ID
            </label>
            <input
              type="text"
              value={formCertRef}
              onChange={(e) => setFormCertRef(e.target.value)}
              placeholder="e.g. SIM-NOTARY-2026-9921"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Legal Attestation Notes * (min 10 characters)
            </label>
            <textarea
              rows={4}
              required
              value={formAttestationNotes}
              onChange={(e) => setFormAttestationNotes(e.target.value)}
              placeholder="Enter explanation of filing grounds, notary reference, or simulated court docket..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit to Queue'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reviewer Decision Modal */}
      {activeRequest && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title="Review Officer Adjudication"
          description={`Render formal review decision for ${activeRequest.beneficiaryName}`}
          maxWidth="xl"
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700">
              <div>
                <strong>Claimant:</strong> {activeRequest.beneficiaryName} ({activeRequest.beneficiaryEmail})
              </div>
              <div>
                <strong>Filing Type:</strong> {activeRequest.evidenceMetadata.declarationType}
              </div>
              <div className="text-[11px] text-slate-500 italic">
                "{activeRequest.evidenceMetadata.legalAttestationNotes}"
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Adjudication Decision *
              </label>
              <select
                value={reviewDecision}
                onChange={(e) => setReviewDecision(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
              >
                <option value="Approved">Approved (Certify Succession Conditions)</option>
                <option value="Access granted">Access granted (Immediate Asset Decryption)</option>
                <option value="Rejected">Rejected (Insufficient Attestation Evidence)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Review Officer Rationale & Audit Findings *
              </label>
              <textarea
                rows={4}
                required
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Detail grounds for approval/rejection, verification checks performed, and timestamped rationale..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Recording Decision...' : 'Commit Decision'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

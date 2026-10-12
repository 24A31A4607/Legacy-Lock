import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { Asset, AssetCategory } from '../types/index.js';
import { Modal } from '../components/ui/Modal.js';
import {
  FolderLock,
  Plus,
  Search,
  FileText,
  Image as ImageIcon,
  FileKey,
  FileCode,
  Download,
  Trash2,
  Edit2,
  Tag,
  Clock,
  HardDrive,
  Eye,
  CheckCircle2,
  AlertCircle,
  File,
} from 'lucide-react';

interface VaultViewProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
}

export const VaultView: React.FC<VaultViewProps> = ({ onNotify }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);

  // Upload / Edit form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<AssetCategory>('Documents');
  const [formTags, setFormTags] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categories: (AssetCategory | 'All')[] = [
    'All',
    'Documents',
    'Photos & Memories',
    'Account Records',
    'Personal Notes',
    'Other',
  ];

  const loadAssets = async () => {
    try {
      setLoading(true);
      const res = await api.getAssets();
      setAssets(res.assets || []);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to fetch vault assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const openUploadModal = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('Documents');
    setFormTags('');
    setFormFile(null);
    setIsUploadOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onNotify('error', 'Title is required');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', formTitle);
      formData.append('description', formDescription);
      formData.append('category', formCategory);

      const parsedTags = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      formData.append('tags', JSON.stringify(parsedTags));

      if (formFile) {
        formData.append('file', formFile);
      }

      await api.createAsset(formData);
      onNotify('success', `"${formTitle}" successfully committed to secure vault.`);
      setIsUploadOpen(false);
      loadAssets();
    } catch (err: any) {
      onNotify('error', err.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (asset: Asset) => {
    setActiveAsset(asset);
    setFormTitle(asset.title);
    setFormDescription(asset.description);
    setFormCategory(asset.category);
    setFormTags(asset.tags.join(', '));
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsset) return;

    setSubmitting(true);
    try {
      const parsedTags = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await api.updateAsset(activeAsset.id, {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        tags: parsedTags,
      });

      onNotify('success', `Asset metadata updated.`);
      setIsEditOpen(false);
      loadAssets();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to update asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activeAsset) return;
    setSubmitting(true);
    try {
      await api.deleteAsset(activeAsset.id);
      onNotify('success', `"${activeAsset.title}" removed from vault.`);
      setIsDeleteOpen(false);
      loadAssets();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to delete asset');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesCategory =
      selectedCategory === 'All' || asset.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      asset.title.toLowerCase().includes(query) ||
      asset.description.toLowerCase().includes(query) ||
      asset.tags.some((t) => t.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'Documents':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'Photos & Memories':
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      case 'Account Records':
        return <FileKey className="w-4 h-4 text-amber-600" />;
      case 'Personal Notes':
        return <FileCode className="w-4 h-4 text-blue-600" />;
      default:
        return <File className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Digital Vault</h1>
          <p className="text-xs text-slate-500 mt-1">
            Store and manage critical documents, credentials, photos, and personal instructions.
          </p>
        </div>

        <button
          onClick={openUploadModal}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Deposit New Asset</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Interactive Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or tag..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <FolderLock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700">No assets found in this view</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No items match the search query "${searchQuery}". Try adjusting your filters.`
              : 'Your vault is currently empty for this category. Deposit your first asset today.'}
          </p>
          <button
            onClick={openUploadModal}
            className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
          >
            Deposit First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 p-5 shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      {getCategoryIcon(asset.category)}
                    </div>
                    {/* Zero-pill metadata text with bullet */}
                    <div className="text-[11px] text-slate-500">
                      <span>{asset.category}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatSize(asset.fileSize)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(asset)}
                      title="Edit metadata"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveAsset(asset);
                        setIsDeleteOpen(true);
                      }}
                      title="Delete asset"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{asset.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {asset.description || 'No additional notes provided.'}
                </p>
              </div>

              {/* Tags and Action footer */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveAsset(asset);
                        setIsPreviewOpen(true);
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    <a
                      href={`/api/assets/${asset.id}/download`}
                      download
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Fetch</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Deposit New Vault Asset"
        description="Encrypted files are saved to private storage with strict ownership authorization."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Asset Title *</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Living Trust Declaration (2026)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="Documents">Documents</option>
                <option value="Photos & Memories">Photos & Memories</option>
                <option value="Account Records">Account Records</option>
                <option value="Personal Notes">Personal Notes</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="legal, family, urgent"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description & Directives</label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Context or instructions for trustees regarding this record..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select File to Upload (PDF, PNG, JPG, TXT, DOCX, etc.)
            </label>
            <input
              type="file"
              onChange={(e) => setFormFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Maximum file size: 25 MB. If no file is attached, a secure text directive file is automatically created.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Depositing...' : 'Commit to Vault'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Asset Metadata"
        description="Update title, description, or tags without modifying the original cryptographic file."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Asset Title</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="Documents">Documents</option>
              <option value="Photos & Memories">Photos & Memories</option>
              <option value="Account Records">Account Records</option>
              <option value="Personal Notes">Personal Notes</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview / Details Modal */}
      {activeAsset && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={activeAsset.title}
          description="Detailed metadata and authorized private download access."
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Category:</span>
                <span className="text-slate-900">{activeAsset.category}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">File Name:</span>
                <span className="font-mono text-slate-900">{activeAsset.fileName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Size:</span>
                <span className="tabular-nums text-slate-900">{formatSize(activeAsset.fileSize)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">MIME Type:</span>
                <span className="font-mono text-slate-900">{activeAsset.mimeType}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Uploaded At:</span>
                <span className="text-slate-900">{new Date(activeAsset.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {activeAsset.description && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-1">Notes & Instructions</h4>
                <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
                  {activeAsset.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <a
                href={`/api/assets/${activeAsset.id}/download`}
                download
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Authorized File</span>
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {activeAsset && (
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title="Delete Vault Asset"
          description="Are you certain you want to remove this asset? This operation cannot be undone."
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Removing <strong>"{activeAsset.title}"</strong> will permanently delete its record and physical file from server storage.
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
                {submitting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

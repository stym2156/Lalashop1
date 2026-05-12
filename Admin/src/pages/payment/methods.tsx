import React, { useEffect, useState } from "react";
import {
  Loader2, Plus, Trash2, Edit3, X, Building2, Smartphone, QrCode,
  CheckCircle2, AlertCircle, Image as ImageIcon, Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchAdminPaymentMethods,
  createAdminPaymentMethod,
  updateAdminPaymentMethod,
  deleteAdminPaymentMethod,
  type AdminPaymentMethod,
  type PaymentMethodInput,
  type PaymentMethodKind,
} from "@/services/adminApi";

const KIND_META: Record<PaymentMethodKind, { labelKey: string; icon: typeof Building2; color: string }> = {
  bank: { labelKey: "pages.payment.methods.kindBank", icon: Building2, color: "from-blue-400 to-blue-600" },
  promptpay: { labelKey: "pages.payment.methods.kindPromptpay", icon: Smartphone, color: "from-emerald-400 to-emerald-600" },
  static_qr: { labelKey: "pages.payment.methods.kindStaticQr", icon: QrCode, color: "from-purple-400 to-purple-600" },
};

const initialForm: PaymentMethodInput = {
  kind: "bank",
  label: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
  promptpayId: "",
  qrImageUrl: "",
  notes: "",
  isActive: true,
  displayOrder: 0,
};

const PaymentMethodsPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<AdminPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentMethodInput>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminPaymentMethods();
      setItems(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('status.loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const openCreate = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (m: AdminPaymentMethod) => {
    setForm({
      kind: m.kind,
      label: m.label,
      bankName: m.bankName || "",
      accountNumber: m.accountNumber || "",
      accountName: m.accountName || "",
      promptpayId: m.promptpayId || "",
      qrImageUrl: m.qrImageUrl || "",
      notes: m.notes || "",
      isActive: m.isActive,
      displayOrder: m.displayOrder,
    });
    setEditingId(m._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateAdminPaymentMethod(editingId, form);
        setSuccess(t('pages.payment.methods.updatedSuccess'));
      } else {
        await createAdminPaymentMethod(form);
        setSuccess(t('pages.payment.methods.createdSuccess'));
      }
      setShowForm(false);
      setForm(initialForm);
      setEditingId(null);
      await reload();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('actions.save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('pages.payment.methods.deleteConfirm'))) return;
    try {
      await deleteAdminPaymentMethod(id);
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('actions.delete'));
    }
  };

  const handleToggleActive = async (m: AdminPaymentMethod) => {
    try {
      await updateAdminPaymentMethod(m._id, { isActive: !m.isActive });
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('actions.update'));
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.payment.methods.header')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.payment.methods.headerDesc')}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#00aeff] text-white px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center hover:bg-[#0096db]"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> {t('pages.payment.methods.addMethod')}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 inline-flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" /> {success}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center rounded-lg border border-dashed border-gray-200">
          <Building2 className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[13px] font-bold text-gray-700">{t('pages.payment.methods.noMethodsYet')}</p>
          <p className="text-[11px] text-gray-500 mt-1">
            {t('pages.payment.methods.noMethodsDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((m) => {
            const meta = KIND_META[m.kind];
            const Icon = meta.icon;
            return (
              <div
                key={m._id}
                className={`rounded-lg border p-4 flex items-start gap-4 bg-white ${
                  m.isActive ? "border-gray-100" : "border-gray-100 opacity-60"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-md bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[13px] font-bold text-gray-900 truncate">{m.label}</h3>
                    <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                      {t(meta.labelKey)}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${
                        m.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {m.isActive ? t('pages.payment.methods.activeLabel') : t('pages.payment.methods.disabledLabel')}
                    </span>
                  </div>
                  {m.kind === "bank" && (
                    <p className="text-[11px] text-gray-700 mt-1">
                      <strong>{m.bankName}</strong> ·{" "}
                      <span className="font-mono">{m.accountNumber}</span> · {m.accountName}
                    </p>
                  )}
                  {m.kind === "promptpay" && (
                    <p className="text-[11px] text-gray-700 mt-1">
                      {t('pages.payment.methods.formPromptpayId')}: <span className="font-mono">{m.promptpayId}</span>
                      {m.accountName && ` · ${m.accountName}`}
                    </p>
                  )}
                  {m.kind === "static_qr" && m.qrImageUrl && (
                    <div className="mt-2 inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.qrImageUrl} alt="QR" className="w-20 h-20 rounded border border-gray-200" />
                    </div>
                  )}
                  {m.notes && (
                    <p className="text-[10px] text-gray-500 mt-1 italic">{m.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(m)}
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      m.isActive
                        ? "border border-gray-200 text-gray-700 hover:bg-gray-50"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {m.isActive ? t('pages.payment.methods.disable') : t('pages.payment.methods.enable')}
                  </button>
                  <button
                    onClick={() => openEdit(m)}
                    className="p-1.5 rounded hover:bg-gray-50 text-gray-400 hover:text-[#00aeff]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m._id)}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal
          title={editingId ? t('pages.payment.methods.editModal') : t('pages.payment.methods.addModal')}
          onClose={() => setShowForm(false)}
          disabled={saving}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label={t('pages.payment.methods.formType')}>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(KIND_META) as PaymentMethodKind[]).map((k) => {
                  const meta = KIND_META[k];
                  const Icon = meta.icon;
                  return (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setForm({ ...form, kind: k })}
                      className={`p-3 rounded-md border text-xs font-bold inline-flex flex-col items-center gap-1 ${
                        form.kind === k
                          ? "border-[#00aeff] bg-blue-50 text-[#00aeff]"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{t(meta.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label={t('pages.payment.methods.formLabel')} required>
              <input
                required
                className={inputCls}
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder={
                  form.kind === "bank"
                    ? "e.g. Kasikorn Main Account"
                    : form.kind === "promptpay"
                    ? "e.g. PromptPay (mobile)"
                    : "e.g. TrueMoney Wallet"
                }
              />
            </Field>

            {form.kind === "bank" && (
              <>
                <Field label={t('pages.payment.methods.formBankName')} required>
                  <input
                    required
                    className={inputCls}
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    placeholder="Kasikornbank"
                  />
                </Field>
                <Field label={t('pages.payment.methods.formAccountNumber')} required>
                  <input
                    required
                    className={`${inputCls} font-mono`}
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    placeholder="123-4-56789-0"
                  />
                </Field>
                <Field label={t('pages.payment.methods.formAccountName')} required>
                  <input
                    required
                    className={inputCls}
                    value={form.accountName}
                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                    placeholder="Lalashop Co., Ltd."
                  />
                </Field>
              </>
            )}

            {form.kind === "promptpay" && (
              <>
                <Field
                  label={t('pages.payment.methods.formPromptpayId')}
                  required
                  hint={t('pages.payment.methods.formPromptpayHint')}
                >
                  <input
                    required
                    className={`${inputCls} font-mono`}
                    value={form.promptpayId}
                    onChange={(e) => setForm({ ...form, promptpayId: e.target.value })}
                    placeholder="0812345678"
                  />
                </Field>
                <Field label={t('pages.payment.methods.formAccountHolderName')}>
                  <input
                    className={inputCls}
                    value={form.accountName}
                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                    placeholder="Lalashop Co., Ltd."
                  />
                </Field>
                <p className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1.5 rounded">
                  {t('pages.payment.methods.promptpayInfo')}
                </p>
              </>
            )}

            {form.kind === "static_qr" && (
              <>
                <Field
                  label={t('pages.payment.methods.formQrImageUrl')}
                  required
                  hint={t('pages.payment.methods.formQrHint')}
                >
                  <input
                    required
                    className={inputCls}
                    value={form.qrImageUrl}
                    onChange={(e) => setForm({ ...form, qrImageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </Field>
                {form.qrImageUrl && (
                  <div className="rounded-md border border-gray-100 p-2 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.qrImageUrl}
                      alt="QR preview"
                      className="w-32 h-32 rounded object-contain bg-gray-50"
                    />
                  </div>
                )}
                <Field label={t('pages.payment.methods.formWalletName')}>
                  <input
                    className={inputCls}
                    value={form.accountName}
                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                    placeholder="TrueMoney / Rabbit LinePay"
                  />
                </Field>
              </>
            )}

            <Field label={t('pages.payment.methods.formNotes')}>
              <textarea
                className={`${inputCls} resize-none`}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Please include order ID in transfer reference"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('pages.payment.methods.formDisplayOrder')}>
                <input
                  type="number"
                  className={inputCls}
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm({ ...form, displayOrder: Number(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label={t('pages.payment.methods.formStatus')}>
                <label className="flex items-center gap-2 mt-1.5">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span className="text-xs text-gray-700">{t('pages.payment.methods.formActiveLabel')}</span>
                </label>
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="px-3 py-1.5 rounded border text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {t('pages.payment.methods.formCancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded bg-[#00aeff] text-white text-xs font-bold hover:bg-[#0096db] disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? t('pages.payment.methods.formSaving') : editingId ? t('pages.payment.methods.formSaveChanges') : t('pages.payment.methods.formCreateMethod')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const inputCls =
  "w-full px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-100 focus:border-[#00aeff] focus:bg-white focus:outline-none transition-colors";

const Field: React.FC<{
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, required, children }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <label className="text-[11px] font-bold text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
    </div>
    {children}
  </div>
);

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ title, onClose, disabled, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h3 className="text-[14px] font-bold">{title}</h3>
        <button
          onClick={onClose}
          disabled={disabled}
          className="text-gray-500 hover:text-black p-1 rounded disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  </div>
);

export default PaymentMethodsPage;

import { useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import api from '../../services/api';

const OrganizationSetupModal = ({ isOpen, organization, onComplete }) => {
    const [name, setName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setName(organization?.name || '');
        setTaxId(organization?.taxId || '');
        setError('');
    }, [isOpen, organization]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        const trimmedName = name.trim();
        const cleanedTaxId = String(taxId || '').replace(/[\s-]/g, '');
        if (!trimmedName || cleanedTaxId.length !== 14) {
            setError('Ingresa un nombre válido y un NIT de 14 dígitos.');
            return;
        }
        try {
            setSaving(true);
            await api.put('/organization/setup', {
                name: trimmedName,
                taxId: cleanedTaxId
            });
            if (onComplete) {
                await onComplete();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'No pudimos guardar el NIT. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
                <div className="px-8 py-7 border-b border-gray-100 bg-gradient-to-br from-blue-50 via-white to-white">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                            <Building2 size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-blue-500">Onboarding</p>
                            <h2 className="text-xl font-black text-gray-900">Completa el perfil fiscal</h2>
                        </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-500">
                        Necesitamos el NIT para unificar facturas y activar la inteligencia contable.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            Empresa
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Nombre legal o comercial"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            NIT (14 dígitos)
                        </label>
                        <input
                            type="text"
                            value={taxId}
                            onChange={(event) => setTaxId(event.target.value)}
                            placeholder="00000000000000"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            disabled={saving}
                        />
                        <p className="mt-2 text-xs text-gray-400">
                            Acepta formato con o sin guiones. Ejemplo: 0614-120390-105-2
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 font-semibold">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : 'Guardar y continuar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OrganizationSetupModal;

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', dui: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const passwordStrong = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    const duiMask = (value) => {
        const digits = value.replace(/\D/g, '').slice(0, 9);
        if (digits.length <= 8) return digits;
        return `${digits.slice(0, 8)}-${digits.slice(8)}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!passwordStrong.test(formData.password)) {
            setError('La contraseña debe tener mayúscula, número y símbolo (mín. 8).');
            return;
        }
        const duiPattern = /^\d{8}-\d$/;
        if (!duiPattern.test(formData.dui)) {
            setError('DUI inválido. Formato 00000000-0');
            return;
        }
        if (!formData.name || formData.name.trim().length < 2 || formData.name.trim().length > 80) {
            setError('Nombre inválido (2 a 80 caracteres).');
            return;
        }

        setIsSubmitting(true);
        try {
            await register(formData.name.trim(), formData.email, formData.password, formData.dui);
            navigate('/');
        } catch (err) {
            if (err.response?.status === 429) {
                setError(err.response?.data?.message || err.response?.data?.msg || 'Demasiados intentos. Espera un momento.');
            } else {
                setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'No se pudo registrar');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="flex items-center justify-center gap-3 pt-8 pb-6 border-b border-gray-100">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2L3 14h9l-1 8 9-12h-9l1-8z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-semibold text-gray-900">Doria</span>
                </div>

                <div className="px-10 py-9">
                    <h1 className="text-2xl font-semibold text-gray-900 text-center">Crear cuenta</h1>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                placeholder="Ejemplo@gmail.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">DUI</label>
                            <input
                                type="text"
                                required
                                value={formData.dui}
                                onChange={(e) => setFormData({ ...formData, dui: duiMask(e.target.value) })}
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                placeholder="00000000-0"
                                maxLength={10}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                    placeholder="Al menos 8 caracteres"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {/* Strength bar visual (simple) */}
                            <div className="mt-3 text-xs space-y-1 text-gray-600">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    Mínimo 8 caracteres
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    Una letra mayúscula
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${/\d/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    Un número
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    Un símbolo
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 animate-pulse">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#1e293b] text-white py-3 rounded-full font-semibold hover:bg-[#0f172a] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Registrarse'}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500 mb-4">¿Ya tienes una cuenta?</p>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center w-full py-2.5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:text-gray-900 transition-colors"
                        >
                            Iniciar sesión
                        </Link>
                    </div>

                    <div className="mt-8 text-center text-xs text-gray-400 uppercase tracking-widest">
                        © 2025 Doria
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

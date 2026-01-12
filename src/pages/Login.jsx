import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(formData.email, formData.password);
            navigate('/');
        } catch (err) {
            if (err.response?.status === 429) {
                setError(err.response?.data?.message || err.response?.data?.msg || 'Demasiados intentos. Intenta en un minuto.');
            } else {
                setError(err.response?.data?.msg || 'Credenciales inválidas');
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
                    <h1 className="text-2xl font-semibold text-gray-900 text-center">Log in</h1>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                placeholder=""
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
                                    className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                    placeholder=""
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <Link to="/forgot" className="text-sm text-gray-600 hover:text-gray-900">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 animate-pulse">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Iniciar sesión'}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500 mb-4">¿No tienes una cuenta?</p>
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center w-full py-2.5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:text-gray-900 transition-colors"
                        >
                            Regístrate
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

export default Login;

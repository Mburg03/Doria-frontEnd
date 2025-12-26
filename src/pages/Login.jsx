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
        <div className="flex min-h-screen bg-gray-50">
            {/* Left: Form Side */}
            <div className="flex flex-col justify-center w-full p-8 md:w-1/2 lg:w-5/12 xl:w-4/12 md:p-12 lg:p-16">
                <div className="w-full max-w-sm mx-auto">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                        Bienvenido de regreso <span role="img" aria-label="wave">👋</span>
                    </h1>
                    <p className="text-gray-500 mb-8">
                        Comienza a gestionar tus facturas.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
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
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
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
                            <Link to="/forgot" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
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
                            className="w-full bg-[#1e293b] text-white py-3 rounded-lg font-semibold hover:bg-[#0f172a] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <div className="mt-12 text-center text-sm text-gray-500">
                        ¿No tienes una cuenta?{' '}
                        <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                            Regístrate
                        </Link>
                    </div>

                    <div className="mt-16 text-center text-xs text-gray-400 uppercase tracking-widest">
                        © 2025 Doria
                    </div>
                </div>
            </div>

            {/* Right: Image Side */}
            <div className="hidden md:block w-1/2 lg:w-7/12 xl:w-8/12 bg-black relative overflow-hidden">
                {/* Placeholder for the aesthetic dark floral image or similar premium vibe */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-90 z-10"></div>
                <img
                    src="https://images.unsplash.com/photo-1542259649-41a396264e1f?q=80&w=2574&auto=format&fit=crop"
                    alt="Aesthetic Background"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
                />
                <div className="absolute bottom-10 left-10 z-20 text-white max-w-md">
                    <p className="text-xl font-light italic mb-2">"Simplicity is the ultimate sophistication."</p>
                    <p className="text-sm opacity-70">Automate your workflow securely.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;

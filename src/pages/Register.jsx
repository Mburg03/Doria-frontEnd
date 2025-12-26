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
        <div className="flex min-h-screen bg-gray-50">
            {/* Left: Form Side */}
            <div className="flex flex-col justify-center w-full p-8 md:w-1/2 lg:w-5/12 xl:w-4/12 md:p-12 lg:p-16">
                <div className="w-full max-w-sm mx-auto">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                        Crea tu cuenta <span role="img" aria-label="party">🎉</span>
                    </h1>
                    <p className="text-gray-500 mb-8">
                        Únete a Factura Automate y simplifica tu vida.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                            className="w-full bg-[#1e293b] text-white py-3 rounded-lg font-semibold hover:bg-[#0f172a] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Registrarse'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                            Iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right: Image Side - Same as Login for consistency */}
            <div className="hidden md:block w-1/2 lg:w-7/12 xl:w-8/12 bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-90 z-10"></div>
                <img
                    src="https://images.unsplash.com/photo-1542259649-41a396264e1f?q=80&w=2574&auto=format&fit=crop"
                    alt="Aesthetic Background"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
                />
                <div className="absolute bottom-10 left-10 z-20 text-white max-w-md">
                    <h2 className="text-3xl font-bold mb-4">Start organizing today.</h2>
                    <p className="text-sm opacity-70">Focus on your business, we handle the documents.</p>
                </div>
            </div>
        </div>
    );
};

export default Register;

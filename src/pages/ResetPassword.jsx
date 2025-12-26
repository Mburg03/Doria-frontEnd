import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Loader2 } from 'lucide-react';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset', { token, password });
      setMessage(res.data?.msg || 'Contraseña actualizada');
    } catch (err) {
      setError(err.response?.data?.msg || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Restablecer contraseña</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Al menos 8 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          {message && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">{message}</div>}
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Actualizar contraseña'}
          </button>
        </form>
        <div className="text-sm text-gray-500 text-center">
          <Link to="/login" className="text-blue-600 font-medium">Volver a iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

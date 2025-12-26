import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { RefreshCw, Trash2, Loader2, Eye, KeyRound } from 'lucide-react';

const formatSize = (bytes = 0) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Administración</h1>
          <p className="text-gray-600">No tienes permisos para esta sección.</p>
        </div>
      </Layout>
    );
  }

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/users?limit=20&page=1');
      setUsers(res.data.items || []);
    } catch (err) {
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/admin/users/${id}`);
      setSelected(res.data);
    } catch {
      setSelected(null);
      setError('No se pudo cargar el detalle.');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este usuario y sus paquetes?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      if (selected?.user?._id === id) setSelected(null);
    } catch {
      setError('No se pudo eliminar el usuario.');
    }
  };

  const handleResetPassword = async (id) => {
    const newPass = window.prompt('Nueva contraseña (min 8 caracteres):');
    if (!newPass || newPass.length < 8) return;
    try {
      await api.patch(`/admin/users/${id}/password`, { password: newPass });
      alert('Contraseña actualizada');
    } catch {
      setError('No se pudo actualizar la contraseña.');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role } : u))
      );
      if (selected?.user?._id === id) {
        setSelected((prev) => ({ ...prev, user: { ...prev.user, role } }));
      }
    } catch {
      setError('No se pudo actualizar el rol.');
    }
  };

  const handlePlanChange = async (id, plan) => {
    try {
      await api.patch(`/admin/users/${id}/plan`, { plan });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, plan } : u))
      );
      if (selected?.user?._id === id) {
        setSelected((prev) => ({ ...prev, user: { ...prev.user, plan } }));
      }
    } catch {
      setError('No se pudo actualizar el plan.');
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administración de Usuarios</h1>
          <p className="text-gray-500">Gestiona roles, paquetes y accesos.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refrescar
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr,1.4fr,0.7fr,0.9fr,0.8fr,1fr] text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 px-4 py-3">
            <span>Usuario</span>
            <span>Rol / Plan</span>
            <span className="text-right">Paquetes</span>
            <span className="text-right">Tamaño</span>
            <span className="text-right">DTE mes</span>
            <span className="text-right">Acciones</span>
          </div>
          {loading ? (
            <div className="p-6 text-gray-500">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-gray-500">No hay usuarios.</div>
          ) : (
            users.map((u) => (
              <div key={u._id} className="grid grid-cols-[2fr,1.4fr,0.7fr,0.9fr,0.8fr,1fr] items-center px-4 py-3 border-b border-gray-50 text-sm text-gray-700">
                <div>
                  <div className="font-semibold text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                  <div className="text-xs text-gray-500">DUI: {u.dui}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white"
                    >
                      <option value="viewer">viewer</option>
                      <option value="basic">basic</option>
                      <option value="admin">admin</option>
                    </select>
                    <select
                      value={u.plan || 'personal'}
                      onChange={(e) => handlePlanChange(u._id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white"
                    >
                      <option value="personal">personal</option>
                      <option value="negocio">negocio</option>
                      <option value="pro">pro</option>
                    </select>
                  </div>
                </div>
                <span className="text-right">{u.stats?.totalPackages ?? 0}</span>
                <span className="text-right">{formatSize(u.stats?.totalSize ?? 0)}</span>
                <span className="text-right">{u.usage?.dteCount ?? 0}</span>
                <div className="text-right flex items-center justify-end gap-2">
                  <button
                    onClick={() => fetchDetail(u._id)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    title="Ver detalle"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleResetPassword(u._id)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    title="Resetear contraseña"
                  >
                    <KeyRound size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(u._id)}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-3">Detalle</h3>
          {loadingDetail && <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Cargando...</p>}
          {!loadingDetail && !selected && <p className="text-sm text-gray-500">Selecciona un usuario para ver detalle.</p>}
          {selected && !loadingDetail && (
            <div className="space-y-2 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">{selected.user.name}</p>
              <p>Email: {selected.user.email}</p>
              <p>DUI: {selected.user.dui}</p>
              <p>Rol: {selected.user.role}</p>
              <p>Plan: {selected.user.plan} ({selected.user.planStatus || 'active'})</p>
              <p>Paquetes: {selected.packages?.length ?? 0}</p>
              <p>Uso mensual: {selected.usage?.dteCount ?? 0} DTEs</p>
              <p>Cuentas Gmail: {selected.gmailCount ?? 0}</p>
              {selected.accounts?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cuentas conectadas</p>
                  <div className="space-y-1">
                    {selected.accounts.map((acc) => (
                      <div key={acc._id || acc.id} className="text-xs text-gray-700 border border-gray-100 rounded px-2 py-1">
                        {acc.email}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Paquetes recientes</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {(selected.packages || []).slice(0, 5).map((p) => (
                    <div key={p._id} className="flex items-center justify-between border border-gray-100 rounded-lg px-2 py-1">
                      <div>
                        <p className="text-xs text-gray-800">{p.batchLabel}</p>
                        <p className="text-[11px] text-gray-500">{new Date(p.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="text-[11px] text-gray-500">{formatSize(p.sizeBytes)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminUsers;

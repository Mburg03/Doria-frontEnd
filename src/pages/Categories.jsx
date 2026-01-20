import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCategory, deleteCategory, fetchCategories } from '../services/categoriesService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { PlusCircle, RefreshCw, Search, Tag, Trash2, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { formatNumber } from '../utils/formatters';
import Toast from '../components/Toast';

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [categoryQuery, setCategoryQuery] = useState('');
  const debouncedCategoryQuery = useDebouncedValue(categoryQuery);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#2563EB');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Estados para feedback visual
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      setCategoriesError(err?.message || 'No se pudieron cargar las categorias.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const term = debouncedCategoryQuery.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) => category.name?.toLowerCase().includes(term));
  }, [categories, debouncedCategoryQuery]);

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const created = await createCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        description: newCategoryDescription.trim()
      });
      setNewCategoryName('');
      setNewCategoryDescription('');
      setToast({ message: 'Categoría creada exitosamente', type: 'success' });
      navigate(`/categories/${created.id}`);
    } catch (err) {
      setToast({ message: err?.message || 'No se pudo crear la categoría.', type: 'error' });
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!categoryId) return;
    setDeletingCategory(true);
    try {
      await deleteCategory(categoryId);
      setCategories((prev) => prev.filter((category) => category.id !== categoryId));
      setToast({ message: 'Categoría eliminada exitosamente', type: 'success' });
      setConfirmDelete(null);
    } catch (err) {
      setToast({ message: err?.message || 'No se pudo eliminar la categoría.', type: 'error' });
    } finally {
      setDeletingCategory(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-1 w-5 bg-blue-600 rounded-full"></div>
            <span className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em]">Categorias</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Categorias Inteligentes</h1>
          <p className="text-gray-400 mt-1 text-sm font-medium">
            Crea colecciones para agrupar proveedores y productos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Tag size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Nueva categoría</p>
              <p className="text-[10px] text-gray-500">Personaliza tu colección</p>
            </div>
          </div>

          <form onSubmit={handleCreateCategory} className="space-y-4">
            {/* Input de nombre */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-black mb-1.5 block">
                Nombre
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Gastos de Operación"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Color picker con preview */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-black mb-1.5 block">
                Color
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="h-12 w-12 rounded-xl border-2 border-gray-200 bg-gray-50 p-1 cursor-pointer hover:border-blue-400 transition-all"
                  />
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: newCategoryColor }}></div>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="h-6 w-6 rounded-lg shadow-sm" style={{ backgroundColor: newCategoryColor }}></div>
                  <span className="text-xs font-mono text-gray-600">{newCategoryColor.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-black mb-1.5 block">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Ej: Gastos operativos mensuales"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Botón crear categoría */}
            <button
              type="submit"
              disabled={!newCategoryName.trim() || creatingCategory}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                {creatingCategory ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <PlusCircle size={14} />
                    Crear categoría
                  </>
                )}
              </div>
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Categorias</p>
              <p className="text-sm text-gray-600">{formatNumber(categories.length)} activas</p>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                placeholder="Buscar"
                className="pl-7 pr-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-100 bg-gray-50 focus:border-blue-500 focus:ring-0"
              />
            </div>
          </div>

          {categoriesLoading ? (
            <div className="p-6 text-sm text-gray-500 flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin" />
              Cargando categorias...
            </div>
          ) : categoriesError ? (
            <div className="p-6 text-sm text-red-600">{categoriesError}</div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                <Tag size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Sin categorías</p>
              <p className="text-xs text-gray-500">Crea tu primera categoría para comenzar</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => navigate(`/categories/${category.id}`)}
                  className="group relative w-full overflow-hidden bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl p-4 text-left hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Icono de categoría con color */}
                      <div
                        className="h-12 w-12 rounded-xl shadow-md flex items-center justify-center transform group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: category.color }}
                      >
                        <Tag size={20} className="text-white" />
                      </div>

                      {/* Información */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                          {category.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-gray-500 font-medium">
                            {formatNumber(category.providerCount)} proveedores
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {formatNumber(category.productCount)} productos
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botón de eliminar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({ id: category.id, name: category.name });
                      }}
                      className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Eliminar categoría"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Indicador de hover */}
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Categories;

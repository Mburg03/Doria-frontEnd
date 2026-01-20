import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCategory, deleteCategory, fetchCategories } from '../services/categoriesService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { PlusCircle, RefreshCw, Search, Tag, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { formatNumber } from '../utils/formatters';

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
      navigate(`/categories/${created.id}`);
    } catch (err) {
      setCategoriesError(err?.message || 'No se pudo crear la categoria.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!categoryId) return;
    const confirmDelete = window.confirm('Eliminar esta categoria y todas sus asignaciones?');
    if (!confirmDelete) return;
    try {
      await deleteCategory(categoryId);
      setCategories((prev) => prev.filter((category) => category.id !== categoryId));
    } catch (err) {
      setCategoriesError(err?.message || 'No se pudo eliminar la categoria.');
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

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
            <Tag size={14} />
            Nueva categoria
          </div>
          <form onSubmit={handleCreateCategory} className="mt-4 space-y-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Gastos de Operacion"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 focus:border-blue-500 focus:bg-white focus:ring-0"
            />
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="h-10 w-12 rounded-lg border border-gray-200 bg-gray-50 p-1"
              />
              <input
                type="text"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Descripcion corta (opcional)"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 focus:border-blue-500 focus:bg-white focus:ring-0"
              />
            </div>
            <button
              type="submit"
              disabled={creatingCategory}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-700 transition-all disabled:opacity-60"
            >
              {creatingCategory ? <RefreshCw size={14} className="animate-spin" /> : <PlusCircle size={14} />}
              Crear
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
            <div className="p-6 text-sm text-gray-500">Sin categorias.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className={clsx(
                    'px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-all'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/categories/${category.id}`)}
                    className="flex items-center gap-3 text-left"
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{category.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {formatNumber(category.providerCount)} proveedores · {formatNumber(category.productCount)} productos
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Eliminar categoria"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Categories;

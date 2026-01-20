import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
    ArrowLeft,
    Building2,
    Package,
    TrendingUp,
    Calendar,
    Search,
    Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const ProviderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [providerData, setProviderData] = useState(null); // Info básica (simulada o fetch)
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('products'); // 'overview' | 'products'
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Productos del Proveedor
                const { data } = await api.get(`/insights/products/provider/${id}`);
                setProducts(data);

                // Simulación de datos del proveedor (Idealmente vendría de un endpoint /api/providers/:id)
                // Por ahora lo inferimos de los productos o un estado previo si existiera
                setProviderData({
                    name: 'Proveedor', // TODO: Fetch real name via ID
                    nit: 'Fetching...',
                    category: 'General'
                });

            } catch (error) {
                console.error('Error fetching provider details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    const filteredProducts = products.filter(p =>
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Layout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
            </Layout>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header Minimalista */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Building2 size={18} className="text-blue-600" />
                                    {/* Nombre temporal hasta tener endpoint de detalle */}
                                    Detalle del Proveedor
                                </h1>
                                <p className="text-xs text-gray-500 font-mono">ID: {id}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {/* Tabs */}
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${activeTab === 'overview'
                                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Resumen
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${activeTab === 'products'
                                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Productos ({products.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'products' && (
                    <div className="space-y-6">
                        {/* Barra de Búsqueda */}
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Grid de Productos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map((product, idx) => (
                                <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all group cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Package size={20} />
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${product.priceVariation > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                            {product.priceVariation > 0 ? 'Varía' : 'Estable'}
                                        </span>
                                    </div>

                                    <h3 className="font-medium text-gray-900 truncate" title={product.description}>
                                        {product.description}
                                    </h3>

                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Último Precio</span>
                                            <span className="font-semibold">${product.lastPrice?.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Promedio</span>
                                            <span className="text-gray-700">${product.avgPrice?.toFixed(2)}</span>
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-gray-50 flex justify-between text-xs text-gray-400">
                                            <span>{product.totalQuantity} unidades</span>
                                            <span>{product.transactionCount} compras</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <TrendingUp size={48} className="mb-4 opacity-20" />
                        <p>Gráficas de tendencia próximamente...</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProviderDetails;

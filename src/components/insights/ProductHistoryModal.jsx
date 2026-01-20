import React, { useEffect, useState } from 'react';
import { X, TrendingUp, Loader2, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const ProductHistoryModal = ({ isOpen, onClose, product, providerId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && product) {
            fetchHistory();
        }
    }, [isOpen, product]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/insights/products/history', {
                params: {
                    description: product.description,
                    providerId
                }
            });
            // Formatear fechas para la gráfica
            const formattedData = data.map(item => ({
                ...item,
                dateStr: new Date(item.date).toLocaleDateString('es-SV', {
                    day: '2-digit', month: 'short', year: '2-digit'
                })
            }));
            setHistory(formattedData);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 pr-8 line-clamp-2">
                            {product?.description}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <TrendingUp size={16} className="text-blue-500" />
                            <span>Historial de Precios</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="animate-spin text-gray-400" size={32} />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Gráfica */}
                            <div className="h-64 w-full">
                                {history.length > 1 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={history}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis
                                                dataKey="dateStr"
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                                axisLine={false}
                                                tickLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(value) => `$${value}`}
                                                dx={-10}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ color: '#111827', fontWeight: 600 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="price"
                                                stroke="#3B82F6"
                                                strokeWidth={3}
                                                dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <Calendar size={32} className="mb-2 opacity-50" />
                                        <p className="text-sm">Se necesitan al menos 2 compras para ver tendencia.</p>
                                    </div>
                                )}
                            </div>

                            {/* Lista Detallada */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-4 text-sm uppercase tracking-wide">Registro de Compras</h4>
                                <div className="border border-gray-100 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium">
                                            <tr>
                                                <th className="px-4 py-3">Fecha</th>
                                                <th className="px-4 py-3">Documento</th>
                                                <th className="px-4 py-3 text-right">Cantidad</th>
                                                <th className="px-4 py-3 text-right">Precio Unit.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {history.map((record, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-gray-600">{record.dateStr}</td>
                                                    <td className="px-4 py-3 text-gray-900 font-medium">{record.controlNumber || record.generationCode?.slice(-8)}</td>
                                                    <td className="px-4 py-3 text-right text-gray-600">{record.quantity}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-blue-600">${record.price.toFixed(4)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductHistoryModal;

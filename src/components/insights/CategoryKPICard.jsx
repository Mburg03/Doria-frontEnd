const CategoryKPICard = ({ label, value, icon: Icon, loading = false }) => (
    <div className="group relative overflow-hidden bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">{label}</p>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                    <Icon size={16} />
                </div>
            </div>
            <p className="text-2xl font-black text-gray-900">
                {loading ? '—' : value}
            </p>
        </div>
    </div>
);

export default CategoryKPICard;

import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const config = {
        success: {
            icon: CheckCircle,
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-900',
            iconColor: 'text-emerald-600'
        },
        error: {
            icon: XCircle,
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-900',
            iconColor: 'text-red-600'
        },
        info: {
            icon: Info,
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-900',
            iconColor: 'text-blue-600'
        }
    };

    const { icon: Icon, bg, border, text, iconColor } = config[type];

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className={`flex items-center gap-3 ${bg} ${border} border rounded-xl px-4 py-3 shadow-lg max-w-md`}>
                <Icon size={20} className={iconColor} />
                <p className={`text-sm font-semibold ${text} flex-1`}>{message}</p>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default Toast;

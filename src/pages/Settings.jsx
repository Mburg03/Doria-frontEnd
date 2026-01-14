import Layout from '../components/Layout';
import { Info } from 'lucide-react';

const Settings = () => {
  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
          <p className="text-gray-500">Preferencias y soporte.</p>
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 flex items-start gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
          <Info size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Soporte</h3>
          <p className="text-sm text-gray-600">
            Para ayuda o soporte, escríbenos a{' '}
            <a href="mailto:mburgosgit003@gmail.com" className="text-blue-600 underline">
              mburgosgit003@gmail.com
            </a>.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;

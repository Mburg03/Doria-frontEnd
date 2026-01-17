import { Search, X } from 'lucide-react';

const SearchInput = ({ value, onChange, placeholder }) => (
  <div className="relative w-full max-w-sm">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
      aria-label={placeholder}
    />
    {value ? (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
        aria-label="Limpiar búsqueda"
      >
        <X className="h-4 w-4" />
      </button>
    ) : null}
  </div>
);

export default SearchInput;

import {FaSearch} from 'react-icons/fa';
import {FaXmark} from 'react-icons/fa6';
/**
 * A custom hook to filter the records that are already loaded on the screen, 
 * without creating a new request.
 */
export default function CatalogSearchInput({
  value,
  onChange,
  placeholder = 'Search loaded titles...',
}) {
  return (
    <div className="relative w-full sm:w-56">
      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded border border-black/20 bg-white py-2 pl-8 pr-3 text-sm text-black
                    focus:outline-none focus:ring-2 focus:ring-black dark:border-white/20 dark:bg-zinc-900
                    dark:text-white dark:focus:ring-white"
      />
      <button onClick={() => onChange ({target: {value: ''}})}>
        <FaXmark className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 cursor-pointer" />
      </button>
    </div>
  );
}

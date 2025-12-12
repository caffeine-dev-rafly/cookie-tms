import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // Find selected label
  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    // Close when clicking outside
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Filter options
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{placeholder}</label>
      
      <div 
        className={`
          w-full border rounded-lg flex items-center bg-white cursor-pointer relative
          ${isOpen ? 'ring-2 ring-green-500 border-transparent' : 'border-gray-300'}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        {Icon && <div className="pl-3 py-2 text-gray-400"><Icon size={20} /></div>}
        
        <div className="flex-1 p-2 px-3 text-gray-700 truncate h-10 flex items-center">
            {selectedOption ? selectedOption.label : <span className="text-gray-400">Select {placeholder}...</span>}
        </div>

        <div className="pr-3 flex items-center gap-1">
            {value && (
                <button onClick={clearSelection} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            )}
            <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1">
                <Search size={16} className="text-gray-400" />
                <input 
                    autoFocus
                    type="text"
                    className="w-full outline-none text-sm p-1"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()} 
                />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                <div 
                    key={option.value}
                    className={`
                        px-4 py-2 text-sm cursor-pointer hover:bg-green-50 hover:text-green-700
                        ${value === option.value ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}
                    `}
                    onClick={() => handleSelect(option)}
                >
                    {option.label}
                    {option.subLabel && <span className="block text-xs text-gray-500">{option.subLabel}</span>}
                </div>
                ))
            ) : (
                <div className="p-4 text-center text-gray-500 text-sm">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

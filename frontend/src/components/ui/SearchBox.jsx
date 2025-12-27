import { useState } from 'react';
import './SearchBox.css';

/**
 * SearchBox Component
 * Reusable search input with debouncing
 */
const SearchBox = ({ 
  placeholder = 'Tìm kiếm...', 
  onSearch, 
  debounceMs = 300,
  defaultValue = ''
}) => {
  const [value, setValue] = useState(defaultValue);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout for debounced search
    const newTimeoutId = setTimeout(() => {
      onSearch(newValue);
    }, debounceMs);

    setTimeoutId(newTimeoutId);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className="search-box">
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      {value && (
        <button 
          className="search-clear-button" 
          onClick={handleClear}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBox;

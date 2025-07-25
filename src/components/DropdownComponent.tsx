import { createSignal, createEffect, onMount, onCleanup, For, Show, createMemo } from 'solid-js';
import { ChevronDown, Search } from 'lucide-solid';
import type { DropdownOption } from '../types';

export type { DropdownOption };

export interface DropdownProps {
  options: DropdownOption[];
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  primaryColor?: string;
  hoverColor?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
}

export function DropdownComponent(props: DropdownProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [selectedOption, setSelectedOption] = createSignal<DropdownOption | null>(null);
  const [highlightedIndex, setHighlightedIndex] = createSignal(-1);
  const [searchQuery, setSearchQuery] = createSignal('');
  
  let dropdownRef: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;
  
  // Color helpers
  const primaryColor = () => props.primaryColor || 'text-[#005DA9]';
  const primaryBorderColor = () => props.primaryColor?.replace('text-', 'border-') || 'border-[#005DA9]';
  const primaryBgColor = () => props.primaryColor?.replace('text-', 'bg-') || 'bg-[#005DA9]';
  const hoverBgColor = () => 'bg-gray-100';
  
  // Filtered options based on search query
  const filteredOptions = createMemo(() => {
    const query = searchQuery().toLowerCase().trim();
    if (!query) return props.options;
    
    return props.options.filter(option => 
      option.label.toLowerCase().includes(query)
    );
  });
  
  // Initialize selected option from value prop
  createEffect(() => {
    if (props.value !== undefined && props.options) {
      const option = props.options.find(opt => opt.value === props.value);
      if (option) {
        setSelectedOption(option);
      }
    } else {
      // Clear selection when value is undefined
      setSelectedOption(null);
    }
  });
  
  // Handle click outside
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      setIsOpen(false);
      setHighlightedIndex(-1);
      setSearchQuery(''); // Clear search when clicking outside
    }
  };
  
  onMount(() => {
    // Use mousedown but with proper event handling
    document.addEventListener('mousedown', handleClickOutside);
  });
  
  onCleanup(() => {
    document.removeEventListener('mousedown', handleClickOutside);
  });
  
  // Input display value
  const inputValue = createMemo(() => {
    if (searchQuery()) return searchQuery();
    return selectedOption()?.label || '';
  });
  
  const handleSelect = (option: DropdownOption) => {
    setSelectedOption(option);
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    props.onChange?.(option.value);
  };
  
  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = target.value;
    setSearchQuery(newValue);
    setHighlightedIndex(0); // Reset highlight when search changes
    
    // If input is cleared, also clear the selection
    if (newValue === '' && selectedOption()) {
      setSelectedOption(null);
      props.onChange?.(undefined as any); // Clear the parent's value
    }
    
    if (!isOpen()) {
      setIsOpen(true);
    }
  };
  
  const handleInputFocus = () => {
    setIsOpen(true);
  };
  
  const handleToggleDropdown = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const wasOpen = isOpen();
    setIsOpen(!wasOpen);
    if (!wasOpen) {
      // Small timeout to ensure dropdown opens before focusing
      setTimeout(() => inputRef?.focus(), 0);
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen() && e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(0);
      return;
    }
    
    if (!isOpen()) return;
    
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchQuery(''); // Clear search on escape
        inputRef?.blur(); // Remove focus from input
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        const filtered = filteredOptions();
        setHighlightedIndex(prev => 
          prev < filtered.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
        
      case 'Enter':
        e.preventDefault();
        const highlighted = highlightedIndex();
        const options = filteredOptions();
        if (highlighted >= 0 && highlighted < options.length) {
          handleSelect(options[highlighted]);
        }
        break;
        
      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        break;
        
      case 'End':
        e.preventDefault();
        setHighlightedIndex(filteredOptions().length - 1);
        break;
    }
  };
  
  return (
    <div class="w-full">
      <Show when={props.label}>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {props.label}
          <Show when={props.required}>
            <span class="text-red-500 ml-1">*</span>
          </Show>
        </label>
      </Show>
      
      <div ref={dropdownRef} class="relative overflow-visible">
        <div class="relative overflow-visible">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-4 w-4 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue()}
            onInput={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            disabled={props.disabled}
            placeholder={props.searchPlaceholder || props.placeholder || 'Search or select an option'}
            class={`w-full pl-10 pr-12 py-3 bg-white border-2 border-solid rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-text ${
              props.disabled 
                ? 'bg-gray-100 cursor-not-allowed border-gray-300 text-gray-500 shadow-sm' 
                : selectedOption() && !searchQuery()
                  ? `border-[#005DA9] border-opacity-40 shadow-lg hover:shadow-xl hover:border-opacity-60 focus:border-[#005DA9] focus:ring-[#005DA9] text-gray-900 font-medium`
                  : `border-gray-400 shadow-md hover:shadow-lg hover:border-[#005DA9] hover:border-opacity-40 focus:border-[#005DA9] focus:ring-[#005DA9] ${searchQuery() ? 'text-gray-900' : 'text-gray-500'}`
            } transition-all duration-200`}
            aria-haspopup="listbox"
            aria-expanded={isOpen()}
            aria-labelledby={props.label ? `${props.label}-label` : undefined}
          />
          <div class="absolute inset-y-0 right-0 pr-2 flex items-center">
            <button
              type="button"
              onClick={handleToggleDropdown}
              class={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                props.disabled 
                  ? 'cursor-not-allowed opacity-50' 
                  : 'cursor-pointer hover:bg-[#005DA9]/10 hover:border hover:border-[#005DA9]/30'
              }`}
              tabIndex={-1} // Prevent tab navigation to this button
              aria-label="Toggle dropdown"
              disabled={props.disabled}
            >
              <ChevronDown 
                class={`h-4 w-4 text-[#005DA9]/70 transition-all duration-200 ${
                  isOpen() ? 'transform rotate-180' : ''
                } ${!props.disabled ? 'group-hover:text-[#005DA9]' : ''}`}
              />
            </button>
          </div>
        </div>
        
        <Show when={isOpen() && !props.disabled}>
          <div class="absolute z-50 w-full mt-2 bg-white border-2 border-[#005DA9]/20 rounded-lg drop-shadow-xl backdrop-blur-sm">
            <ul 
              class="max-h-60 overflow-auto py-2 rounded-lg"
              role="listbox"
              aria-label={props.label || 'Options'}
            >
              <Show
                when={filteredOptions().length > 0}
                fallback={
                  <li class="px-4 py-6 text-center text-gray-500">
                    {props.noResultsText || 'No results found for'} "{searchQuery()}"
                  </li>
                }
              >
                <For each={filteredOptions()}>
                  {(option, index) => (
                    <li
                      role="option"
                      aria-selected={selectedOption()?.value === option.value}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent focus issues
                        handleSelect(option);
                      }}
                      onMouseEnter={() => setHighlightedIndex(index())}
                      class={`px-4 py-2.5 mx-2 my-0.5 rounded-md cursor-pointer transition-all duration-150 ${
                        selectedOption()?.value === option.value
                          ? `${primaryBgColor()} text-white shadow-sm hover:shadow-md`
                          : `${highlightedIndex() === index() ? 'bg-[#005DA9]/10' : ''} hover:bg-[#005DA9]/10 text-gray-700`
                      }`}
                    >
                      {option.label}
                    </li>
                  )}
                </For>
              </Show>
            </ul>
          </div>
        </Show>
      </div>
    </div>
  );
}
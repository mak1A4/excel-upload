import { createSignal, createEffect, onMount, onCleanup, For, Show } from 'solid-js';
import { ChevronDown } from 'lucide-solid';
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
}

export function DropdownComponent(props: DropdownProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [selectedOption, setSelectedOption] = createSignal<DropdownOption | null>(null);
  const [highlightedIndex, setHighlightedIndex] = createSignal(-1);
  
  let dropdownRef: HTMLDivElement | undefined;
  let buttonRef: HTMLButtonElement | undefined;
  
  // Color helpers
  const primaryColor = () => props.primaryColor || 'text-[#005DA9]';
  const primaryBorderColor = () => props.primaryColor?.replace('text-', 'border-') || 'border-[#005DA9]';
  const primaryBgColor = () => props.primaryColor?.replace('text-', 'bg-') || 'bg-[#005DA9]';
  const hoverBgColor = () => 'bg-gray-100';
  
  // Initialize selected option from value prop
  createEffect(() => {
    if (props.value !== undefined && props.options) {
      const option = props.options.find(opt => opt.value === props.value);
      if (option) {
        setSelectedOption(option);
      }
    }
  });
  
  // Handle click outside
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };
  
  onMount(() => {
    // Use mousedown but with proper event handling
    document.addEventListener('mousedown', handleClickOutside);
  });
  
  onCleanup(() => {
    document.removeEventListener('mousedown', handleClickOutside);
  });
  
  const handleSelect = (option: DropdownOption) => {
    setSelectedOption(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
    props.onChange?.(option.value);
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen()) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }
    
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        buttonRef?.focus();
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < props.options.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        const highlighted = highlightedIndex();
        if (highlighted >= 0 && highlighted < props.options.length) {
          handleSelect(props.options[highlighted]);
        }
        break;
        
      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        break;
        
      case 'End':
        e.preventDefault();
        setHighlightedIndex(props.options.length - 1);
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
      
      <div ref={dropdownRef} class="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen())}
          onKeyDown={handleKeyDown}
          disabled={props.disabled}
          class={`w-full px-3 py-2 text-left bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            props.disabled 
              ? 'bg-gray-100 cursor-not-allowed border-gray-300 text-gray-500' 
              : `border-gray-300 hover:border-gray-400 focus:${primaryBorderColor()} focus:ring-${primaryColor()?.match(/\[(.*?)\]/)?.[1] || '#005DA9'}`
          } transition-colors duration-200`}
          aria-haspopup="listbox"
          aria-expanded={isOpen()}
          aria-labelledby={props.label ? `${props.label}-label` : undefined}
        >
          <div class="flex items-center justify-between">
            <span class={selectedOption() ? 'text-gray-900' : 'text-gray-500'}>
              {selectedOption()?.label || props.placeholder || 'Select an option'}
            </span>
            <ChevronDown 
              class={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                isOpen() ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </button>
        
        <Show when={isOpen() && !props.disabled}>
          <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <ul 
              class="max-h-60 overflow-auto py-1"
              role="listbox"
              aria-label={props.label || 'Options'}
            >
              <For each={props.options}>
                {(option, index) => (
                  <li
                    role="option"
                    aria-selected={selectedOption()?.value === option.value}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent focus issues
                      handleSelect(option);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index())}
                    class={`px-3 py-2 cursor-pointer transition-colors duration-150 ${
                      selectedOption()?.value === option.value
                        ? `${primaryBgColor()} text-white hover:opacity-90`
                        : `${highlightedIndex() === index() ? 'bg-gray-100' : ''} hover:bg-gray-100`
                    }`}
                  >
                    {option.label}
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
      </div>
    </div>
  );
}
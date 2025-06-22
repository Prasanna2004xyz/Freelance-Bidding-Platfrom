import React, { forwardRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  icon?: React.ReactNode;
  helperText?: string;
  showPasswordToggle?: boolean;
  loading?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    success,
    icon, 
    type,
    helperText,
    showPasswordToggle = false,
    loading = false,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    const inputType = type === 'password' && showPassword ? 'text' : type;
    const hasError = !!error;
    const hasSuccess = !!success;
    
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-silver-200">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-silver-400">
              {icon}
            </div>
          )}
          
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {hasError && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
          )}
          
          {hasSuccess && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
          )}
          
          {showPasswordToggle && type === 'password' && !loading && !hasError && !hasSuccess && (
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-silver-400 hover:text-silver-200 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          
          <input
            type={inputType}
            className={cn(
              'w-full px-3 py-3 glass-card text-silver-100 placeholder-silver-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300',
              icon && 'pl-10',
              (hasError || hasSuccess) && 'pr-10',
              loading && 'pr-10',
              showPasswordToggle && type === 'password' && !loading && !hasError && !hasSuccess && 'pr-10',
              hasError && 'ring-2 ring-red-500 bg-red-500/10',
              hasSuccess && 'ring-2 ring-green-500 bg-green-500/10',
              isFocused && !hasError && !hasSuccess && 'ring-2 ring-blue-500 bg-blue-500/10',
              className
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? 'input-error' : 
              hasSuccess ? 'input-success' : 
              helperText ? 'input-helper' : undefined
            }
            {...props}
          />
        </div>
        
        {helperText && !hasError && !hasSuccess && (
          <p id="input-helper" className="text-sm text-silver-400">
            {helperText}
          </p>
        )}
        
        {hasError && (
          <p id="input-error" className="text-sm text-red-400 flex items-center gap-1" aria-live="polite">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
        
        {hasSuccess && (
          <p id="input-success" className="text-sm text-green-400 flex items-center gap-1" aria-live="polite">
            <CheckCircle className="w-3 h-3" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
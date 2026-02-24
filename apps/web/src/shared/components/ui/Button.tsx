import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-transparent',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-9 w-9 p-0 flex items-center justify-center',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

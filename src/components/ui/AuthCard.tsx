import { ReactNode } from 'react'

interface AuthCardProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function AuthCard({ title, subtitle, icon, children, className = '' }: AuthCardProps) {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 w-full">
      <div className={`card p-8 w-full max-w-md ${className}`}>
        <div className="text-center mb-8">
          {icon && (
            <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              {icon}
            </div>
          )}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
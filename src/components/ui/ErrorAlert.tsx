interface ErrorAlertProps {
  message: string
  className?: string
}

export function ErrorAlert({ message, className = '' }: ErrorAlertProps) {
  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center ${className}`}>
      {message}
    </div>
  )
}
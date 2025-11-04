import { IconType } from 'react-icons'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

interface InputFieldProps {
  name: string
  label: string
  type?: string
  placeholder?: string
  icon?: IconType
  showPasswordToggle?: boolean
  showPassword?: boolean
  onTogglePassword?: () => void
  required?: boolean
  optional?: boolean
  // For custom form handling (not Formik context)
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  error?: string
  touched?: boolean
}

export function InputField({
  name,
  label,
  type = 'text',
  placeholder,
  icon: Icon,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
  required = false,
  optional = false,
  value,
  onChange,
  onBlur,
  error,
  touched,
}: InputFieldProps) {
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type
  const hasError = touched && error

  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && <span className="text-gray-500 font-normal ml-1">(optional)</span>}
      </label>
      <div className="relative mb-6">
        {Icon && (
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        )}
        <input
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
            hasError ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <FaEyeSlash className="w-4 h-4" />
            ) : (
              <FaEye className="w-4 h-4" />
            )}
          </button>
        )}
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}
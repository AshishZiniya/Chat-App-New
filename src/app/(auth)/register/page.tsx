'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaArrowLeft, FaImage, FaLock, FaUser, FaUserPlus } from 'react-icons/fa'
import { useFormikForm } from '@/hooks/useFormikForm'
import { validationSchemas } from '@/lib/validations'
import { AuthCard } from '@/components/ui/AuthCard'
import { InputField } from '@/components/ui/InputField'
import { Button } from '@/components/ui/Button'
import { ErrorAlert } from '@/components/ui/ErrorAlert'

interface RegisterFormValues {
  username: string
  password: string
  confirmPassword: string
  avatar: string
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const { values, errors, touched, handleChange, handleSubmit, isLoading, submitError } = useFormikForm<RegisterFormValues>({
    initialValues: {
      username: '',
      password: '',
      confirmPassword: '',
      avatar: '',
    },
    validationSchema: validationSchemas.register,
    onSubmit: async (values) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          avatar: values.avatar,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }

      router.push('/Chat')
    },
  })

  return (
    <AuthCard
      title="Create Account"
      subtitle="Join our chat community"
      icon={<FaUserPlus className="w-8 h-8 text-white" />}
    >
      {submitError && (
        <ErrorAlert message={submitError} className="mb-6" />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField
          name="username"
          label="Username"
          placeholder="Choose a username"
          icon={FaUser}
          value={values.username}
          onChange={handleChange}
          error={errors.username}
          touched={touched.username}
          required
        />

        <InputField
          name="password"
          label="Password"
          type="password"
          placeholder="Enter a password"
          icon={FaLock}
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          touched={touched.password}
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          required
        />

        <InputField
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          icon={FaLock}
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          touched={touched.confirmPassword}
          required
        />

        <InputField
          name="avatar"
          label="Avatar URL"
          placeholder="https://example.com/avatar.jpg"
          icon={FaImage}
          value={values.avatar}
          onChange={handleChange}
          error={errors.avatar}
          touched={touched.avatar}
          optional
        />

        <Button
          type="submit"
          disabled={isLoading}
          loading={isLoading}
          loadingText="Creating..."
          icon={FaUserPlus}
          className="w-full bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          Create Account
        </Button>

        <Link
          href="/login"
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <FaArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </form>
    </AuthCard>
  );
}
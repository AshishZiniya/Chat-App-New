'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaArrowLeft, FaComments, FaLock, FaSignInAlt, FaUser } from 'react-icons/fa'
import { useFormikForm } from '@/hooks/useFormikForm'
import { validationSchemas } from '@/lib/validations'
import { AuthCard } from '@/components/ui/AuthCard'
import { InputField } from '@/components/ui/InputField'
import { Button } from '@/components/ui/Button'
import { ErrorAlert } from '@/components/ui/ErrorAlert'

interface LoginFormValues {
  username: string
  password: string
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const { values, errors, touched, handleChange, handleSubmit, isLoading, submitError } = useFormikForm<LoginFormValues>({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: validationSchemas.login,
    onSubmit: async (values) => {
      const result = await signIn('credentials', {
        username: values.username,
        password: values.password,
        isRegister: 'false',
        redirect: false
      })

      if (result?.error) {
        throw new Error(result.error || 'Invalid credentials')
      } else if (result?.ok) {
        router.push('/Chat')
      } else {
        throw new Error('Login failed')
      }
    },
  })

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account"
      icon={<FaComments className="w-8 h-8 text-white" />}
    >
      {submitError && (
        <ErrorAlert message={submitError} className="mb-6" />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField
          name="username"
          label="Username"
          placeholder="Enter your username"
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
          placeholder="Enter your password"
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

        <Button
          type="submit"
          disabled={isLoading}
          loading={isLoading}
          loadingText="Signing in..."
          icon={FaSignInAlt}
          className="w-full"
        >
          Sign in
        </Button>

        <Link
          href="/register"
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <FaArrowLeft className="w-4 h-4" />
          Create Account
        </Link>
      </form>
    </AuthCard>
  )
}
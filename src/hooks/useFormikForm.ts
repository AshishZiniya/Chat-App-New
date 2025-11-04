import { useFormik } from 'formik'
import { ObjectSchema, AnyObject } from 'yup'

interface UseFormikFormOptions<T extends AnyObject> {
  initialValues: T
  validationSchema: ObjectSchema<T>
  onSubmit: (values: T) => Promise<void> | void
}

export function useFormikForm<T extends AnyObject>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormikFormOptions<T>) {
  const formik = useFormik<T>({
    initialValues,
    validationSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        await onSubmit(values)
      } catch (error) {
        if (error instanceof Error) {
          setStatus({ submit: error.message })
        }
      } finally {
        setSubmitting(false)
      }
    },
  })

  return {
    ...formik,
    isLoading: formik.isSubmitting,
    submitError: formik.status?.submit as string | undefined,
  }
}
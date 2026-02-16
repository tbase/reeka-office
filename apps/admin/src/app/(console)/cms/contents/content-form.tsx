"use client"

import { useRef, useState } from "react"
import { useForm } from "@tanstack/react-form"

import { ContentFieldsJson } from "@/components/cms/content-fields-json"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LinkButton } from "@/components/ui/link-button"
import { Textarea } from "@/components/ui/textarea"

type CategoryOption = {
  id: number
  name: string
  fieldSchema: {
    name: string
    label: string
    type: "text" | "textarea" | "image" | "number" | "date" | "select" | "switch"
    required?: boolean
    options?: string[]
    placeholder?: string
  }[]
}

type ContentFormValue = {
  id?: number
  name?: string
  content?: string
  categoryId?: number
  fields?: Record<string, unknown>
}

export function ContentForm({
  action,
  categories,
  submitLabel,
  cancelHref,
  value,
}: {
  action: (formData: FormData) => void | Promise<void>
  categories: CategoryOption[]
  submitLabel: string
  cancelHref: string
  value?: ContentFormValue
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    defaultValues: {
      name: value?.name ?? "",
      content: value?.content ?? "",
    },
    onSubmit: async ({ value: formValue }) => {
      if (!formRef.current) {
        return
      }

      const formData = new FormData(formRef.current)
      formData.set("name", formValue.name)
      formData.set("content", formValue.content)

      if (value?.id) {
        formData.set("id", String(value.id))
      }

      await action(formData)
    },
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()

    setIsSubmitting(true)
    try {
      await form.handleSubmit()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {value?.id ? <input type="hidden" name="id" value={String(value.id)} /> : null}

      <form.Field
        name="name"
        validators={{
          onSubmit: ({ value: fieldValue }) =>
            fieldValue.trim().length > 0 ? undefined : "内容名称不能为空",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0
          return (
            <Field data-invalid={hasError || undefined}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>内容名称</FieldLabel>
                <Input
                  id={field.name}
                  name="name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="内容名称"
                  required
                />
                <FieldError>{hasError ? String(field.state.meta.errors[0]) : null}</FieldError>
              </FieldContent>
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="content">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>正文</FieldLabel>
              <Textarea
                id={field.name}
                name="content"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="正文"
                rows={4}
              />
              <FieldDescription>支持纯文本录入，可留空。</FieldDescription>
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <Field>
        <FieldContent>
          <FieldLabel>分类</FieldLabel>
        <ContentFieldsJson
          categories={categories}
          defaultCategoryId={value?.categoryId}
          defaultFields={value?.fields}
        />
        </FieldContent>
      </Field>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || categories.length === 0}>{submitLabel}</Button>
        <LinkButton href={cancelHref} variant="ghost">取消</LinkButton>
      </div>
    </form>
  )
}

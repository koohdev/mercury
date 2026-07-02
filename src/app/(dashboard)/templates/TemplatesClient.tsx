'use client'

import { useState, useTransition } from 'react'
import { Search, Copy, Plus, Edit, Trash2, X, Check, Loader2 } from 'lucide-react'
import { createTemplate, updateTemplate, deleteTemplate, createCategory, deleteCategory } from '@/lib/actions/templates'
import { Template, TemplateCategory } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface TemplatesClientProps {
  initialCategories: TemplateCategory[]
  initialTemplates: Template[]
  isAdmin: boolean
}

export default function TemplatesClient({
  initialCategories,
  initialTemplates,
  isAdmin
}: TemplatesClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'create' | 'edit'>('create')
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formCategoryId, setFormCategoryId] = useState('')
  const [formSortOrder, setFormSortOrder] = useState(0)
  const [formError, setFormError] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()
  
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCatPending, startCatTransition] = useTransition()

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return
    startCatTransition(async () => {
      const res = await createCategory(newCategoryName)
      if (res?.error) {
        setFormError(res.error)
      } else {
        setNewCategoryName('')
        // Automatically select the newly created category if possible
      }
    })
  }

  // Copy to clipboard handler
  const handleCopy = async (templateId: string, bodyText: string) => {
    try {
      await navigator.clipboard.writeText(bodyText)
      setCopiedId(templateId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Filter and search logic
  const filteredTemplates = initialTemplates.filter((template) => {
    const category = initialCategories.find(c => c.id === template.category_id)
    const categoryName = category?.name || ''

    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.body.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategoryId === 'all' || template.category_id === selectedCategoryId

    return matchesSearch && matchesCategory
  })

  // Open modal handlers
  const openCreateModal = () => {
    setModalType('create')
    setEditingTemplateId(null)
    setFormTitle('')
    setFormBody('')
    setFormCategoryId(initialCategories[0]?.id || '')
    setFormSortOrder(0)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (template: Template) => {
    setModalType('edit')
    setEditingTemplateId(template.id)
    setFormTitle(template.title)
    setFormBody(template.body)
    setFormCategoryId(template.category_id)
    setFormSortOrder(template.sort_order || 0)
    setFormError(null)
    setIsModalOpen(true)
  }

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formTitle.trim()) {
      setFormError('Title is required')
      return
    }
    if (!formBody.trim()) {
      setFormError('Body content is required')
      return
    }
    if (!formCategoryId) {
      setFormError('Category is required')
      return
    }

    startTransition(async () => {
      const payload = {
        categoryId: formCategoryId,
        title: formTitle,
        body: formBody,
        sortOrder: formSortOrder,
      }

      let res
      if (modalType === 'create') {
        res = await createTemplate(payload)
      } else if (modalType === 'edit' && editingTemplateId) {
        res = await updateTemplate(editingTemplateId, payload)
      }

      if (res?.error) {
        setFormError(res.error)
      } else {
        setIsModalOpen(false)
      }
    })
  }

  // Delete handler
  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    startTransition(async () => {
      const res = await deleteTemplate(id)
      if (res?.error) {
        alert(res.error)
      }
    })
  }

  const handleDeleteCategory = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"? This will fail if there are templates remaining in this category.`)) return

    startTransition(async () => {
      const res = await deleteCategory(id)
      if (res?.error) {
        alert(res.error)
      } else {
        if (selectedCategoryId === id) {
          setSelectedCategoryId('all')
        }
      }
    })
  }

  return (
    <div className="space-y-lg">
      {/* Top action bar: Search, Add Template (Admin) */}
      <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-1 text-ink text-body pl-10 pr-sm py-2 rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle transition-colors duration-150"
          />
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-xs bg-primary hover:bg-primary-hover active:bg-primary-focus text-primary-foreground px-lg py-2 rounded-md font-medium text-button transition-colors duration-150 cursor-pointer shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add Template
          </button>
        )}
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-xs overflow-x-auto pb-xs border-b border-hairline scrollbar-thin">
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`px-sm py-1.5 rounded-pill text-body-sm font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer ${
            selectedCategoryId === 'all'
              ? 'bg-surface-3 text-ink border border-hairline-strong'
              : 'text-ink-subtle hover:text-ink hover:bg-surface-2 border border-transparent'
          }`}
        >
          All
        </button>
        {initialCategories.map((category) => (
          <div key={category.id} className="relative flex items-center gap-1 shrink-0 group">
            <button
              onClick={() => setSelectedCategoryId(category.id)}
              className={`px-sm py-1.5 rounded-pill text-body-sm font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                selectedCategoryId === category.id
                  ? 'bg-surface-3 text-ink border border-hairline-strong'
                  : 'text-ink-subtle hover:text-ink hover:bg-surface-2 border border-transparent'
              }`}
            >
              {category.name}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteCategory(category.id, category.name)
                }}
                title={`Delete ${category.name} category`}
                className="p-1 rounded-full text-ink-subtle hover:text-red-400 hover:bg-red-950/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer border border-transparent"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-xl border border-dashed border-hairline rounded-lg bg-surface-1">
          <p className="text-ink-subtle text-body-sm">No templates found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {filteredTemplates.map((template) => {
            const category = initialCategories.find(c => c.id === template.category_id)
            const categoryName = category?.name || 'UNCATEGORIZED'
            
            return (
              <div
                key={template.id}
                onClick={() => handleCopy(template.id, template.body)}
                className="group relative flex flex-col justify-between bg-surface-1 hover:bg-surface-2 border border-hairline hover:border-hairline-strong rounded-lg p-lg transition-all duration-150 cursor-pointer shadow-sm min-h-[160px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-sm mb-xs">
                    <h3 className="text-body-lg font-medium text-ink tracking-tight line-clamp-1 pr-6">
                      {template.title}
                    </h3>
                    
                    {/* Clipboard copy indicator badge / icon */}
                    <div className="text-ink-subtle group-hover:text-ink transition-colors duration-150">
                      {copiedId === template.id ? (
                        <span className="inline-flex items-center gap-xxs text-caption text-semantic-success font-medium bg-semantic-success/10 px-2 py-0.5 rounded-pill border border-semantic-success/20">
                          <Check className="h-3 w-3" />
                          Copied
                        </span>
                      ) : (
                        <Copy className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>

                  <p className="text-body-sm text-ink-muted whitespace-pre-wrap line-clamp-4 mt-sm font-sans">
                    {template.body}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-lg">
                  <span className="bg-surface-3 text-ink-subtle text-caption rounded-pill px-2 py-0.5 font-medium border border-hairline-tertiary">
                    {categoryName}
                  </span>

                  {/* Admin inline controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity duration-150" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(template)}
                        title="Edit Template"
                        className="p-1 rounded bg-surface-3 hover:bg-surface-4 text-ink-muted hover:text-ink transition-colors cursor-pointer border border-hairline"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        title="Delete Template"
                        className="p-1 rounded bg-surface-3 hover:bg-red-950/30 text-ink-subtle hover:text-red-400 transition-colors cursor-pointer border border-hairline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Admin Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-semantic-overlay flex items-center justify-center p-md">
          <div className="bg-surface-1 border border-hairline rounded-lg w-full max-w-lg overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-lg py-md border-b border-hairline">
              <h3 className="text-subhead font-medium text-ink">
                {modalType === 'create' ? 'Create Response Template' : 'Edit Response Template'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ink-subtle hover:text-ink p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-lg space-y-md">
              {formError && (
                <div className="p-sm text-body-sm text-red-400 bg-red-950/20 border border-red-900/50 rounded-md">
                  {formError}
                </div>
              )}

              {/* Title Field */}
              <div className="space-y-xxs">
                <label className="text-eyebrow font-medium tracking-eyebrow text-ink-subtle uppercase block">
                  Template Title
                </label>
                <Input
                  type="text"
                  placeholder="e.g. AI Content Warning"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-surface-2 border-hairline text-ink"
                />
              </div>

              {/* Category Field */}
              <div className="space-y-xxs">
                <label className="text-eyebrow font-medium tracking-eyebrow text-ink-subtle uppercase block">
                  Category
                </label>
                <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                  <SelectTrigger className="w-full bg-surface-2 border-hairline text-ink focus:outline-primary-focus">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-2 border border-hairline text-ink">
                    <SelectGroup>
                      {initialCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {isAdmin && (
                  <div className="flex gap-2 items-center mt-2">
                    <Input
                      type="text"
                      placeholder="Add new category (e.g. AI Content)"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 bg-surface-2 border-hairline text-ink"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={isCatPending}
                      className="bg-primary hover:bg-primary-hover text-primary-foreground px-sm py-2 rounded-md font-medium text-xs transition-colors cursor-pointer shrink-0"
                    >
                      {isCatPending ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                )}
              </div>

              {/* Body Content Field */}
              <div className="space-y-xxs">
                <label className="text-eyebrow font-medium tracking-eyebrow text-ink-subtle uppercase block">
                  Response Body Text
                </label>
                <textarea
                  placeholder="Type the pre-approved template content here..."
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  rows={6}
                  className="w-full bg-surface-2 text-ink text-body px-sm py-2 rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle resize-none"
                />
              </div>

              {/* Sort Order Field */}
              <div className="space-y-xxs">
                <label className="text-eyebrow font-medium tracking-eyebrow text-ink-subtle uppercase block">
                  Sort Order
                </label>
                <Input
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full bg-surface-2 border-hairline text-ink"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-sm pt-md border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="bg-surface-2 hover:bg-surface-3 text-ink px-lg py-2 rounded-md font-medium border border-hairline text-button transition-colors duration-150 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-xs bg-primary hover:bg-primary-hover active:bg-primary-focus text-primary-foreground px-lg py-2 rounded-md font-medium text-button transition-colors duration-150 cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modalType === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom micro-toast at the bottom right */}
      {copiedId && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-3 text-ink border border-hairline-strong px-lg py-3 rounded-lg shadow-xl flex items-center gap-sm animate-fade-in-up">
          <Check className="h-5 w-5 text-semantic-success" />
          <span className="text-body-sm font-medium">Copied response template to clipboard!</span>
        </div>
      )}
    </div>
  )
}

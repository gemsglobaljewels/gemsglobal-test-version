'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Plus, Edit, Trash2, AlertCircle, Search, X, Check, Upload, ImageIcon, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react'

type Category = {
  id: string
  name: string
  image_url?: string | null
  product_count?: number
  show_on_home?: boolean | null
  show_on_recipient?: boolean | null
  parent_category_id?: string | null
  slug?: string
}

export default function FreshAdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newImg, setNewImg] = useState('')
  const [newShowOnHome, setNewShowOnHome] = useState(false)
  const [newShowOnRecipient, setNewShowOnRecipient] = useState(false)
  const [newParentId, setNewParentId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingImg, setEditingImg] = useState('')
  const [editingShowOnHome, setEditingShowOnHome] = useState(false)
  const [editingShowOnRecipient, setEditingShowOnRecipient] = useState(false)
  const [editingParentId, setEditingParentId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const addFileInputRef = useRef<HTMLInputElement>(null)

  // Filter categories that don't have parents (parent categories)
  const parentCategories = categories.filter(c => !c.parent_category_id)

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  // Load all categories
  const loadCategories = async () => {
    try {
      setError(null)
      setLoading(true)
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      setError('Failed to load categories. Please check if you ran the SQL in Supabase.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Upload image
  const handleImageUpload = async (file: File, catId: string | 'new') => {
    if (uploading) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/storage/upload-category-image', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      if (catId === 'new') {
        setNewImg(url)
      } else {
        setEditingImg(url)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  // Add new category
  const addCategory = async () => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          image_url: newImg || null,
          parent_category_id: newParentId,
          show_on_home: newShowOnHome,
          show_on_recipient: newShowOnRecipient
        })
      })
      if (!res.ok) throw new Error('Failed to create category')
      await loadCategories()
      setNewName('')
      setNewImg('')
      setNewParentId(null)
      setNewShowOnHome(false)
      setNewShowOnRecipient(false)
    } catch (err) {
      console.error(err)
      alert('Failed to create category')
    } finally {
      setAdding(false)
    }
  }

  // Update category
  const updateCategory = async (id: string) => {
    console.log('updateCategory called for id:', id, 'with data:', {
      name: editingName,
      image_url: editingImg,
      parent_category_id: editingParentId,
      show_on_home: editingShowOnHome,
      show_on_recipient: editingShowOnRecipient
    })
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingName,
          image_url: editingImg || null,
          parent_category_id: editingParentId,
          show_on_home: editingShowOnHome,
          show_on_recipient: editingShowOnRecipient
        })
      })
      console.log('Update response status:', res.status)
      const responseData = await res.json()
      console.log('Update response data:', responseData)
      if (!res.ok) throw new Error(responseData.error || 'Failed to update category')
      await loadCategories()
      setEditingId(null)
    } catch (err: any) {
      console.error(err)
      alert(`Failed to update category: ${err.message}`)
    }
  }

  // Toggle show on home
  const toggleShowOnHome = async (cat: Category) => {
    console.log('toggleShowOnHome called for:', cat)
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_on_home: !(cat.show_on_home ?? false) })
      })
      console.log('Toggle response status:', res.status)
      const responseData = await res.json()
      console.log('Toggle response data:', responseData)
      if (!res.ok) throw new Error(responseData.error || 'Failed to update category')
      await loadCategories()
    } catch (err: any) {
      console.error(err)
      alert(`Failed to update category: ${err.message}`)
    }
  }

  // Toggle show on recipient
  const toggleShowOnRecipient = async (cat: Category) => {
    console.log('toggleShowOnRecipient called for:', cat)
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_on_recipient: !(cat.show_on_recipient ?? false) })
      })
      console.log('Toggle response status:', res.status)
      const responseData = await res.json()
      console.log('Toggle response data:', responseData)
      if (!res.ok) throw new Error(responseData.error || 'Failed to update category')
      await loadCategories()
    } catch (err: any) {
      console.error(err)
      alert(`Failed to update category: ${err.message}`)
    }
  }

  // Delete category
  const deleteCategory = async (cat: Category) => {
    console.log('deleteCategory called for:', cat)
    if (!confirm(`Are you sure you want to delete "${cat.name}"?`)) return
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
      console.log('Delete response status:', res.status)
      const responseData = await res.json()
      console.log('Delete response data:', responseData)
      if (!res.ok) throw new Error(responseData.error || 'Failed to delete category')
      await loadCategories()
    } catch (err: any) {
      console.error(err)
      alert(`Failed to delete category: ${err.message}`)
    }
  }

  // Get parent name for a category
  const getParentName = (catId: string | null) => {
    if (!catId) return null
    return categories.find(c => c.id === catId)?.name
  }

  // Filter categories by search
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-gray-800 mb-2">
            Categories
          </h1>
          <p className="text-gray-600 mb-4">
            Manage product categories with parent-child relationships
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-800 font-medium">{error}</p>
                  <button
                    onClick={() => loadCategories()}
                    className="text-red-600 text-sm underline mt-1 hover:text-red-800"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Search & Count */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="Search categories..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {filteredCategories.length} categories
                  </span>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="p-12 text-center">
                  <Loader2 className="animate-spin mx-auto text-gray-400 mb-3" size={28} />
                  <p className="text-gray-500">Loading categories...</p>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredCategories.length === 0 && (
                <div className="p-12 text-center">
                  <ImageIcon className="mx-auto text-gray-300 mb-3" size={32} />
                  <p className="text-gray-500">
                    {query ? 'No categories found' : 'No categories yet. Add your first one!'}
                  </p>
                </div>
              )}

              {/* Categories List */}
              {!loading && filteredCategories.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {filteredCategories.map((cat) => (
                    <div key={cat.id}>
                      {/* Main Row */}
                      <div className="p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                        {/* Image */}
                        <div className="flex-shrink-0">
                          {cat.image_url ? (
                            <img
                              src={cat.image_url}
                              alt={cat.name}
                              className="w-14 h-14 rounded-lg object-cover border border-gray-100"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-100">
                              <ImageIcon size={24} className="text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-800 truncate">
                              {cat.name}
                            </h3>
                            {(cat.show_on_home ?? false) ? (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                Home
                              </span>
                            ) : null}
                            {(cat.show_on_recipient ?? false) ? (
                              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                                Recipient
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm">
                            <span className="text-gray-500">
                              {cat.product_count} product{cat.product_count !== 1 ? 's' : ''}
                            </span>
                            {cat.parent_category_id && (
                              <span className="text-gray-400">
                                • Parent: {getParentName(cat.parent_category_id)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleShowOnHome(cat)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={(cat.show_on_home ?? false) ? 'Remove from home' : 'Show on home'}
                          >
                            {(cat.show_on_home ?? false) ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                          <button
                            onClick={() => toggleShowOnRecipient(cat)}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title={(cat.show_on_recipient ?? false) ? 'Remove from recipient' : 'Show on recipient'}
                          >
                            {(cat.show_on_recipient ?? false) ? <Sparkles size={18} /> : <Sparkles size={18} />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(cat.id)
                              setEditingName(cat.name)
                              setEditingImg(cat.image_url || '')
                              setEditingShowOnHome(cat.show_on_home ?? false)
                              setEditingShowOnRecipient(cat.show_on_recipient ?? false)
                              setEditingParentId(cat.parent_category_id || null)
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => deleteCategory(cat)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Edit Panel */}
                      {editingId === cat.id && (
                        <div className="border-t border-gray-100 bg-gray-50 p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            {/* Image */}
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                Image
                              </label>
                              <div
                                className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-gray-300 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                {editingImg ? (
                                  <img
                                    src={editingImg}
                                    alt="Preview"
                                    className="w-24 h-24 object-cover rounded"
                                  />
                                ) : (
                                  <div className="text-center">
                                    <Upload size={20} className="text-gray-400 mx-auto mb-1" />
                                    <p className="text-xs text-gray-400">Click to upload</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Name & Parent */}
                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                  Parent Category
                                </label>
                                <select
                                  value={editingParentId || ''}
                                  onChange={(e) => setEditingParentId(e.target.value || null)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                >
                                  <option value="">None (Root category)</option>
                                  {parentCategories
                                    .filter(c => c.id !== cat.id)
                                    .map(c => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                </select>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="show-home-edit"
                                  checked={editingShowOnHome}
                                  onChange={(e) => setEditingShowOnHome(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="show-home-edit" className="text-sm text-gray-600">
                                  Show on home page
                                </label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="show-recipient-edit"
                                  checked={editingShowOnRecipient}
                                  onChange={(e) => setEditingShowOnRecipient(e.target.checked)}
                                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                />
                                <label htmlFor="show-recipient-edit" className="text-sm text-gray-600">
                                  Show on recipient section
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => updateCategory(cat.id)}
                              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <Check size={16} />
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Add New Category */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-yellow-500" />
                Add New Category
              </h2>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Diamond Rings"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                {/* Parent Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Parent Category (Optional)
                  </label>
                  <select
                    value={newParentId || ''}
                    onChange={(e) => setNewParentId(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    <option value="">None (Root category)</option>
                    {parentCategories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Image (Optional)
                  </label>
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-lg p-5 flex items-center justify-center cursor-pointer hover:border-gray-300 transition-colors"
                    onClick={() => addFileInputRef.current?.click()}
                  >
                    {newImg ? (
                      <img
                        src={newImg}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon size={24} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Click to upload</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Show on Home Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-home-new"
                    checked={newShowOnHome}
                    onChange={(e) => setNewShowOnHome(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="show-home-new" className="text-sm text-gray-600">
                    Show on home page
                  </label>
                </div>

                {/* Show on Recipient Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-recipient-new"
                    checked={newShowOnRecipient}
                    onChange={(e) => setNewShowOnRecipient(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <label htmlFor="show-recipient-new" className="text-sm text-gray-600">
                    Show on recipient section
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  onClick={addCategory}
                  disabled={!newName.trim() || adding || uploading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Plus size={18} />
                  )}
                  {adding ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file && editingId) handleImageUpload(file, editingId)
            e.target.value = ''
          }}
        />
        <input
          ref={addFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImageUpload(file, 'new')
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

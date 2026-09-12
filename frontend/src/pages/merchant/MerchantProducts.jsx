import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Check, X, AlertTriangle, Package, IndianRupee, Tag, UploadCloud, FileSpreadsheet, Download, RefreshCw, Image as ImageIcon, Link as LinkIcon, Star, Eye, Copy, ChevronLeft, ChevronRight, ShoppingBag, CheckCircle2, Info, ArrowRight } from 'lucide-react'
import { api } from '../../mock/api'
import { CATEGORIES } from '../../mock/seed'
import { INR } from '../../lib/format'
import EmptyState from '../../components/EmptyState'

const DEFAULT_SAMPLE_CSV = `name,price,category,stock,image,description
Classic Silk Saree,2499,Ethnic Wear,50,https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600,Pure silk saree with zari border
Cotton Kurta Set,1299,Daily Wear,100,https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600,Breathable summer daily wear
Wireless Earbuds,1999,Electronics,25,https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600,Active noise cancellation`

function parseCSV(text) {
  if (!text || !text.trim()) return []
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const parseLine = (line) => {
    const result = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        inQuote = !inQuote
      } else if (c === ',' && !inQuote) {
        result.push(cur.trim())
        cur = ''
      } else {
        cur += c
      }
    }
    result.push(cur.trim())
    return result
  }

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/^"|"$/g, ''))
  const nameIdx = headers.findIndex((h) => h === 'name' || h === 'product_name' || h === 'title')
  const priceIdx = headers.findIndex((h) => h === 'price' || h === 'mrp' || h === 'cost')
  const catIdx = headers.findIndex((h) => h === 'category' || h === 'category_name' || h === 'category_id')
  const stockIdx = headers.findIndex((h) => h === 'stock' || h === 'quantity' || h === 'qty')
  const imgIdx = headers.findIndex((h) => h === 'image' || h === 'image_url' || h === 'photo')
  const descIdx = headers.findIndex((h) => h === 'description' || h === 'desc' || h === 'details')

  const items = []
  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i])
    if (row.length === 0 || (row.length === 1 && !row[0])) continue

    const name = nameIdx !== -1 ? row[nameIdx] : row[0] || ''
    if (!name) continue

    const price = priceIdx !== -1 ? parseFloat(row[priceIdx]) || 0 : 0
    const category = catIdx !== -1 ? row[catIdx] : 'General'
    const stock = stockIdx !== -1 ? parseInt(row[stockIdx], 10) || 10 : 10
    const image = (imgIdx !== -1 ? row[imgIdx] : '') || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
    const description = descIdx !== -1 ? row[descIdx] : ''

    items.push({ name, price, category, stock, image, description, is_active: true })
  }
  return items
}

const statusFilters = [
  { id: 'all', label: 'All Items' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'low_stock', label: 'Low Stock (≤5)' },
  { id: 'out_of_stock', label: 'Out of Stock' },
]

export default function MerchantProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState(CATEGORIES)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category_id: CATEGORIES[0]?.id || 'cat_ethnic',
    price: '',
    stock: '',
    image: '',
    description: '',
    is_active: true,
  })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Image upload state
  const [imageTab, setImageTab] = useState('url')      // 'url' | 'upload'
  const [uploadedImages, setUploadedImages] = useState([]) // { url, name }[]
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  
  // Bulk Upload Modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [csvText, setCsvText] = useState(DEFAULT_SAMPLE_CSV)
  const [bulkError, setBulkError] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  // Category modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)

  // Delete modal
  const [deleteProductTarget, setDeleteProductTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Notification toast
  const [toastMessage, setToastMessage] = useState('')

  const parsedBulkItems = useMemo(() => parseCSV(csvText), [csvText])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [prods, cats] = await Promise.all([
        api.getMerchantProducts({
          categoryId: selectedCategory,
          query: searchQuery,
          status: selectedStatus,
        }),
        api.getMerchantCategories(),
      ])
      setProducts(Array.isArray(prods) ? prods : [])
      const loadedCats = Array.isArray(cats) ? cats : []
      const merged = [...loadedCats]
      for (const cat of CATEGORIES) {
        if (!merged.some((c) => c.id === cat.id || c.name.toLowerCase() === cat.name.toLowerCase())) {
          merged.push(cat)
        }
      }
      setCategories(merged)
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedStatus])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadData()
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      category_id: categories[0]?.id || CATEGORIES[0]?.id || 'cat_ethnic',
      price: '',
      stock: '10',
      image: '',
      description: '',
      is_active: true,
    })
    setFormError('')
    setImageTab('url')
    setUploadedImages([])
    setUploadError('')
    setModalOpen(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category_id: product.category_id || '',
      price: String(product.price),
      stock: String(product.stock ?? 0),
      image: product.image || '',
      description: product.description || '',
      is_active: product.is_active !== false,
    })
    setFormError('')
    setImageTab('url')
    // Pre-populate uploaded images strip if product already has an image URL
    setUploadedImages(product.image ? [{ url: product.image, name: 'Current image' }] : [])
    setUploadError('')
    setModalOpen(true)
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Product name is required.')
      return
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setFormError('Please enter a valid price.')
      return
    }

    try {
      setSaving(true)
      setFormError('')

      const payload = {
        name: formData.name.trim(),
        category_id: formData.category_id || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock || '0', 10),
        image: formData.image.trim(),
        description: formData.description.trim(),
        is_active: formData.is_active,
      }

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload)
        showToast(`Updated "${payload.name}" successfully!`)
      } else {
        await api.createProduct(payload)
        showToast(`Created "${payload.name}" successfully!`)
      }

      setModalOpen(false)
      loadData()
    } catch (err) {
      setFormError(err.message || 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (product) => {
    try {
      const newStatus = !product.is_active
      await api.updateProduct(product.id, { is_active: newStatus })
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: newStatus } : p))
      )
      showToast(`${product.name} is now ${newStatus ? 'Active' : 'Inactive'}.`)
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteProductTarget) return
    try {
      setDeleting(true)
      await api.deleteProduct(deleteProductTarget.id)
      showToast(`Deleted "${deleteProductTarget.name}".`)
      setDeleteProductTarget(null)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    try {
      setSavingCategory(true)
      const cat = await api.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim(),
      })
      setCategories((prev) => [...prev, cat])
      setFormData((prev) => ({ ...prev, category_id: cat.id }))
      setNewCategoryName('')
      setNewCategoryDesc('')
      setCategoryModalOpen(false)
      showToast(`Category "${cat.name}" added!`)
    } catch (err) {
      alert(err.message || 'Failed to create category')
    } finally {
      setSavingCategory(false)
    }
  }

  const handleBulkImport = async () => {
    if (parsedBulkItems.length === 0) {
      setBulkError('Please enter or upload valid CSV rows with at least product name.')
      return
    }
    try {
      setBulkSaving(true)
      setBulkError('')
      const res = await api.bulkCreateMerchantProducts(parsedBulkItems)
      const count = res?.count || parsedBulkItems.length
      showToast(`Successfully imported ${count} products!`)
      setBulkModalOpen(false)
      loadData()
    } catch (err) {
      setBulkError(err.message || 'Failed to import products.')
    } finally {
      setBulkSaving(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        setCsvText(content)
      }
    }
    reader.readAsText(file)
  }

  const downloadSampleCSV = () => {
    const blob = new Blob([DEFAULT_SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'returnguard_products_sample.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Metrics computation
  const totalCount = products.length
  const activeCount = products.filter((p) => p.is_active !== false).length
  const lowStockCount = products.filter((p) => Number(p.stock) <= 5).length
  const inventoryValue = products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0), 0)

  // Category color mapping for vibrant badges
  const catColorMap = {
    'Ethnic Wear': { bg: 'bg-orange-100', text: 'text-orange-700', icon: '👗' },
    'Daily Wear': { bg: 'bg-pink-100', text: 'text-pink-700', icon: '👕' },
    'Electronics': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🎧' },
    'Home & Living': { bg: 'bg-teal-100', text: 'text-teal-700', icon: '🏠' },
    'Footwear': { bg: 'bg-purple-100', text: 'text-purple-700', icon: '👟' },
  }
  const getCatStyle = (name) => catColorMap[name] || { bg: 'bg-slate-100', text: 'text-slate-700', icon: '📦' }

  // Generate SKU from product
  const getSku = (product) => {
    if (product.sku) return product.sku
    const catMap = { cat_ethnic: 'EW', cat_daily: 'DW', cat_electronics: 'EB', cat_home: 'HL', cat_footwear: 'FW' }
    const prefix = catMap[product.category_id] || 'NK'
    const num = String(product.id || '').replace(/[^0-9]/g, '').slice(-3).padStart(3, '0')
    return `${prefix}-${num}`
  }

  // Duplicate handler
  const handleDuplicate = async (product) => {
    try {
      const payload = {
        name: `${product.name} (Copy)`,
        category_id: product.category_id || null,
        price: product.price,
        stock: product.stock || 0,
        image: product.image || '',
        description: product.description || '',
        is_active: true,
      }
      await api.createProduct(payload)
      showToast(`Duplicated "${product.name}" successfully!`)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to duplicate product.')
    }
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage))
  const paginatedProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
          <Check className="h-4 w-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Products & Catalog</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage your product inventory, pricing, descriptions, and sales status.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer transition"
          >
            <Tag className="h-4 w-4 text-slate-500" />
            New Category
          </button>
          <button
            onClick={() => {
              setCsvText(DEFAULT_SAMPLE_CSV)
              setBulkError('')
              setBulkModalOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
          >
            <UploadCloud className="h-4 w-4 text-emerald-600" />
            Bulk Upload (CSV)
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* ── Vibrant Gradient Metric Cards ────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Products — Blue/Indigo Gradient */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/80">Total Products</p>
              <p className="text-2xl sm:text-3xl font-bold">{totalCount}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-white/70">All products in catalog</p>
        </div>

        {/* Active for Sale — Green Gradient */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/80">Active for Sale</p>
              <p className="text-2xl sm:text-3xl font-bold">{activeCount}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-white/70">Products currently active</p>
        </div>

        {/* Low / Out of Stock — Coral/Red Gradient */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/80">Low / Out of Stock</p>
              <p className="text-2xl sm:text-3xl font-bold">{lowStockCount}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-white/70">Products need attention</p>
        </div>

        {/* Catalog Inventory Value — Teal/Emerald Gradient */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/80">Catalog Inventory Value</p>
              <p className="text-2xl sm:text-3xl font-bold">{INR.format(inventoryValue)}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-white/70">Total stock value</p>
        </div>
      </div>

      {/* ── Filter and Search Bar ────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none cursor-pointer"
            style={{
              appearance: 'auto',
              WebkitAppearance: 'menulist',
              MozAppearance: 'menulist',
              minWidth: 160,
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full sm:flex-wrap">
            {statusFilters.map((sf) => {
              let pillClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              if (selectedStatus === sf.id) {
                if (sf.id === 'all') pillClass = 'bg-indigo-600 text-white shadow-xs'
                else if (sf.id === 'active') pillClass = 'bg-indigo-600 text-white shadow-xs'
                else if (sf.id === 'inactive') pillClass = 'bg-slate-800 text-white shadow-xs'
                else if (sf.id === 'low_stock') pillClass = 'bg-amber-500 text-white shadow-xs'
                else if (sf.id === 'out_of_stock') pillClass = 'bg-rose-500 text-white shadow-xs'
              }
              return (
                <button
                  key={sf.id}
                  onClick={() => { setSelectedStatus(sf.id); setCurrentPage(1) }}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${pillClass}`}
                >
                  {sf.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Products Table ────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
            <p className="text-sm">Loading catalog items...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No products found"
              description="Try adjusting your search query or filter to see products."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-200/70">
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((product) => {
                  const isLow = Number(product.stock) <= 5 && Number(product.stock) > 0
                  const isOut = Number(product.stock) === 0
                  const catName =
                    product.category_name ||
                    categories.find((c) => c.id === product.category_id)?.name ||
                    'General'
                  const catStyle = getCatStyle(catName)
                  const sku = getSku(product)

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product — image + name + description + SKU */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{product.name}</p>
                            <p className="line-clamp-1 max-w-xs text-xs text-slate-500">
                              {product.description || 'No description provided.'}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">SKU: {sku}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category — colorful pill with icon */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${catStyle.bg} ${catStyle.text}`}>
                          <span>{catStyle.icon}</span>
                          {catName}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4 font-bold text-slate-900">
                        {INR.format(product.price)}
                      </td>

                      {/* Stock — colored pill */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            isOut
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOut ? 'Out of stock' : `${product.stock} units`}
                        </span>
                      </td>

                      {/* Active Toggle */}
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(product)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            product.is_active !== false ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              product.is_active !== false ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* View link */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openEditModal(product)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>

                      {/* Actions — Edit / Duplicate / Delete */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(product)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer"
                            title="Duplicate Product"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => setDeleteProductTarget(product)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination Footer ─────────────────────────────────── */}
      {products.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Showing <span className="font-semibold text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, products.length)}–{Math.min(currentPage * itemsPerPage, products.length)}</span> of{' '}
            <span className="font-semibold text-slate-700">{products.length}</span> products
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition shadow-2xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium cursor-pointer transition shadow-2xs ${
                  currentPage === pg
                    ? 'bg-blue-600 font-bold text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition shadow-2xs"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom Tip Banner ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 px-5 py-3.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-emerald-800">
          <Info className="h-4 w-4 text-emerald-600 shrink-0" />
          <span><strong>Tip:</strong> Keep your product information updated and monitor low stock items to avoid missed sales.</span>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-white border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer shadow-2xs whitespace-nowrap">
          View Inventory Report <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Cotton Kurta Set"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCategoryModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      title="Add a custom category"
                    >
                      <Plus className="h-3 w-3" /> New
                    </button>
                  </div>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                    style={{
                      appearance: 'auto',
                      WebkitAppearance: 'menulist',
                      MozAppearance: 'menulist',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="1499.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="25"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <label className="flex items-center gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Active for sale</span>
                  </label>
                </div>
              </div>

              {/* ── Image Section ── tabbed URL / Upload ─────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Product Image
                </label>

                {/* Tab switcher */}
                <div className="flex mb-3 rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
                      imageTab === 'url' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <LinkIcon className="h-3.5 w-3.5" /> Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
                      imageTab === 'upload' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Upload Files
                  </button>
                </div>

                {imageTab === 'url' ? (
                  /* URL input */
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                    {formData.image && (
                      <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                        <span className="text-xs text-slate-500 truncate flex-1">{formData.image}</span>
                        <button type="button" onClick={() => setFormData({ ...formData, image: '' })}
                          className="text-slate-400 hover:text-rose-500 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* File upload */
                  <div>
                    {/* Drop zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={async (e) => {
                        e.preventDefault()
                        setDragOver(false)
                        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                        if (!files.length) return
                        setUploading(true); setUploadError('')
                        try {
                          const res = await api.uploadProductImages(files)
                          const newImgs = res.urls.map((url, i) => ({ url, name: files[i]?.name || `image_${i+1}` }))
                          setUploadedImages(prev => [...prev, ...newImgs])
                          if (!formData.image && res.urls[0]) setFormData(f => ({ ...f, image: res.urls[0] }))
                          if (res.errors?.length) setUploadError(res.errors.join(' | '))
                        } catch(err) { setUploadError(err.message || 'Upload failed.') }
                        finally { setUploading(false) }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all ${
                        dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40'
                      }`}
                    >
                      {uploading ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                          <p className="text-xs text-slate-500">Uploading…</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-8 w-8 text-slate-400" />
                          <p className="text-xs font-medium text-slate-600">Drop images here or <span className="text-indigo-600">browse</span></p>
                          <p className="text-[11px] text-slate-400">JPG, PNG, WebP — up to 5 MB each · max 10 files</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || [])
                        if (!files.length) return
                        setUploading(true); setUploadError('')
                        try {
                          const res = await api.uploadProductImages(files)
                          const newImgs = res.urls.map((url, i) => ({ url, name: files[i]?.name || `image_${i+1}` }))
                          setUploadedImages(prev => [...prev, ...newImgs])
                          if (!formData.image && res.urls[0]) setFormData(f => ({ ...f, image: res.urls[0] }))
                          if (res.errors?.length) setUploadError(res.errors.join(' | '))
                        } catch(err) { setUploadError(err.message || 'Upload failed.') }
                        finally { setUploading(false); e.target.value = '' }
                      }}
                    />

                    {uploadError && (
                      <p className="mt-1.5 text-xs text-amber-600">{uploadError}</p>
                    )}

                    {/* Thumbnail strip — click to select primary */}
                    {uploadedImages.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] text-slate-500 mb-1.5">Click a thumbnail to set as the <strong>primary image</strong>:</p>
                        <div className="flex flex-wrap gap-2">
                          {uploadedImages.map((img, idx) => {
                            const isPrimary = formData.image === img.url
                            return (
                              <div key={idx} className="relative group">
                                <button
                                  type="button"
                                  onClick={() => setFormData(f => ({ ...f, image: img.url }))}
                                  className={`block w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                                    isPrimary ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'
                                  }`}
                                  title={isPrimary ? 'Primary image' : `Set as primary: ${img.name}`}
                                >
                                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                </button>
                                {isPrimary && (
                                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm">
                                    <Star className="h-3 w-3" fill="currentColor" />
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadedImages(prev => prev.filter((_, i) => i !== idx))
                                    if (isPrimary) setFormData(f => ({ ...f, image: '' }))
                                  }}
                                  className="absolute -top-1.5 -left-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm"
                                  title="Remove"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                        {formData.image && (
                          <p className="mt-1.5 text-[11px] text-indigo-600 flex items-center gap-1">
                            <Star className="h-3 w-3" fill="currentColor" /> Primary: <span className="truncate max-w-xs">{formData.image}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Product features, fit, styling details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Product</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Are you sure you want to remove <span className="font-semibold text-slate-900">"{deleteProductTarget.name}"</span> from your catalog?
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteProductTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Creation Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Category</h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Footwear, Accessories"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Brief description of this collection"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {savingCategory ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Product Upload Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Bulk Product Upload</h3>
                  <p className="text-xs text-slate-500">Paste CSV data or upload a file to import multiple products at once.</p>
                </div>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1">
              {/* Quick Actions / Tips */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-xs text-slate-600">
                  Columns: <code className="bg-white px-1.5 py-0.5 rounded border text-slate-800 font-semibold">name, price, category, stock, image, description</code>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                    <UploadCloud className="h-3.5 w-3.5 text-indigo-600" />
                    Upload .CSV File
                    <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={downloadSampleCSV}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-600" />
                    Download Sample
                  </button>
                </div>
              </div>

              {/* CSV Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    CSV Data (Comma Separated)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCsvText(DEFAULT_SAMPLE_CSV)}
                    className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Reset to Sample
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="name,price,category,stock,image,description&#10;Product 1,999,Ethnic Wear,50,https://...,Product details"
                  className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Error display */}
              {bulkError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                  {bulkError}
                </div>
              )}

              {/* Preview Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span>Parsed Preview</span>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                      {parsedBulkItems.length} products ready
                    </span>
                  </div>
                </div>

                {parsedBulkItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                    No valid products parsed yet. Make sure the header row has <code>name, price, category</code>.
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Product Name</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Price</th>
                          <th className="py-2 px-3">Stock</th>
                          <th className="py-2 px-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedBulkItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900 flex items-center gap-2">
                              {item.image && (
                                <img src={item.image} alt="" className="h-6 w-6 rounded object-cover border border-slate-200 shrink-0" />
                              )}
                              <span className="truncate max-w-[140px]">{item.name}</span>
                            </td>
                            <td className="py-2 px-3">
                              <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-semibold text-emerald-700">{INR.format(item.price)}</td>
                            <td className="py-2 px-3 text-slate-600">{item.stock}</td>
                            <td className="py-2 px-3 text-slate-500 truncate max-w-[160px]">{item.description || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>



            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkSaving || parsedBulkItems.length === 0}
                onClick={handleBulkImport}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {bulkSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" /> Import {parsedBulkItems.length} Products
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

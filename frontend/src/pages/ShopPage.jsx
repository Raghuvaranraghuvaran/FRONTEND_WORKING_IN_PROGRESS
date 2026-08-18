import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../mock/api'
import { INR } from '../lib/format'
import { classNames } from '../lib/format'

export default function ShopPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || 'all'
  const query = searchParams.get('q') || ''

  useEffect(() => {
    api.getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setLoading(true)
    api.getProducts({ categoryId: activeCategory, query }).then((data) => {
      setProducts(data)
      setLoading(false)
    })
  }, [activeCategory, query])

  const categoryName = categories.find((c) => c.id === activeCategory)?.name || 'All products'

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{categoryName}</h1>
          <p className="text-sm text-slate-500">Browse the Aria Fashion House catalog.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSearchParams({ category: activeCategory, q: e.target.q.value })
          }}
          className="flex gap-2"
        >
          <input
            name="q"
            defaultValue={query}
            placeholder="Search products"
            className="w-52 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Search
          </button>
        </form>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSearchParams({ q: query })}
          className={classNames(
            'rounded-full px-4 py-1.5 text-sm font-medium',
            activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSearchParams({ category: category.id, q: query })}
            className={classNames(
              'rounded-full px-4 py-1.5 text-sm font-medium',
              activeCategory === category.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm font-semibold text-slate-900">No products found</p>
          <p className="mt-1 text-sm text-slate-500">Try a different category or search.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="aspect-square overflow-hidden bg-slate-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-slate-500">
                  {categories.find((c) => c.id === product.category_id)?.name || 'Uncategorized'}
                </p>
                <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</h2>
                <p className="mt-2 text-base font-bold text-slate-900">{INR.format(product.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

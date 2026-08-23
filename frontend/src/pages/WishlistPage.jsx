import { useApp } from '../context/AppContext'
import { Heart, Trash2 } from 'lucide-react'

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useApp()

  if (wishlist.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900">My Wishlist</h1>
        <p className="text-sm text-slate-500 mt-1">Save items you love for later</p>

        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16">
          <Heart className="h-16 w-16 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Your wishlist is empty</h2>
          <p className="mt-2 text-sm text-slate-500">Start adding items you love!</p>
          <a
            href="/shop"
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Browse Products
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Wishlist</h1>
          <p className="text-sm text-slate-500 mt-1">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {wishlist.map((product) => (
          <div
            key={product.id}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg"
          >
            {/* Product Image */}
            <div className="aspect-square overflow-hidden bg-slate-100">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>

            {/* Remove from Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-all hover:bg-rose-50"
              title="Remove from wishlist"
            >
              <Trash2 className="h-4 w-4 text-rose-600" />
            </button>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{product.name}</h3>
              <p className="mt-1 text-xs text-slate-500 line-clamp-1">{product.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">{product.price ? `Rs. ${Number(product.price).toLocaleString()}` : ''}</span>
                {product.stock > 0 ? (
                  <span className="text-xs font-medium text-emerald-600">In Stock</span>
                ) : (
                  <span className="text-xs font-medium text-rose-600">Out of Stock</span>
                )}
              </div>

              {/* View Product Details */}
              <a
                href={`/products/${product.id}`}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all text-center no-underline"
              >
                View Product Details →
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

import { Mail, Phone, MessageCircle, FileText, HelpCircle } from 'lucide-react'

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Help & Support</h1>
        <p className="mt-2 text-slate-600">We're here to help! Get in touch with us through any of these channels.</p>
      </div>

      {/* Contact Options */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
        {/* Email Support */}
        <a
          href="mailto:support@returnguard.com"
          className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-lg hover:border-indigo-300"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Email Support</h3>
          <p className="mt-2 text-sm text-slate-600">Send us an email and we'll respond within 24 hours.</p>
          <p className="mt-3 text-sm font-semibold text-indigo-600">support@returnguard.com</p>
        </a>

        {/* Phone Support */}
        <a
          href="tel:+918001234567"
          className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-lg hover:border-emerald-300"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <Phone className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Phone Support</h3>
          <p className="mt-2 text-sm text-slate-600">Call us Monday to Friday, 9 AM - 6 PM IST.</p>
          <p className="mt-3 text-sm font-semibold text-emerald-600">+91 800 123 4567</p>
        </a>

        {/* Live Chat */}
        <button
          onClick={() => alert('Live chat feature coming soon!')}
          className="group rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all hover:shadow-lg hover:border-purple-300"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Live Chat</h3>
          <p className="mt-2 text-sm text-slate-600">Chat with our support team in real-time.</p>
          <p className="mt-3 text-sm font-semibold text-purple-600">Start Chat →</p>
        </button>
      </div>

      {/* FAQ Section */}
      <div id="faq-section" className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="mb-6 flex items-center gap-3">
          <HelpCircle className="h-7 w-7 text-indigo-600" />
          <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {/* FAQ Item */}
          <details className="group rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-300">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900">
              <span>How do I return a product?</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Go to "My Orders", select the order you want to return, and click "Request Return". 
              Fill in the return reason and our team will process your request. You'll receive an 
              OTP for verification when the pickup agent arrives.
            </p>
          </details>

          <details className="group rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-300">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900">
              <span>What is the return policy?</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              You can return most items within 7 days of delivery. Items must be unused and in 
              original packaging. Some categories like intimate wear and perishables cannot be returned.
            </p>
          </details>

          <details className="group rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-300">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900">
              <span>How long does a refund take?</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Once your return is picked up and verified, refunds are processed within 5-7 business days. 
              The amount will be credited to your original payment method.
            </p>
          </details>

          <details className="group rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-300">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900">
              <span>Can I track my return status?</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Yes! Go to "My Orders" and you'll see the current status of all your returns. 
              You can track pickup, verification, and refund status in real-time.
            </p>
          </details>

          <details className="group rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-300">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900">
              <span>What if I receive a damaged product?</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              If you receive a damaged or defective product, please contact us immediately with photos. 
              We'll arrange for a replacement or full refund with priority pickup.
            </p>
          </details>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
        <div className="flex items-start gap-4">
          <FileText className="h-8 w-8 flex-shrink-0 text-indigo-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Need More Help?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Visit our comprehensive help center for detailed guides, tutorials, and policy information.
            </p>
            <button
              type="button"
              onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="mt-4 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Visit Help Center
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

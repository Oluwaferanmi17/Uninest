export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center justify-center p-12 text-center">
          {/* Illustration */}
          <div className="w-48 h-48 bg-white/10 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-sm">
            <svg className="w-24 h-24 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold mb-4">
            Welcome to <span className="text-accent">UniNest</span>
          </h2>
          <p className="text-white/70 text-lg max-w-md">
            The easiest way to find safe, affordable off-campus accommodation near your Nigerian university.
          </p>

          {/* Floating cards */}
          <div className="mt-12 space-y-4 w-full max-w-sm">
            {[
              { icon: "🏠", text: "2,000+ Verified Listings" },
              { icon: "🔒", text: "Secure Paystack Payments" },
              { icon: "💬", text: "Real-time Chat with Landlords" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-white/80">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

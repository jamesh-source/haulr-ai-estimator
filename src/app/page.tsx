import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Brain,
  FileText,
  Zap,
  TrendingUp,
  Shield,
  CheckCircle,
  Star,
  MapPin,
  Clock,
  DollarSign,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">HAULR</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Reviews
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="hidden text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors md:block"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pb-20 pt-32">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-100/50 blur-3xl" />
          <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-indigo-100/40 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 ring-1 ring-blue-100">
              <Zap className="h-4 w-4" />
              AI-Powered Estimating
            </div>

            <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              <span className="gradient-text">AI-Powered</span>
              <br />
              Junk Removal Estimating
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600 leading-relaxed">
              Stop guessing. Start knowing. Get accurate estimates in seconds with
              AI that analyzes photos, calculates cubic yards, and prices jobs
              automatically.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all hover:shadow-blue-500/40 hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                Watch Demo
              </a>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              No credit card required. Free 14-day trial.
            </p>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="relative rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl shadow-gray-900/10">
              <div className="rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <div className="ml-4 h-6 flex-1 max-w-xs rounded bg-gray-700/50 px-3 flex items-center">
                    <span className="text-xs text-gray-400">haulr.app/dashboard</span>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-blue-600 p-4 text-white">
                    <div className="text-2xl font-bold">$847</div>
                    <div className="text-sm text-blue-200">AI Estimate</div>
                  </div>
                  <div className="rounded-lg bg-gray-700/50 p-4 text-white">
                    <div className="text-2xl font-bold">12.5 yd³</div>
                    <div className="text-sm text-gray-400">Cubic Yards</div>
                  </div>
                  <div className="rounded-lg bg-gray-700/50 p-4 text-white">
                    <div className="text-2xl font-bold">94%</div>
                    <div className="text-sm text-gray-400">Confidence</div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-gray-700/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Brain className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">AI Analysis Complete</div>
                      <div className="text-xs text-gray-400">
                        Detected: furniture, appliances, construction debris
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-100 bg-gray-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { value: "2,500+", label: "Estimates Created" },
              { value: "94%", label: "Pricing Accuracy" },
              { value: "3 min", label: "Average Estimate Time" },
              { value: "$50K+", label: "Revenue Generated" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to run a modern junk removal business
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From photo upload to signed quote in minutes. Our AI does the heavy lifting.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Camera,
                title: "Photo Analysis",
                description:
                  "Upload photos of any junk pile. Our AI instantly identifies items, estimates volume, and categorizes materials for accurate pricing.",
                colorClass: "bg-blue-50 text-blue-600",
              },
              {
                icon: Brain,
                title: "AI Pricing Engine",
                description:
                  "GPT-4 Vision analyzes your photos and calculates estimates based on cubic yards, item types, labor requirements, and local dump fees.",
                colorClass: "bg-indigo-50 text-indigo-600",
              },
              {
                icon: FileText,
                title: "Instant Quotes",
                description:
                  "Generate professional PDF quotes in one click. Branded with your company info, ready to send to customers immediately.",
                colorClass: "bg-purple-50 text-purple-600",
              },
              {
                icon: MapPin,
                title: "Distance Pricing",
                description:
                  "Automatically calculate drive time and fuel costs using Google Maps. Distance-based pricing built right in.",
                colorClass: "bg-green-50 text-green-600",
              },
              {
                icon: TrendingUp,
                title: "Learning AI",
                description:
                  "The system gets smarter over time. As you complete jobs, the AI learns your actual costs and improves future estimates.",
                colorClass: "bg-orange-50 text-orange-600",
              },
              {
                icon: Shield,
                title: "CRM Built In",
                description:
                  "Manage customers, track jobs, send follow-ups, and collect payments. Everything in one place, no integrations needed.",
                colorClass: "bg-red-50 text-red-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.colorClass}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              From photo to quote in 3 steps
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              No more time wasted driving out to give quotes. Let AI do it for you.
            </p>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-3">
            {[
              {
                step: "01",
                icon: Camera,
                title: "Upload Photos",
                description:
                  "Customer texts you photos, or you capture them on-site. Upload directly from your phone. Multiple angles supported.",
              },
              {
                step: "02",
                icon: Brain,
                title: "AI Analyzes",
                description:
                  "Our AI examines every item, estimates cubic yards, identifies special items (appliances, mattresses, hazmat), and calculates labor needs.",
              },
              {
                step: "03",
                icon: DollarSign,
                title: "Send the Quote",
                description:
                  "Review the AI estimate, adjust if needed, and send a professional PDF quote via email or SMS. Collect payment on the spot.",
              },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                <div className="relative">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                      <item.icon className="h-8 w-8" />
                    </div>
                    <span className="text-5xl font-black text-gray-100">{item.step}</span>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Loved by junk removal pros
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              See what operators are saying about HAULR.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              {
                name: "Mike T.",
                company: "T&T Junk Removal, Dallas TX",
                avatar: "MT",
                rating: 5,
                quote:
                  "I used to spend 45 minutes driving to every quote. Now I just ask customers to send photos and have an estimate in 2 minutes. Saved me at least 10 hours a week.",
              },
              {
                name: "Sarah K.",
                company: "Clean Sweep Hauling, Phoenix AZ",
                avatar: "SK",
                rating: 5,
                quote:
                  "The AI pricing is scary accurate. I was skeptical at first but after 200 jobs, my actual vs estimated is within 8%. Way better than I was doing manually.",
              },
              {
                name: "James R.",
                company: "Rapid Removal LLC, Atlanta GA",
                avatar: "JR",
                rating: 5,
                quote:
                  "Closed a $2,400 job from a photo estimate while I was on another job. Customer signed the digital quote while I was working. Game changer for my business.",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-6 text-gray-600 leading-relaxed italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              One plan, everything included. No hidden fees, no per-estimate charges.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-lg">
            <div className="relative rounded-3xl bg-blue-600 p-8 text-white shadow-2xl shadow-blue-500/25">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-yellow-400 px-4 py-1 text-sm font-bold text-gray-900">
                  Most Popular
                </span>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold">Professional</h3>
                <div className="mt-4 flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black">$149</span>
                  <span className="text-blue-200">/month</span>
                </div>
                <p className="mt-2 text-blue-200">or $1,490/year (save $298)</p>
              </div>

              <ul className="mt-8 space-y-4">
                {[
                  "Unlimited AI estimates",
                  "GPT-4 Vision photo analysis",
                  "Unlimited customers & jobs",
                  "Professional PDF quotes",
                  "Google Maps distance pricing",
                  "Email & SMS quote delivery",
                  "Stripe payment processing",
                  "Learning AI (improves over time)",
                  "Mobile-optimized PWA",
                  "Priority support",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-blue-200" />
                    <span className="text-blue-50">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className="mt-8 block w-full rounded-xl bg-white py-4 text-center text-base font-bold text-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
              >
                Start Free 14-Day Trial
              </Link>

              <p className="mt-4 text-center text-sm text-blue-200">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to stop leaving money on the table?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Join hundreds of junk removal operators using AI to win more jobs and
              increase their average ticket price.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Free 14-day trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">HAULR</span>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                AI-powered estimating for modern junk removal businesses.
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#features" className="hover:text-gray-900 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-gray-900 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-gray-900 transition-colors">
                    How It Works
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} HAULR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

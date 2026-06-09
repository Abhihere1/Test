import Link from "next/link";

export default function HomePage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-50"
      data-testid="home-page"
    >
      <div className="max-w-2xl w-full">
        <h1
          className="text-4xl font-bold text-slate-900 mb-2"
          data-testid="home-heading"
        >
          Partner Onboarding Portal
        </h1>
        <p className="text-slate-500 mb-10 text-lg">
          Fintech partner management and KYC verification platform
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Link
            href="/onboarding/pipeline"
            data-testid="nav-onboarding-link"
            className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 text-xl">
              &#127970;
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-1">
              Partner Onboarding
            </h2>
            <p className="text-slate-500 text-sm">
              Manage fintech partner applications through the onboarding
              pipeline.
            </p>
          </Link>
          <Link
            href="/kyc/queue"
            data-testid="nav-kyc-link"
            className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center mb-4 text-xl">
              &#128269;
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-1">
              KYC Verification
            </h2>
            <p className="text-slate-500 text-sm">
              Process customer identity verifications in the compliance queue.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

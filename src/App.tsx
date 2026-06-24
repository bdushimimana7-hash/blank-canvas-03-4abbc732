import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { lazy, Suspense } from "react";

const IndexPage       = lazy(() => import("./routes/index"));
const LoginPage       = lazy(() => import("./routes/login"));
const SignupPage      = lazy(() => import("./routes/signup"));
const SetupPage       = lazy(() => import("./routes/setup"));
const ResetPasswordPage = lazy(() => import("./routes/reset-password"));
const Dashboard       = lazy(() => import("./routes/dashboard"));
const History         = lazy(() => import("./routes/history"));
const LiveQueue       = lazy(() => import("./routes/queue"));
const AddToQueue      = lazy(() => import("./routes/queue-add"));
const SettingsPage    = lazy(() => import("./routes/settings"));
const SuperAdmin      = lazy(() => import("./routes/superadmin"));
const JoinPage        = lazy(() => import("./routes/join"));
const StatusPage      = lazy(() => import("./routes/status"));
const TermsPage       = lazy(() => import("./routes/terms"));
const PrivacyPage     = lazy(() => import("./routes/privacy"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-[#0F6E56] border-t-transparent animate-spin" />
        <span className="text-xs text-[#7A7A72]">Loading…</span>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="route-fade flex min-h-screen items-center justify-center bg-[#F7F5F0] px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl font-extrabold leading-none text-[#0F6E56] sm:text-9xl">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-[#0E0E0C]">This page stepped out of line.</h2>
        <p className="mt-2 text-sm text-[#7A7A72]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="shine-hover inline-flex items-center justify-center rounded-xl bg-[#0F6E56] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0a5a44]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
       <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/queue" element={<LiveQueue />} />
            <Route path="/queue-add" element={<AddToQueue />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/superadmin" element={<SuperAdmin />} />
            <Route path="/join/:businessId" element={<JoinPage />} />
            <Route path="/status/:entryId" element={<StatusPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

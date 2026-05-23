import DashboardSidebar from './_components/DashboardSidebar'

export const metadata = {
  title: 'LEXRAM TSR — Title Scrutiny Report',
}

export default function TsrLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-tsr className="flex flex-1 min-h-0 overflow-hidden bg-cream">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

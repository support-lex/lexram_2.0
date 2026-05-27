import DashboardSidebar from './_components/DashboardSidebar'

export const metadata = {
  title: 'LEXRAM TSR — Title Scrutiny Report',
}

export default function TsrLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <DashboardSidebar />
      <main className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {children}
      </main>
    </div>
  )
}

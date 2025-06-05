export default function FormLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-neutral-100 fixed inset-0">
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}

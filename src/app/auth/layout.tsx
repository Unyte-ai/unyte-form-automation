import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh flex">
      {/* Left Half - Teal Background with Logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#007187] relative">
        {/* Logo in top right of left side */}
        <div className="absolute top-6 left-6">
          <Image
            src="/Unyte-Logo.png"
            alt="Unyte Logo"
            width={134}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </div>
      </div>

      {/* Right Half - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 bg-white">
        <div className="w-full max-w-md lg:max-w-lg">
          {/* Mobile Logo - Only shown on smaller screens */}
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/Unyte-Logo.png"
              alt="Unyte Logo"
              width={134}
              height={40}
              className="h-10 w-auto mx-auto"
              priority
            />
          </div>
          
          {children}
        </div>
      </div>
    </div>
  )
}
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-svh flex bg-gray-100">
      {/* Left Half - Auth Forms */}
      <div className="w-full lg:w-1/2 bg-white lg:bg-gray-100 relative">
        {/* Desktop Logo - Top left corner */}
        <div className="hidden lg:block absolute top-6 left-6">
          <Image
            src="/Unyte-Logo.png"
            alt="Unyte Logo"
            width={134}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </div>

        {/* Content container */}
        <div className="flex items-center justify-center p-6 md:p-10 h-full">
          <div className="w-full max-w-md lg:max-w-lg">
            {/* Mobile Logo - Centered above form */}
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

      {/* Right Half - Floating Teal Panel */}
      <div className="hidden lg:flex lg:w-1/2 p-6">
        <div className="bg-[#007187] rounded-2xl flex-1 relative">
        </div>
      </div>
    </div>
  )
}
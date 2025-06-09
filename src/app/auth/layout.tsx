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
        <div className="bg-[#007486] rounded-2xl flex-1 relative overflow-hidden">
          
          <div className="relative z-10 p-8 flex flex-col justify-between h-full text-white">
            {/* Header Section */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
                <div className="w-2 h-2 bg-[#3FBA9C] rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Intelligent Automation</span>
              </div>
              
              <h2 className="text-3xl font-bold mb-4 mt-7 leading-tight">
                Multi-Platform Marketing
                <br />
                <span className="text-[#3FBA9C]">Made Easy</span>
              </h2>
              
              <p className="text-lg text-teal-100 leading-relaxed">
                Turn hours of campaign setup into minutes. We automate the creation and deployment of campaigns across all major advertising platforms.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="w-8 h-8 bg-[#3FBA9C] rounded-lg mb-3 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-1">Campaign Creation</h3>
                <p className="text-xs text-teal-200">Automated setup</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="w-8 h-8 bg-[#F37032] rounded-lg mb-3 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-1">Multi-Platform</h3>
                <p className="text-xs text-teal-200">Google, Meta, LinkedIn</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="w-8 h-8 bg-[#007486] rounded-lg mb-3 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-1">Unified Dashboard</h3>
                <p className="text-xs text-teal-200">All platforms, one view</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="w-8 h-8 bg-[#A3011B] rounded-lg mb-3 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-1">Time Saving</h3>
                <p className="text-xs text-teal-200">Hours reduced to minutes</p>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-teal-100">
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 bg-[#3FBA9C] rounded-full"></div>
                  <div className="w-5 h-5 bg-[#F37032] rounded-full"></div>
                  <div className="w-5 h-5 bg-[#A3011B] rounded-full"></div>
                </div>
                <span className="text-sm font-medium">Join the smart marketing revolution</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
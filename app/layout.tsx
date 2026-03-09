import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "InsureAssist - CRM for Insurance Agents",
  description: "Multi-tenant CRM with AI-powered lead qualification",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Try to import SpeedInsights, but don't fail if it's not available
  const SpeedInsightsComponent = (() => {
    try {
      const { SpeedInsights } = require('@vercel/speed-insights/next')
      return <SpeedInsights />
    } catch (e) {
      // Module not available, skip it
      return null
    }
  })()

  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {SpeedInsightsComponent}
      </body>
    </html>
  )
}

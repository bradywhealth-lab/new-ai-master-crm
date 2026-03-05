'use client'

import SocialMediaManager from '@/components/social-media-manager'
import SocialPostsManager from '@/components/social-posts-manager'

export default function SocialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Social Media</h1>
        <p className="text-gray-600">Manage your social media connections and posts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Social Connections */}
        <div className="lg:col-span-1">
          <SocialMediaManager />
        </div>

        {/* Social Posts */}
        <div className="lg:col-span-1">
          <SocialPostsManager />
        </div>
      </div>
    </div>
  )
}

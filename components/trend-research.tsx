'use client'

import { useState } from 'react'
import type { Trend, HashtagAnalysis } from '@/types/social'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function TrendResearch() {
  const [keyword, setKeyword] = useState('')
  const [hashtag, setHashtag] = useState('')
  const [platform, setPlatform] = useState<'linkedin' | 'twitter' | 'instagram'>('linkedin')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [trends, setTrends] = useState<Trend[]>([])
  const [hashtagAnalyses, setHashtagAnalyses] = useState<HashtagAnalysis[]>([])
  const [activeTab, setActiveTab] = useState<'trends' | 'hashtags'>('trends')

  async function loadTrends() {
    const response = await fetch(`/api/trends/analyze?type=trend&platform=${platform}`)
    const result = await response.json()
    setTrends(result.data?.trends || [])
  }

  async function loadHashtags() {
    const response = await fetch(`/api/trends/analyze?type=hashtag&platform=${platform}`)
    const result = await response.json()
    setHashtagAnalyses(result.data?.hashtagAnalyses || [])
  }

  async function analyze() {
    if (!keyword && !hashtag) return

    setIsAnalyzing(true)
    try {
      const body: any = { platform }
      if (keyword) body.keyword = keyword
      if (hashtag) body.hashtag = hashtag

      const response = await fetch('/api/trends/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setKeyword('')
        setHashtag('')
        loadTrends()
        loadHashtags()
      }
    } catch (error) {
      console.error('Failed to analyze:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const platformColors: Record<string, string> = {
    linkedin: 'bg-blue-100 text-blue-800',
    twitter: 'bg-gray-100 text-gray-800',
    instagram: 'bg-pink-100 text-pink-800'
  }

  const performanceColors: Record<string, string> = {
    trending_up: 'bg-green-100 text-green-800',
    trending_down: 'bg-red-100 text-red-800',
    stable: 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Analysis Form */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Research</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full border rounded p-2"
              >
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">X (Twitter)</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Keyword to Research</label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g., AI insurance, CRM automation..."
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hashtag to Analyze</label>
              <Input
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                placeholder="e.g., #InsuranceTech, #AI"
                className="w-full border rounded p-2"
              />
            </div>

            <Button
              onClick={analyze}
              disabled={isAnalyzing || (!keyword && !hashtag)}
              className="w-full"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Analysis Results</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={activeTab === 'trends' ? 'default' : 'outline'}
                onClick={() => setActiveTab('trends')}
              >
                Trends
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'hashtags' ? 'default' : 'outline'}
                onClick={() => setActiveTab('hashtags')}
              >
                Hashtags
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeTab === 'trends' ? (
              <>
                {trends.length === 0 ? (
                  <p className="text-gray-500 text-sm">No trend data yet. Analyze a keyword above.</p>
                ) : (
                  trends.map((trend) => (
                    <div key={trend.id} className="p-4 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{trend.keyword}</h3>
                          <Badge className={platformColors[trend.platform]}>
                            {trend.platform}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{trend.volume.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">posts</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={trend.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {trend.growth_rate >= 0 ? '↑' : '↓'} {Math.abs(trend.growth_rate)}%
                        </span>
                        <span className="text-gray-500">
                          analyzed {new Date(trend.last_analyzed).toLocaleDateString()}
                        </span>
                      </div>
                      {trend.related_keywords.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1">Related keywords:</div>
                          <div className="flex flex-wrap gap-2">
                            {trend.related_keywords.map((kw) => (
                              <Badge key={kw} variant="outline">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            ) : (
              <>
                {hashtagAnalyses.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hashtag data yet. Analyze a hashtag above.</p>
                ) : (
                  hashtagAnalyses.map((analysis, idx) => (
                    <div key={idx} className="p-4 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{analysis.hashtag}</h3>
                          <Badge className={platformColors[platform]}>
                            {platform}
                          </Badge>
                        </div>
                        <Badge className={performanceColors[analysis.recent_performance]}>
                          {analysis.recent_performance.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <div className="font-bold">{analysis.post_count.toLocaleString()}</div>
                          <div className="text-gray-500 text-xs">posts</div>
                        </div>
                        <div>
                          <div className="font-bold">{analysis.avg_likes}</div>
                          <div className="text-gray-500 text-xs">avg likes</div>
                        </div>
                        <div>
                          <div className="font-bold">{analysis.avg_comments}</div>
                          <div className="text-gray-500 text-xs">avg comments</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

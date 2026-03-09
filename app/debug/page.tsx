'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Hardcoded credentials for debugging
const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlia3Rja2RwaGh3am5tdnp3c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzQxNzgsImV4cCI6MjA4ODIxMDE3OH0.-QXSfvi848zGDglMsU3hu2A6RWXKHRpMYPwuTpbko2s'

export default function Debug() {
  const [data, setData] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [env, setEnv] = useState<{ url: string; key: string }>({ url: '', key: '' })
  
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
    
    setEnv({
      url: url,
      key: key ? 'SET' : 'NOT SET'
    })
    
    try {
      const supabase = createClient(url, key)
      supabase.from('articles').select('title, category').limit(5)
        .then(({ data, error }) => {
          if (error) setError(JSON.stringify(error))
          else setData(data)
        })
    } catch(e) {
      setError((e as Error).message)
    }
  }, [])
  
  return (
    <div className="p-8 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">Supabase Debug</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify({ env, data, error }, null, 2)}
      </pre>
    </div>
  )
}

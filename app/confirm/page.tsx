import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'

const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlia3Rja2RwaGh3am5tdnp3c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzQxNzgsImV4cCI6MjA4ODIxMDE3OH0.-QXSfvi848zGDglMsU3hu2A6RWXKHRpMYPwuTpbko2s'

export const dynamic = 'force-dynamic'

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  
  if (!token) {
    return <ConfirmResult success={false} />
  }

  const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Find subscriber with this token
  const { data: subscriber, error: findError } = await supabase
    .from('subscribers')
    .select('id, email, active')
    .eq('confirmation_token', token)
    .single()

  if (findError || !subscriber) {
    return <ConfirmResult success={false} />
  }

  // If already active, show success
  if (subscriber.active) {
    return <ConfirmResult success={true} alreadyConfirmed={true} />
  }

  // Activate the subscription
  const { error: updateError } = await supabase
    .from('subscribers')
    .update({ 
      active: true, 
      confirmation_token: null 
    })
    .eq('id', subscriber.id)

  if (updateError) {
    return <ConfirmResult success={false} />
  }

  return <ConfirmResult success={true} />
}

function ConfirmResult({ 
  success, 
  alreadyConfirmed = false 
}: { 
  success: boolean
  alreadyConfirmed?: boolean 
}) {
  return (
    <div className="min-h-screen bg-[#FFFDFB] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-block mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#1C1412]">into.tax</h1>
        </Link>
        
        {success ? (
          <div className="bg-white border border-[#E8DFD6] rounded-lg p-8 shadow-sm">
            <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#1C1412] mb-2">
              {alreadyConfirmed ? "Already confirmed!" : "You're confirmed!"}
            </h2>
            <p className="text-[#6B5B4F] mb-6">
              {alreadyConfirmed 
                ? "Your subscription is already active."
                : "First digest arrives Friday."
              }
            </p>
            <Link 
              href="/"
              className="inline-block px-6 py-2.5 bg-[#C8702A] text-white text-sm font-medium rounded-md hover:bg-[#A0522D] transition-colors"
            >
              Back to into.tax
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[#E8DFD6] rounded-lg p-8 shadow-sm">
            <div className="w-16 h-16 bg-[#FFEBEE] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#C62828]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#1C1412] mb-2">
              This link has expired or is invalid.
            </h2>
            <p className="text-[#6B5B4F] mb-6">
              Please try subscribing again.
            </p>
            <Link 
              href="/"
              className="inline-block px-6 py-2.5 bg-[#C8702A] text-white text-sm font-medium rounded-md hover:bg-[#A0522D] transition-colors"
            >
              Back to into.tax
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

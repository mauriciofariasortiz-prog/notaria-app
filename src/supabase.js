import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xnmbdmddftmfafarlfgi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubWJkbWRkZnRtZmFmYXJsZmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDQzNjIsImV4cCI6MjA5NzEyMDM2Mn0.0clMCJH0mZ6m39BRVbU0yNmmR7VNagtku-8U26QQLGQ'

export const supabase = createClient(supabaseUrl, supabaseKey)

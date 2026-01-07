import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  console.log('Export function called, method:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting database export...')

    // Fetch all tables data
    const [categoriesResult, contactsResult, templatesResult, userEmailsResult] = await Promise.all([
      supabase.from('contact_categories').select('*'),
      supabase.from('contacts').select('*'),
      supabase.from('email_templates').select('*'),
      supabase.from('user_emails').select('*'),
    ])

    if (categoriesResult.error) console.error('Categories error:', categoriesResult.error)
    if (contactsResult.error) console.error('Contacts error:', contactsResult.error)
    if (templatesResult.error) console.error('Templates error:', templatesResult.error)
    if (userEmailsResult.error) console.error('User emails error:', userEmailsResult.error)

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tables: {
        contact_categories: categoriesResult.data || [],
        contacts: contactsResult.data || [],
        email_templates: templatesResult.data || [],
        user_emails: userEmailsResult.data || [],
      }
    }

    console.log('Export completed successfully')

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    console.error('Export error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Exporting database...')

    const [categories, contacts, templates, userEmails] = await Promise.all([
      supabase.from('contact_categories').select('*'),
      supabase.from('contacts').select('*'),
      supabase.from('email_templates').select('*'),
      supabase.from('user_emails').select('*'),
    ])

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tables: {
        contact_categories: categories.data || [],
        contacts: contacts.data || [],
        email_templates: templates.data || [],
        user_emails: userEmails.data || [],
      }
    }

    console.log('Export done:', Object.keys(exportData.tables).map(k => `${k}: ${exportData.tables[k as keyof typeof exportData.tables].length}`))

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Export error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
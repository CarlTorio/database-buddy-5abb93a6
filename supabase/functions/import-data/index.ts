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

    const importData = await req.json()
    console.log('Importing database...')

    if (!importData.tables) {
      throw new Error('Invalid import file format')
    }

    const results = { categories: 0, contacts: 0, templates: 0, userEmails: 0 }

    // Import categories first (contacts depend on them)
    for (const item of importData.tables.contact_categories || []) {
      const { error } = await supabase.from('contact_categories').upsert(item, { onConflict: 'id' })
      if (!error) results.categories++
    }

    for (const item of importData.tables.contacts || []) {
      const { error } = await supabase.from('contacts').upsert(item, { onConflict: 'id' })
      if (!error) results.contacts++
    }

    for (const item of importData.tables.email_templates || []) {
      const { error } = await supabase.from('email_templates').upsert(item, { onConflict: 'id' })
      if (!error) results.templates++
    }

    for (const item of importData.tables.user_emails || []) {
      const { error } = await supabase.from('user_emails').upsert(item, { onConflict: 'id' })
      if (!error) results.userEmails++
    }

    console.log('Import done:', results)

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Import error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
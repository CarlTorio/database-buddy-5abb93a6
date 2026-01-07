import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const importData = await req.json()

    console.log('Starting database import...')
    console.log('Import version:', importData.version)
    console.log('Exported at:', importData.exportedAt)

    if (!importData.tables) {
      throw new Error('Invalid import file format: missing tables property')
    }

    const results = {
      contact_categories: { inserted: 0, errors: 0 },
      contacts: { inserted: 0, errors: 0 },
      email_templates: { inserted: 0, errors: 0 },
      user_emails: { inserted: 0, errors: 0 },
    }

    // Import contact_categories first (since contacts depend on them)
    if (importData.tables.contact_categories?.length > 0) {
      for (const category of importData.tables.contact_categories) {
        const { error } = await supabase
          .from('contact_categories')
          .upsert(category, { onConflict: 'id' })
        
        if (error) {
          console.error('Error importing category:', error)
          results.contact_categories.errors++
        } else {
          results.contact_categories.inserted++
        }
      }
    }

    // Import contacts
    if (importData.tables.contacts?.length > 0) {
      for (const contact of importData.tables.contacts) {
        const { error } = await supabase
          .from('contacts')
          .upsert(contact, { onConflict: 'id' })
        
        if (error) {
          console.error('Error importing contact:', error)
          results.contacts.errors++
        } else {
          results.contacts.inserted++
        }
      }
    }

    // Import email_templates
    if (importData.tables.email_templates?.length > 0) {
      for (const template of importData.tables.email_templates) {
        const { error } = await supabase
          .from('email_templates')
          .upsert(template, { onConflict: 'id' })
        
        if (error) {
          console.error('Error importing template:', error)
          results.email_templates.errors++
        } else {
          results.email_templates.inserted++
        }
      }
    }

    // Import user_emails
    if (importData.tables.user_emails?.length > 0) {
      for (const userEmail of importData.tables.user_emails) {
        const { error } = await supabase
          .from('user_emails')
          .upsert(userEmail, { onConflict: 'id' })
        
        if (error) {
          console.error('Error importing user email:', error)
          results.user_emails.errors++
        } else {
          results.user_emails.inserted++
        }
      }
    }

    console.log('Import completed:', results)

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    console.error('Import error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

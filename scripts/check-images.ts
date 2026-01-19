
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkBlogImages() {
    console.log("Checking blog images...")
    const { data, error } = await supabase
        .from('blogs')
        .select('title, featured_image')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error:", error)
        return
    }

    data?.forEach(blog => {
        const isTemporary = blog.featured_image?.includes('blob.core.windows.net')
        console.log(`\nBlog: ${blog.title}`)
        console.log(`URL: ${blog.featured_image?.substring(0, 100)}...`)
        console.log(`Status: ${isTemporary ? '⚠️ TEMPORARY (EXPECTED TO FAIL)' : '✅ PERMANENT'}`)
    })
}

checkBlogImages()

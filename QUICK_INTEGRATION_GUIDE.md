# Quick Integration Guide - Image Style Selection

## Step 1: Import the new components

Add this to the top of `/app/dashboard/admin/page.tsx`:

```typescript
import { ImageStyleSelector, ImageSelectionGrid } from "@/components/admin/ImageStyleSelector"
```

## Step 2: Add new state variables

Replace line 33 (`const [imageStyle, setImageStyle] = useState("Minimalist")`) with:

```typescript
const [selectedImageStyles, setSelectedImageStyles] = useState<string[]>(['Minimalist'])
const [generateMultipleImages, setGenerateMultipleImages] = useState(false)
const [generatedImages, setGeneratedImages] = useState<Array<{ style: string; url: string }>>([])
const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
```

## Step 3: Update handleGenerate function

Replace the existing `handleGenerate` function (around line 131-145) with:

```typescript
async function handleGenerate() {
    setLoading(true)
    setGeneratedBlog(null)
    setGeneratedImages([])
    setSelectedImageUrl(null)
    
    try {
        const res = await fetch("/api/generate-blog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                topic, 
                focus, 
                keywords, 
                productName, 
                productUrl, 
                authorName, 
                length, 
                imageStyles: selectedImageStyles,
                generateMultipleImages,
                publishDate 
            }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        
        if (data.requiresImageSelection) {
            setGeneratedBlog(data.blog)
            setGeneratedImages(data.images)
            showMsg("Blog and images generated! Please select your preferred image.")
        } else {
            setGeneratedBlog(data.blog)
            showMsg("Blog generated successfully!")
        }
    } catch (error: any) { 
        showMsg(error.message, 'error') 
    } finally { 
        setLoading(false) 
    }
}
```

## Step 4: Add new save function

Add this new function after `handleGenerate`:

```typescript
async function handleSaveWithSelectedImage() {
    if (!selectedImageUrl || !generatedBlog) return
    
    setLoading(true)
    try {
        const res = await fetch("/api/generate-blog", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                blogData: generatedBlog,
                selectedImageUrl,
                topic,
                focus,
                keywords,
                productName,
                productUrl,
                authorName,
                publishDate
            }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        
        showMsg("Blog saved successfully with selected image!")
        setGeneratedBlog(null)
        setGeneratedImages([])
        setSelectedImageUrl(null)
        fetchBlogs()
    } catch (error: any) {
        showMsg(error.message, 'error')
    } finally {
        setLoading(false)
    }
}
```

## Step 5: Add Image Style Selector to UI

Find the "Publish Date" InputGroup (around line 279-286) and add this AFTER it:

```tsx
<InputGroup label="Image Style / Genre">
    <ImageStyleSelector
        selectedStyles={selectedImageStyles}
        onStylesChange={setSelectedImageStyles}
        generateMultiple={generateMultipleImages}
        onGenerateMultipleChange={setGenerateMultipleImages}
    />
</InputGroup>
```

## Step 6: Add Image Selection Grid

Find the preview section (around line 376-388) and REPLACE the entire `generatedBlog` preview block with:

```tsx
{generatedImages.length > 0 ? (
    <ImageSelectionGrid
        images={generatedImages}
        selectedUrl={selectedImageUrl}
        onSelect={setSelectedImageUrl}
        onSave={handleSaveWithSelectedImage}
        loading={loading}
    />
) : generatedBlog ? (
    <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-6">
        <img src={generatedBlog.featured_image} className="w-full aspect-video object-cover rounded-2xl" />
        <h3 className="text-2xl font-bold">{generatedBlog.title}</h3>
        <div className="prose prose-invert max-h-[400px] overflow-y-auto text-sm opacity-60" dangerouslySetInnerHTML={{ __html: generatedBlog.content }} />
        <div className="flex gap-4">
            <Button onClick={() => {
                setEditingBlog(generatedBlog)
                setGeneratedBlog(null)
            }} className="flex-1 py-6 bg-accent text-black font-black uppercase">Refine & Save</Button>
            <Button onClick={() => setGeneratedBlog(null)} variant="outline" className="py-6 border-white/10 font-black uppercase">Dismiss</Button>
        </div>
    </div>
) : null}
```

## That's it!

Now test the feature:
1. Fill in blog details
2. Select multiple image styles (try Minimalist, Realistic, and Futuristic)
3. Toggle "Generate Multiple Images" ON
4. Click "Generate Intelligence Post"
5. Wait for images to generate
6. Select your favorite image
7. Click "Save Blog with Selected Image"

The blog will be saved with your chosen image!

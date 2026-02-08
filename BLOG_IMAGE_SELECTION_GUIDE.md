# Blog Image Style Selection - Implementation Guide

## Overview
This document outlines the changes needed to add multi-image style selection to the Blog Commander.

## Features Added
1. **Multiple Image Style Selection**: Choose from 8 different image styles
2. **Multi-Image Generation**: Generate multiple images with different styles at once
3. **Image Preview & Selection**: View all generated images and select your favorite
4. **Realistic Style Support**: Includes "Realistic" as a style option

## Available Image Styles
- Minimalist
- Abstract
- Realistic ⭐ (New!)
- Futuristic
- Corporate
- Vibrant
- Dark
- Illustrative

## Changes Required

### 1. State Variables (Add to admin/page.tsx around line 33)

```typescript
const [selectedImageStyles, setSelectedImageStyles] = useState<string[]>(['Minimalist'])
const [generateMultipleImages, setGenerateMultipleImages] = useState(false)
const [generatedImages, setGeneratedImages] = useState<Array<{ style: string; url: string }>>([])
const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
```

### 2. Image Style Constants (Add after imports)

```typescript
const IMAGE_STYLES = [
    'Minimalist',
    'Abstract',
    'Realistic',
    'Futuristic',
    'Corporate',
    'Vibrant',
    'Dark',
    'Illustrative'
]
```

### 3. Updated handleGenerate Function

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
            // Multiple images generated - show selection UI
            setGeneratedBlog(data.blog)
            setGeneratedImages(data.images)
            showMsg("Blog and images generated! Please select your preferred image.")
        } else {
            // Single image - saved automatically
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

### 4. New Function: Save Blog with Selected Image

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

### 5. Toggle Image Style Selection

```typescript
function toggleImageStyle(style: string) {
    setSelectedImageStyles(prev => {
        if (prev.includes(style)) {
            return prev.filter(s => s !== style)
        } else {
            return [...prev, style]
        }
    })
}
```

## UI Components to Add

### Image Style Selector (Add in Configuration Section)

```tsx
<InputGroup label="Image Style / Genre">
    <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={generateMultipleImages}
                    onChange={(e) => setGenerateMultipleImages(e.target.checked)}
                    className="w-4 h-4 accent-accent"
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                    Generate Multiple Images
                </span>
            </label>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {IMAGE_STYLES.map(style => (
                <button
                    key={style}
                    type="button"
                    onClick={() => toggleImageStyle(style)}
                    className={`px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        selectedImageStyles.includes(style)
                            ? 'bg-accent text-black'
                            : 'bg-white/5 border border-white/10 hover:border-accent/50'
                    }`}
                >
                    {style}
                </button>
            ))}
        </div>
        
        <p className="text-[10px] text-white/40 italic">
            {generateMultipleImages 
                ? `Will generate ${selectedImageStyles.length} image${selectedImageStyles.length > 1 ? 's' : ''} for selection`
                : 'Will generate 1 image with the first selected style'
            }
        </p>
    </div>
</InputGroup>
```

### Image Selection UI (Replace Preview Section when images are generated)

```tsx
{generatedImages.length > 0 && (
    <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-6">
        <h3 className="text-2xl font-black uppercase tracking-tighter italic text-accent">
            Select Your Image
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
            {generatedImages.map((img, idx) => (
                <div
                    key={idx}
                    onClick={() => setSelectedImageUrl(img.url)}
                    className={`cursor-pointer rounded-xl overflow-hidden border-4 transition-all ${
                        selectedImageUrl === img.url
                            ? 'border-accent scale-105'
                            : 'border-white/10 hover:border-accent/50'
                    }`}
                >
                    <img
                        src={img.url}
                        alt={img.style}
                        className="w-full aspect-video object-cover"
                    />
                    <div className="bg-black/80 p-3 text-center">
                        <span className="text-xs font-black uppercase tracking-wider">
                            {img.style}
                        </span>
                    </div>
                </div>
            ))}
        </div>
        
        <Button
            onClick={handleSaveWithSelectedImage}
            disabled={!selectedImageUrl || loading}
            className="w-full py-6 bg-accent text-black font-black uppercase"
        >
            {loading ? "Saving..." : "Save Blog with Selected Image"}
        </Button>
    </div>
)}
```

## Testing Steps

1. Navigate to Admin Dashboard → Blog Commander
2. Fill in blog details (topic, focus, keywords, etc.)
3. Select multiple image styles (e.g., Minimalist, Realistic, Futuristic)
4. Check "Generate Multiple Images"
5. Click "Generate Intelligence Post"
6. Wait for generation (will take longer with multiple images)
7. Review all generated images
8. Click on your preferred image to select it
9. Click "Save Blog with Selected Image"
10. Verify the blog appears in the archive with the correct image

## Notes

- Generating multiple images takes longer (each image takes ~10-15 seconds)
- Maximum recommended: 4-5 styles at once
- The "Realistic" style uses DALL-E's "natural" mode for photorealistic results
- All other styles use "vivid" mode for more artistic results

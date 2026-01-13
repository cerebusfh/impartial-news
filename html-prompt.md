# HTML Generation Task

## Your Task
Convert the provided news data JSON into a complete, professional HTML news page with a classic newspaper aesthetic.

## HTML Template

Use this exact structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Impartial News - [DATE FROM JSON]</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Classic newspaper typography */
        body { 
            font-family: Georgia, 'Times New Roman', Times, serif;
            background: #fafafa;
            color: #121212;
        }
        
        h1, h2, h3 { 
            font-family: 'Playfair Display', Georgia, serif;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        /* Newspaper-style layout */
        .news-story {
            border-bottom: 1px solid #e5e5e5;
            padding: 1.25rem 0;
            transition: background-color 0.2s;
        }
        
        .news-story:hover {
            background-color: #f5f5f5;
        }
        
        .news-story:last-child {
            border-bottom: none;
        }
        
        .headline {
            font-size: 1.25rem;
            line-height: 1.3;
            margin-bottom: 0.5rem;
            color: #121212;
        }
        
        .top-headline {
            font-size: 1.5rem;
            line-height: 1.2;
            font-weight: 700;
        }
        
        .blurb {
            font-size: 0.95rem;
            line-height: 1.6;
            color: #333;
            margin-bottom: 0.5rem;
            font-style: normal;
            font-weight: normal;
        }
        
        .source {
            font-size: 0.75rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .section-header {
            border-top: 3px double #121212;
            border-bottom: 1px solid #121212;
            padding: 0.5rem 0;
            margin: 2rem 0 1rem 0;
            font-size: 1.1rem;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        
        header {
            border-bottom: 3px double #121212;
            padding: 1.5rem 0;
            background: white;
        }
        
        .masthead {
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin: 0;
            letter-spacing: 2px;
        }
        
        .tagline {
            text-align: center;
            font-size: 0.85rem;
            color: #666;
            margin-top: 0.5rem;
            font-style: italic;
        }
        
        .date-header {
            text-align: center;
            font-size: 0.9rem;
            margin-top: 0.75rem;
            color: #121212;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        @media (max-width: 768px) {
            .masthead { font-size: 2rem; }
            .top-headline { font-size: 1.25rem; }
            .headline { font-size: 1.1rem; }
        }
    </style>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <div class="container mx-auto max-w-5xl px-4">
            <h1 class="masthead">IMPARTIAL NEWS</h1>
            <p class="tagline">"All the News That's Fit to Read"</p>
            <p class="date-header">[DATE] | Last Updated: [TIMESTAMP]</p>
        </div>
    </header>

    <div class="container mx-auto max-w-5xl px-4 mt-4 mb-4">
        <button id="refresh-news-btn" 
                class="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded text-sm transition duration-150 ease-in-out"
                style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
            🔄 Update Edition
        </button>
        <span id="refresh-status" class="ml-4 text-sm text-gray-600"></span>
    </div>

    <main class="container mx-auto max-w-5xl px-4 bg-white" style="padding-top: 1.5rem; padding-bottom: 3rem;">
        
        <!-- TOP HEADLINES -->
        <section class="mb-8">
            <h2 class="section-header">Top Headlines</h2>
            <div class="grid md:grid-cols-2 gap-x-8">
                <!-- Insert top_headlines stories here -->
                <article class="news-story">
                    <h3 class="headline top-headline">[HEADLINE]</h3>
                    <p class="blurb">[BLURB]</p>
                    <p class="source">[SOURCE]</p>
                </article>
            </div>
        </section>

        <!-- U.S. NEWS -->
        <section class="mb-8">
            <h2 class="section-header">United States</h2>
            <div>
                <!-- Insert us_news stories here -->
                <article class="news-story">
                    <h3 class="headline">[HEADLINE]</h3>
                    <p class="blurb">[BLURB]</p>
                    <p class="source">[SOURCE]</p>
                </article>
            </div>
        </section>

        <!-- WORLD NEWS -->
        <section class="mb-8">
            <h2 class="section-header">World</h2>
            <div>
                <!-- Insert world_news stories here -->
            </div>
        </section>

        <!-- BUSINESS -->
        <section class="mb-8">
            <h2 class="section-header">Business</h2>
            <div>
                <!-- Insert business stories here -->
            </div>
        </section>

        <!-- SPORTS -->
        <section class="mb-8">
            <h2 class="section-header">Sports</h2>
            <div>
                <!-- Insert sports stories here -->
            </div>
        </section>

        <!-- ENTERTAINMENT -->
        <section class="mb-8">
            <h2 class="section-header">Arts & Entertainment</h2>
            <div>
                <!-- Insert entertainment stories here -->
            </div>
        </section>

        <!-- GAMING -->
        <section class="mb-8">
            <h2 class="section-header">Technology & Gaming</h2>
            <div>
                <!-- Insert gaming stories here -->
            </div>
        </section>

    </main>

    <footer class="bg-gray-900 text-gray-400 py-6 mt-8 text-center" style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
        <div class="container mx-auto max-w-5xl px-4">
            <p class="text-sm">&copy; 2026 Impartial News Aggregator</p>
            <p class="text-xs mt-2">Curated by artificial intelligence | Updated daily at 6:00 AM PST</p>
        </div>
    </footer>

    <script>
    document.getElementById('refresh-news-btn').addEventListener('click', async function() {
        const btn = this;
        const status = document.getElementById('refresh-status');
        
        btn.disabled = true;
        btn.textContent = '⏳ Generating...';
        status.textContent = 'This may take 2-3 minutes...';
        
        try {
            const response = await fetch('https://impartial-news-production.up.railway.app/generate');
            const data = await response.json();
            
            status.textContent = '✅ ' + data.message + ' - Page will refresh in 60 seconds';
            
            // Refresh page after 60 seconds to show new content
            setTimeout(() => location.reload(), 60000);
        } catch (error) {
            status.textContent = '❌ Error: ' + error.message;
            btn.disabled = false;
            btn.textContent = '🔄 Update Edition';
        }
    });
    </script>
</body>
</html>
```

## Instructions

1. Take the news data JSON provided
2. Insert each story into the appropriate section
3. Use the exact HTML structure above
4. Fill in the date from the JSON
5. Create one `<article class="news-story">` for each story
6. For top headlines, ensure EXACTLY 4 stories for balanced 2-column layout
7. Output the COMPLETE HTML file - do not truncate or summarize

**Return only the HTML - no explanations, no markdown code blocks wrapping it.**

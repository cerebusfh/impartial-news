# HTML Generation Task

## Your Task
Convert the provided news data JSON into a complete, professional HTML news page.

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
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .news-card {
            background: white;
            border-radius: 0.5rem;
            padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: shadow 0.3s;
        }
        .news-card:hover { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .source { font-size: 0.8rem; color: #6b7280; margin-top: 0.75rem; }
    </style>
</head>
<body class="bg-gray-50">
    <header class="bg-indigo-600 text-white p-6">
        <div class="container mx-auto max-w-6xl">
            <h1 class="text-3xl font-bold">Impartial News</h1>
            <p class="text-indigo-200">[DATE] - Factual Headlines</p>
            <p class="text-indigo-300 text-sm mt-1">Last updated: [TIMESTAMP]</p>
        </div>
    </header>

    <div class="container mx-auto max-w-6xl px-4 sm:px-6 mt-4">
        <button id="refresh-news-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition duration-150 ease-in-out">
            🔄 Refresh News Now
        </button>
        <span id="refresh-status" class="ml-4 text-sm text-gray-600"></span>
    </div>

    <main class="container mx-auto max-w-6xl p-6">
        
        <!-- TOP HEADLINES -->
        <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-600">Top Headlines</h2>
            <div class="grid md:grid-cols-2 gap-6">
                <!-- Insert top_headlines stories here -->
                <article class="news-card">
                    <h3 class="text-lg font-semibold mb-2">[HEADLINE]</h3>
                    <p class="text-gray-600 text-sm">[BLURB]</p>
                    <p class="source">Source: [SOURCE]</p>
                </article>
            </div>
        </section>

        <!-- U.S. NEWS -->
        <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-600">U.S. News</h2>
            <div class="grid md:grid-cols-3 gap-6">
                <!-- Insert us_news stories here -->
            </div>
        </section>

        <!-- WORLD NEWS -->
        <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-600">World News</h2>
            <div class="grid md:grid-cols-3 gap-6">
                <!-- Insert world_news stories here -->
            </div>
        </section>

        <!-- BUSINESS -->
        <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-600">Business</h2>
            <div class="grid md:grid-cols-3 gap-6">
                <!-- Insert business stories here -->
            </div>
        </section>

        <!-- SPORTS -->
        <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-600">Sports</h2>
            <div class="grid md:grid-cols-3 gap-6">
                <!-- Insert sports stories here -->
            </div>
        </section>

        <!-- ENTERTAINMENT -->
        <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-600">Entertainment</h2>
            <div class="grid md:grid-cols-3 gap-6">
                <!-- Insert entertainment stories here -->
            </div>
        </section>

        <!-- GAMING -->
        <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-600">Gaming</h2>
            <div class="grid md:grid-cols-3 gap-6">
                <!-- Insert gaming stories here -->
            </div>
        </section>

    </main>

    <footer class="bg-gray-800 text-gray-300 p-6 mt-10 text-center">
        <p>&copy; 2026 Impartial News Aggregator</p>
    </footer>

    <script>
    document.getElementById('refresh-news-btn').addEventListener('click', async function() {
        const btn = this;
        const status = document.getElementById('refresh-status');
        
        btn.disabled = true;
        btn.textContent = '⏳ Generating...';
        status.textContent = 'This may take 10-15 minutes...';
        
        try {
            const response = await fetch('https://impartial-news-production.up.railway.app/generate');
            const data = await response.json();
            
            status.textContent = '✅ ' + data.message + ' - Page will refresh in 2 minutes';
            
            // Refresh page after 2 minutes to show new content
            setTimeout(() => location.reload(), 120000);
        } catch (error) {
            status.textContent = '❌ Error: ' + error.message;
            btn.disabled = false;
            btn.textContent = '🔄 Refresh News Now';
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
5. Create one `<article class="news-card">` for each story
6. Output the COMPLETE HTML file - do not truncate or summarize

**Return only the HTML - no explanations, no markdown code blocks wrapping it.**
MANDATORY FIRST STEP: Before doing anything else, you MUST search the web using your search tool for current news. Do not proceed until you have searched for: 1. "breaking news today January 7 2026" 2. "US news latest today" 3. "world news today" 4. "business news today" 5. "top sports news today" 6. "entertainment news today" 7. "gaming news today" After searching, verify you have REAL sources (with URLs) before generating content. If you cannot search the web, STOP and tell me you cannot complete this task. 
Your Task
You are an impartial news editor. You will:
Search the internet for current news stories (from the last 24-48 hours)
Find 3-4 stories in each category: Top Headlines, U.S. News, World News, Business, Sports, Entertainment
Generate impartial headlines and blurbs for each story
Output a complete HTML page with all stories
Step 1: Search for News
Search for recent news in these categories:
Top Headlines: Major government actions, Supreme Court rulings, international developments (3-4 stories)
U.S. News: Domestic policy, federal agency actions, major court cases (3 stories)
World News: International events, diplomatic developments, conflicts (3 stories)
Business: Economic indicators, regulatory actions, major corporate news (3 stories)
Sports: Major tournaments, finals, championships currently happening (3 stories)
Entertainment: Recent announcements, releases, industry events (3 stories)
Use search queries like:
"major news today"
"U.S. government actions last 48 hours"
"world news breaking"
"sports championships today"
Step 2: Editorial Guidelines for Each Story
Core Principles
Verifiability: Anchor every story to a concrete, verifiable action or event
Impartiality: Remove ALL loaded, emotional, or sensational language
Attribution: Clearly attribute claims to sources
Recency: Only include events from the last 24-48 hours
Name Removal Rules
REMOVE these names:
Current politicians (presidents, senators, governors, cabinet members)
Political appointees and officials
Replace with titles: "The US President", "The Secretary of State", "The German Chancellor"
KEEP these names:
Athletes (e.g., "Alcaraz", "LeBron James")
Entertainers (e.g., "Taylor Swift", "Snoop Dogg")
Business leaders when the story is ABOUT them specifically (e.g., a CEO resignation)
Historical figures
Private citizens who are newsworthy
Neutrality Checklist
Before writing each headline/blurb, remove:
❌ Emotional adjectives: "shocking," "devastating," "amazing," "huge"
❌ Subjective qualifiers: "large-scale," "massive," "tiny," "significant" (unless with numbers)
❌ Loaded verbs: "slams," "blasts," "defends," "attacks"
✅ Use neutral verbs: "states," "announces," "reports," "proposes"
Handling Conflicts/Disputes
When sources disagree:
Report the disagreement itself factually
Attribute each position clearly
Example: "Official sources reported X attendees, while independent media outlets reported Y attendees"
Step 3: Output Format
Generate a complete HTML file using this structure:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Impartial News - [Today's Date]</title>
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
    </style>
</head>
<body class="bg-gray-50">
    <header class="bg-indigo-600 text-white p-6">
        <div class="container mx-auto max-w-6xl">
            <h1 class="text-3xl font-bold">Impartial News</h1>
            <p class="text-indigo-200">[Today's Date] - Factual Headlines</p>
        </div>
    </header>

    <main class="container mx-auto max-w-6xl p-6">
        <!-- TOP HEADLINES -->
        <section class="mb-10">
            <h2 class="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-600">Top Headlines</h2>
            <div class="grid md:grid-cols-2 gap-6">
                <!-- For each story: -->
                <article class="news-card">
                    <h3 class="text-lg font-semibold mb-2">[Impartial Headline]</h3>
                    <p class="text-gray-600 text-sm">[1-2 sentence factual blurb]</p>
                </article>
            </div>
        </section>

        <!-- Repeat for: U.S. News, World News, Business, Sports, Entertainment -->
        <!-- Use grid-cols-3 for these sections -->
    </main>

    <footer class="bg-gray-800 text-gray-300 p-6 mt-10 text-center">
        <p>&copy; [Year] Impartial News Aggregator</p>
    </footer>
</body>
</html>

Step 4: Generation Process
For EACH story you find:
Read the original source
Identify the core verifiable fact (what actually happened?)
Remove all adjectives and loaded language
Replace politician names with titles
Keep athlete/entertainer names
Write headline (8-15 words, factual, no punctuation except proper nouns)
Write blurb (1-2 sentences, adds context or key details)
Example Transformations
Original: "Trump SLAMS Biden's Terrible Border Policy in Fiery Speech" Your Output: "US President Criticizes Previous Administration's Immigration Approach in Campaign Address"
Original: "Alcaraz Crushes Opponent in Epic Roland-Garros Comeback!" Your Output: "Alcaraz Advances to French Open Final After Defeating Djokovic in Five Sets"
Original: "BREAKING: Stocks Crash as Fed Announces Shocking Rate Hike" Your Output: "Federal Reserve Raises Interest Rates by 0.75 Percentage Points, Markets Decline"
Final Instruction
Now execute:
Search for current news in all categories
Select 3-4 stories per category (prioritize recency and significance)
Apply editorial guidelines to each story
Generate the complete HTML file with all stories formatted
Use today's actual date in the header
Generate the HTML now.

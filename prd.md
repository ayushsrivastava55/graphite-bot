### **1\. System Architecture & Research Flow**

The system follows a **Scrape-Synthesize-Deliver** model. It uses specialized "spiders" to fetch data, an LLM (like Gemini or OpenAI) to summarize it, and a notification engine to send the results.

**The Core Flow for Developers:**

1.  **Ingestion:** Python-based scrapers (using Playwright or BeautifulSoup) target the URLs provided in the Index.
    
2.  **Processing:** Raw HTML is stripped to clean text and sent to an LLM API.
    

*   _Prompt Logic:_ "Identify new drill results, funding, or production updates. Ignore generic marketing fluff."
    

1.  **Storage:** Summaries and links are stored in a database (PostgreSQL) to avoid duplicate reports.
    
2.  **Distribution:** An automated script pulls the last X hours/days of news and formats it into an HTML email sent via SendGrid or AWS SES.
    

### **2\. The 3-Tiered Automation Schedule (Cron Jobs)**

**Job Name**

**Frequency**

**Target Source**

**Primary Objective**

**Cron A: Daily "Graphite Hub" Monitor**

**Daily (Every 24h)**

graphitehub.com/news/

Scrape and read _all_ new articles/blogs posted that day. Synthesize into a "Daily Industry Snapshot."

**Cron B: 3-Day Industry Synthesis**

**Every 72h**

Top 20 Competitor News Pages

Comprehensive update on the 20 peers. Focus on "Breakthroughs vs. Failures."

**Cron C: Weekly Financial Pulse**

**Every Friday**

Yahoo Finance / SEDAR+

Update Market Caps, TTM Revenue, and official regulatory filings for all 20 peers.

### **3\. Competitor Index & Data Sources**

Your developer should use these links as the "seed list" for the automated scrapers.

#### **Target: First Canadian Graphite Inc.**

*   **Website:** [firstcanadiangraphite.com](https://firstcanadiangraphite.com/)
    
*   **News Page:** [firstcanadiangraphite.com/news/](https://firstcanadiangraphite.com/news/)
    
*   **Ticker:** TSXV: FCI
    

#### **Top 20 Competitors (Canada & USA Region)**

**#**

**Company Name**

**Stock Ticker**

**Website (News/Investor Section)**

1

**Nouveau Monde Graphite**

TSX: NOU

[nmg.com/news/](https://nmg.com/news/)

2

**Graphite One Inc.**

TSXV: GPH

[graphiteoneinc.com/news/](https://www.graphiteoneinc.com/news/)

3

**Northern Graphite**

TSX: NGC

[northerngraphite.com/news/](https://www.google.com/search?q=https://northerngraphite.com/news/)

4

**Titan Mining Corp.**

TSX: TI

[titanminingcorp.com/news/](https://www.titanminingcorp.com/news/)

5

**Westwater Resources**

NYSE: WWR

[westwaterresources.net/investors/](https://westwaterresources.net/investors/)

6

**NextSource Materials**

TSX: NEXT

[nextsourcematerials.com/news/](https://www.nextsourcematerials.com/news/)

7

**Lomiko Metals**

TSXV: LMR

[lomiko.com/news/](https://lomiko.com/news/)

8

**Canada Carbon**

TSXV: CCB

[canadacarbon.com/news/](https://www.google.com/search?q=https://www.canadacarbon.com/news/)

9

**Focus Graphite**

TSXV: FMS

[focusgraphite.com/news/](https://www.google.com/search?q=https://focusgraphite.com/news/)

10

**Volt Carbon Tech**

TSXV: VCT

[voltcarbontech.com/news/](https://voltcarbontech.com/news/)

11

**Mason Graphite**

TSXV: LLG

[masongraphite.com/news/](https://www.google.com/search?q=https://masongraphite.com/news/)

12

**South Star Battery Metals**

TSXV: STS

[southstarbatterymetals.com/news/](https://www.google.com/search?q=https://www.southstarbatterymetals.com/news/)

13

**Giga Metals**

TSXV: GIGA

[gigametals.com/news/](https://www.gigametals.com/news/)

14

**Gratomic Inc.**

TSXV: GRAT

[gratomic.ca/news/](https://gratomic.ca/news/)

15

**International Graphite**

ASX: IG6

[internationalgraphite.com.au/news/](https://www.google.com/search?q=https://internationalgraphite.com.au/news/)

16

**Ceylon Graphite**

TSXV: CYL

[ceylongraphite.com/news/](https://www.ceylongraphite.com/news/)

17

**Sayona Mining**

ASX: SYA

[sayonamining.com.au/news/](https://www.google.com/search?q=https://sayonamining.com.au/news/)

18

**Eagle Graphite**

TSXV: EGA

[eaglegraphite.com/news/](https://www.google.com/search?q=https://eaglegraphite.com/news/)

19

**Metals Australia**

ASX: MLS

[metalsaustralia.com.au/news/](https://www.google.com/search?q=https://metalsaustralia.com.au/news/)

20

**Applied Graphite Tech**

TSXV: AGT

[appliedgraphite.com/news/](https://appliedgraphite.com/news/)

### **4\. Visual Dashboard Requirements (For Dev)**

To provide a "Comparison View" with First Canadian Graphite, the dashboard should include:

1.  **FCI Benchmarking Row:** A sticky header showing FCI’s latest stock price, market cap, and most recent drill result summary.
    
2.  **Competitor Matrix:** A table of the 20 companies above, sortable by:
    

*   _Sentiment:_ (Calculated by AI based on recent news—Positive/Neutral/Negative).
    
*   _Development Phase:_ (Exploration, PEA, Feasibility, Production).
    
*   _Revenue Status:_ (Pre-revenue vs. Producing).
    

1.  **Growth Heatmap:** A visual chart showing the volume of news releases per company over the last 30 days.
    

### **5\. Core Research Sources for Automation**

In addition to company sites, the daily and 3-day crons must scrape these hubs:

*   **Graphite Hub (Daily):** https://graphitehub.com/news/
    
*   **Investing News Network:** investingnews.com/graphite-investing/
    
*   **Mining.com:** mining.com/tag/graphite/
    
*   **SEDAR+:** sedarplus.ca (For official Canadian filings)
    

### **Summary for Development**

**Project Title:** FCI Competitive Intelligence Agent (CIA)

**Goal:** High-frequency monitoring of the graphite sector using 3 cron jobs.

**Key Task:** Ensure graphitehub.com/news/ is crawled daily with full-text extraction and LLM summarization.

**Output:** Structured HTML Email Reports and a Web Dashboard for visual comparison of 20 peers against First Canadian Graphite.

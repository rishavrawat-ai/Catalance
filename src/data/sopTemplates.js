export const SOP_TEMPLATES = {
  WEBSITE: {
    phases: [
      { id: "1", name: "Planning & Design", status: "in-progress", progress: 40 },
      { id: "2", name: "Development & Integrations", status: "pending", progress: 0 },
      { id: "3", name: "Content Integration & Testing", status: "pending", progress: 0 },
      { id: "4", name: "Launch & Post-Launch", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1
      { id: "1", title: "Define website goals and target audience", phase: "1", status: "completed" },
      { id: "2", title: "Create sitemap (main pages and navigation)", phase: "1", status: "completed" },
      { id: "3", title: "Collect design references and inspirations", phase: "1", status: "in-progress" },
      { id: "4", title: "Design wireframes and mockups for key pages", phase: "1", status: "pending" },
      { id: "5", title: "Finalize UI/UX, color palette, and typography", phase: "1", status: "pending" },
      // Phase 2
      { id: "6", title: "Set up hosting, domain, and SSL", phase: "2", status: "pending" },
      { id: "7", title: "Configure CMS/framework (e.g., WordPress or custom)", phase: "2", status: "pending" },
      { id: "8", title: "Develop responsive frontend (homepage + inner pages)", phase: "2", status: "pending" },
      { id: "9", title: "Set up backend, database, and required logic", phase: "2", status: "pending" },
      { id: "10", title: "Integrate forms, payment gateway, blog, chat, and APIs", phase: "2", status: "pending" },
      // Phase 3
      { id: "11", title: "Upload and format text, images, and media", phase: "3", status: "pending" },
      { id: "12", title: "Apply basic SEO (meta tags, titles, URLs, alt text)", phase: "3", status: "pending" },
      { id: "13", title: "Test all features: forms, payments, navigation, interactions", phase: "3", status: "pending" },
      { id: "14", title: "Check speed, mobile responsiveness, and cross-browser support", phase: "3", status: "pending" },
      // Phase 4
      { id: "15", title: "Share staging link for final client review", phase: "4", status: "pending" },
      { id: "16", title: "Deploy website to live server with SSL enabled", phase: "4", status: "pending" },
      { id: "17", title: "Get final approval and confirm go-live", phase: "4", status: "pending" },
      { id: "18", title: "Provide admin access, credentials, and documentation", phase: "4", status: "pending" },
      { id: "19", title: "Offer support and updates if included in the plan", phase: "4", status: "pending" }
    ]
  },
  APP: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Planning & Design", status: "pending", progress: 0 },
      { id: "3", name: "Development & Testing", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Support", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "a1", title: "Understand business goals and app purpose", phase: "1", status: "completed" },
      { id: "a2", title: "Identify target audience and use cases", phase: "1", status: "in-progress" },
      { id: "a3", title: "List core features (login, payments, notifications, etc.)", phase: "1", status: "pending" },
      { id: "a4", title: "Decide platforms: iOS, Android, or cross-platform", phase: "1", status: "pending" },
      { id: "a5", title: "Finalize scope, budget, and timeline", phase: "1", status: "pending" },
      // Phase 2: Planning & Design
      { id: "a6", title: "Create wireframes for user flow and screens", phase: "2", status: "pending" },
      { id: "a7", title: "Design UI/UX with brand colors, fonts, and components", phase: "2", status: "pending" },
      { id: "a8", title: "Share designs with client for feedback", phase: "2", status: "pending" },
      { id: "a9", title: "Revise and finalize designs for development", phase: "2", status: "pending" },
      // Phase 3: Development & Testing
      { id: "a10", title: "Build frontend screens and user interactions", phase: "3", status: "pending" },
      { id: "a11", title: "Develop backend (database, APIs, server logic)", phase: "3", status: "pending" },
      { id: "a12", title: "Integrate third-party services (payments, chat, analytics, push)", phase: "3", status: "pending" },
      { id: "a13", title: "Test for bugs, usability, performance, and device compatibility", phase: "3", status: "pending" },
      // Phase 4: Deployment & Support
      { id: "a14", title: "Share beta build for client testing and feedback", phase: "4", status: "pending" },
      { id: "a15", title: "Submit app to Google Play / Apple App Store", phase: "4", status: "pending" },
      { id: "a16", title: "Provide admin access, credentials, and documentation", phase: "4", status: "pending" },
      { id: "a17", title: "Offer ongoing support, updates, and bug fixes", phase: "4", status: "pending" }
    ]
  },
  SOFTWARE: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Planning & Design", status: "pending", progress: 0 },
      { id: "3", name: "Development & Testing", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Support", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "s1", title: "Understand business objectives and problems to solve", phase: "1", status: "completed" },
      { id: "s2", title: "Document requirements in an SRS (Software Requirement Specification)", phase: "1", status: "in-progress" },
      { id: "s3", title: "Select technologies (languages, frameworks, tools)", phase: "1", status: "pending" },
      { id: "s4", title: "Agree on scope, budget, and project timeline", phase: "1", status: "pending" },
      // Phase 2: Planning & Design
      { id: "s5", title: "Define system architecture and module breakdown", phase: "2", status: "pending" },
      { id: "s6", title: "Design database structure and workflows", phase: "2", status: "pending" },
      { id: "s7", title: "Create wireframes/UI for user-facing modules", phase: "2", status: "pending" },
      { id: "s8", title: "Build prototype (if needed) for early validation", phase: "2", status: "pending" },
      { id: "s9", title: "Get client approval on architecture and design", phase: "2", status: "pending" },
      // Phase 3: Development & Testing
      { id: "s10", title: "Develop modules (frontend + backend) in phases", phase: "3", status: "pending" },
      { id: "s11", title: "Integrate APIs, third-party tools, and internal systems", phase: "3", status: "pending" },
      { id: "s12", title: "Perform functional, performance, and security testing", phase: "3", status: "pending" },
      { id: "s13", title: "Share test build/staging link for client review and feedback", phase: "3", status: "pending" },
      // Phase 4: Deployment & Support
      { id: "s14", title: "Deploy software on server/cloud/client infrastructure", phase: "4", status: "pending" },
      { id: "s15", title: "Deliver final build with documentation and credentials", phase: "4", status: "pending" },
      { id: "s16", title: "Train client/team to use and manage the system", phase: "4", status: "pending" },
      { id: "s17", title: "Provide maintenance, patches, and feature updates", phase: "4", status: "pending" }
    ]
  },
  CYBERSECURITY: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Assessment & Planning", status: "pending", progress: 0 },
      { id: "3", name: "Implementation & Testing", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Ongoing Support", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "c1", title: "Understand business type, infrastructure, and security concerns", phase: "1", status: "completed" },
      { id: "c2", title: "Define scope: servers, apps, network, endpoints, data, etc.", phase: "1", status: "in-progress" },
      { id: "c3", title: "Identify required standards (ISO, GDPR, HIPAA, PCI-DSS, etc.)", phase: "1", status: "pending" },
      { id: "c4", title: "Finalize scope, engagement duration, and deliverables", phase: "1", status: "pending" },
      // Phase 2: Assessment & Planning
      { id: "c5", title: "Perform risk assessment of current infrastructure", phase: "2", status: "pending" },
      { id: "c6", title: "Map attack surfaces (network, web apps, APIs, users)", phase: "2", status: "pending" },
      { id: "c7", title: "Plan security activities: penetration tests, audits, monitoring", phase: "2", status: "pending" },
      { id: "c8", title: "Get client approval on approach and schedule", phase: "2", status: "pending" },
      // Phase 3: Implementation & Testing
      { id: "c9", title: "Conduct penetration testing to find exploitable weaknesses", phase: "3", status: "pending" },
      { id: "c10", title: "Run vulnerability scans using professional tools", phase: "3", status: "pending" },
      { id: "c11", title: "Recommend and/or implement firewalls, access controls, encryption", phase: "3", status: "pending" },
      { id: "c12", title: "Present findings and priorities to client", phase: "3", status: "pending" },
      // Phase 4: Reporting & Ongoing Support
      { id: "c13", title: "Provide a detailed vulnerability report with severity levels", phase: "4", status: "pending" },
      { id: "c14", title: "Share remediation recommendations and best practices", phase: "4", status: "pending" },
      { id: "c15", title: "Support client team in fixing identified issues", phase: "4", status: "pending" },
      { id: "c16", title: "Offer periodic scans, monitoring, and threat alerts", phase: "4", status: "pending" }
    ]
  },
  BRAND_STRATEGY: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Research & Insights", status: "pending", progress: 0 },
      { id: "3", name: "Strategy Development", status: "pending", progress: 0 },
      { id: "4", name: "Implementation & Monitoring", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "b1", title: "Understand business goals, mission, vision, and target audience", phase: "1", status: "completed" },
      { id: "b2", title: "Audit existing branding, positioning, and messaging", phase: "1", status: "in-progress" },
      { id: "b3", title: "Research competitors’ brand strategies and positioning", phase: "1", status: "pending" },
      { id: "b4", title: "Finalize scope, deliverables, timeline, and approval process", phase: "1", status: "pending" },
      // Phase 2: Research & Insights
      { id: "b5", title: "Study market trends, customer needs, and opportunities", phase: "2", status: "pending" },
      { id: "b6", title: "Define customer personas and behavior patterns", phase: "2", status: "pending" },
      { id: "b7", title: "Conduct SWOT analysis (strengths, weaknesses, opportunities, threats)", phase: "2", status: "pending" },
      { id: "b8", title: "Share insights with client and collect feedback", phase: "2", status: "pending" },
      // Phase 3: Strategy Development
      { id: "b9", title: "Define brand positioning and unique value proposition", phase: "3", status: "pending" },
      { id: "b10", title: "Define core brand message and key communication pillars", phase: "3", status: "pending" },
      { id: "b11", title: "Recommend visual identity (colors, fonts, logo style)", phase: "3", status: "pending" },
      { id: "b12", title: "Define verbal identity (tone of voice, vocabulary, messaging style)", phase: "3", status: "pending" },
      { id: "b13", title: "Plan content & marketing campaigns, channels, and messaging", phase: "3", status: "pending" },
      { id: "b14", title: "Present complete brand strategy and get client approval", phase: "3", status: "pending" },
      // Phase 4: Implementation & Monitoring
      { id: "b15", title: "Deliver brand guidelines/brand book for consistent use", phase: "4", status: "pending" },
      { id: "b16", title: "Support application of brand across marketing materials and channels", phase: "4", status: "pending" },
      { id: "b17", title: "Monitor brand performance and audience response", phase: "4", status: "pending" },
      { id: "b18", title: "Provide ongoing recommendations and updates as the market evolves", phase: "4", status: "pending" }
    ]
  },
  PUBLIC_RELATIONS: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Strategy & Planning", status: "pending", progress: 0 },
      { id: "3", name: "Execution & Outreach", status: "pending", progress: 0 },
      { id: "4", name: "Monitoring & Reporting", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "pr1", title: "Understand business goals, brand image, and target audience", phase: "1", status: "completed" },
      { id: "pr2", title: "Audit existing PR efforts: media coverage, press releases, online reputation", phase: "1", status: "in-progress" },
      { id: "pr3", title: "Define PR objectives (awareness, credibility, crisis management, etc.)", phase: "1", status: "pending" },
      { id: "pr4", title: "Finalize deliverables, timelines, channels, and reporting frequency", phase: "1", status: "pending" },
      // Phase 2: Strategy & Planning
      { id: "pr5", title: "Identify relevant media outlets, journalists, and influencers", phase: "2", status: "pending" },
      { id: "pr6", title: "Develop key messages, story angles, and brand tone", phase: "2", status: "pending" },
      { id: "pr7", title: "Create a PR campaign calendar (press releases, events, outreach)", phase: "2", status: "pending" },
      { id: "pr8", title: "Share strategy and content plan for client review and approval", phase: "2", status: "pending" },
      // Phase 3: Execution & Outreach
      { id: "pr9", title: "Create PR content: press releases, media kits, pitches, and articles", phase: "3", status: "pending" },
      { id: "pr10", title: "Distribute content to targeted journalists, media outlets, and influencers", phase: "3", status: "pending" },
      { id: "pr11", title: "Coordinate PR events, interviews, and collaborations", phase: "3", status: "pending" },
      { id: "pr12", title: "Provide regular updates and gather client feedback on live campaigns", phase: "3", status: "pending" },
      // Phase 4: Monitoring & Reporting
      { id: "pr13", title: "Track media coverage, mentions, and sentiment", phase: "4", status: "pending" },
      { id: "pr14", title: "Measure performance (reach, engagement, traffic, impact)", phase: "4", status: "pending" },
      { id: "pr15", title: "Share detailed PR reports with insights and recommendations", phase: "4", status: "pending" },
      { id: "pr16", title: "Optimize messaging and approach for future PR campaigns", phase: "4", status: "pending" }
    ]
  },
  SEO: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Strategy & Planning", status: "pending", progress: 0 },
      { id: "3", name: "Implementation & Optimization", status: "pending", progress: 0 },
      { id: "4", name: "Monitoring & Reporting", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "seo1", title: "Understand business goals, target audience, and current SEO performance", phase: "1", status: "completed" },
      { id: "seo2", title: "Audit website structure, content, backlinks, and technical health", phase: "1", status: "in-progress" },
      { id: "seo3", title: "Discuss target keywords, search intent, and key pages", phase: "1", status: "pending" },
      { id: "seo4", title: "Finalize deliverables, timelines, and reporting frequency", phase: "1", status: "pending" },
      // Phase 2: Strategy & Planning
      { id: "seo5", title: "Perform keyword research for primary and long-tail terms", phase: "2", status: "pending" },
      { id: "seo6", title: "Define on-page SEO strategy (meta tags, headers, internal links, content)", phase: "2", status: "pending" },
      { id: "seo7", title: "Define off-page SEO strategy (backlinks, guest posts, brand mentions)", phase: "2", status: "pending" },
      { id: "seo8", title: "Present SEO roadmap and get client approval before implementation", phase: "2", status: "pending" },
      // Phase 3: Implementation & Optimization
      { id: "seo9", title: "Apply on-page optimizations to key pages and new content", phase: "3", status: "pending" },
      { id: "seo10", title: "Fix technical SEO issues (crawl errors, sitemaps, redirects, structure)", phase: "3", status: "pending" },
      { id: "seo11", title: "Create SEO-focused content (blogs, landing pages, resources)", phase: "3", status: "pending" },
      { id: "seo12", title: "Share progress, get client feedback, and refine as needed", phase: "3", status: "pending" },
      // Phase 4: Monitoring & Reporting
      { id: "seo13", title: "Track keyword rankings, organic traffic, and conversions", phase: "4", status: "pending" },
      { id: "seo14", title: "Conduct regular mini-audits to find new issues and opportunities", phase: "4", status: "pending" },
      { id: "seo15", title: "Share weekly/monthly SEO reports with insights and action items", phase: "4", status: "pending" },
      { id: "seo16", title: "Continuously update strategy and optimizations based on data", phase: "4", status: "pending" }
    ]
  },
  SMO: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Strategy & Planning", status: "pending", progress: 0 },
      { id: "3", name: "Implementation & Optimization", status: "pending", progress: 0 },
      { id: "4", name: "Monitoring & Reporting", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "smo1", title: "Understand business goals, target audience, and social media presence", phase: "1", status: "completed" },
      { id: "smo2", title: "Audit current social profiles, content, engagement, and analytics", phase: "1", status: "in-progress" },
      { id: "smo3", title: "Define SMO objectives (growth, engagement, leads, conversions)", phase: "1", status: "pending" },
      { id: "smo4", title: "Finalize deliverables, timelines, and reporting schedule", phase: "1", status: "pending" },
      // Phase 2: Strategy & Planning
      { id: "smo5", title: "Select the most effective platforms for the target audience", phase: "2", status: "pending" },
      { id: "smo6", title: "Plan content strategy (post types, topics, formats, and frequency)", phase: "2", status: "pending" },
      { id: "smo7", title: "Define hashtag strategy and posting schedule", phase: "2", status: "pending" },
      { id: "smo8", title: "Plan profile optimization (bio, links, visuals, keywords)", phase: "2", status: "pending" },
      { id: "smo9", title: "Share strategy with client and get approval", phase: "2", status: "pending" },
      // Phase 3: Implementation & Optimization
      { id: "smo10", title: "Optimize profiles (profile picture, cover, bio, links, highlights)", phase: "3", status: "pending" },
      { id: "smo11", title: "Publish content according to the content calendar", phase: "3", status: "pending" },
      { id: "smo12", title: "Implement engagement tactics (CTAs, polls, replies, DMs, collaborations)", phase: "3", status: "pending" },
      { id: "smo13", title: "Share performance updates and apply client feedback", phase: "3", status: "pending" },
      // Phase 4: Monitoring & Reporting
      { id: "smo14", title: "Track engagement, reach, clicks, followers, and conversions", phase: "4", status: "pending" },
      { id: "smo15", title: "Analyze which content, formats, and times perform best", phase: "4", status: "pending" },
      { id: "smo16", title: "Share weekly/monthly reports with insights and next steps", phase: "4", status: "pending" },
      { id: "smo17", title: "Adjust strategy, visuals, and posting times for continuous improvement", phase: "4", status: "pending" }
    ]
  },
  LEAD_GENERATION: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Research & Strategy", status: "pending", progress: 0 },
      { id: "3", name: "Execution & Outreach", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Handover", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "lg1", title: "Understand client’s products, services, and unique selling points", phase: "1", status: "completed" },
      { id: "lg2", title: "Define ideal customer profile (industry, demographics, geography, job titles)", phase: "1", status: "in-progress" },
      { id: "lg3", title: "Set lead qualification criteria (budget, authority, need, timeline)", phase: "1", status: "pending" },
      { id: "lg4", title: "Finalize deliverables (lead count, platforms, tools), timeline, and revision policy", phase: "1", status: "pending" },
      // Phase 2: Research & Strategy
      { id: "lg5", title: "Analyze competitors, industry trends, and audience behavior", phase: "2", status: "pending" },
      { id: "lg6", title: "Select best lead generation channels (LinkedIn, email, social media, databases, ads)", phase: "2", status: "pending" },
      { id: "lg7", title: "Choose lead sourcing tools (e.g., Apollo, ZoomInfo, LinkedIn Sales Navigator)", phase: "2", status: "pending" },
      { id: "lg8", title: "Decide approach: organic outreach, paid ads, cold emailing, or mixed strategy", phase: "2", status: "pending" },
      // Phase 3: Execution & Outreach
      { id: "lg9", title: "Collect accurate contact details (name, email, phone, LinkedIn, company)", phase: "3", status: "pending" },
      { id: "lg10", title: "Prepare personalized email/DM scripts and outreach sequences", phase: "3", status: "pending" },
      { id: "lg11", title: "Run engagement campaigns with A/B testing across chosen platforms", phase: "3", status: "pending" },
      { id: "lg12", title: "Qualify leads and remove irrelevant contacts based on client criteria", phase: "3", status: "pending" },
      // Phase 4: Reporting & Handover
      { id: "lg13", title: "Track open rates, reply rates, conversions, and cost per lead", phase: "4", status: "pending" },
      { id: "lg14", title: "Share lead lists, campaign performance, and progress updates with client", phase: "4", status: "pending" },
      { id: "lg15", title: "Optimize targeting, messaging, and channels based on results and feedback", phase: "4", status: "pending" },
      { id: "lg16", title: "Deliver final list of qualified leads with documentation and recommendations", phase: "4", status: "pending" }
    ]
  },
  LEAD_QUALIFICATION: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Research & Data Collection", status: "pending", progress: 0 },
      { id: "3", name: "Qualification Process", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Handover", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "lq1", title: "Understand client’s sales goals and definition of a “high-value” lead", phase: "1", status: "completed" },
      { id: "lq2", title: "Define ideal customer profile (industry, company size, role, location)", phase: "1", status: "in-progress" },
      { id: "lq3", title: "Agree on qualification framework (e.g., BANT, CHAMP, or custom model)", phase: "1", status: "pending" },
      { id: "lq4", title: "Finalize deliverables (qualified list, scoring system, reporting format)", phase: "1", status: "pending" },
      // Phase 2: Research & Data Collection
      { id: "lq5", title: "Source raw leads from campaigns, databases, and outreach", phase: "2", status: "pending" },
      { id: "lq6", title: "Enrich data with verified emails, phone numbers, and company details", phase: "2", status: "pending" },
      { id: "lq7", title: "Segment leads by demographics, firmographics, and buyer stage", phase: "2", status: "pending" },
      { id: "lq8", title: "Perform initial screening to remove irrelevant or duplicate entries", phase: "2", status: "pending" },
      // Phase 3: Qualification Process
      { id: "lq9", title: "Score leads using agreed criteria (budget, authority, need, timeline, etc.)", phase: "3", status: "pending" },
      { id: "lq10", title: "Analyze behavior (email opens, replies, downloads, webinar attendance)", phase: "3", status: "pending" },
      { id: "lq11", title: "Verify accuracy via email/phone validation or LinkedIn cross-checks", phase: "3", status: "pending" },
      { id: "lq12", title: "Rank leads as Hot, Warm, or Cold for sales prioritization", phase: "3", status: "pending" },
      // Phase 4: Reporting & Handover
      { id: "lq13", title: "Provide detailed lead reports with scores, notes, and segments", phase: "4", status: "pending" },
      { id: "lq14", title: "Review lead quality with client and refine criteria if needed", phase: "4", status: "pending" },
      { id: "lq15", title: "Adjust qualification logic based on sales conversion feedback", phase: "4", status: "pending" },
      { id: "lq16", title: "Deliver final sales-ready lead list with supporting documentation", phase: "4", status: "pending" }
    ]
  },
  BUSINESS_LEADS: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Research & Lead Sourcing", status: "pending", progress: 0 },
      { id: "3", name: "Lead Verification & Qualification", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Delivery", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "bl1", title: "Understand client’s industry, offerings, and business goals", phase: "1", status: "completed" },
      { id: "bl2", title: "Define ideal customer profile (industry, company size, decision-makers)", phase: "1", status: "in-progress" },
      { id: "bl3", title: "Clarify required lead type: B2B, B2C, local, or international", phase: "1", status: "pending" },
      { id: "bl4", title: "Finalize deliverables (lead count, required data fields, quality checks, timeline)", phase: "1", status: "pending" },
      // Phase 2: Research & Lead Sourcing
      { id: "bl5", title: "Identify potential companies and decision-makers matching client goals", phase: "2", status: "pending" },
      { id: "bl6", title: "Use trusted tools/platforms (LinkedIn, Crunchbase, Apollo, ZoomInfo, etc.)", phase: "2", status: "pending" },
      { id: "bl7", title: "Collect contact details (name, email, phone, LinkedIn, company information)", phase: "2", status: "pending" },
      { id: "bl8", title: "Segment leads by relevance, industry, size, or geography", phase: "2", status: "pending" },
      // Phase 3: Lead Verification & Qualification
      { id: "bl9", title: "Clean data by removing duplicates and incorrect/incomplete entries", phase: "3", status: "pending" },
      { id: "bl10", title: "Verify email and phone validity using verification tools", phase: "3", status: "pending" },
      { id: "bl11", title: "Apply qualification criteria (e.g., BANT) to ensure fit", phase: "3", status: "pending" },
      { id: "bl12", title: "Categorize leads as Hot, Warm, or Cold for the client’s sales funnel", phase: "3", status: "pending" },
      // Phase 4: Reporting & Delivery
      { id: "bl13", title: "Compile leads into a clean, structured format (Excel, Google Sheets, or CRM)", phase: "4", status: "pending" },
      { id: "bl14", title: "Share sample data for client review and approval", phase: "4", status: "pending" },
      { id: "bl15", title: "Deliver final verified lead list with documentation", phase: "4", status: "pending" },
      { id: "bl16", title: "Provide post-delivery support for refinements or ongoing lead generation", phase: "4", status: "pending" }
    ]
  },
  CONTENT_MARKETING: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Strategy & Content Planning", status: "pending", progress: 0 },
      { id: "3", name: "Content Creation & Distribution", status: "pending", progress: 0 },
      { id: "4", name: "Lead Nurturing & Reporting", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "cm1", title: "Understand client’s goals (brand awareness, inbound leads, nurturing)", phase: "1", status: "completed" },
      { id: "cm2", title: "Define buyer personas, industries, and key pain points", phase: "1", status: "in-progress" },
      { id: "cm3", title: "Decide content formats (blogs, case studies, ebooks, videos, infographics, etc.)", phase: "1", status: "pending" },
      { id: "cm4", title: "Confirm deliverables, platforms, timeline, and KPIs", phase: "1", status: "pending" },
      // Phase 2: Strategy & Content Planning
      { id: "cm5", title: "Audit existing content to identify gaps and opportunities", phase: "2", status: "pending" },
      { id: "cm6", title: "Conduct keyword and topic research aligned with buyer intent", phase: "2", status: "pending" },
      { id: "cm7", title: "Build a content calendar for consistent publishing", phase: "2", status: "pending" },
      { id: "cm8", title: "Plan lead magnets (ebooks, whitepapers, webinars, checklists) for lead capture", phase: "2", status: "pending" },
      // Phase 3: Content Creation & Distribution
      { id: "cm9", title: "Create high-quality content tailored to each audience segment", phase: "3", status: "pending" },
      { id: "cm10", title: "Optimize content for SEO (keywords, meta tags, on-page elements)", phase: "3", status: "pending" },
      { id: "cm11", title: "Distribute content via website, social media, email, and ads", phase: "3", status: "pending" },
      { id: "cm12", title: "Use CTAs and landing pages with forms to convert visitors into leads", phase: "3", status: "pending" },
      // Phase 4: Lead Nurturing & Reporting
      { id: "cm13", title: "Track engagement (clicks, downloads, sign-ups, conversions)", phase: "4", status: "pending" },
      { id: "cm14", title: "Score leads based on engagement level and customer fit", phase: "4", status: "pending" },
      { id: "cm15", title: "Share performance reports (traffic, leads, conversion rates) with insights", phase: "4", status: "pending" },
      { id: "cm16", title: "Refine content topics, formats, and channels based on results and feedback", phase: "4", status: "pending" }
    ]
  },
  SOCIAL_MEDIA_LEAD_GEN: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Strategy & Campaign Planning", status: "pending", progress: 0 },
      { id: "3", name: "Execution & Lead Capture", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Optimization", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "smlg1", title: "Understand client’s lead generation goals (sales, bookings, sign-ups, consultations)", phase: "1", status: "completed" },
      { id: "smlg2", title: "Define target audience (demographics, interests, industries, platforms)", phase: "1", status: "in-progress" },
      { id: "smlg3", title: "Align offers (discounts, free trials, ebooks, webinars, demos) with audience needs", phase: "1", status: "pending" },
      { id: "smlg4", title: "Confirm deliverables (ad campaigns, organic posts, lead forms), KPIs, and timeline", phase: "1", status: "pending" },
      // Phase 2: Strategy & Campaign Planning
      { id: "smlg5", title: "Select platforms (Facebook, Instagram, LinkedIn, X/Twitter, etc.) based on audience", phase: "2", status: "pending" },
      { id: "smlg6", title: "Plan content strategy: creatives, copy, and formats (posts, reels, stories, carousels, ads)", phase: "2", status: "pending" },
      { id: "smlg7", title: "Design lead magnets or offers (guides, demos, free calls, events)", phase: "2", status: "pending" },
      { id: "smlg8", title: "Define ad strategy (lead form ads, conversion ads) and organic engagement approach", phase: "2", status: "pending" },
      // Phase 3: Execution & Lead Capture
      { id: "smlg9", title: "Set up and launch targeted paid campaigns and/or organic promotions", phase: "3", status: "pending" },
      { id: "smlg10", title: "Publish consistent, conversion-focused content across chosen platforms", phase: "3", status: "pending" },
      { id: "smlg11", title: "Integrate lead forms (native lead ads or landing pages)", phase: "3", status: "pending" },
      { id: "smlg12", title: "Respond to comments, messages, and inquiries to capture and warm up leads", phase: "3", status: "pending" },
      // Phase 4: Reporting & Optimization
      { id: "smlg13", title: "Track leads, cost per lead (CPL), and lead quality", phase: "4", status: "pending" },
      { id: "smlg14", title: "Share regular reports and validate lead quality with client", phase: "4", status: "pending" },
      { id: "smlg15", title: "Run A/B tests on creatives, copy, targeting, and formats", phase: "4", status: "pending" },
      { id: "smlg16", title: "Optimize campaigns and deliver final qualified lead lists with recommendations", phase: "4", status: "pending" }
    ]
  },
  CUSTOMER_SUPPORT: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Planning & Setup", status: "pending", progress: 0 },
      { id: "3", name: "Support Operations", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Continuous Improvement", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "cs1", title: "Understand client’s business, customer support needs, and goals", phase: "1", status: "completed" },
      { id: "cs2", title: "Get access to CRM, support tools, FAQs, and product/service information", phase: "1", status: "in-progress" },
      { id: "cs3", title: "Define support channels: email, chat, phone, social media, or multi-channel", phase: "1", status: "pending" },
      { id: "cs4", title: "Finalize working hours, deliverables, SLAs/response times, and escalation flow", phase: "1", status: "pending" },
      // Phase 2: Planning & Setup
      { id: "cs5", title: "Design support workflows for inquiries, complaints, and escalations", phase: "2", status: "pending" },
      { id: "cs6", title: "Prepare and organize knowledge base (FAQs, templates, canned responses)", phase: "2", status: "pending" },
      { id: "cs7", title: "Configure tools: ticketing system, live chat, chatbot, CRM integrations, etc.", phase: "2", status: "pending" },
      { id: "cs8", title: "Share workflows and setup with client for review and approval before launch", phase: "2", status: "pending" },
      // Phase 3: Support Operations
      { id: "cs9", title: "Handle customer queries quickly, politely, and professionally", phase: "3", status: "pending" },
      { id: "cs10", title: "Log, track, and resolve issues within agreed timelines", phase: "3", status: "pending" },
      { id: "cs11", title: "Escalate complex or critical cases to the right internal teams", phase: "3", status: "pending" },
      { id: "cs12", title: "Capture and apply client and customer feedback to improve support quality", phase: "3", status: "pending" },
      // Phase 4: Reporting & Continuous Improvement
      { id: "cs13", title: "Share performance reports (response time, resolution rate, CSAT, NPS, etc.)", phase: "4", status: "pending" },
      { id: "cs14", title: "Analyze recurring issues and recommend process or product improvements", phase: "4", status: "pending" },
      { id: "cs15", title: "Provide regular updates and suggestions for optimizing support operations", phase: "4", status: "pending" },
      { id: "cs16", title: "Offer ongoing support, training, and updates as client needs evolve", phase: "4", status: "pending" }
    ]
  },
  TECHNICAL_SUPPORT: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Planning & Setup", status: "pending", progress: 0 },
      { id: "3", name: "Support Operations", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Continuous Improvement", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "ts1", title: "Understand client’s technical environment, systems, and support objectives", phase: "1", status: "completed" },
      { id: "ts2", title: "Get access to software, hardware, network, documentation, and manuals", phase: "1", status: "in-progress" },
      { id: "ts3", title: "Define scope of support: hardware, software, network, IT infrastructure, or mixed", phase: "1", status: "pending" },
      { id: "ts4", title: "Finalize SLAs (response and resolution times), working hours, and escalation levels", phase: "1", status: "pending" },
      // Phase 2: Planning & Setup
      { id: "ts5", title: "Design standard workflows for ticket logging, prioritization, and resolution", phase: "2", status: "pending" },
      { id: "ts6", title: "Configure tools: helpdesk/ticketing, remote access, monitoring, alerting, etc.", phase: "2", status: "pending" },
      { id: "ts7", title: "Build and organize technical knowledge base (troubleshooting guides, SOPs, FAQs)", phase: "2", status: "pending" },
      { id: "ts8", title: "Share processes and setup with client for review and approval before going live", phase: "2", status: "pending" },
      // Phase 3: Support Operations
      { id: "ts9", title: "Respond to technical issues promptly and professionally", phase: "3", status: "pending" },
      { id: "ts10", title: "Diagnose problems, apply fixes, and document resolutions", phase: "3", status: "pending" },
      { id: "ts11", title: "Escalate complex or high-impact issues to senior engineers or specialists", phase: "3", status: "pending" },
      { id: "ts12", title: "Collect client feedback to refine workflows and improve documentation", phase: "3", status: "pending" },
      // Phase 4: Reporting & Continuous Improvement
      { id: "ts13", title: "Track and report KPIs (resolution time, downtime, ticket volume, reopen rate)", phase: "4", status: "pending" },
      { id: "ts14", title: "Identify recurring or critical issues and suggest preventive solutions", phase: "4", status: "pending" },
      { id: "ts15", title: "Provide regular updates and recommendations for system and process improvements", phase: "4", status: "pending" },
      { id: "ts16", title: "Deliver ongoing technical support, updates, and training as required", phase: "4", status: "pending" }
    ]
  },
  PROJECT_MANAGEMENT: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Planning & Scheduling", status: "pending", progress: 0 },
      { id: "3", name: "Execution & Monitoring", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Project Closure", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "pm1", title: "Understand project goals, deliverables, timeline, and key stakeholders", phase: "1", status: "completed" },
      { id: "pm2", title: "Define project scope: phases, tasks, milestones, and responsibilities", phase: "1", status: "in-progress" },
      { id: "pm3", title: "Collect all relevant documents, tools, and team details", phase: "1", status: "pending" },
      { id: "pm4", title: "Finalize project plan, deliverables, reporting workflow, and approval process", phase: "1", status: "pending" },
      // Phase 2: Planning & Scheduling
      { id: "pm5", title: "Create a detailed project roadmap with tasks, dependencies, and milestones", phase: "2", status: "pending" },
      { id: "pm6", title: "Allocate resources: assign roles, responsibilities, and tools to team members", phase: "2", status: "pending" },
      { id: "pm7", title: "Estimate timelines and budget for each phase and task", phase: "2", status: "pending" },
      { id: "pm8", title: "Share the project plan with the client and get formal approval", phase: "2", status: "pending" },
      // Phase 3: Execution & Monitoring
      { id: "pm9", title: "Manage and track task completion and overall project progress", phase: "3", status: "pending" },
      { id: "pm10", title: "Maintain clear communication and coordination with all stakeholders", phase: "3", status: "pending" },
      { id: "pm11", title: "Identify, document, and resolve risks, issues, and bottlenecks", phase: "3", status: "pending" },
      { id: "pm12", title: "Adjust plans based on feedback from the client and team", phase: "3", status: "pending" },
      // Phase 4: Reporting & Project Closure
      { id: "pm13", title: "Provide regular status reports on progress, milestones, and KPIs", phase: "4", status: "pending" },
      { id: "pm14", title: "Deliver final outputs ensuring they meet agreed quality standards", phase: "4", status: "pending" },
      { id: "pm15", title: "Conduct post-project analysis and document lessons learned", phase: "4", status: "pending" },
      { id: "pm16", title: "Offer ongoing support, maintenance, or follow-up assistance if required", phase: "4", status: "pending" }
    ]
  },
  DATA_ENTRY: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Planning & Setup", status: "pending", progress: 0 },
      { id: "3", name: "Data Entry & Verification", status: "pending", progress: 0 },
      { id: "4", name: "Delivery & Support", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "de1", title: "Understand data type, volume, and required output format", phase: "1", status: "completed" },
      { id: "de2", title: "Receive data sources (files, databases, scanned docs, etc.) from client", phase: "1", status: "in-progress" },
      { id: "de3", title: "Define data entry type: manual input, spreadsheet, CRM, or database updates", phase: "1", status: "pending" },
      { id: "de4", title: "Finalize timeline, deliverables, accuracy standards, and approval workflow", phase: "1", status: "pending" },
      // Phase 2: Planning & Setup
      { id: "de5", title: "Prepare templates and formats (spreadsheets, forms, databases)", phase: "2", status: "pending" },
      { id: "de6", title: "Ensure required software, accounts, and platforms are accessible", phase: "2", status: "pending" },
      { id: "de7", title: "Prioritize tasks based on urgency, category, or client preference", phase: "2", status: "pending" },
      { id: "de8", title: "Get client approval on templates, formats, and workflow before starting", phase: "2", status: "pending" },
      // Phase 3: Data Entry & Verification
      { id: "de9", title: "Enter data accurately and systematically into assigned platforms", phase: "3", status: "pending" },
      { id: "de10", title: "Validate entries for errors, duplicates, and missing information", phase: "3", status: "pending" },
      { id: "de11", title: "Share interim progress with client if needed for review", phase: "3", status: "pending" },
      { id: "de12", title: "Correct and update data based on quality checks and client feedback", phase: "3", status: "pending" },
      // Phase 4: Delivery & Support
      { id: "de13", title: "Deliver final datasets in agreed formats (Excel, CSV, Google Sheets, etc.)", phase: "4", status: "pending" },
      { id: "de14", title: "Maintain records of entered data and any modifications made", phase: "4", status: "pending" },
      { id: "de15", title: "Provide a summary of completed volume, issues, and error corrections", phase: "4", status: "pending" },
      { id: "de16", title: "Offer post-delivery support for minor updates and additional tasks", phase: "4", status: "pending" }
    ]
  },
  TRANSCRIPTION: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Planning & Setup", status: "pending", progress: 0 },
      { id: "3", name: "Transcription & Review", status: "pending", progress: 0 },
      { id: "4", name: "Delivery & Support", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "tr1", title: "Understand transcription type: audio/video, interviews, podcasts, meetings, etc.", phase: "1", status: "completed" },
      { id: "tr2", title: "Receive audio/video files and reference materials from client", phase: "1", status: "in-progress" },
      { id: "tr3", title: "Define scope: turnaround time, format, timestamps, speaker labels, accuracy level", phase: "1", status: "pending" },
      { id: "tr4", title: "Finalize timeline, deliverables, revisions, and approval workflow", phase: "1", status: "pending" },
      // Phase 2: Planning & Setup
      { id: "tr5", title: "Set up transcription tools: software, foot pedals, text editors, etc.", phase: "2", status: "pending" },
      { id: "tr6", title: "Check audio/video quality and note any potential challenges (noise, accents)", phase: "2", status: "pending" },
      { id: "tr7", title: "Prepare document templates with headings, speaker labels, and timestamp rules", phase: "2", status: "pending" },
      { id: "tr8", title: "Get client approval on format and workflow before starting", phase: "2", status: "pending" },
      // Phase 3: Transcription & Review
      { id: "tr9", title: "Transcribe audio/video to text accurately, preserving context and clarity", phase: "3", status: "pending" },
      { id: "tr10", title: "Add timestamps and identify speakers correctly if requested", phase: "3", status: "pending" },
      { id: "tr11", title: "Proofread and perform quality checks for grammar and completeness", phase: "3", status: "pending" },
      { id: "tr12", title: "Share draft transcripts (if required) and incorporate client changes", phase: "3", status: "pending" },
      // Phase 4: Delivery & Support
      { id: "tr13", title: "Deliver final transcripts in agreed formats (Word, PDF, text, etc.)", phase: "4", status: "pending" },
      { id: "tr14", title: "Maintain organized records of transcription files and revision history", phase: "4", status: "pending" },
      { id: "tr15", title: "Provide optional summary or key points if requested by the client", phase: "4", status: "pending" },
      { id: "tr16", title: "Offer post-delivery support for minor edits and additional transcription", phase: "4", status: "pending" }
    ]
  },
  TRANSLATION: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Planning & Preparation", status: "pending", progress: 0 },
      { id: "3", name: "Translation & Review", status: "pending", progress: 0 },
      { id: "4", name: "Delivery & Support", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "tl1", title: "Understand content type, target language(s), and purpose (marketing, legal, internal, etc.)", phase: "1", status: "completed" },
      { id: "tl2", title: "Receive source materials (text, documents, multimedia) from client", phase: "1", status: "in-progress" },
      { id: "tl3", title: "Define scope: word count, format, style guide, turnaround time", phase: "1", status: "pending" },
      { id: "tl4", title: "Finalize timeline, deliverables, revision policy, and approval workflow", phase: "1", status: "pending" },
      // Phase 2: Planning & Preparation
      { id: "tl5", title: "Prepare terminology list, glossary, and brand-specific vocabulary", phase: "2", status: "pending" },
      { id: "tl6", title: "Set up translation tools (CAT tools, dictionaries, reference materials)", phase: "2", status: "pending" },
      { id: "tl7", title: "Ensure formatting and templates preserve layout, headings, and structure", phase: "2", status: "pending" },
      { id: "tl8", title: "Get client approval on approach, glossary, and format before translation", phase: "2", status: "pending" },
      // Phase 3: Translation & Review
      { id: "tl9", title: "Translate content accurately while preserving meaning, tone, and context", phase: "3", status: "pending" },
      { id: "tl10", title: "Edit and proofread for grammar, style, and cultural relevance", phase: "3", status: "pending" },
      { id: "tl11", title: "Share draft versions for client feedback if required", phase: "3", status: "pending" },
      { id: "tl12", title: "Perform final quality assurance to ensure consistency and terminology accuracy", phase: "3", status: "pending" },
      // Phase 4: Delivery & Support
      { id: "tl13", title: "Deliver translated content in agreed formats (Word, PDF, subtitles, etc.)", phase: "4", status: "pending" },
      { id: "tl14", title: "Maintain records of translations, glossaries, and revisions", phase: "4", status: "pending" },
      { id: "tl15", title: "Optionally provide summary or localization notes if requested", phase: "4", status: "pending" },
      { id: "tl16", title: "Offer post-delivery support for minor edits and additional translation needs", phase: "4", status: "pending" }
    ]
  },
  TUTORING: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Planning & Curriculum Design", status: "pending", progress: 0 },
      { id: "3", name: "Tutoring Sessions", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Support", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "tu1", title: "Understand student goals, grade level, subjects, and learning preferences", phase: "1", status: "completed" },
      { id: "tu2", title: "Assess current knowledge, strengths, and weaknesses", phase: "1", status: "in-progress" },
      { id: "tu3", title: "Define scope: subjects, topics, number of sessions, and session duration", phase: "1", status: "pending" },
      { id: "tu4", title: "Finalize schedule, fees, teaching approach, and progress reporting method", phase: "1", status: "pending" },
      // Phase 2: Planning & Curriculum Design
      { id: "tu5", title: "Create structured lesson plans with clear learning outcomes", phase: "2", status: "pending" },
      { id: "tu6", title: "Prepare resources (textbooks, worksheets, videos, digital tools)", phase: "2", status: "pending" },
      { id: "tu7", title: "Customize lessons based on student’s learning style and pace", phase: "2", status: "pending" },
      { id: "tu8", title: "Share plan and sample materials with client/student for feedback and approval", phase: "2", status: "pending" },
      // Phase 3: Tutoring Sessions
      { id: "tu9", title: "Deliver lessons as per plan (online or offline)", phase: "3", status: "pending" },
      { id: "tu10", title: "Use interactive methods: exercises, quizzes, discussions, and examples", phase: "3", status: "pending" },
      { id: "tu11", title: "Check understanding through assignments, mini-tests, or quick assessments", phase: "3", status: "pending" },
      { id: "tu12", title: "Adjust teaching style and difficulty level based on performance and feedback", phase: "3", status: "pending" },
      // Phase 4: Reporting & Support
      { id: "tu13", title: "Provide regular progress reports highlighting strengths and improvement areas", phase: "4", status: "pending" },
      { id: "tu14", title: "Recommend additional resources and study methods for self-practice", phase: "4", status: "pending" },
      { id: "tu15", title: "Offer doubt-clearing and extra help outside regular sessions (as agreed)", phase: "4", status: "pending" },
      { id: "tu16", title: "Plan future sessions and update curriculum as the student advances", phase: "4", status: "pending" }
    ]
  },
  COACHING: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Planning & Strategy", status: "pending", progress: 0 },
      { id: "3", name: "Coaching Sessions", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Support", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "co1", title: "Understand client goals, challenges, and desired outcomes", phase: "1", status: "completed" },
      { id: "co2", title: "Assess current situation: skills, mindset, performance, or behavior baseline", phase: "1", status: "in-progress" },
      { id: "co3", title: "Define coaching focus (career, life, business, health, personal development, etc.)", phase: "1", status: "pending" },
      { id: "co4", title: "Finalize session frequency, duration, deliverables, and overall engagement terms", phase: "1", status: "pending" },
      // Phase 2: Planning & Strategy
      { id: "co5", title: "Set clear, measurable goals for the coaching program", phase: "2", status: "pending" },
      { id: "co6", title: "Develop an action plan with steps, exercises, and milestones", phase: "2", status: "pending" },
      { id: "co7", title: "Prepare tools and resources (worksheets, templates, frameworks, digital materials)", phase: "2", status: "pending" },
      { id: "co8", title: "Share plan with client for alignment and approval before starting sessions", phase: "2", status: "pending" },
      // Phase 3: Coaching Sessions
      { id: "co9", title: "Conduct one-on-one or group sessions according to the agreed plan", phase: "3", status: "pending" },
      { id: "co10", title: "Use discussions, exercises, reflections, and real-life scenarios", phase: "3", status: "pending" },
      { id: "co11", title: "Monitor progress and track changes in behavior, performance, or results", phase: "3", status: "pending" },
      { id: "co12", title: "Refine coaching techniques based on client feedback and progress", phase: "3", status: "pending" },
      // Phase 4: Reporting & Support
      { id: "co13", title: "Provide periodic progress updates, highlighting achievements and challenges", phase: "4", status: "pending" },
      { id: "co14", title: "Recommend practices, habits, and exercises for continued growth", phase: "4", status: "pending" },
      { id: "co15", title: "Offer follow-up support or check-ins between sessions (as agreed)", phase: "4", status: "pending" },
      { id: "co16", title: "Plan next phase of coaching and adjust strategies as needed", phase: "4", status: "pending" }
    ]
  },
  COURSE_DEVELOPMENT: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Planning & Curriculum Design", status: "pending", progress: 0 },
      { id: "3", name: "Content Creation & Development", status: "pending", progress: 0 },
      { id: "4", name: "Delivery & Support", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "cd1", title: "Understand course objectives, target audience, and desired learning outcomes", phase: "1", status: "completed" },
      { id: "cd2", title: "Collect existing materials, references, and key topics from client", phase: "1", status: "in-progress" },
      { id: "cd3", title: "Define course format (video, PDF, slides, interactive modules), length, and lesson count", phase: "1", status: "pending" },
      { id: "cd4", title: "Finalize timeline, deliverables, revision rounds, and approval process", phase: "1", status: "pending" },
      // Phase 2: Planning & Curriculum Design
      { id: "cd5", title: "Create a detailed course outline with modules, lessons, and assessments", phase: "2", status: "pending" },
      { id: "cd6", title: "Plan learning materials (videos, PDFs, worksheets, quizzes, activities)", phase: "2", status: "pending" },
      { id: "cd7", title: "Decide instructional strategy (teaching methods, pacing, interaction level)", phase: "2", status: "pending" },
      { id: "cd8", title: "Share outline and plan with client for review and approval before development", phase: "2", status: "pending" },
      // Phase 3: Content Creation & Development
      { id: "cd9", title: "Develop lessons (scripts, slides, videos, PDFs, interactive content)", phase: "3", status: "pending" },
      { id: "cd10", title: "Integrate graphics, visuals, quizzes, and exercises to improve engagement", phase: "3", status: "pending" },
      { id: "cd11", title: "Revise content based on client feedback and suggestions", phase: "3", status: "pending" },
      { id: "cd12", title: "Perform internal quality checks for clarity, accuracy, and learning alignment", phase: "3", status: "pending" },
      // Phase 4: Delivery & Support
      { id: "cd13", title: "Obtain final client approval on all course materials", phase: "4", status: "pending" },
      { id: "cd14", title: "Deploy course on LMS, website, or chosen platform", phase: "4", status: "pending" },
      { id: "cd15", title: "Provide learner support materials (guides, FAQs, instructions)", phase: "4", status: "pending" },
      { id: "cd16", title: "Offer post-delivery support for updates, revisions, or additional modules", phase: "4", status: "pending" }
    ]
  },
  LEGAL_CONSULTING: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Research & Analysis", status: "pending", progress: 0 },
      { id: "3", name: "Strategy & Advisory", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Support", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "lc1", title: "Understand client’s legal needs, business context, and objectives", phase: "1", status: "completed" },
      { id: "lc2", title: "Collect relevant documents: contracts, agreements, policies, and legal correspondence", phase: "1", status: "in-progress" },
      { id: "lc3", title: "Define scope of work: legal advice, contract review, compliance, or representation", phase: "1", status: "pending" },
      { id: "lc4", title: "Finalize deliverables, timelines, fees, and approval workflow", phase: "1", status: "pending" },
      // Phase 2: Research & Analysis
      { id: "lc5", title: "Review contracts, documents, and applicable laws/regulations", phase: "2", status: "pending" },
      { id: "lc6", title: "Identify legal risks, liabilities, gaps, and areas of non-compliance", phase: "2", status: "pending" },
      { id: "lc7", title: "Check compliance with relevant laws, regulations, and industry standards", phase: "2", status: "pending" },
      { id: "lc8", title: "Share preliminary findings with client and gather feedback", phase: "2", status: "pending" },
      // Phase 3: Strategy & Advisory
      { id: "lc9", title: "Provide clear, actionable legal recommendations and risk mitigation steps", phase: "3", status: "pending" },
      { id: "lc10", title: "Draft or revise contracts, agreements, legal notices, and related documents", phase: "3", status: "pending" },
      { id: "lc11", title: "Guide client on implementing legal changes or strategies", phase: "3", status: "pending" },
      { id: "lc12", title: "Review and finalize documents and strategies with client approval", phase: "3", status: "pending" },
      // Phase 4: Reporting & Support
      { id: "lc13", title: "Deliver finalized contracts, legal reports, and advisory notes", phase: "4", status: "pending" },
      { id: "lc14", title: "Maintain organized records of documents, advice, and communications", phase: "4", status: "pending" },
      { id: "lc15", title: "Offer follow-up assistance for clarifications, disputes, or amendments", phase: "4", status: "pending" },
      { id: "lc16", title: "Provide ongoing consultation and periodic legal checkups as required", phase: "4", status: "pending" }
    ]
  },
  IP_SERVICES: {
    phases: [
      { id: "1", name: "Requirement Gathering", status: "in-progress", progress: 20 },
      { id: "2", name: "Research & Planning", status: "pending", progress: 0 },
      { id: "3", name: "Filing & Protection", status: "pending", progress: 0 },
      { id: "4", name: "Post-Filing Support", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1: Requirement Gathering
      { id: "ip1", title: "Understand the type of IP: trademark, copyright, patent, design, etc.", phase: "1", status: "completed" },
      { id: "ip2", title: "Clarify client’s objectives: protection, registration, enforcement, or licensing", phase: "1", status: "in-progress" },
      { id: "ip3", title: "Collect IP assets: logos, creative works, inventions, brand names, designs", phase: "1", status: "pending" },
      { id: "ip4", title: "Finalize deliverables, timelines, fees, and approval workflow", phase: "1", status: "pending" },
      // Phase 2: Research & Planning
      { id: "ip5", title: "Conduct prior art/trademark searches to check originality and conflicts", phase: "2", status: "pending" },
      { id: "ip6", title: "Develop IP strategy: protection type, jurisdictions, and filing roadmap", phase: "2", status: "pending" },
      { id: "ip7", title: "Ensure alignment with applicable IP laws and regulations", phase: "2", status: "pending" },
      { id: "ip8", title: "Share findings and proposed strategy with client for validation and approval", phase: "2", status: "pending" },
      // Phase 3: Filing & Protection
      { id: "ip9", title: "Prepare applications, supporting documents, and related agreements", phase: "3", status: "pending" },
      { id: "ip10", title: "File IP applications with the relevant authorities or registries", phase: "3", status: "pending" },
      { id: "ip11", title: "Monitor application status, deadlines, office actions, and oppositions", phase: "3", status: "pending" },
      { id: "ip12", title: "Keep client updated on progress, responses needed, and next steps", phase: "3", status: "pending" },
      // Phase 4: Post-Filing Support
      { id: "ip13", title: "Manage IP portfolio, including renewals, records, and documentation", phase: "4", status: "pending" },
      { id: "ip14", title: "Support enforcement actions for infringement, misuse, or disputes", phase: "4", status: "pending" },
      { id: "ip15", title: "Provide periodic reports on IP status, changes, and asset value", phase: "4", status: "pending" },
      { id: "ip16", title: "Advise on future IP strategy, expansion, and new registrations", phase: "4", status: "pending" }
    ]
  }
};

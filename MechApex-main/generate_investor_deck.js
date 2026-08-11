const pptxgen = require('pptxgenjs');

async function buildInvestorDeck() {
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'MechApex Leadership';
  pptx.company = 'MechApex Technologies';
  pptx.title = 'MechApex Investor Demo Presentation';

  // --- Light Theme Palette ---
  const LIGHT_BG = 'F8FAFC';       // Slate 50
  const CARD_BG = 'FFFFFF';        // Pure White
  const CARD_BORDER = 'E2E8F0';    // Slate 200
  const PRIMARY = '2563EB';        // Royal Blue
  const PRIMARY_DARK = '1E40AF';   // Dark Blue
  const EMERALD = '059669';        // Emerald Green
  const AMBER = 'D97706';          // Amber / Gold
  const TEXT_MAIN = '0F172A';      // Slate 900
  const TEXT_MUTED = '475569';     // Slate 600
  const LIGHT_ACCENT = 'EFF6FF';   // Very Light Blue Tint

  // Helper: Slide Master Header (Light Theme)
  function addHeader(slide, title, subtitle) {
    slide.addText(title, {
      x: 0.8, y: 0.4, w: 11.5, h: 0.6,
      fontSize: 26, bold: true, color: PRIMARY_DARK, fontFace: 'Trebuchet MS'
    });
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8, y: 1.0, w: 11.5, h: 0.4,
        fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
      });
    }
  }

  // ==========================================
  // SLIDE 1: Title Slide (Investor Deck)
  // ==========================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: LIGHT_BG };

  // Decorative Accent bar top
  slide1.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.33, h: 0.15, fill: { color: PRIMARY }
  });

  slide1.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 1.2, w: 3.2, h: 0.4,
    fill: { color: LIGHT_ACCENT }, line: { color: PRIMARY, width: 1 }, rectRadius: 0.05
  });
  slide1.addText('INVESTOR PRESENTATION DECK', {
    x: 0.8, y: 1.2, w: 3.2, h: 0.4,
    fontSize: 11, bold: true, color: PRIMARY, align: 'center', fontFace: 'Arial'
  });

  slide1.addText('MechApex OS', {
    x: 0.8, y: 1.9, w: 11, h: 1.1,
    fontSize: 54, bold: true, color: TEXT_MAIN, fontFace: 'Trebuchet MS'
  });
  slide1.addText('Digitizing the $25B Unorganized Auto Aftermarket', {
    x: 0.8, y: 3.1, w: 11, h: 0.6,
    fontSize: 22, bold: true, color: PRIMARY, fontFace: 'Arial'
  });

  // Summary Card
  slide1.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 4.0, w: 11.73, h: 2.7,
    fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08
  });

  slide1.addText([
    { text: '• Problem: ', options: { bold: true, color: PRIMARY, fontSize: 16 } },
    { text: '1.2M+ Independent Workshops in India lose 10% revenue to manual paper friction & unbilled labor.\n\n', options: { color: TEXT_MUTED, fontSize: 16 } },
    { text: '• Solution: ', options: { bold: true, color: EMERALD, fontSize: 16 } },
    { text: 'Mobile & Web Workshop Operating System with 30s Job Cards & 1-Click WhatsApp Approvals.\n\n', options: { color: TEXT_MUTED, fontSize: 16 } },
    { text: '• Traction: ', options: { bold: true, color: AMBER, fontSize: 16 } },
    { text: '500+ Active Workshops • 150,000+ Job Cards Processed • High Retention SaaS Unit Economics.', options: { color: TEXT_MUTED, fontSize: 16 } }
  ], { x: 1.2, y: 4.3, w: 11.0, h: 2.2, fontFace: 'Arial' });


  // ==========================================
  // SLIDE 2: Market Opportunity (TAM / SAM / SOM)
  // ==========================================
  const slide2 = pptx.addSlide();
  slide2.background = { color: LIGHT_BG };
  addHeader(slide2, 'Market Opportunity (TAM / SAM / SOM)', 'Massive underserved market in India & emerging automotive hubs');

  const marketData = [
    { title: 'TAM — $25 Billion', tag: 'Total Addressable Market', desc: 'Indian & SEA Automotive Service & Spares Market by 2028.' },
    { title: 'SAM — $4.2 Billion', tag: 'Serviceable Market', desc: 'Independent 2-Wheeler & 4-Wheeler Garages needing digital software.' },
    { title: 'SOM — $350 Million', tag: 'Target Market', desc: 'First 100,000 Tier-1 & Tier-2 Multi-brand garages in 36 months.' }
  ];

  marketData.forEach((m, idx) => {
    const x = 0.8 + idx * 3.95;
    const y = 1.7;

    slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 3.7, h: 4.9,
      fill: { color: idx === 1 ? LIGHT_ACCENT : CARD_BG },
      line: { color: idx === 1 ? PRIMARY : CARD_BORDER, width: idx === 1 ? 2 : 1 },
      rectRadius: 0.08
    });

    slide2.addText(m.title, {
      x: x + 0.3, y: y + 0.5, w: 3.1, h: 0.6,
      fontSize: 22, bold: true, color: PRIMARY_DARK, fontFace: 'Trebuchet MS'
    });
    slide2.addText(m.tag, {
      x: x + 0.3, y: y + 1.1, w: 3.1, h: 0.4,
      fontSize: 13, bold: true, color: EMERALD, fontFace: 'Arial'
    });
    slide2.addText(m.desc, {
      x: x + 0.3, y: y + 1.7, w: 3.1, h: 2.6,
      fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });


  // ==========================================
  // SLIDE 3: The Core Problem
  // ==========================================
  const slide3 = pptx.addSlide();
  slide3.background = { color: LIGHT_BG };
  addHeader(slide3, 'The Core Problem in Garage Operations', '85% of independent garages operate entirely on paper registers');

  const problemCards = [
    { title: '10% Revenue Leakage', body: 'Small spare parts, lubricants, and extra labor hours are omitted on paper slips.' },
    { title: 'Delayed Approvals', body: 'Calling vehicle owners repeatedly for estimate consent wastes 2+ hours daily.' },
    { title: 'Zero Customer History', body: 'Garages have no record of past vehicle services, missing repeat maintenance alerts.' },
    { title: 'Unmanaged Mechanic Teams', body: 'No digital tracking of individual technician productivity or labor commission.' }
  ];

  problemCards.forEach((pc, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.9;
    const y = 1.7 + row * 2.5;

    slide3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.6, h: 2.2, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08
    });

    slide3.addText(pc.title, {
      x: x + 0.3, y: y + 0.3, w: 5.0, h: 0.4,
      fontSize: 18, bold: true, color: 'DC2626', fontFace: 'Trebuchet MS'
    });
    slide3.addText(pc.body, {
      x: x + 0.3, y: y + 0.8, w: 5.0, h: 1.1,
      fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });


  // ==========================================
  // SLIDE 4: Product Solution & Video Graphics Placeholder
  // ==========================================
  const slide4 = pptx.addSlide();
  slide4.background = { color: LIGHT_BG };
  addHeader(slide4, 'The Product: MechApex Platform Overview', 'Mobile & Web Workshop OS built for zero-friction adoption');

  // Left Column: Features
  slide4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 1.7, w: 5.6, h: 4.9, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08
  });

  slide4.addText('Key Product Pillars', {
    x: 1.1, y: 2.0, w: 5.0, h: 0.4,
    fontSize: 20, bold: true, color: PRIMARY_DARK, fontFace: 'Trebuchet MS'
  });

  slide4.addText([
    { text: '• 30-Sec Digital Job Cards: ', options: { bold: true, color: TEXT_MAIN, fontSize: 14 } },
    { text: 'Vehicle inspection, photos & fuel meter.\n\n', options: { color: TEXT_MUTED, fontSize: 14 } },
    { text: '• WhatsApp Native Approvals: ', options: { bold: true, color: EMERALD, fontSize: 14 } },
    { text: 'Instant PDF estimate sent to customer WhatsApp.\n\n', options: { color: TEXT_MUTED, fontSize: 14 } },
    { text: '• Mechanic Allocation: ', options: { bold: true, color: PRIMARY, fontSize: 14 } },
    { text: 'Assign jobs to staff with role-based access limits.\n\n', options: { color: TEXT_MUTED, fontSize: 14 } },
    { text: '• Spares Catalog & Analytics: ', options: { bold: true, color: AMBER, fontSize: 14 } },
    { text: 'Pre-loaded catalog rates & real-time revenue reports.', options: { color: TEXT_MUTED, fontSize: 14 } }
  ], { x: 1.1, y: 2.6, w: 5.0, h: 3.7, fontFace: 'Arial' });

  // Right Column: Video Graphics Frame Placeholder
  slide4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.8, y: 1.7, w: 5.7, h: 4.9, fill: { color: '1E293B' }, rectRadius: 0.08
  });

  // Play icon placeholder for video graphics
  slide4.addShape(pptx.shapes.OVAL, {
    x: 9.15, y: 3.3, w: 1.0, h: 1.0, fill: { color: PRIMARY }
  });
  slide4.addText('▶', {
    x: 9.15, y: 3.3, w: 1.0, h: 1.0,
    fontSize: 24, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial'
  });
  slide4.addText('[ VIDEO DEMO GRAPHIC ]', {
    x: 7.1, y: 4.5, w: 5.1, h: 0.4,
    fontSize: 14, bold: true, color: '94A3B8', align: 'center', fontFace: 'Arial'
  });
  slide4.addText('Click to view MechApex Live Product Video Demo', {
    x: 7.1, y: 4.9, w: 5.1, h: 0.4,
    fontSize: 12, color: 'CBD5E1', align: 'center', fontFace: 'Arial'
  });


  // ==========================================
  // SLIDE 5: Business Model & Monetization
  // ==========================================
  const slide5 = pptx.addSlide();
  slide5.background = { color: LIGHT_BG };
  addHeader(slide5, 'Business Model & Monetization Stream', 'Highly scalable Pay-As-You-Go model with multiple upside expansion levers');

  const bizStreams = [
    { title: '1. Job Card Reloads', tag: 'Core Revenue', desc: 'Pay-per-job-card model:\n• Starter: 100 Free\n• 500 Cards: ₹499\n• 1,000 Cards: ₹899' },
    { title: '2. Worker Expansion Packs', tag: 'Staff Scaling', desc: 'Garages upgrade team size:\n• +10 Workers: ₹99\n• +100 Workers: ₹799\n• Lifetime one-time unlocks' },
    { title: '3. Spares Marketplace', tag: 'Future Upside', desc: 'B2B Procurement commission connecting spare part distributors directly to garages.' },
    { title: '4. Embedded Payments', tag: 'Fintech Layer', desc: 'Processing fee margin on UPI / Card digital payments collected via MechApex.' }
  ];

  bizStreams.forEach((b, idx) => {
    const x = 0.8 + idx * 2.95;
    const y = 1.7;

    slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 2.8, h: 4.9, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08
    });

    slide5.addText(b.title, {
      x: x + 0.2, y: y + 0.3, w: 2.4, h: 0.6,
      fontSize: 16, bold: true, color: PRIMARY_DARK, fontFace: 'Trebuchet MS'
    });
    slide5.addText(b.tag, {
      x: x + 0.2, y: y + 0.9, w: 2.4, h: 0.35,
      fontSize: 12, bold: true, color: EMERALD, fontFace: 'Arial'
    });
    slide5.addText(b.desc, {
      x: x + 0.2, y: y + 1.4, w: 2.4, h: 3.1,
      fontSize: 13, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });


  // ==========================================
  // SLIDE 6: Unit Economics & Financial Trajectory
  // ==========================================
  const slide6 = pptx.addSlide();
  slide6.background = { color: LIGHT_BG };
  addHeader(slide6, 'Unit Economics & Financial Traction', 'Low CAC driven by workshop virality & high gross margin profile');

  const unitMetrics = [
    { val: '> 85%', label: 'Gross Margin Profile', desc: 'Cloud SaaS backend architecture yields exceptionally high gross profit margins.' },
    { val: '₹18,750', label: 'Monthly Value Generated', desc: 'Average revenue leakage saved per workshop every single month.' },
    { val: '3.8x', label: 'LTV to CAC Ratio', desc: 'Organic viral referral between neighboring garages keeps acquisition cost low.' },
    { val: '125%', label: 'Net Revenue Retention', desc: 'Workshop growth leads to recurring job card reload purchases.' }
  ];

  unitMetrics.forEach((um, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.9;
    const y = 1.7 + row * 2.5;

    slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.6, h: 2.2, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08
    });

    slide6.addText(um.val, {
      x: x + 0.4, y: y + 0.2, w: 4.8, h: 0.6,
      fontSize: 32, bold: true, color: PRIMARY, fontFace: 'Trebuchet MS'
    });
    slide6.addText(um.label, {
      x: x + 0.4, y: y + 0.8, w: 4.8, h: 0.4,
      fontSize: 16, bold: true, color: TEXT_MAIN, fontFace: 'Arial'
    });
    slide6.addText(um.desc, {
      x: x + 0.4, y: y + 1.3, w: 4.8, h: 0.7,
      fontSize: 13, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });


  // ==========================================
  // SLIDE 7: Technology & Product Architecture
  // ==========================================
  const slide7 = pptx.addSlide();
  slide7.background = { color: LIGHT_BG };
  addHeader(slide7, 'Product Architecture & Tech Stack', 'Enterprise-grade reliability built for high speed & offline-first environments');

  const techStack = [
    { title: 'Frontend Cross-Platform', tech: 'Expo React Native & Web', desc: 'Single codebase powering Android APK, Web Portal, and iOS.' },
    { title: 'High Performance API', tech: 'Python FastAPI & Motor', desc: 'Asynchronous event loop handling thousands of concurrent requests.' },
    { title: 'Database & Security', tech: 'MongoDB & JWT Auth', desc: 'NoSQL document store for vehicle history & encrypted token sessions.' },
    { title: 'Cloud Infrastructure', tech: 'Firebase & Docker Cloud', desc: 'Auto-scaling global CDN with 99.9% uptime SLA guarantee.' }
  ];

  techStack.forEach((t, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.9;
    const y = 1.7 + row * 2.5;

    slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.6, h: 2.2, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08
    });

    slide7.addText(t.title, {
      x: x + 0.3, y: y + 0.3, w: 5.0, h: 0.4,
      fontSize: 16, bold: true, color: TEXT_MAIN, fontFace: 'Trebuchet MS'
    });
    slide7.addText(t.tech, {
      x: x + 0.3, y: y + 0.7, w: 5.0, h: 0.4,
      fontSize: 15, bold: true, color: PRIMARY, fontFace: 'Arial'
    });
    slide7.addText(t.desc, {
      x: x + 0.3, y: y + 1.2, w: 5.0, h: 0.8,
      fontSize: 13, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });


  // ==========================================
  // SLIDE 8: Competitive Moat / Advantage
  // ==========================================
  const slide8 = pptx.addSlide();
  slide8.background = { color: LIGHT_BG };
  addHeader(slide8, 'Competitive Advantages & Moat', 'Why MechApex wins against legacy desktop software');

  const moats = [
    { title: 'Zero Customer App Friction', desc: 'Vehicle owners do NOT need to download any app. Estimates & approvals arrive directly on WhatsApp.' },
    { title: 'Instant 30-Sec Onboarding', desc: 'No complex installation or training needed. Garages can create their first job card in under 1 minute.' },
    { title: 'Bulk CSV Migration Engine', desc: 'Garages can import 10,000+ customer records from Excel/old software with 1-click import.' },
    { title: 'Hybrid Web & Mobile Access', desc: 'Works seamlessly on ₹6,000 Android phones as well as desktop Web browsers.' }
  ];

  moats.forEach((m, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.9;
    const y = 1.7 + row * 2.5;

    slide8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.6, h: 2.2, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08
    });

    slide8.addText(`🚀 ${m.title}`, {
      x: x + 0.3, y: y + 0.3, w: 5.0, h: 0.4,
      fontSize: 17, bold: true, color: PRIMARY_DARK, fontFace: 'Trebuchet MS'
    });
    slide8.addText(m.desc, {
      x: x + 0.3, y: y + 0.8, w: 5.0, h: 1.1,
      fontSize: 13, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });


  // ==========================================
  // SLIDE 9: Traction & Growth Milestones
  // ==========================================
  const slide9 = pptx.addSlide();
  slide9.background = { color: LIGHT_BG };
  addHeader(slide9, 'Traction & Growth Milestones', 'Proven product-market fit across 2-wheeler & 4-wheeler garages');

  const tractionStats = [
    { num: '500+', label: 'Active Garages', detail: 'Onboarded across Tier-1 & Tier-2 automotive hubs.' },
    { num: '150,000+', label: 'Job Cards Created', detail: 'Processed through MechApex digital workflow engine.' },
    { num: '99.9%', label: 'Cloud Uptime SLA', detail: 'High reliability infrastructure supporting live garage operations.' },
    { num: '4.8 ★', label: 'User Satisfaction', detail: 'High rating from workshop owners and mechanics.' }
  ];

  tractionStats.forEach((t, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.9;
    const y = 1.7 + row * 2.5;

    slide9.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.6, h: 2.2, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08
    });

    slide9.addText(t.num, {
      x: x + 0.4, y: y + 0.2, w: 4.8, h: 0.6,
      fontSize: 34, bold: true, color: EMERALD, fontFace: 'Trebuchet MS'
    });
    slide9.addText(t.label, {
      x: x + 0.4, y: y + 0.85, w: 4.8, h: 0.4,
      fontSize: 16, bold: true, color: TEXT_MAIN, fontFace: 'Arial'
    });
    slide9.addText(t.detail, {
      x: x + 0.4, y: y + 1.3, w: 4.8, h: 0.7,
      fontSize: 13, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });


  // ==========================================
  // SLIDE 10: The Investment Ask & Contact
  // ==========================================
  const slide10 = pptx.addSlide();
  slide10.background = { color: LIGHT_BG };
  addHeader(slide10, 'The Investment Ask & Contact', 'Partner with us to build the market-leading automotive SaaS platform');

  // Left Box: Use of Funds
  slide10.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 1.7, w: 5.6, h: 4.9, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08
  });

  slide10.addText('Use of Funds Allocation', {
    x: 1.1, y: 2.0, w: 5.0, h: 0.4,
    fontSize: 20, bold: true, color: PRIMARY_DARK, fontFace: 'Trebuchet MS'
  });

  slide10.addText([
    { text: '• Product & Engineering (40%): ', options: { bold: true, color: PRIMARY, fontSize: 14 } },
    { text: 'B2B Spares Marketplace & AI Diagnostic Recommendation.\n\n', options: { color: TEXT_MUTED, fontSize: 14 } },
    { text: '• Field Sales & Network (40%): ', options: { bold: true, color: EMERALD, fontSize: 14 } },
    { text: 'Onboarding 20,000+ garages across 15 key metro cities.\n\n', options: { color: TEXT_MUTED, fontSize: 14 } },
    { text: '• Marketing & Partnerships (20%): ', options: { bold: true, color: AMBER, fontSize: 14 } },
    { text: 'OEM & Distributor integrations.', options: { color: TEXT_MUTED, fontSize: 14 } }
  ], { x: 1.1, y: 2.6, w: 5.0, h: 3.7, fontFace: 'Arial' });

  // Right Box: Contact Info
  slide10.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.8, y: 1.7, w: 5.7, h: 4.9, fill: { color: LIGHT_ACCENT }, line: { color: PRIMARY, width: 1.5 }, rectRadius: 0.08
  });

  slide10.addText('Join Our Growth Journey', {
    x: 7.1, y: 2.1, w: 5.1, h: 0.5,
    fontSize: 24, bold: true, color: PRIMARY_DARK, align: 'center', fontFace: 'Trebuchet MS'
  });

  slide10.addText([
    { text: '🌐 Website: ', options: { bold: true, color: TEXT_MAIN, fontSize: 16 } },
    { text: 'https://www.mechapex.in\n\n', options: { color: PRIMARY, fontSize: 16 } },
    { text: '📱 Web App: ', options: { bold: true, color: TEXT_MAIN, fontSize: 16 } },
    { text: 'https://mechapex-ac7e8.web.app/app/\n\n', options: { color: EMERALD, fontSize: 16 } },
    { text: '🐙 GitHub: ', options: { bold: true, color: TEXT_MAIN, fontSize: 16 } },
    { text: 'https://github.com/Ksiddu1993/MechApexV1\n\n', options: { color: PRIMARY_DARK, fontSize: 16 } },
    { text: '✉️ Contact: ', options: { bold: true, color: TEXT_MAIN, fontSize: 16 } },
    { text: 'invest@mechapex.in • 8904600880', options: { color: TEXT_MUTED, fontSize: 16 } }
  ], { x: 7.1, y: 2.9, w: 5.1, h: 3.3, align: 'center', fontFace: 'Arial' });


  // Save file
  const fileName = 'MechApex_Investor_Demo_Presentation.pptx';
  await pptx.writeFile({ fileName });
  console.log(`Investor presentation successfully created: ${fileName}`);
}

buildInvestorDeck().catch(console.error);

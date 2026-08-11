const pptxgen = require('pptxgenjs');

async function buildPresentation() {
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'MechApex Team';
  pptx.company = 'MechApex OS';
  pptx.title = 'MechApex Client Demo Presentation';

  // --- Theme Colors ---
  const DARK_BG = '0B0F19';
  const CARD_BG = '161F32';
  const PRIMARY = 'D97706'; // Amber / Gold
  const TEXT_MAIN = 'FFFFFF';
  const TEXT_MUTED = '94A3B8';
  const EMERALD = '10B981';
  const ACCENT_BLUE = '3B82F6';

  // Helper: Slide Master Header
  function addHeader(slide, title, subtitle) {
    slide.addText(title, {
      x: 0.8, y: 0.5, w: 11.5, h: 0.6,
      fontSize: 26, bold: true, color: PRIMARY, fontFace: 'Trebuchet MS'
    });
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8, y: 1.1, w: 11.5, h: 0.4,
        fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
      });
    }
  }

  // ==========================================
  // SLIDE 1: Title Slide
  // ==========================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: DARK_BG };

  slide1.addShape(pptx.shapes.RECTANGLE, {
    x: 0.8, y: 1.5, w: 2.2, h: 0.4,
    fill: { color: '1E293B' }, line: { color: PRIMARY, width: 1 }
  });
  slide1.addText('POWERFUL WORKSHOP OS', {
    x: 0.8, y: 1.5, w: 2.2, h: 0.4,
    fontSize: 10, bold: true, color: PRIMARY, align: 'center'
  });

  slide1.addText('MechApex', {
    x: 0.8, y: 2.2, w: 10, h: 1.0,
    fontSize: 54, bold: true, color: TEXT_MAIN, fontFace: 'Trebuchet MS'
  });
  slide1.addText('Next-Gen Garage & Auto Workshop Management', {
    x: 0.8, y: 3.3, w: 10, h: 0.6,
    fontSize: 22, color: TEXT_MUTED, fontFace: 'Arial'
  });

  slide1.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 4.3, w: 11.7, h: 2.2,
    fill: { color: CARD_BG }, rectRadius: 0.1
  });

  slide1.addText([
    { text: '• 30-Second Digital Job Cards\n', options: { bold: true, color: TEXT_MAIN, fontSize: 16 } },
    { text: '• Instant WhatsApp PDF Billing & Customer Approval\n', options: { bold: true, color: TEXT_MAIN, fontSize: 16 } },
    { text: '• Mechanic Team Delegation & Parts Stock Inventory\n', options: { bold: true, color: TEXT_MAIN, fontSize: 16 } },
    { text: '• 2-Wheeler & 4-Wheeler Ready Across Web & Android', options: { bold: true, color: PRIMARY, fontSize: 16 } }
  ], { x: 1.2, y: 4.6, w: 11, h: 1.6, fontFace: 'Arial' });


  // ==========================================
  // SLIDE 2: The Challenge / Problem
  // ==========================================
  const slide2 = pptx.addSlide();
  slide2.background = { color: DARK_BG };
  addHeader(slide2, 'The Problem: Traditional Workshop Pain Points', 'Why traditional paper-based garages lose time and revenue every day');

  const problems = [
    { title: 'Paper Job Cards Lost', desc: 'Handwritten job sheets get dirty, lost, or misread, leading to customer disputes.' },
    { title: 'Unbilled Spares & Labor', desc: 'Up to 10% of small spare parts & extra mechanic hours are forgotten in final billing.' },
    { title: 'Slow Customer Approvals', desc: 'Calling customers multiple times for estimate permission delays vehicle delivery.' },
    { title: 'No Team Accountability', desc: 'Difficult to track which mechanic worked on which car or calculate monthly output.' }
  ];

  problems.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.9;
    const y = 1.8 + row * 2.5;

    slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.6, h: 2.2, fill: { color: CARD_BG }, rectRadius: 0.1
    });

    slide2.addText(p.title, {
      x: x + 0.3, y: y + 0.3, w: 5.0, h: 0.4,
      fontSize: 18, bold: true, color: 'EF4444', fontFace: 'Trebuchet MS'
    });
    slide2.addText(p.desc, {
      x: x + 0.3, y: y + 0.8, w: 5.0, h: 1.1,
      fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });


  // ==========================================
  // SLIDE 3: The Solution (MechApex)
  // ==========================================
  const slide3 = pptx.addSlide();
  slide3.background = { color: DARK_BG };
  addHeader(slide3, 'The Solution: MechApex Digital OS', 'Transforming garage management into a high-speed digital operation');

  const features3 = [
    { title: '⚡ Fast Intake', sub: '30-sec Job Sheet', body: 'Capture customer details, fuel level, vehicle photos & inspection items instantly.' },
    { title: '💬 WhatsApp First', sub: 'Instant Estimates', body: 'Send digital estimates & GST invoices directly to customer WhatsApp with 1 tap.' },
    { title: '👥 Team Control', sub: 'Mechanic Accounts', body: 'Assign job cards to mechanics, monitor live status, and set worker permission limits.' },
    { title: '📊 Live Analytics', sub: 'Real-time Reports', body: 'Track daily workshop revenue, completed jobs, pending items, and customer history.' }
  ];

  features3.forEach((f, idx) => {
    const x = 0.8 + idx * 2.95;
    const y = 1.8;

    slide3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 2.8, h: 4.8, fill: { color: CARD_BG }, rectRadius: 0.1
    });

    slide3.addText(f.title, {
      x: x + 0.2, y: y + 0.4, w: 2.4, h: 0.5,
      fontSize: 18, bold: true, color: PRIMARY, fontFace: 'Trebuchet MS'
    });
    slide3.addText(f.sub, {
      x: x + 0.2, y: y + 0.9, w: 2.4, h: 0.4,
      fontSize: 13, bold: true, color: EMERALD, fontFace: 'Arial'
    });
    slide3.addText(f.body, {
      x: x + 0.2, y: y + 1.5, w: 2.4, h: 2.8,
      fontSize: 13, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });


  // ==========================================
  // SLIDE 4: Core Capabilities & Modules
  // ==========================================
  const slide4 = pptx.addSlide();
  slide4.background = { color: DARK_BG };
  addHeader(slide4, 'Core Features & Capabilities', 'Built specifically for 2-wheeler & 4-wheeler auto workshops');

  const capabilities = [
    { name: 'Digital Job Cards', desc: 'Pre-loaded services, vehicle inspection checklist, photo attachments, and status tracking (Pending, In-Progress, Completed).' },
    { name: 'WhatsApp Billing & Receipts', desc: 'Generate itemized PDF/digital estimates and GST invoices. Send directly via WhatsApp in 1 click.' },
    { name: 'Mechanics & Sub-User Roles', desc: 'Owner dashboard with worker permissions. Assign mechanics to specific job cards and track technician productivity.' },
    { name: 'Spares Inventory Catalog', desc: 'Pre-loaded spare parts & labor service rates. Low stock alerts and margin tracking per service.' },
    { name: 'Bulk CSV Customer Migration', desc: 'Import existing customer phone numbers, names, and vehicle registration numbers seamlessly via 1-click CSV.' },
    { name: 'Multi-Device Web & Android Portal', desc: 'Access your workshop data from Android smartphones, tablets, or any computer web browser.' }
  ];

  capabilities.forEach((c, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.9;
    const y = 1.8 + row * 1.6;

    slide4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.6, h: 1.4, fill: { color: CARD_BG }, rectRadius: 0.08
    });

    slide4.addText(`✔ ${c.name}`, {
      x: x + 0.25, y: y + 0.15, w: 5.1, h: 0.35,
      fontSize: 15, bold: true, color: ACCENT_BLUE, fontFace: 'Trebuchet MS'
    });
    slide4.addText(c.desc, {
      x: x + 0.25, y: y + 0.55, w: 5.1, h: 0.75,
      fontSize: 12, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });


  // ==========================================
  // SLIDE 5: Client Walkthrough / Workflow
  // ==========================================
  const slide5 = pptx.addSlide();
  slide5.background = { color: DARK_BG };
  addHeader(slide5, 'Step-by-Step Client Demo Workflow', 'How MechApex runs a vehicle through your garage in 4 simple steps');

  const steps = [
    { num: 'STEP 1', title: 'Vehicle Intake', desc: 'Type Reg Number (e.g. KA 05 ME 9988) & select customer name. Select pre-loaded services.' },
    { num: 'STEP 2', title: 'Assign Mechanic', desc: 'Select mechanic from your team dropdown. MechApex updates the job status to In-Progress.' },
    { num: 'STEP 3', title: 'WhatsApp Estimate', desc: 'Click "Send WhatsApp". Customer receives exact estimate and approves instantly.' },
    { num: 'STEP 4', title: 'Payment & Checkout', desc: 'Mark job Completed, generate final invoice, and collect UPI / Cash payment with receipt.' }
  ];

  steps.forEach((s, idx) => {
    const x = 0.8 + idx * 2.95;
    const y = 2.0;

    slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 2.8, h: 4.4, fill: { color: CARD_BG }, rectRadius: 0.1
    });

    slide5.addShape(pptx.shapes.OVAL, {
      x: x + 0.9, y: y + 0.3, w: 1.0, h: 1.0, fill: { color: PRIMARY }
    });
    slide5.addText(`${idx + 1}`, {
      x: x + 0.9, y: y + 0.3, w: 1.0, h: 1.0,
      fontSize: 24, bold: true, color: TEXT_MAIN, align: 'center', fontFace: 'Trebuchet MS'
    });

    slide5.addText(s.title, {
      x: x + 0.2, y: y + 1.5, w: 2.4, h: 0.5,
      fontSize: 16, bold: true, color: TEXT_MAIN, align: 'center', fontFace: 'Trebuchet MS'
    });
    slide5.addText(s.desc, {
      x: x + 0.2, y: y + 2.1, w: 2.4, h: 2.0,
      fontSize: 13, color: TEXT_MUTED, align: 'center', fontFace: 'Arial'
    });
  });


  // ==========================================
  // SLIDE 6: Business Impact & ROI
  // ==========================================
  const slide6 = pptx.addSlide();
  slide6.background = { color: DARK_BG };
  addHeader(slide6, 'Business Impact & ROI for Garage Owners', 'Real measurable results observed across 500+ workshops');

  const metrics = [
    { val: '45+ Hours', label: 'Saved per Month', detail: 'Eliminate manual paperwork, redundant calls, and physical register entry.' },
    { val: '₹18,750+', label: 'Unbilled Leakage Saved', detail: 'Capture 100% of spare parts, extra oil liters, and specialized mechanic labor.' },
    { val: '30 Seconds', label: 'Avg Job Card Time', detail: 'Rapid digital intake allows your workshop to handle 25% more vehicles daily.' },
    { val: '100% Zero', label: 'Customer Dispute', detail: 'Transparent WhatsApp estimates with customer approval before work starts.' }
  ];

  metrics.forEach((m, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.9;
    const y = 1.8 + row * 2.5;

    slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.6, h: 2.2, fill: { color: CARD_BG }, rectRadius: 0.1
    });

    slide6.addText(m.val, {
      x: x + 0.4, y: y + 0.2, w: 4.8, h: 0.6,
      fontSize: 32, bold: true, color: EMERALD, fontFace: 'Trebuchet MS'
    });
    slide6.addText(m.label, {
      x: x + 0.4, y: y + 0.8, w: 4.8, h: 0.4,
      fontSize: 16, bold: true, color: TEXT_MAIN, fontFace: 'Arial'
    });
    slide6.addText(m.detail, {
      x: x + 0.4, y: y + 1.3, w: 4.8, h: 0.7,
      fontSize: 13, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });


  // ==========================================
  // SLIDE 7: Flexible Pricing Plans
  // ==========================================
  const slide7 = pptx.addSlide();
  slide7.background = { color: DARK_BG };
  addHeader(slide7, 'Transparent & Affordable Pricing', 'No monthly subscriptions required — pay only as your garage grows');

  const plans = [
    { title: 'Starter Free', price: '₹0', detail: 'First 100 Job Cards Free', features: ['Up to 10 Workers', 'WhatsApp Invoice Sharing', 'Customer Vehicle History'] },
    { title: '500 Job Cards', price: '₹499', detail: 'One-time Reload', features: ['500 Digital Job Cards', 'GST & Non-GST Billing', '1-Click CSV Import/Export', '10 Workers Included'] },
    { title: '1,000 Job Cards', price: '₹899', detail: 'One-time Reload', features: ['1,000 Digital Job Cards', 'Priority Customer Support', 'Inventory Stock Catalog', 'Unlimited Database'] }
  ];

  plans.forEach((p, idx) => {
    const x = 0.8 + idx * 3.95;
    const y = 1.8;

    slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 3.7, h: 4.8, fill: { color: CARD_BG },
      line: { color: idx === 1 ? PRIMARY : CARD_BG, width: idx === 1 ? 2 : 0 },
      rectRadius: 0.1
    });

    slide7.addText(p.title, {
      x: x + 0.3, y: y + 0.4, w: 3.1, h: 0.4,
      fontSize: 20, bold: true, color: TEXT_MAIN, fontFace: 'Trebuchet MS'
    });
    slide7.addText(p.price, {
      x: x + 0.3, y: y + 0.85, w: 3.1, h: 0.6,
      fontSize: 34, bold: true, color: PRIMARY, fontFace: 'Trebuchet MS'
    });
    slide7.addText(p.detail, {
      x: x + 0.3, y: y + 1.45, w: 3.1, h: 0.3,
      fontSize: 12, color: TEXT_MUTED, fontFace: 'Arial'
    });

    p.features.forEach((ft, fIdx) => {
      slide7.addText(`✔ ${ft}`, {
        x: x + 0.3, y: y + 2.0 + fIdx * 0.5, w: 3.1, h: 0.4,
        fontSize: 13, color: TEXT_MAIN, fontFace: 'Arial'
      });
    });
  });


  // ==========================================
  // SLIDE 8: Worker Expansion Packs
  // ==========================================
  const slide8 = pptx.addSlide();
  slide8.background = { color: DARK_BG };
  addHeader(slide8, 'Worker & Team Expansion Packs', 'Scale your mechanics and multi-branch team effortlessly');

  const wPacks = [
    { title: '10 Extra Workers', price: '₹99', sub: 'One-time Lifetime Upgrade', desc: ['Add +10 Worker accounts', 'Individual Mechanic Logins', 'Track labor & productivity per mechanic'] },
    { title: '100 Extra Workers', price: '₹799', sub: 'Best Value for Networks', desc: ['Add +100 Worker accounts', 'Multi-branch Staff Network', 'Granular Role & Permission Access Controls'] }
  ];

  wPacks.forEach((wp, idx) => {
    const x = 0.8 + idx * 5.9;
    const y = 1.8;

    slide8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.6, h: 4.8, fill: { color: CARD_BG }, rectRadius: 0.1
    });

    slide8.addText(wp.title, {
      x: x + 0.4, y: y + 0.4, w: 4.8, h: 0.5,
      fontSize: 22, bold: true, color: TEXT_MAIN, fontFace: 'Trebuchet MS'
    });
    slide8.addText(wp.price, {
      x: x + 0.4, y: y + 0.9, w: 4.8, h: 0.7,
      fontSize: 40, bold: true, color: EMERALD, fontFace: 'Trebuchet MS'
    });
    slide8.addText(wp.sub, {
      x: x + 0.4, y: y + 1.6, w: 4.8, h: 0.4,
      fontSize: 14, bold: true, color: PRIMARY, fontFace: 'Arial'
    });

    wp.desc.forEach((d, dIdx) => {
      slide8.addText(`• ${d}`, {
        x: x + 0.4, y: y + 2.3 + dIdx * 0.6, w: 4.8, h: 0.5,
        fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
      });
    });
  });


  // ==========================================
  // SLIDE 9: Next Steps & Contact
  // ==========================================
  const slide9 = pptx.addSlide();
  slide9.background = { color: DARK_BG };
  addHeader(slide9, 'Get Started with MechApex Today!', 'Experience the future of automotive garage management');

  slide9.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 1.8, w: 11.7, h: 4.8, fill: { color: CARD_BG }, rectRadius: 0.1
  });

  slide9.addText('Ready to Upgrade Your Workshop?', {
    x: 1.2, y: 2.2, w: 10.9, h: 0.6,
    fontSize: 26, bold: true, color: TEXT_MAIN, align: 'center', fontFace: 'Trebuchet MS'
  });

  slide9.addText([
    { text: '🌐 Official Website: ', options: { bold: true, color: TEXT_MAIN, fontSize: 18 } },
    { text: 'https://www.mechapex.in\n\n', options: { color: PRIMARY, fontSize: 18 } },
    { text: '📱 Live Web App Portal: ', options: { bold: true, color: TEXT_MAIN, fontSize: 18 } },
    { text: 'https://mechapex-ac7e8.web.app/app/\n\n', options: { color: EMERALD, fontSize: 18 } },
    { text: '🐙 Open-Source GitHub Repo: ', options: { bold: true, color: TEXT_MAIN, fontSize: 18 } },
    { text: 'https://github.com/Ksiddu1993/MechApexV1\n\n', options: { color: ACCENT_BLUE, fontSize: 18 } },
    { text: '📞 Support & UPI: ', options: { bold: true, color: TEXT_MAIN, fontSize: 18 } },
    { text: '8904600880@upi', options: { color: TEXT_MUTED, fontSize: 18 } }
  ], { x: 1.5, y: 3.0, w: 10.3, h: 3.0, align: 'center', fontFace: 'Arial' });


  // Save file
  const fileName = 'MechApex_Client_Demo_Presentation.pptx';
  await pptx.writeFile({ fileName });
  console.log(`Presentation successfully created: ${fileName}`);
}

buildPresentation().catch(console.error);

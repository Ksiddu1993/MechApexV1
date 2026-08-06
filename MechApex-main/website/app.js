// MechApex Website Interactive Logic

document.addEventListener('DOMContentLoaded', () => {

  // --- Services Database ---
  const servicesFourWheeler = [
    { id: 'sw1', name: 'Synthetic Engine Oil (4L)', price: 1850, checked: true },
    { id: 'sw2', name: 'Oil & Air Filter Replacement', price: 450, checked: true },
    { id: 'sw3', name: 'Front Brake Pad Change', price: 850, checked: true },
    { id: 'sw4', name: 'Full Body Foam Wash & Vacuum', price: 300, checked: true },
    { id: 'sw5', name: 'Wheel Alignment & Balancing', price: 650, checked: false },
    { id: 'sw6', name: 'AC Gas Top Up & Service', price: 1200, checked: false }
  ];

  const servicesTwoWheeler = [
    { id: 'tw1', name: 'Engine Oil Change (1L)', price: 450, checked: true },
    { id: 'tw2', name: 'General Service & Tuning', price: 350, checked: true },
    { id: 'tw3', name: 'Chain Lubrication & Tightening', price: 120, checked: true },
    { id: 'tw4', name: 'Brake Shoe Clean & Adjustment', price: 180, checked: false },
    { id: 'tw5', name: 'Spark Plug & Air Filter Check', price: 200, checked: false }
  ];

  let currentVehicleType = '4-wheeler';
  let activeServices = [...servicesFourWheeler];

  // --- Elements ---
  const typeFourWheelerBtn = document.getElementById('typeFourWheeler');
  const typeTwoWheelerBtn = document.getElementById('typeTwoWheeler');
  const checklistContainer = document.getElementById('checklistContainer');

  const simName = document.getElementById('simName');
  const simPhone = document.getElementById('simPhone');
  const simReg = document.getElementById('simReg');
  const simModel = document.getElementById('simModel');

  const outName = document.getElementById('outName');
  const outPhone = document.getElementById('outPhone');
  const outReg = document.getElementById('outReg');
  const outModel = document.getElementById('outModel');
  const outItems = document.getElementById('outItems');
  const outTotal = document.getElementById('outTotal');
  const heroTotal = document.getElementById('heroTotal');

  // Render Simulator Checklist
  function renderChecklist() {
    checklistContainer.innerHTML = '';
    activeServices.forEach(item => {
      const div = document.createElement('div');
      div.className = 'chk-item';
      div.innerHTML = `
        <label style="cursor: pointer; display: flex; align-items: center;">
          <input type="checkbox" id="${item.id}" ${item.checked ? 'checked' : ''}>
          <span>${item.name}</span>
        </label>
        <span style="font-weight: 700; color: var(--primary);">₹${item.price}</span>
      `;
      checklistContainer.appendChild(div);

      // Event listener
      div.querySelector('input').addEventListener('change', (e) => {
        item.checked = e.target.checked;
        updateInvoice();
      });
    });
  }

  // Update Live Invoice Output
  function updateInvoice() {
    outName.textContent = simName.value || 'Customer Name';
    outPhone.textContent = simPhone.value || '9876543210';
    outReg.textContent = (simReg.value || 'REG NO').toUpperCase();
    outModel.textContent = simModel.value || 'Vehicle Model';

    outItems.innerHTML = '';
    let total = 0;

    activeServices.filter(s => s.checked).forEach(s => {
      total += s.price;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.name}</td>
        <td style="text-align: right; font-weight: 700;">₹${s.price.toLocaleString('en-IN')}</td>
      `;
      outItems.appendChild(tr);
    });

    const totalStr = '₹' + total.toLocaleString('en-IN');
    outTotal.textContent = totalStr;
    if (heroTotal) heroTotal.textContent = total.toLocaleString('en-IN');
  }

  // Vehicle Type Toggle
  if (typeFourWheelerBtn && typeTwoWheelerBtn) {
    typeFourWheelerBtn.addEventListener('click', () => {
      currentVehicleType = '4-wheeler';
      typeFourWheelerBtn.classList.add('active');
      typeTwoWheelerBtn.classList.remove('active');
      activeServices = [...servicesFourWheeler];
      simReg.value = 'KA 01 AB 1234';
      simModel.value = 'Hyundai Creta 1.6';
      renderChecklist();
      updateInvoice();
    });

    typeTwoWheelerBtn.addEventListener('click', () => {
      currentVehicleType = '2-wheeler';
      typeTwoWheelerBtn.classList.add('active');
      typeFourWheelerBtn.classList.remove('active');
      activeServices = [...servicesTwoWheeler];
      simReg.value = 'KA 05 HL 7788';
      simModel.value = 'Royal Enfield Classic 350';
      renderChecklist();
      updateInvoice();
    });
  }

  // Input Listeners
  [simName, simPhone, simReg, simModel].forEach(input => {
    if (input) input.addEventListener('input', updateInvoice);
  });

  // Initial render
  renderChecklist();
  updateInvoice();


  // --- ROI Calculator Logic ---
  const vehiclesSlider = document.getElementById('vehiclesSlider');
  const avgBillSlider = document.getElementById('avgBillSlider');
  const vehiclesVal = document.getElementById('vehiclesVal');
  const avgBillVal = document.getElementById('avgBillVal');
  const resHours = document.getElementById('resHours');
  const resRevenue = document.getElementById('resRevenue');

  function updateCalculator() {
    if (!vehiclesSlider || !avgBillSlider) return;
    const vCount = parseInt(vehiclesSlider.value, 10);
    const avgBill = parseInt(avgBillSlider.value, 10);

    vehiclesVal.textContent = `${vCount} Vehicles`;
    avgBillVal.textContent = `₹${avgBill.toLocaleString('en-IN')}`;

    // Calculation: 6 mins saved per vehicle * vCount * 30 days / 60 mins = Hours Saved
    const hoursSaved = Math.round((vCount * 6 * 30) / 60);
    // 5% revenue leakage captured by digital billing
    const leakageSaved = Math.round(vCount * 30 * avgBill * 0.05);

    resHours.textContent = `${hoursSaved} Hours`;
    resRevenue.textContent = `₹${leakageSaved.toLocaleString('en-IN')}`;
  }

  if (vehiclesSlider && avgBillSlider) {
    vehiclesSlider.addEventListener('input', updateCalculator);
    avgBillSlider.addEventListener('input', updateCalculator);
    updateCalculator();
  }


  // --- Pricing Tab Toggle ---
  const tabJobCards = document.getElementById('tabJobCards');
  const tabWorkers = document.getElementById('tabWorkers');
  const jobCardsGrid = document.getElementById('jobCardsGrid');
  const workersGrid = document.getElementById('workersGrid');

  if (tabJobCards && tabWorkers) {
    tabJobCards.addEventListener('click', () => {
      tabJobCards.classList.add('active');
      tabWorkers.classList.remove('active');
      jobCardsGrid.style.display = 'grid';
      workersGrid.style.display = 'none';
    });

    tabWorkers.addEventListener('click', () => {
      tabWorkers.classList.add('active');
      tabJobCards.classList.remove('active');
      workersGrid.style.display = 'grid';
      jobCardsGrid.style.display = 'none';
    });
  }


  // --- FAQ Accordion ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq-question');
    q.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });

});

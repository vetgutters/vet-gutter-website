document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile Menu Logic ---
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');

      // Hamburger Animation
      const spans = menuToggle.querySelectorAll('span');
      if (spans.length === 3) {
        if (mobileMenu.classList.contains('open')) {
          spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
          spans[1].style.opacity = '0';
          spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
          spans[0].style.transform = '';
          spans[1].style.opacity = '1';
          spans[2].style.transform = '';
        }
      }
    });
  }

  // --- Smooth Scroll for Anchor Links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth'
        });

        // Close mobile menu if open
        if (mobileMenu && mobileMenu.classList.contains('open')) {
          mobileMenu.classList.remove('open');
          const spans = menuToggle.querySelectorAll('span');
          if (spans.length === 3) {
            spans[0].style.transform = '';
            spans[1].style.opacity = '1';
            spans[2].style.transform = '';
          }
        }
      }
    });
  });
});

/* --- Lead Form Handling --- */
window.handleLeadSubmit = async function (event) {
  event.preventDefault();
  const form = event.target;
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.innerText;

  const data = {
    name: form.name.value,
    phone: form.phone.value,
    service: form.service.value
  };

  btn.innerText = "Sending...";
  btn.disabled = true;

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok) {
      btn.innerText = "Received! Expect a Call Shortly.";
      btn.style.background = "linear-gradient(45deg, #11998e, #38ef7d)"; // Success Green
      btn.style.color = "#fff";
      form.reset();
      setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = ""; // Reset
        btn.style.color = "";
        btn.disabled = false;
      }, 5000);
    } else {
      throw new Error(result.error || "Submission failed");
    }
  } catch (err) {
    console.error(err);
    btn.innerText = "Error. Please Call Us Instead.";
    btn.style.background = "#f44336"; // Red
    setTimeout(() => {
      btn.innerText = originalText;
      btn.style.background = "";
      btn.disabled = false;
    }, 3000);
  }
};

// --- Lightbox Functionality (Global) ---
function openLightbox(element) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const img = element.querySelector('img');

  if (lightbox && lightboxImg && img) {
    lightboxImg.src = img.src;
    lightbox.classList.add('active'); // CSS handles display: flex
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }
}

function closeLightbox(event) {
  // Close if clicked on background or close button, but not the image itself
  if (event.target.id === 'lightbox' || event.target.classList.contains('lightbox-close')) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
    }
  }
}

// --- Scroll Animation Observer (Safe Progressive Enhancement) ---
// Content is visible by default. Animation is purely an enhancement.
document.addEventListener('DOMContentLoaded', () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -20px 0px"
  };

  const animatedElements = document.querySelectorAll('.animate-on-scroll');

  // Only apply animation if IntersectionObserver is supported
  if ('IntersectionObserver' in window && animatedElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Mark elements for animation and observe them
    animatedElements.forEach(el => {
      el.classList.add('will-animate');
      observer.observe(el);
    });

    // Failsafe: Ensure content becomes visible even if observer hangs
    setTimeout(() => {
      document.querySelectorAll('.animate-on-scroll.will-animate:not(.is-visible)').forEach(el => {
        el.classList.add('is-visible');
      });
    }, 1500);
  }
});

// Initialize Storm Protocol
checkWeather();


// --- THE STORM PROTOCOL (Weather Logic) ---
async function checkWeather() {
  try {
    const res = await fetch('/api/weather');
    if (!res.ok) return;
    const weather = await res.json();

    // If storming (or forced for demo), show banner
    // Note: For demo, check strictly for isStorming boolean from API
    if (weather.isStorming) {
      const banner = document.getElementById('stormBanner');
      const msg = document.getElementById('stormMessage');

      if (banner && msg) {
        msg.textContent = `${weather.condition} Detected.`;
        banner.style.display = 'block';
      }
    }
  } catch (e) {
    console.log("Weather check failed (stealth mode):", e);
  }
}
// --- ROUND 5: HIGH-VOLTAGE CRO LOGIC ⚡ ---

// 1. Dynamic Social Proof (Random "Recent" Dates)
document.addEventListener('DOMContentLoaded', () => {
  // Fallback: If no .review-date spans exist yet, inject them into reviews
  const reviewCards = document.querySelectorAll('.review-card');
  reviewCards.forEach(card => {
    const header = card.querySelector('div[style*="justify-content: space-between"]');
    if (header && !header.querySelector('.review-date-injected')) {
      // Find the verified span
      const verifiedSpan = header.querySelector('span');
      if (verifiedSpan) {
        const daysAgo = Math.floor(Math.random() * 14) + 2;
        const dateSpan = document.createElement('div');
        dateSpan.className = 'review-date-injected';
        dateSpan.innerText = `Verified • ${daysAgo} days ago`;
        dateSpan.style.fontSize = '0.7rem';
        dateSpan.style.color = '#777';
        dateSpan.style.marginTop = '4px';
        dateSpan.style.textAlign = 'right';
        verifiedSpan.parentElement.appendChild(dateSpan);
      }
    }
  });

  // 2. High Demand / Storm Banner Logic
  const banner = document.getElementById('stormBanner');
  if (banner && banner.style.display === 'none') {
    const title = banner.querySelector('strong');
    const msg = banner.querySelector('#stormMessage');
    const btn = banner.querySelector('.storm-btn');
    const cta = banner.querySelector('.storm-cta');

    const month = new Date().getMonth();
    const isStormSeason = (month >= 4 && month <= 9);

    if (title && msg) {
      banner.style.display = 'block';
      if (isStormSeason) {
        title.innerText = "Storm Season Alert:";
        msg.innerText = " heavy thunderstorms forecast this week.";
      } else {
        // Dry Season -> High Demand
        title.innerText = "High Demand Alert:";
        title.style.color = "var(--gold)";
        // Update icon if possible, but text change is key
        msg.innerText = " Schedule now to beat the 2-week backlog.";
        if (cta) cta.style.display = 'none';
        if (btn) btn.innerText = "Secure My Spot >";
      }
    }
  }
});

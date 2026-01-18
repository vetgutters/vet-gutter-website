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

// --- Scroll Animation Observer ---
const observerOptions = {
  threshold: 0.1, // Trigger when 10% visible
  rootMargin: "0px 0px -50px 0px" // Trigger slightly before entering bottom
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target); // Run once
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  animatedElements.forEach(el => observer.observe(el));
});

document.addEventListener('DOMContentLoaded', () => {

    // ─── Page Switcher Logic ───────────────────────────────────────
    const switcherLinks = document.querySelectorAll('.page-switcher a');
    const switcher = document.querySelector('.page-switcher');

    // Enable transition on the slider after a tiny delay so it doesn't slide on page load
    setTimeout(() => {
        if (switcher) switcher.classList.add('transition-enabled');
    }, 50);

    switcherLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetHref = link.getAttribute('href');
            
            // Allow default if opening in new tab or anchor link
            if (e.ctrlKey || e.metaKey || !targetHref || targetHref.startsWith('#')) return;
            
            // Only animate if it's navigating to the other page
            const currentPath = window.location.pathname.split('/').pop() || 'MainMasterpiece.html';
            if (targetHref && !currentPath.includes(targetHref)) {
                e.preventDefault();
                
                // Visually move the slider right before navigation for a snappier feel
                if (switcher && switcher.classList.contains('page-1')) {
                    switcher.classList.remove('page-1');
                    switcher.classList.add('page-2');
                } else if (switcher && switcher.classList.contains('page-2')) {
                    switcher.classList.remove('page-2');
                    switcher.classList.add('page-1');
                }

                // Wait for the slider to animate, then navigate cleanly
                setTimeout(() => {
                    window.location.href = targetHref;
                }, 350);
            }
        });
    });

    // ─── Reveal On Scroll Animation ────────────────────────────────
    const revealElements = document.querySelectorAll('.reveal');

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                entry.target.classList.remove('active');
            }
        });
    };

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);
    revealElements.forEach(el => revealObserver.observe(el));

    // Immediately reveal hero content already in viewport
    setTimeout(() => {
        const topElements = document.querySelectorAll('.hero-content.reveal');
        topElements.forEach(el => el.classList.add('active'));
    }, 100);

    // ─── Copyright Year (Safe Check) ───────────────────────────────
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ─── Navbar: scroll effects + progress bar ─────────────────────
    const navbar = document.querySelector('.navbar');
    const heroSection = document.querySelector('.hero');
    const pageSwitcher = document.querySelector('.page-switcher-wrapper');

    window.addEventListener('scroll', () => {
        // Frosted glass background toggle
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
            if (pageSwitcher) pageSwitcher.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
            if (pageSwitcher) pageSwitcher.classList.remove('scrolled');
        }

        // Progress bar mapped to hero section scroll
        const heroHeight = heroSection ? heroSection.offsetHeight : 500;
        let scrollPct = 0;
        if (heroHeight > 0) {
            scrollPct = Math.min((window.scrollY / heroHeight) * 100, 100);
        }
        navbar.style.setProperty('--scroll-progress', `${scrollPct}%`);
    });

    // ─── Comparison Slider ─────────────────────────────────────────
    const comparisonSlider = document.getElementById('comparison-slider');
    const comparisonWrapper = document.querySelector('.comparison-wrapper');
    
    if (comparisonSlider && comparisonWrapper) {
        comparisonSlider.addEventListener('input', (e) => {
            comparisonWrapper.style.setProperty('--exposure', `${e.target.value}%`);
        });
    }

    // ─── Theme Toggle ──────────────────────────────────────────────
    const themeBtn = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    const root = document.documentElement;

    // Load saved preference
    if (localStorage.getItem('theme') === 'light') {
        root.setAttribute('data-theme', 'light');
        if (moonIcon && sunIcon) {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        }
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            if (root.getAttribute('data-theme') === 'light') {
                root.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
                if (moonIcon && sunIcon) {
                    moonIcon.style.display = 'block';
                    sunIcon.style.display = 'none';
                }
            } else {
                root.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if (moonIcon && sunIcon) {
                    moonIcon.style.display = 'none';
                    sunIcon.style.display = 'block';
                }
            }
        });
    }

    // ─── Language Toggle ───────────────────────────────────────────
    const langBtn = document.getElementById('lang-toggle');
    const body = document.body;

    // Load saved preference or default to Italian
    let currentLang = localStorage.getItem('lang') || 'it';
    body.classList.remove('lang-it', 'lang-en');
    body.classList.add(`lang-${currentLang}`);
    
    if (langBtn) {
        // Init button text (show the OTHER language option)
        langBtn.textContent = currentLang === 'it' ? 'EN' : 'IT';

        langBtn.addEventListener('click', () => {
            body.classList.remove(`lang-${currentLang}`);
            currentLang = currentLang === 'it' ? 'en' : 'it';
            body.classList.add(`lang-${currentLang}`);
            localStorage.setItem('lang', currentLang);
            langBtn.textContent = currentLang === 'it' ? 'EN' : 'IT';
        });
    }

    // ─── Reference Dropdown Toggles ──────────────────────────────────
    document.querySelectorAll('.ref-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const refId = trigger.getAttribute('data-ref');
            const dropdown = document.getElementById(refId);
            if (!dropdown) return;

            // If this dropdown is already open, just close it
            if (dropdown.classList.contains('open')) {
                dropdown.classList.remove('open');
                return;
            }

            // Close all other open dropdowns first
            document.querySelectorAll('.ref-dropdown.open').forEach(open => {
                open.classList.remove('open');
            });

            // Open the target dropdown
            dropdown.classList.add('open');
        });
    });

    // ─── Trigger initial state ─────────────────────────────────────
    window.dispatchEvent(new Event('scroll'));
});

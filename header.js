/**
 * Professional header interaction functionality for Legal Nomicon
 * Handles mobile menu toggle, scroll effects, and micro-interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const header = document.querySelector('header');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu li a');
    const navButtons = document.querySelectorAll('.nav-buttons .btn');
    
    // Mobile menu toggle functionality with animation
    if (mobileMenuBtn && navMenu) {
        // Set initial aria state
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-controls', 'nav-menu');
        navMenu.setAttribute('id', 'nav-menu');
        
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Accessibility - update aria attributes
            const expanded = navMenu.classList.contains('active');
            mobileMenuBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            
            // Toggle icon if needed
            if (mobileMenuBtn.querySelector('i')) {
                const icon = mobileMenuBtn.querySelector('i');
                if (expanded) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
    
    // Add scroll effect to header with smooth transition
    let lastScrollTop = 0;
    const scrollThreshold = 50;
    
    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add scrolled class when scrolling down past threshold
        if (scrollTop > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    }
    
    // Initial check on page load
    handleScroll();
    
    // Listen for scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (navMenu && navMenu.classList.contains('active') && 
            !navMenu.contains(event.target) && 
            !mobileMenuBtn.contains(event.target)) {
            navMenu.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            
            // Reset icon
            if (mobileMenuBtn.querySelector('i')) {
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
    
    // Add active state to current page link
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath || 
            (currentPath.endsWith('/') && linkPath === currentPath.slice(0, -1)) ||
            (currentPath === '/' && linkPath === 'index.html')) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
});

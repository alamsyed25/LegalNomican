document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        // Close mobile menu when clicking outside
        if (!event.target.closest('nav') && navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (navMenu && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            }
        });
    });
    
    // Add animation on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.feature-card, .security-feature, .stat-item, .preview-feature');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight - 100) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };
    
    // Set initial state for animation
    document.querySelectorAll('.feature-card, .security-feature, .stat-item, .preview-feature').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Run animation on load and scroll
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);
    
    // Demo Form Handling
    const demoForm = document.getElementById('demoForm');
    const submitButton = document.getElementById('submitButton');
    const formMessage = document.getElementById('formMessage');
    
    if (demoForm) {
        // Form state management
        const formState = {
            firstName: '',
            lastName: '',
            workEmail: '',
            companyName: '',
            jobTitle: '',
            firmSize: '',
            useCase: '',
            phoneNumber: '',
            isSubmitting: false,
            hasError: false,
            errorMessage: '',
            successMessage: ''
        };
        
        // Handle input changes
        const handleInputChange = (e) => {
            const { name, value } = e.target;
            formState[name] = value;
        };
        
        // Add event listeners to all form inputs
        const formInputs = demoForm.querySelectorAll('input, select');
        formInputs.forEach(input => {
            input.addEventListener('change', handleInputChange);
            input.addEventListener('input', handleInputChange);
        });
        
        // Form validation
        const validateForm = () => {
            // Reset error state
            formState.hasError = false;
            formState.errorMessage = '';
            
            // Required fields
            const requiredFields = [
                { name: 'firstName', label: 'First Name' },
                { name: 'lastName', label: 'Last Name' },
                { name: 'workEmail', label: 'Work Email' },
                { name: 'companyName', label: 'Company/Firm Name' },
                { name: 'jobTitle', label: 'Job Title' },
                { name: 'firmSize', label: 'Firm Size' },
                { name: 'useCase', label: 'Primary Use Case' }
            ];
            
            // Check required fields
            for (const field of requiredFields) {
                if (!formState[field.name]) {
                    formState.hasError = true;
                    formState.errorMessage = `${field.label} is required`;
                    return false;
                }
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formState.workEmail)) {
                formState.hasError = true;
                formState.errorMessage = 'Please enter a valid email address';
                return false;
            }
            
            return true;
        };
        
        // Form submission
        demoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Don't submit if already submitting
            if (formState.isSubmitting) return;
            
            // Validate form
            if (!validateForm()) {
                showFormMessage(formState.errorMessage, 'error');
                return;
            }
            
            // Set submitting state
            formState.isSubmitting = true;
            submitButton.classList.add('loading');
            
            try {
                // Simulate API call with timeout
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Success
                formState.successMessage = 'Thank you! We will contact you shortly to schedule your demo.';
                showFormMessage(formState.successMessage, 'success');
                
                // Reset form
                demoForm.reset();
                Object.keys(formState).forEach(key => {
                    if (key !== 'isSubmitting' && key !== 'hasError' && key !== 'errorMessage' && key !== 'successMessage') {
                        formState[key] = '';
                    }
                });
            } catch (error) {
                // Error
                formState.hasError = true;
                formState.errorMessage = 'There was an error submitting your request. Please try again.';
                showFormMessage(formState.errorMessage, 'error');
            } finally {
                // Reset submitting state
                formState.isSubmitting = false;
                submitButton.classList.remove('loading');
            }
        });
        
        // Show form message
        function showFormMessage(message, type) {
            formMessage.textContent = message;
            formMessage.className = 'form-message';
            formMessage.classList.add(type);
            
            // Scroll to message
            formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Hide message after 5 seconds if it's a success message
            if (type === 'success') {
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            }
        }
    }
});

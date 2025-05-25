document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const elements = {
        mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
        navMenu: document.querySelector('.nav-menu'),
        demoForm: document.getElementById('demoForm'),
        submitButton: document.getElementById('submitButton'),
        formMessage: document.getElementById('formMessage'),
        animatedElements: document.querySelectorAll('.feature-card, .security-feature, .stat-item, .preview-feature')
    };

    // Mobile menu handling
    if (elements.mobileMenuBtn && elements.navMenu) {
        elements.mobileMenuBtn.addEventListener('click', () => {
            elements.navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!event.target.closest('nav') && elements.navMenu.classList.contains('active')) {
                elements.navMenu.classList.remove('active');
            }
        });
    }

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
                elements.navMenu?.classList.remove('active');
            }
        });
    });

    // Scroll animations
    const animateOnScroll = () => {
        elements.animatedElements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const shouldAnimate = elementPosition < window.innerHeight - 100;
            element.style.opacity = shouldAnimate ? '1' : '0';
            element.style.transform = shouldAnimate ? 'translateY(0)' : 'translateY(20px)';
        });
    };

    // Initialize animations
    elements.animatedElements.forEach(element => {
        Object.assign(element.style, {
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease'
        });
    });

    // Form handling
    if (elements.demoForm) {
        const formState = {
            data: {
                firstName: '',
                lastName: '',
                workEmail: '',
                companyName: '',
                jobTitle: '',
                firmSize: '',
                useCase: '',
                phoneNumber: ''
            },
            isSubmitting: false
        };

        // Form validation
        const validateForm = () => {
            const requiredFields = [
                ['firstName', 'First Name'],
                ['lastName', 'Last Name'],
                ['workEmail', 'Work Email'],
                ['companyName', 'Company/Firm Name'],
                ['jobTitle', 'Job Title'],
                ['firmSize', 'Firm Size'],
                ['useCase', 'Primary Use Case']
            ];

            // Check required fields
            const missingField = requiredFields.find(([key, label]) => !formState.data[key]);
            if (missingField) {
                return { isValid: false, message: `${missingField[1]} is required` };
            }

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formState.data.workEmail)) {
                return { isValid: false, message: 'Please enter a valid email address' };
            }

            return { isValid: true };
        };

        // Show form message
        const showFormMessage = (message, type) => {
            Object.assign(elements.formMessage, {
                textContent: message,
                className: `form-message ${type}`
            });

            elements.formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            if (type === 'success') {
                setTimeout(() => {
                    elements.formMessage.style.display = 'none';
                }, 5000);
            }
        };

        // Handle form submission
        elements.demoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (formState.isSubmitting) return;

            const validation = validateForm();
            if (!validation.isValid) {
                showFormMessage(validation.message, 'error');
                return;
            }

            formState.isSubmitting = true;
            elements.submitButton.classList.add('loading');

            try {
                // Real API call
                const response = await fetch('/api/submit-demo-form', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formState.data)
                });

                const result = await response.json();
                
                if (result.success) {
                    showFormMessage('Thank you! Redirecting to demo...', 'success');
                    // Redirect to demo page after 1.5 seconds
                    setTimeout(() => {
                        window.location.href = result.demoUrl;
                    }, 1500);
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                showFormMessage('There was an error submitting your request. Please try again.', 'error');
            } finally {
                formState.isSubmitting = false;
                elements.submitButton.classList.remove('loading');
            }
        });

        // Handle input changes
        elements.demoForm.querySelectorAll('input, select').forEach(input => {
            const handleChange = ({ target }) => {
                formState.data[target.name] = target.value;
            };
            input.addEventListener('change', handleChange);
            input.addEventListener('input', handleChange);
        });
    }

    // Initialize animations
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);
});

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const elements = {
        mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
        navMenu: document.querySelector('.nav-menu'),
        demoForm: document.getElementById('demoForm'),
        submitButton: document.getElementById('submitButton'),
        formMessage: document.getElementById('formMessage'),
        animatedElements: document.querySelectorAll('.feature-card, .security-feature, .stat-item, .preview-feature, .pricing-card'),
        pricingCards: document.querySelectorAll('.pricing-card'),
        pricingButtons: document.querySelectorAll('.pricing-nav-btn'),
        faqItems: document.querySelectorAll('.faq-item')
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
    
    // Pricing section functionality
    if (elements.pricingCards.length > 0) {
        // Add hover effects to pricing cards
        elements.pricingCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (!card.classList.contains('popular')) {
                    card.style.transform = 'translateY(-10px)';
                    card.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.2)';
                } else {
                    card.style.transform = 'scale(1.05) translateY(-10px)';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                if (!card.classList.contains('popular')) {
                    card.style.transform = 'translateY(0)';
                    card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                } else {
                    card.style.transform = 'scale(1.05)';
                }
            });
        });
        
        // Add click event to pricing buttons
        const trialButtons = document.querySelectorAll('.pricing-btn');
        trialButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (button.textContent.includes('Free Trial')) {
                    e.preventDefault();
                    // Show a simple modal or alert for free trial
                    alert('Thank you for your interest! Your free trial will begin after you complete a short registration form.');
                    // Redirect to contact form
                    setTimeout(() => {
                        const contactSection = document.querySelector('#contact');
                        if (contactSection) {
                            contactSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 500);
                }
            });
        });
    }
    
    // FAQ functionality
    if (elements.faqItems.length > 0) {
        elements.faqItems.forEach(item => {
            const question = item.querySelector('h4');
            const answer = item.querySelector('p');
            
            // Add click event to expand/collapse FAQ items
            question.addEventListener('click', () => {
                const isExpanded = item.classList.contains('expanded');
                
                // Close all other items
                elements.faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('expanded');
                        const otherAnswer = otherItem.querySelector('p');
                        otherAnswer.style.maxHeight = '0';
                    }
                });
                
                // Toggle current item
                if (isExpanded) {
                    item.classList.remove('expanded');
                    answer.style.maxHeight = '0';
                } else {
                    item.classList.add('expanded');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            });
            
            // Initialize FAQ items (collapsed by default)
            answer.style.maxHeight = '0';
            answer.style.overflow = 'hidden';
            answer.style.transition = 'max-height 0.3s ease';
            question.style.cursor = 'pointer';
        });
    }
});

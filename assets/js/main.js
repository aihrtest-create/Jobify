/**
 * InterviewEcho - Main JavaScript
 * Handles form interactions, navigation, and accessibility features
 */

// DOM Elements
const heroCtaButton = document.querySelector('.hero__cta');
const formElement = document.querySelector('form');
const jobLinkInput = document.getElementById('job-link');
const jobDescriptionInput = document.getElementById('job-description');
const interactiveElements = document.querySelectorAll('button, a, input, textarea');

// Event Handlers
const handleHeroCtaClick = (event) => {
  event.preventDefault();
  const formSection = document.getElementById('form');
  
  if (formSection) {
    formSection.scrollIntoView({
      behavior: 'smooth'
    });
    formSection.focus();
  }
};

const handleFormSubmit = (event) => {
  event.preventDefault();
  
  const jobLink = jobLinkInput?.value?.trim() || '';
  const jobDescription = jobDescriptionInput?.value?.trim() || '';
  
  if (!jobDescription) {
    alert('Пожалуйста, введите описание вакансии');
    jobDescriptionInput?.focus();
    return;
  }
  
  // Simulate form submission
  const submitButton = event.target.querySelector('.form-button');
  const originalText = submitButton?.textContent;
  
  if (submitButton) {
    submitButton.textContent = 'Отправляем...';
    submitButton.disabled = true;
  }
  
  setTimeout(() => {
    alert('Форма отправлена! (Это демо версия)');
    
    if (submitButton) {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
    
    // Reset form
    if (formElement) {
      formElement.reset();
    }
  }, 1000);
};

const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    
    if (event.target.tagName === 'BUTTON' || event.target.classList.contains('nav__item')) {
      event.target.click();
    }
  }
};

const handleInputFocus = (event) => {
  event.target.parentElement?.classList.add('focused');
};

const handleInputBlur = (event) => {
  event.target.parentElement?.classList.remove('focused');
};

// Utility Functions
const addFocusStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .form-group.focused .form-input {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
    }
  `;
  document.head.appendChild(style);
};

const initializeAccessibility = () => {
  // Add ARIA attributes if missing
  if (heroCtaButton && !heroCtaButton.getAttribute('aria-label')) {
    heroCtaButton.setAttribute('aria-label', 'Начать бесплатно');
  }
  
  if (formElement && !formElement.getAttribute('aria-labelledby')) {
    const formTitle = document.getElementById('form-title');
    if (formTitle) {
      formElement.setAttribute('aria-labelledby', 'form-title');
    }
  }
  
  // Add tabindex to interactive elements if missing
  interactiveElements.forEach(element => {
    if (!element.hasAttribute('tabindex') && element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
      element.setAttribute('tabindex', '0');
    }
  });
};

const initializeEventListeners = () => {
  // Hero CTA button
  if (heroCtaButton) {
    heroCtaButton.addEventListener('click', handleHeroCtaClick);
    heroCtaButton.addEventListener('keydown', handleKeyDown);
  }
  
  // Form submission
  if (formElement) {
    formElement.addEventListener('submit', handleFormSubmit);
  }
  
  // Input focus/blur handlers
  if (jobLinkInput) {
    jobLinkInput.addEventListener('focus', handleInputFocus);
    jobLinkInput.addEventListener('blur', handleInputBlur);
  }
  
  if (jobDescriptionInput) {
    jobDescriptionInput.addEventListener('focus', handleInputFocus);
    jobDescriptionInput.addEventListener('blur', handleInputBlur);
  }
  
  // Keyboard navigation for interactive elements
  interactiveElements.forEach(element => {
    element.addEventListener('keydown', handleKeyDown);
  });
};

const initializeApp = () => {
  try {
    addFocusStyles();
    initializeAccessibility();
    initializeEventListeners();
    
    console.log('InterviewEcho app initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleHeroCtaClick,
    handleFormSubmit,
    handleKeyDown,
    initializeApp
  };
}

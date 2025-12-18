/**
 * Main JavaScript File
 * Handles common functionality across all pages
 */

// Initialize header functionality
function initHeader() {
    const header = $('#main-header');
    const mobileMenuToggle = $('#mobile-menu-toggle');
    const mobileNav = $('#mobile-nav');
    
    // Scroll handler for header
    let scrollTimer;
    $(window).on('scroll', function() {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function() {
            if ($(window).scrollTop() > 20) {
                header.addClass('scrolled');
            } else {
                header.removeClass('scrolled');
            }
        }, 10);
    });
    
    // Mobile menu toggle
    mobileMenuToggle.on('click', function() {
        mobileNav.toggleClass('active');
        const isActive = mobileNav.hasClass('active');
        mobileMenuToggle.attr('aria-expanded', isActive);
        mobileMenuToggle.attr('aria-label', isActive ? '메뉴 닫기' : '메뉴 열기');
    });
    
    // Close mobile menu when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.header-content, .mobile-nav').length) {
            mobileNav.removeClass('active');
            mobileMenuToggle.attr('aria-expanded', 'false');
        }
    });
    
    // Close mobile menu when clicking a link
    $('.mobile-nav-link').on('click', function() {
        mobileNav.removeClass('active');
        mobileMenuToggle.attr('aria-expanded', 'false');
    });
}

// Initialize reveal animations
function initRevealAnimations() {
    const revealElements = $('.reveal, .reveal-up, .reveal-down, .reveal-left, .reveal-right, .reveal-fade');
    
    // Check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= -100 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 100 &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Reveal elements on scroll
    function checkReveal() {
        revealElements.each(function() {
            const $el = $(this);
            if (!$el.hasClass('revealed') && isInViewport(this)) {
                $el.addClass('revealed');
            }
        });
    }
    
    // Initial check
    checkReveal();
    
    // Check on scroll (debounced)
    let scrollTimer;
    $(window).on('scroll', function() {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(checkReveal, 10);
    });
    
    // Check on resize
    $(window).on('resize', checkReveal);
}

// Initialize stagger animations
function initStaggerAnimations() {
    const staggerContainers = $('.stagger-container');
    
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= -50 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 50 &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    function checkStagger() {
        staggerContainers.each(function() {
            const $container = $(this);
            if (!$container.hasClass('revealed') && isInViewport(this)) {
                $container.addClass('revealed');
                
                // Animate children with delay
                const $items = $container.find('.stagger-item');
                $items.each(function(index) {
                    const $item = $(this);
                    setTimeout(function() {
                        $item.css({
                            'transition-delay': (index * 0.1) + 's'
                        });
                    }, 10);
                });
            }
        });
    }
    
    checkStagger();
    
    let scrollTimer;
    $(window).on('scroll', function() {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(checkStagger, 10);
    });
    
    $(window).on('resize', checkStagger);
}

// Initialize card hover effects
function initCardEffects() {
    $('.card-elevated').on('mouseenter', function() {
        $(this).css('transform', 'translateY(-8px)');
    }).on('mouseleave', function() {
        $(this).css('transform', 'translateY(0)');
    });
}

// Initialize button animations
function initButtonAnimations() {
    $('.btn-animated').on('mouseenter', function() {
        $(this).css('transform', 'scale(1.02)');
    }).on('mouseleave', function() {
        $(this).css('transform', 'scale(1)');
    }).on('mousedown', function() {
        $(this).css('transform', 'scale(0.98)');
    }).on('mouseup', function() {
        $(this).css('transform', 'scale(1.02)');
    });
}

// Initialize accordion
function initAccordion() {
    $('.accordion-trigger').on('click', function() {
        const $item = $(this).closest('.accordion-item');
        const isActive = $item.hasClass('active');
        
        // Close all items
        $('.accordion-item').removeClass('active');
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            $item.addClass('active');
        }
    });
}

// Initialize modal
function initModal() {
    // Open modal
    $('.modal-trigger').on('click', function(e) {
        e.preventDefault();
        const modalId = $(this).data('modal');
        $('#' + modalId).addClass('active');
        $('body').css('overflow', 'hidden');
    });
    
    // Close modal
    $('.modal-close, .modal-overlay').on('click', function(e) {
        if ($(e.target).hasClass('modal-overlay') || $(e.target).hasClass('modal-close')) {
            $(this).closest('.modal-overlay').removeClass('active');
            $('body').css('overflow', '');
        }
    });
    
    // Close on ESC key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            $('.modal-overlay').removeClass('active');
            $('body').css('overflow', '');
        }
    });
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility: Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Initialize all common functionality
$(document).ready(function() {
    initRevealAnimations();
    initStaggerAnimations();
    initCardEffects();
    initButtonAnimations();
    initAccordion();
    initModal();
    
    // Add animated class to buttons
    $('.btn').addClass('btn-animated');
    
    // Add card-elevated class to cards
    $('.card').addClass('card-elevated');
});



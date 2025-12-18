/**
 * Advanced Animations JavaScript
 * Handles complex animations and interactions
 */

// Smooth scroll to element
function smoothScrollTo(target, offset = 80) {
    const $target = $(target);
    if ($target.length) {
        $('html, body').animate({
            scrollTop: $target.offset().top - offset
        }, 600, 'swing');
    }
}

// Parallax effect for hero sections (disabled for performance)
function initParallax() {
    // Parallax effect disabled to improve scroll performance
    // If needed, use CSS-only parallax with background-attachment: fixed
    return;
}

// Spring animation simulation using CSS cubic-bezier
function springAnimation(element, properties, duration = 300) {
    const $el = $(element);
    const originalTransition = $el.css('transition');
    
    $el.css({
        'transition': 'all ' + duration + 'ms cubic-bezier(0.34, 1.56, 0.64, 1)'
    });
    
    $el.css(properties);
    
    setTimeout(function() {
        $el.css('transition', originalTransition);
    }, duration);
}

// Stagger children animation
function staggerChildren(container, delay = 100) {
    const $container = $(container);
    const $children = $container.children();
    
    $children.each(function(index) {
        const $child = $(this);
        setTimeout(function() {
            $child.addClass('fade-in');
        }, index * delay);
    });
}

// Counter animation
function animateCounter(element, target, duration = 2000) {
    const $el = $(element);
    const start = parseInt($el.text()) || 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(function() {
        current += increment;
        if (current >= target) {
            $el.text(target);
            clearInterval(timer);
        } else {
            $el.text(Math.floor(current));
        }
    }, 16);
}

// Typing effect
function typeText(element, text, speed = 50) {
    const $el = $(element);
    $el.text('');
    let i = 0;
    
    const timer = setInterval(function() {
        if (i < text.length) {
            $el.text($el.text() + text.charAt(i));
            i++;
        } else {
            clearInterval(timer);
        }
    }, speed);
}

// Fade in on scroll with offset
function initFadeInScroll() {
    const $elements = $('.fade-in-scroll');
    
    function checkFade() {
        $elements.each(function() {
            const $el = $(this);
            const elementTop = $el.offset().top;
            const elementBottom = elementTop + $el.outerHeight();
            const viewportTop = $(window).scrollTop();
            const viewportBottom = viewportTop + $(window).height();
            
            if (elementBottom > viewportTop && elementTop < viewportBottom) {
                $el.addClass('fade-in');
            }
        });
    }
    
    checkFade();
    $(window).on('scroll', debounce(checkFade, 10));
}

// Magnetic button effect
function initMagneticButtons() {
    $('.magnetic-btn').on('mousemove', function(e) {
        const $btn = $(this);
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        $btn.css({
            'transform': 'translate(' + (x * 0.3) + 'px, ' + (y * 0.3) + 'px)'
        });
    }).on('mouseleave', function() {
        $(this).css('transform', 'translate(0, 0)');
    });
}

// Ripple effect on click
function initRippleEffect() {
    $('.ripple-effect').on('click', function(e) {
        const $btn = $(this);
        const $ripple = $('<span>').addClass('ripple');
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        $ripple.css({
            width: size + 'px',
            height: size + 'px',
            left: x + 'px',
            top: y + 'px'
        });
        
        $btn.append($ripple);
        
        setTimeout(function() {
            $ripple.remove();
        }, 600);
    });
}

// 3D tilt effect
function initTiltEffect() {
    $('.tilt-effect').on('mousemove', function(e) {
        const $card = $(this);
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        $card.css({
            'transform': 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)'
        });
    }).on('mouseleave', function() {
        $(this).css('transform', 'perspective(1000px) rotateX(0) rotateY(0)');
    });
}

// Page transition
function pageTransition(url) {
    $('body').addClass('page-transition-exit');
    
    setTimeout(function() {
        window.location.href = url;
    }, 300);
}

// Initialize all advanced animations
$(document).ready(function() {
    initParallax();
    initFadeInScroll();
    initMagneticButtons();
    initRippleEffect();
    initTiltEffect();
    
    // Add ripple effect to buttons
    $('.btn').addClass('ripple-effect');
});

// CSS for ripple effect
const rippleStyle = `
    .ripple-effect {
        position: relative;
        overflow: hidden;
    }
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;

// Inject ripple styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = rippleStyle;
    document.head.appendChild(style);
}



/**
 * Authentication JavaScript
 * Handles login, signup, and authentication-related functionality
 * Backend API ready for connection
 */

// API Configuration
const API_CONFIG = {
    baseURL: '/api', // Change this to your backend API URL
    endpoints: {
        login: '/auth/login',
        signup: '/auth/signup',
        logout: '/auth/logout',
        verify: '/auth/verify',
        refresh: '/auth/refresh'
    }
};

// Initialize login form
function initLoginForm() {
    const $form = $('#login-form');
    
    if ($form.length) {
        $form.validate({
            rules: {
                email: {
                    required: true,
                    email: true
                },
                password: {
                    required: true,
                    minlength: 6
                }
            },
            messages: {
                email: {
                    required: '이메일을 입력해주세요',
                    email: '올바른 이메일을 입력해주세요'
                },
                password: {
                    required: '비밀번호를 입력해주세요',
                    minlength: '비밀번호는 최소 6자 이상이어야 합니다'
                }
            },
            errorClass: 'error',
            errorElement: 'span',
            errorPlacement: function(error, element) {
                error.addClass('form-error');
                error.insertAfter(element);
            },
            submitHandler: function(form) {
                handleLogin(form);
            }
        });
    }
}

// Initialize signup form
function initSignupForm() {
    const $form = $('#signup-form');
    
    if ($form.length) {
        $form.validate({
            rules: {
                email: {
                    required: true,
                    email: true
                },
                password: {
                    required: true,
                    minlength: 6
                },
                confirmPassword: {
                    required: true,
                    minlength: 6,
                    equalTo: '#password'
                },
                agreeToTerms: {
                    required: true
                }
            },
            messages: {
                email: {
                    required: '이메일을 입력해주세요',
                    email: '올바른 이메일을 입력해주세요'
                },
                password: {
                    required: '비밀번호를 입력해주세요',
                    minlength: '비밀번호는 최소 6자 이상이어야 합니다'
                },
                confirmPassword: {
                    required: '비밀번호 확인을 입력해주세요',
                    minlength: '비밀번호는 최소 6자 이상이어야 합니다',
                    equalTo: '비밀번호가 일치하지 않습니다'
                },
                agreeToTerms: {
                    required: '약관에 동의해주세요'
                }
            },
            errorClass: 'error',
            errorElement: 'span',
            errorPlacement: function(error, element) {
                error.addClass('form-error');
                if (element.attr('type') === 'checkbox') {
                    error.insertAfter(element.parent());
                } else {
                    error.insertAfter(element);
                }
            },
            submitHandler: function(form) {
                handleSignup(form);
            }
        });
    }
}

// Handle login
function handleLogin(form) {
    const $form = $(form);
    const $submitBtn = $form.find('button[type="submit"]');
    const $errorMsg = $form.find('.error-message');
    
    // Disable submit button
    $submitBtn.prop('disabled', true).html('<span class="spinner"></span> 처리 중...');
    $errorMsg.hide();
    
    const formData = {
        email: $('#email').val(),
        password: $('#password').val()
    };
    
    // API Call - Replace with your backend endpoint
    $.ajax({
        url: API_CONFIG.baseURL + API_CONFIG.endpoints.login,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                // Store auth token if provided
                if (response.token) {
                    localStorage.setItem('authToken', response.token);
                    localStorage.setItem('userEmail', response.email);
                    localStorage.setItem('isLoggedIn', 'true');
                } else {
                    // Fallback: local storage only (for development)
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userEmail', formData.email);
                }
                
                // Show success message
                showSuccessMessage('로그인 성공!');
                
                // Redirect to home page
                setTimeout(function() {
                    window.location.href = '../index.html';
                }, 1000);
            } else {
                showError(response.message || '로그인에 실패했습니다.');
                $submitBtn.prop('disabled', false).text('로그인');
            }
        },
        error: function(xhr) {
            let errorMessage = '로그인 중 오류가 발생했습니다.';
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            } else if (xhr.status === 401) {
                errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
            } else if (xhr.status === 0) {
                // CORS or network error - use fallback
                console.warn('API connection failed, using fallback');
                handleLoginFallback(formData);
                return;
            }
            
            showError(errorMessage);
            $submitBtn.prop('disabled', false).text('로그인');
        }
    });
}

// Handle signup
function handleSignup(form) {
    const $form = $(form);
    const $submitBtn = $form.find('button[type="submit"]');
    const $errorMsg = $form.find('.error-message');
    
    // Disable submit button
    $submitBtn.prop('disabled', true).html('<span class="spinner"></span> 처리 중...');
    $errorMsg.hide();
    
    const formData = {
        email: $('#email').val(),
        password: $('#password').val(),
        confirmPassword: $('#confirmPassword').val()
    };
    
    // API Call - Replace with your backend endpoint
    $.ajax({
        url: API_CONFIG.baseURL + API_CONFIG.endpoints.signup,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                // Store auth token if provided
                if (response.token) {
                    localStorage.setItem('authToken', response.token);
                    localStorage.setItem('userEmail', response.email);
                    localStorage.setItem('isLoggedIn', 'true');
                } else {
                    // Fallback: local storage only (for development)
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userEmail', formData.email);
                }
                
                // Show success message
                showSuccessMessage('회원가입 성공!');
                
                // Redirect to home page
                setTimeout(function() {
                    window.location.href = '../index.html';
                }, 1000);
            } else {
                showError(response.message || '회원가입에 실패했습니다.');
                $submitBtn.prop('disabled', false).text('회원가입');
            }
        },
        error: function(xhr) {
            let errorMessage = '회원가입 중 오류가 발생했습니다.';
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            } else if (xhr.status === 409) {
                errorMessage = '이미 등록된 이메일입니다.';
            } else if (xhr.status === 0) {
                // CORS or network error - use fallback
                console.warn('API connection failed, using fallback');
                handleSignupFallback(formData);
                return;
            }
            
            showError(errorMessage);
            $submitBtn.prop('disabled', false).text('회원가입');
        }
    });
}

// Fallback login (for development/testing without backend)
function handleLoginFallback(formData) {
    // Store in localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', formData.email);
    
    showSuccessMessage('로그인 성공! (개발 모드)');
    
    setTimeout(function() {
        window.location.href = '../index.html';
    }, 1000);
}

// Fallback signup (for development/testing without backend)
function handleSignupFallback(formData) {
    // Store user data in localStorage for admin viewing
    const userData = {
        id: Date.now().toString(),
        email: formData.email,
        registeredAt: new Date().toISOString(),
        status: 'active'
    };
    
    // Get existing users from localStorage
    let users = [];
    try {
        const stored = localStorage.getItem('users');
        if (stored) {
            users = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error reading users:', e);
    }
    
    // Check if email already exists
    const existingUser = users.find(u => u.email === formData.email);
    if (existingUser) {
        showError('이미 등록된 이메일입니다.');
        return;
    }
    
    // Add new user
    users.push(userData);
    
    // Save back to localStorage
    try {
        localStorage.setItem('users', JSON.stringify(users));
        console.log('User registered:', userData);
    } catch (e) {
        console.error('Error saving user:', e);
    }
    
    // Store in localStorage for login
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', formData.email);
    
    showSuccessMessage('회원가입 성공! (개발 모드)');
    
    setTimeout(function() {
        window.location.href = '../index.html';
    }, 1000);
}

// Show error message
function showError(message) {
    const $errorMsg = $('.error-message');
    if ($errorMsg.length) {
        $errorMsg.text(message).show().addClass('fade-in');
    } else {
        // Create error message element
        const $error = $('<div>')
            .addClass('error-message alert alert-error')
            .text(message);
        $('form').prepend($error);
        setTimeout(function() {
            $error.addClass('fade-in');
        }, 10);
    }
}

// Show success message
function showSuccessMessage(message) {
    const $success = $('<div>')
        .addClass('success-message alert alert-success')
        .text(message);
    $('body').append($success);
    $success.addClass('fade-in');
    
    setTimeout(function() {
        $success.remove();
    }, 3000);
}

// Toggle password visibility
function initPasswordToggle() {
    $('.toggle-password').on('click', function() {
        const $btn = $(this);
        const $input = $btn.siblings('input');
        const type = $input.attr('type') === 'password' ? 'text' : 'password';
        
        $input.attr('type', type);
        $btn.toggleClass('eye-off');
    });
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Logout
function logout() {
    // Call logout API if token exists
    const token = getAuthToken();
    if (token) {
        $.ajax({
            url: API_CONFIG.baseURL + API_CONFIG.endpoints.logout,
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }).always(function() {
            // Clear local storage regardless of API call result
            localStorage.removeItem('authToken');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
            window.location.href = '../index.html';
        });
    } else {
        // Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        window.location.href = '../index.html';
    }
}

// Initialize all auth functionality
$(document).ready(function() {
    initLoginForm();
    initSignupForm();
    initPasswordToggle();
    
    // Check login status and update UI
    if (isLoggedIn()) {
        $('.login-status').text('로그아웃');
        $('.login-status').attr('href', '#').on('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});



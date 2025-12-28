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
        // 한국 전화번호 검증 메서드 추가
        $.validator.addMethod("phoneKR", function(value, element) {
            // 숫자만 추출
            const phoneNumber = value.replace(/[^0-9]/g, '');
            // 10자리 또는 11자리 숫자인지 확인
            if (phoneNumber.length < 10 || phoneNumber.length > 11) {
                return false;
            }
            // 010, 011, 016, 017, 018, 019로 시작하는지 확인
            return /^01[0-9]/.test(phoneNumber);
        }, "올바른 전화번호 형식을 입력해주세요 (예: 010-1234-5678)");
        
        $form.validate({
            rules: {
                name: {
                    required: true,
                    minlength: 2
                },
                phone: {
                    required: true,
                    phoneKR: true
                },
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
                name: {
                    required: '이름을 입력해주세요',
                    minlength: '이름은 최소 2자 이상이어야 합니다'
                },
                phone: {
                    required: '이동전화번호를 입력해주세요',
                    phoneKR: '올바른 전화번호 형식을 입력해주세요 (예: 010-1234-5678)'
                },
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
                console.log('Form validation passed, submitting...');
                handleSignup(form);
            },
            invalidHandler: function(event, validator) {
                console.log('Form validation failed');
                console.log('Errors:', validator.errorList);
                // 첫 번째 에러 메시지를 상단에 표시
                const firstError = validator.errorList[0];
                if (firstError) {
                    const $errorMsg = $('.error-message');
                    if ($errorMsg.length) {
                        $errorMsg.text(firstError.message).show();
                    }
                }
            }
        });
    }
}

// Handle login (로컬 저장소 기반)
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
    
    // 로컬 저장소 기반 로그인 처리
    handleLoginFallback(formData);
}

// Handle signup (로컬 저장소 기반)
function handleSignup(form) {
    console.log('handleSignup called');
    const $form = $(form);
    const $submitBtn = $form.find('button[type="submit"]');
    const $errorMsg = $form.find('.error-message');
    
    // Disable submit button
    $submitBtn.prop('disabled', true).html('<span class="spinner"></span> 처리 중...');
    $errorMsg.hide();
    
    const formData = {
        name: $('#name').val(),
        phone: $('#phone').val(),
        email: $('#email').val(),
        password: $('#password').val(),
        confirmPassword: $('#confirmPassword').val()
    };
    
    console.log('Form data:', formData);
    
    // 로컬 저장소 기반 회원가입 처리
    handleSignupFallback(formData);
}

// 로컬 저장소 기반 로그인 처리
function handleLoginFallback(formData) {
    const $form = $('#login-form');
    const $submitBtn = $form ? $form.find('button[type="submit"]') : null;
    
    try {
        // 로컬 저장소에서 사용자 목록 가져오기
        let users = [];
        try {
            const stored = localStorage.getItem('users');
            if (stored) {
                users = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error reading users:', e);
            showError('사용자 데이터를 읽는 중 오류가 발생했습니다.');
            if ($submitBtn) {
                $submitBtn.prop('disabled', false).text('로그인');
            }
            return;
        }
        
        // 이메일로 사용자 찾기 (대소문자 무시, 공백 제거)
        const searchEmail = formData.email.trim().toLowerCase();
        const user = users.find(u => {
            if (!u.email) return false;
            return u.email.trim().toLowerCase() === searchEmail;
        });
        
        if (!user) {
            console.error('User not found:', searchEmail);
            console.log('Available users:', users.map(u => u.email));
            showError('등록되지 않은 이메일입니다.');
            if ($submitBtn) {
                $submitBtn.prop('disabled', false).text('로그인');
            }
            return;
        }
        
        // 비밀번호 확인 (공백 제거)
        const inputPassword = formData.password.trim();
        const storedPassword = (user.password || '').trim();
        
        if (storedPassword !== inputPassword) {
            console.error('Password mismatch for:', searchEmail);
            console.log('Input password length:', inputPassword.length);
            console.log('Stored password length:', storedPassword.length);
            showError('비밀번호가 올바르지 않습니다.');
            if ($submitBtn) {
                $submitBtn.prop('disabled', false).text('로그인');
            }
            return;
        }
        
        // 로그인 성공 - 로컬 저장소에 로그인 정보 저장
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.name || '');
        localStorage.setItem('userId', user.id || '');
        
        // 로그인 이력 저장
        try {
            let loginHistory = [];
            const storedHistory = localStorage.getItem('loginHistory');
            if (storedHistory) {
                loginHistory = JSON.parse(storedHistory);
            }
            
            const loginRecord = {
                id: Date.now().toString(),
                userId: user.id || '',
                userEmail: user.email,
                userName: user.name || '',
                loginAt: new Date().toISOString(),
                ipAddress: 'N/A', // 클라이언트 사이드에서는 IP를 직접 가져올 수 없음
                userAgent: navigator.userAgent || 'N/A'
            };
            
            loginHistory.push(loginRecord);
            
            // 최근 1000개만 유지
            if (loginHistory.length > 1000) {
                loginHistory = loginHistory.slice(-1000);
            }
            
            localStorage.setItem('loginHistory', JSON.stringify(loginHistory));
        } catch (e) {
            console.error('Error saving login history:', e);
        }
        
        showSuccessMessage('로그인 성공!');
        
        // 헤더 업데이트 (같은 페이지에 있을 경우)
        if (typeof updateHeaderLoginStatus === 'function') {
            updateHeaderLoginStatus();
        }
        
        setTimeout(function() {
            window.location.href = '../index.html';
        }, 1000);
    } catch (e) {
        console.error('Error in handleLoginFallback:', e);
        showError('로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        if ($submitBtn) {
            $submitBtn.prop('disabled', false).text('로그인');
        }
    }
}

// 로컬 저장소 기반 회원가입 처리
function handleSignupFallback(formData) {
    const $form = $('#signup-form');
    const $submitBtn = $form ? $form.find('button[type="submit"]') : null;
    
    try {
        // Store user data in localStorage for admin viewing
        const userData = {
            id: Date.now().toString(),
            name: formData.name || '',
            phone: formData.phone || '',
            email: formData.email,
            password: formData.password, // 비밀번호 저장 (실제 환경에서는 해시화 필요)
            registeredAt: new Date().toISOString(),
            status: 'active',
            authMethod: 'normal'
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
            showError('사용자 데이터를 읽는 중 오류가 발생했습니다.');
            if ($submitBtn) {
                $submitBtn.prop('disabled', false).text('회원가입');
            }
            return;
        }
        
        // Check if email already exists
        const existingUser = users.find(u => u.email === formData.email);
        if (existingUser) {
            showError('이미 등록된 이메일입니다.');
            if ($submitBtn) {
                $submitBtn.prop('disabled', false).text('회원가입');
            }
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
            showError('사용자 데이터를 저장하는 중 오류가 발생했습니다.');
            if ($submitBtn) {
                $submitBtn.prop('disabled', false).text('회원가입');
            }
            return;
        }
        
        // Store in localStorage for login
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('userName', formData.name || '');
        localStorage.setItem('userId', userData.id);
        
        showSuccessMessage('회원가입 성공!');
        
        // 헤더 업데이트 (같은 페이지에 있을 경우)
        if (typeof updateHeaderLoginStatus === 'function') {
            updateHeaderLoginStatus();
        }
        
        setTimeout(function() {
            window.location.href = '../index.html';
        }, 1000);
    } catch (e) {
        console.error('Error in handleSignupFallback:', e);
        showError('회원가입 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        if ($submitBtn) {
            $submitBtn.prop('disabled', false).text('회원가입');
        }
    }
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
            localStorage.removeItem('userName');
            localStorage.removeItem('authProvider');
            localStorage.removeItem('authMethod');
            
            // 헤더 업데이트
            if (typeof updateHeaderLoginStatus === 'function') {
                updateHeaderLoginStatus();
            }
            
            window.location.href = '../index.html';
        });
    } else {
        // Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('authProvider');
        localStorage.removeItem('authMethod');
        
        // 헤더 업데이트
        if (typeof updateHeaderLoginStatus === 'function') {
            updateHeaderLoginStatus();
        }
        
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



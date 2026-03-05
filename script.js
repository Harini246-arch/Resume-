// ===== PAGE NAVIGATION =====
window.pages = {
    login: document.getElementById('loginPage'),
    register: document.getElementById('registerPage'),
    upload: document.getElementById('uploadPage'),
    analysis: document.getElementById('analysisPage'),
    results: document.getElementById('resultsPage'),
    jobSearch: document.getElementById('jobSearchPage'),
    profile: document.getElementById('profilePage')
};

window.showPage = function showPage(pageName) {
    Object.values(window.pages).forEach(page => {
        if (page) page.classList.remove('active');
    });
    const target = window.pages[pageName];
    if (target) target.classList.add('active');

    // Profile Page specific logic: Refresh history
    if (pageName === 'profile' && typeof window.loadProfile === 'function') {
        window.loadProfile();
    }

    // Focus Mode: Hide Navigation/Sidebar on Upload, Analysis, Login, Register pages
    const navbar = document.querySelector('.navbar');
    const sidebar = document.querySelector('.sidebar');

    const focusPages = ['upload', 'analysis', 'login', 'register'];
    if (focusPages.includes(pageName)) {
        if (navbar) navbar.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';
        document.body.classList.remove('focus-mode');
    } else {
        if (navbar) navbar.style.display = 'block';
        if (sidebar) sidebar.style.display = 'flex';
        document.body.classList.remove('focus-mode');
    }
};
// Alias for use inside this file
const showPage = window.showPage;

// ===== LOGIN PAGE =====
const loginForm = document.getElementById('loginForm');
const togglePasswordBtn = document.querySelector('.toggle-password');
const passwordInput = document.getElementById('password');

// ===== AUTHENTICATION =====
window.authToken = localStorage.getItem('resumeAnalyzerToken');
window.currentUser = localStorage.getItem('resumeAnalyzerUser') ? JSON.parse(localStorage.getItem('resumeAnalyzerUser')) : null;

// Initial UI update when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.currentUser) {
        updateUserProfileUI();
    }
});

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;

        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Login failed');

            // Success
            window.authToken = data.token;
            window.currentUser = data.user;
            localStorage.setItem('resumeAnalyzerToken', window.authToken);
            localStorage.setItem('resumeAnalyzerUser', JSON.stringify(window.currentUser));

            updateUserProfileUI();
            showNotification(`Welcome back, ${window.currentUser.name}!`, 'success');

            setTimeout(() => {
                showPage('upload');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1000);

        } catch (error) {
            showNotification(error.message, 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

function updateUserProfileUI() {
    if (window.currentUser) {
        // Update all variants of name displays
        const nameSelectors = '.profile-name, .profile-name-display, #resName';
        document.querySelectorAll(nameSelectors).forEach(el => el.textContent = window.currentUser.name);

        // Generate initials
        const parts = window.currentUser.name.split(' ');
        const initials = parts.length > 1
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].substring(0, 2).toUpperCase();

        // Update all avatar versions (Navbar, Sidebar, Profile Page)
        const avatarSelectors = '.avatar, .profile-avatar, .profile-avatar-large, .profile-avatar-xl, .profile-avatar-large-circle';
        document.querySelectorAll(avatarSelectors).forEach(el => {
            el.textContent = initials;
        });

        // Trigger any page-specific updates if needed
        console.log('User UI Updated:', window.currentUser.name);
    }
}

if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle icon
        const icon = togglePasswordBtn.querySelector('svg');
        if (type === 'text') {
            icon.innerHTML = `
                <path d="M10 4C4.5 4 2 10 2 10C2 10 4.5 16 10 16C15.5 16 18 10 18 10C18 10 15.5 4 10 4Z" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
                <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" stroke-width="1.5"/>
            `;
        } else {
            icon.innerHTML = `
                <path d="M10 4C4.5 4 2 10 2 10C2 10 4.5 16 10 16C15.5 16 18 10 18 10C18 10 15.5 4 10 4Z" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
            `;
        }
    });
}

// ===== REGISTER PAGE =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regPasswordConfirm').value;
        const btn = document.getElementById('registerSubmitBtn');

        if (password !== confirm) { showNotification('Passwords do not match!', 'error'); return; }
        if (password.length < 6) { showNotification('Password must be at least 6 characters.', 'error'); return; }

        btn.textContent = 'Creating Account...';
        btn.disabled = true;
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Registration failed');
            window.authToken = data.token;
            window.currentUser = data.user;
            localStorage.setItem('resumeAnalyzerToken', window.authToken);
            localStorage.setItem('resumeAnalyzerUser', JSON.stringify(window.currentUser));
            updateUserProfileUI();
            showNotification(`Welcome, ${window.currentUser.name}! Account created.`, 'success');
            setTimeout(() => showPage('upload'), 1000);
        } catch (err) {
            showNotification(err.message, 'error');
            btn.textContent = 'Create Account';
            btn.disabled = false;
        }
    });
}

// Social login buttons
const socialBtns = document.querySelectorAll('.social-btn');
socialBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const originalText = btn.textContent;
        btn.textContent = 'Connecting...';
        btn.disabled = true;

        setTimeout(() => {
            showPage('upload');
            btn.textContent = originalText;
            btn.disabled = false;
        }, 1500);
    });
});

// ===== UPLOAD PAGE =====
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadedFile = document.getElementById('uploadedFile');
const removeFileBtn = document.getElementById('removeFile');
const analyzeBtn = document.getElementById('analyzeBtn');
const roleSelect = document.getElementById('roleSelect');
const roleChips = document.querySelectorAll('.role-chip');

let selectedFile = null;

// Role chip selection
roleChips.forEach(chip => {
    chip.addEventListener('click', () => {
        // Convert 'Software Engineer' to 'software-engineer' to match the <select> values
        const value = chip.textContent.trim().toLowerCase().replace(/\s+/g, '-');

        // Update the select dropdown
        roleSelect.value = value;

        // Visual feedback for chips
        roleChips.forEach(c => c.style.borderColor = 'rgba(255, 255, 255, 0.1)');
        chip.style.borderColor = '#4F46E5';
        chip.style.background = 'rgba(79, 70, 229, 0.1)';

        checkAnalyzeButton();
    });
});

roleSelect.addEventListener('change', checkAnalyzeButton);

// Browse button
if (browseBtn) {
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
}

// Dropzone click
if (dropzone) {
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });
}

// File input change
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });
}

// Drag and drop
if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            handleFileUpload(file);
        } else {
            alert('Please upload a PDF file');
        }
    });
}

function handleFileUpload(file) {
    selectedFile = file;

    // Update UI
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);

    dropzone.style.display = 'none';
    uploadedFile.style.display = 'flex';

    // Animate in
    uploadedFile.style.opacity = '0';
    uploadedFile.style.transform = 'translateY(10px)';
    setTimeout(() => {
        uploadedFile.style.transition = 'all 0.3s ease';
        uploadedFile.style.opacity = '1';
        uploadedFile.style.transform = 'translateY(0)';
    }, 10);

    checkAnalyzeButton();
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Remove file
if (removeFileBtn) {
    removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFile = null;
        fileInput.value = '';

        uploadedFile.style.display = 'none';
        dropzone.style.display = 'block';

        checkAnalyzeButton();
    });
}

function checkAnalyzeButton() {
    if (selectedFile && roleSelect.value) {
        analyzeBtn.disabled = false;
        analyzeBtn.style.opacity = '1';
        analyzeBtn.style.cursor = 'pointer';
    } else {
        // We keep it clickable but show a message if they try to start without items
        // Or keep it disabled but styled clearly
        analyzeBtn.disabled = false; // Make it clickable so we can show warning
        analyzeBtn.style.opacity = selectedFile ? '1' : '0.5';
    }
}

// Analyze button
if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
        if (!selectedFile) {
            showNotification('Please upload your resume first.', 'error');
            return;
        }
        if (!roleSelect.value) {
            showNotification('Please select a target role (e.g. Software Engineer).', 'info');
            // Shake the role section for emphasis
            document.querySelector('.role-section').style.animation = 'pulse 0.5s ease';
            setTimeout(() => document.querySelector('.role-section').style.animation = '', 500);
            return;
        }

        showPage('analysis');
        startAnalysis();
    });
}

// ===== ANALYSIS PAGE =====
let analysisResult = null;

async function startAnalysis() {
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const steps = document.querySelectorAll('.step-item');

    // Reset UI
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';
    steps.forEach(s => {
        s.classList.remove('active', 'completed');
        s.querySelector('.step-icon').classList.remove('active', 'completed');
        s.querySelector('.step-status').textContent = 'Pending';
    });

    // Start Simulation Timer
    let progress = 0;
    const duration = 8000; // 8 seconds (faster for demo)
    const interval = 50;
    const increment = (100 / duration) * interval;

    const progressInterval = setInterval(() => {
        progress += increment;
        if (progress > 95) progress = 95; // Hold at 95% until complete

        progressFill.style.width = progress + '%';
        progressPercent.textContent = Math.round(progress) + '%';

        updateStepsUI(progress);
    }, interval);

    try {
        // --- 1. Prepare Upload Data ---
        const formData = new FormData();
        formData.append('resume', selectedFile);
        formData.append('role', roleSelect.value);

        if (window.currentUser) {
            formData.append('userId', window.currentUser.id);
        }

        const headers = {};
        if (window.authToken) {
            headers['Authorization'] = `Bearer ${window.authToken}`;
        }

        // --- 2. Call Backend API ---
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
            headers: headers
        });

        if (!response.ok) throw new Error('Analysis failed');

        analysisResult = await response.json();

        // --- 3. Complete Progress ---
        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        progressPercent.textContent = '100%';

        // Mark all steps complete
        steps.forEach(step => {
            step.classList.add('completed');
            step.querySelector('.step-icon').innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10L8 13L15 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
            step.querySelector('.step-status').textContent = 'Completed';
        });

        // --- 4. Show Results ---
        setTimeout(() => {
            showPage('results');
            displayResults(analysisResult);
        }, 800);

    } catch (error) {
        clearInterval(progressInterval);
        alert('Error analyzing resume: ' + error.message);
        showPage('upload');
    }
}

function updateStepsUI(progress) {
    if (progress >= 0 && progress < 25) {
        updateStep(0, 'active');
    } else if (progress >= 25 && progress < 50) {
        updateStep(0, 'completed');
        updateStep(1, 'active');
    } else if (progress >= 50 && progress < 75) {
        updateStep(1, 'completed');
        updateStep(2, 'active');
    } else if (progress >= 75) {
        updateStep(2, 'completed');
        updateStep(3, 'active');
    }
}

function displayResults(data) {
    // Skills
    const skillsContainer = document.querySelector('.skills-tags');
    if (skillsContainer && data.analysis && data.analysis.hardSkills) {
        skillsContainer.innerHTML = data.analysis.hardSkills.map(skill =>
            `<span class="skill-tag">${skill}</span>`
        ).join('');
    }

    // Profile Card Info
    if (data.analysis) {
        const nameEl = document.getElementById('resName');
        const titleEl = document.getElementById('resTitle');
        const locEl = document.getElementById('resLocation');
        const emailEl = document.getElementById('resEmailDisplay');
        const phoneEl = document.getElementById('resPhoneDisplay');

        if (nameEl) nameEl.textContent = window.currentUser ? window.currentUser.name : "Resume Candidate";
        if (titleEl) titleEl.textContent = document.getElementById('roleSelect').value + " Applicant";

        if (locEl && data.analysis.contact) {
            locEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L3 5V9C3 12 5 14 8 15C11 14 13 12 13 9V5L8 2Z" stroke="currentColor" stroke-width="1.5"/></svg> ${data.analysis.contact.location || 'Location Extracted'}`;
        }
        if (emailEl && data.analysis.contact) {
            emailEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 6H11M5 9H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> ${data.analysis.contact.email}`;
        }
        if (phoneEl && data.analysis.contact) {
            phoneEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4L8 8L14 4M2 4V12H14V4" stroke="currentColor" stroke-width="1.5"/></svg> ${data.analysis.contact.phone}`;
        }
    }

    // Skill Gap Analysis - Aggregated from top matches
    const gapContainer = document.getElementById('missingSkillsList');
    if (gapContainer && data.matches && data.matches.length > 0) {
        // Get all missing skills from top 3 matches and deduplicate
        const allMissing = data.matches.slice(0, 3).flatMap(j => j.missingSkills || []);
        const uniqueMissing = [...new Set(allMissing)].slice(0, 8);

        if (uniqueMissing.length > 0) {
            gapContainer.innerHTML = uniqueMissing.map(skill =>
                `<span class="skill-tag soft" style="cursor: pointer;" onclick="showNotification('Learning path for ${skill} coming soon!', 'info')">${skill}</span>`
            ).join('');
        } else {
            gapContainer.innerHTML = '<p style="color: #10B981; font-size: 0.9rem;">No gaps found! You are a perfect match for these roles.</p>';
        }
    }

    // Recommended Jobs
    const jobsGrid = document.querySelector('.jobs-grid');
    if (jobsGrid && data.matches) {
        // Store these for the modal's "Related Jobs" feature
        if (typeof window.currentLoadedJobs !== 'undefined') {
            window.currentLoadedJobs = data.matches;
        }

        jobsGrid.innerHTML = data.matches.map(job => {
            const jobData = JSON.stringify(job).replace(/"/g, '&quot;');
            const gapCount = job.missingSkills ? job.missingSkills.length : 0;

            return `
                <div class="job-card" onclick="openJobDetails(${jobData})">
                    <div class="job-header">
                        <div class="job-icon">${job.icon || '💼'}</div>
                        <div class="match-score ${job.scoreClass || 'high'}">
                            <span class="score">${job.matchScore}%</span>
                            <span class="label">MATCH SCORE</span>
                        </div>
                    </div>
                    <h3>${job.title}</h3>
                    <p class="job-company">${job.company} • ${job.location}</p>
                    <div class="job-gap-hint" style="margin-bottom: 12px; font-size: 0.8rem; color: ${gapCount > 0 ? '#F59E0B' : '#10B981'};">
                        ${gapCount > 0 ? `⚠️ ${gapCount} skills to learn` : '✅ Perfect Skill Match'}
                    </div>
                    <div class="job-tags">
                        ${job.tags ? job.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
}

function updateStep(index, status) {
    const steps = document.querySelectorAll('.step-item');
    const step = steps[index];

    if (!step) return;

    const icon = step.querySelector('.step-icon');
    const statusText = step.querySelector('.step-status');

    // Remove all status classes
    step.classList.remove('active', 'completed');
    icon.classList.remove('active', 'completed');
    statusText.classList.remove('active', 'completed');

    if (status === 'completed') {
        step.classList.add('completed');
        icon.classList.add('completed');
        icon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10L8 13L15 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
        statusText.textContent = 'Completed';
        statusText.classList.add('completed');
    } else if (status === 'active') {
        step.classList.add('active');
        icon.classList.add('active');
        icon.innerHTML = '<div class="spinner"></div>';
        statusText.textContent = 'In progress...';
        statusText.classList.add('active');
    }
}

// ===== RESULTS PAGE =====
// Add smooth scroll animations for results
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards on results page
setTimeout(() => {
    const cards = document.querySelectorAll('.result-card, .job-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';
        observer.observe(card);
    });
}, 100);

// Job card interactions
const jobCards = document.querySelectorAll('.job-card');
jobCards.forEach(card => {
    card.addEventListener('click', () => {
        // Add pulse animation
        card.style.animation = 'pulse 0.3s ease';
        setTimeout(() => {
            card.style.animation = '';
        }, 300);
    });
});

// Export PDF button
const exportBtn = document.querySelector('.export-btn');
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="white" stroke-width="2"/>
                <path d="M10 6V10" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Exporting...
        `;
        exportBtn.disabled = true;

        setTimeout(() => {
            exportBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10L8 13L15 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Downloaded!
            `;

            setTimeout(() => {
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
            }, 2000);
        }, 2000);
    });
}

// Re-upload button
const reuploadBtn = document.querySelector('.reupload-btn');
if (reuploadBtn) {
    reuploadBtn.addEventListener('click', () => {
        showPage('upload');
    });
}

// Sidebar link interactions
const sidebarLinks = document.querySelectorAll('.sidebar-link');
sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// Add hover effect to skill tags
const skillTags = document.querySelectorAll('.skill-tag');
skillTags.forEach(tag => {
    tag.addEventListener('mouseenter', () => {
        tag.style.transform = 'scale(1.05)';
        tag.style.transition = 'transform 0.2s ease';
    });

    tag.addEventListener('mouseleave', () => {
        tag.style.transform = 'scale(1)';
    });
});

// Animate progress bars on page load
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => {
            bar.style.transition = 'width 1s ease';
            bar.style.width = width;
        }, 100);
    });
}

// Add typing effect to progress info
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

// Initialize animations when analysis page is shown
const analysisPage = document.getElementById('analysisPage');
if (analysisPage) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                if (analysisPage.classList.contains('active')) {
                    animateProgressBars();
                }
            }
        });
    });

    observer.observe(analysisPage, { attributes: true });
}

// Add particle effect to login page (optional enhancement)
function createParticles() {
    const leftPanel = document.querySelector('.left-panel');
    if (!leftPanel) return;

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = 'rgba(255, 255, 255, 0.3)';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.pointerEvents = 'none';
        particle.style.animation = `float ${Math.random() * 10 + 5}s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 5 + 's';

        leftPanel.appendChild(particle);
    }
}

// Initialize particles on load
window.addEventListener('load', () => {
    createParticles();
});

// Add smooth transitions between pages
function smoothPageTransition(fromPage, toPage) {
    fromPage.style.opacity = '1';
    fromPage.style.transition = 'opacity 0.3s ease';
    fromPage.style.opacity = '0';

    setTimeout(() => {
        fromPage.classList.remove('active');
        toPage.classList.add('active');
        toPage.style.opacity = '0';
        toPage.style.transition = 'opacity 0.3s ease';

        setTimeout(() => {
            toPage.style.opacity = '1';
        }, 10);
    }, 300);
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to go back
    if (e.key === 'Escape') {
        const activePage = document.querySelector('.page.active');
        if (activePage === pages.results) {
            showPage('upload');
        }
    }

    // Enter to submit forms
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        const activeForm = document.querySelector('.page.active form');
        if (activeForm) {
            e.preventDefault();
            activeForm.dispatchEvent(new Event('submit'));
        }
    }
});

// Add loading states to all buttons
const allButtons = document.querySelectorAll('button');
allButtons.forEach(button => {
    button.addEventListener('click', function () {
        if (!this.disabled) {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 100);
        }
    });
});

// Notification system
window.showNotification = function (message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '16px 24px';
    notification.style.background = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#4F46E5';
    notification.style.color = 'white';
    notification.style.borderRadius = '12px';
    notification.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '1000';
    notification.style.animation = 'slideIn 0.3s ease';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Signup and Forgot Password Simulation
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('signup-link')) {
        e.preventDefault();
        showNotification('Registration is currently closed for new beta users.', 'info');
    }
    if (e.target.classList.contains('forgot-link')) {
        e.preventDefault();
        showNotification('Password reset link sent to your email (Demo)', 'success');
    }
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Console welcome message
console.log('%c🚀 ResumeAI', 'font-size: 24px; font-weight: bold; color: #4F46E5;');
console.log('%cWelcome to ResumeAI - Your AI-powered career companion', 'font-size: 14px; color: #6B7280;');
console.log('%cBuilt with ❤️ using modern web technologies', 'font-size: 12px; color: #9CA3AF;');

// ===== PROFILE EDITING =====
window.openEditProfileModal = function () {
    const modal = document.getElementById('editProfileModal');
    if (!modal) return;

    // Fill with current values
    document.getElementById('editResName').value = document.getElementById('resName').textContent;
    document.getElementById('editResTitle').value = document.getElementById('resTitle').textContent;

    // For meta fields, get only the text content (ignoring the SVG)
    const locText = document.getElementById('resLocation').innerText;
    const emailText = document.getElementById('resEmailDisplay').innerText;
    const phoneText = document.getElementById('resPhoneDisplay').innerText;

    document.getElementById('editResLocation').value = locText.trim();
    document.getElementById('editResEmail').value = emailText.trim();
    document.getElementById('editResPhone').value = phoneText.trim();

    modal.style.display = 'flex';
};

window.closeEditProfileModal = function () {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.style.display = 'none';
};

window.saveProfileChanges = function () {
    const newName = document.getElementById('editResName').value;
    // Update the UI with new values and keep the premium icons
    document.getElementById('resName').textContent = newName;
    document.getElementById('resTitle').textContent = document.getElementById('editResTitle').value;

    document.getElementById('resLocation').innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L3 5V9C3 12 5 14 8 15C11 14 13 12 13 9V5L8 2Z" stroke="currentColor" stroke-width="1.5"/></svg> ${document.getElementById('editResLocation').value}`;
    document.getElementById('resEmailDisplay').innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 6H11M5 9H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> ${document.getElementById('editResEmail').value}`;
    document.getElementById('resPhoneDisplay').innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4L8 8L14 4M2 4V12H14V4" stroke="currentColor" stroke-width="1.5"/></svg> ${document.getElementById('editResPhone').value}`;

    // Sync with global account name if logged in
    if (window.currentUser) {
        window.currentUser.name = newName;
        localStorage.setItem('resumeAnalyzerUser', JSON.stringify(window.currentUser));
        if (typeof updateUserProfileUI === 'function') updateUserProfileUI();
    }

    showNotification('Profile updated successfully!', 'success');
    window.closeEditProfileModal();
};

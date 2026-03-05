// ===== PAGE NAVIGATION UPDATE =====
// Note: pages already registered in script.js. Just ensure jobSearch & profile are set.
if (!window.pages.jobSearch) window.pages.jobSearch = document.getElementById('jobSearchPage');
if (!window.pages.profile) window.pages.profile = document.getElementById('profilePage');

// Initialize user UI if already logged in
if (window.authToken && window.currentUser) {
    if (typeof updateUserProfileUI === 'function') updateUserProfileUI();
}

// ===== JOB SEARCH =====
const jobSearchBtn = document.getElementById('jobSearchBtn');
const jobSearchInput = document.getElementById('jobSearchInput');
const searchResultsGrid = document.getElementById('searchResultsGrid');

if (jobSearchBtn) {
    jobSearchBtn.addEventListener('click', performJobSearch);
}
if (jobSearchInput) {
    jobSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performJobSearch();
    });
}
function displayJobCard(job) {
    // Stringify the job object safely for the onclick handler
    const jobData = JSON.stringify(job).replace(/"/g, '&quot;');
    return `
        <div class="result-card" style="margin-bottom: 1rem; cursor: pointer;" onclick="openJobDetails(${jobData})">
            <div class="card-header">
                <div class="card-icon blue">${job.icon || '💼'}</div>
                <h3>${job.title}</h3>
            </div>
            <p class="job-company" style="color: #cbd5e1; margin-bottom: 0.5rem;">${job.company} • ${job.location}</p>
            <div class="job-tags" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${job.tags ? job.tags.map(t => `<span class="skill-tag">${t}</span>`).join('') : ''}
            </div>
        </div>
    `;
}

// Global variable to store all loaded jobs for "Related Jobs" searching
window.currentLoadedJobs = [];

window.openJobDetails = async function (job) {
    const modal = document.getElementById('jobModal');
    if (!modal) return;
    document.getElementById('modalJobTitle').textContent = job.title;
    document.getElementById('modalJobCompany').textContent = `${job.company} • ${job.location}`;
    document.getElementById('modalJobIcon').textContent = job.icon || '💼';
    document.getElementById('modalJobDescription').textContent = job.description || "We are looking for a dedicated professional to join our team. You will be responsible for implementing core features and collaborating with cross-functional stakeholders.";

    // Skills
    const skillsContainer = document.getElementById('modalJobSkills');
    skillsContainer.innerHTML = (job.requiredSkills || []).map(s => `<span class="skill-tag">${s}</span>`).join('');

    // Missing Skills
    const missingContainer = document.getElementById('modalMissingSkills');
    const missingSection = document.getElementById('modalMissingSkillsSection');
    if (job.missingSkills && job.missingSkills.length > 0) {
        missingSection.style.display = 'block';
        missingContainer.innerHTML = job.missingSkills.map(s => `<span class="skill-tag soft" style="border-color: #F59E0B; color: #F59E0B;">${s}</span>`).join('');
    } else {
        missingSection.style.display = 'none';
    }

    // Related Jobs (Find jobs with at least one matching skill)
    const relatedContainer = document.getElementById('relatedJobsList');
    const related = window.currentLoadedJobs
        .filter(j => j.id !== job.id)
        .filter(j => j.requiredSkills.some(s => job.requiredSkills.includes(s)))
        .slice(0, 3);

    if (related.length > 0) {
        relatedContainer.innerHTML = related.map(rj => `
            <div class="related-job-item" style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between;">
                <span>${rj.title} at ${rj.company}</span>
                <span style="color: #4F46E5; cursor: pointer;">View</span>
            </div>
        `).join('');
    } else {
        relatedContainer.innerHTML = '<p style="color: #9CA3AF;">No similar roles found.</p>';
    }

    modal.style.display = 'flex';
}

window.closeJobModal = function () {
    document.getElementById('jobModal').style.display = 'none';
};

async function performJobSearch() {
    const query = jobSearchInput.value;
    if (!searchResultsGrid) return;

    searchResultsGrid.innerHTML = '<p style="color:white; text-align:center;">Searching...</p>';

    try {
        const res = await fetch(`/api/jobs/search?q=${encodeURIComponent(query)}`);
        const jobs = await res.json();
        window.currentLoadedJobs = jobs; // Save for related jobs

        if (jobs.length === 0) {
            searchResultsGrid.innerHTML = '<p style="color:white; text-align:center;">No jobs found matching your criteria.</p>';
            return;
        }

        searchResultsGrid.innerHTML = jobs.map(displayJobCard).join('');

    } catch (e) {
        searchResultsGrid.innerHTML = '<p style="color:red; text-align:center;">Error searching jobs.</p>';
    }
}

// ===== PROFILE PAGE =====
window.loadProfile = async function loadProfile() {
    window.authToken = localStorage.getItem('resumeAnalyzerToken');
    if (!window.authToken) {
        if (typeof showNotification === 'function') showNotification('Please login first', 'error');
        if (typeof showPage === 'function') showPage('login');
        return;
    }

    try {
        const res = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${window.authToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();

        // Update Profile Info
        if (typeof updateUserProfileUI === 'function') {
            window.currentUser = data.user; // Sync latest from server
            updateUserProfileUI();
        }

        const emailDisplays = document.querySelectorAll('.profile-email-display');
        emailDisplays.forEach(el => el.textContent = data.user.email);


        // Update History
        const historyList = document.getElementById('historyList');
        if (historyList) {
            if (!data.resumes || data.resumes.length === 0) {
                historyList.innerHTML = `
                    <div style="text-align: center; padding: 3rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.1);">
                        <p style="color: #9CA3AF; margin: 0;">No analysis history found. Start by uploading your resume!</p>
                    </div>`;
            } else {
                historyList.innerHTML = data.resumes.map(resume => {
                    const dateStr = resume.uploadDate ? new Date(resume.uploadDate).toLocaleDateString() : 'Recent';
                    return `
                    <div class="history-item">
                        <div class="history-info">
                            <h4>${resume.roleTarget || 'General'} Role Analysis</h4>
                            <div class="history-meta">
                                <span>📅 ${dateStr}</span>
                                <span>📄 ${resume.fileName}</span>
                            </div>
                        </div>
                        <div class="history-actions">
                            <span class="score-badge">Analysis Complete</span>
                        </div>
                    </div>`;
                }).join('');
            }
        }
    } catch (e) {
        console.error("Failed to load profile", e);
        if (typeof showNotification === 'function') showNotification('Could not load user data', 'error');
    }
    loadSavedJobs();
}



async function loadSavedJobs() {
    const savedList = document.getElementById('savedJobsList');
    if (!savedList) return;
    try {
        const res = await fetch('/api/user/saved-jobs', {
            headers: { 'Authorization': `Bearer ${window.authToken}` }
        });
        const jobs = await res.json();
        if (jobs.length === 0) {
            savedList.innerHTML = '<p style="color: #9CA3AF;">You haven\'t saved any jobs yet.</p>';
        } else {
            savedList.innerHTML = jobs.map(j => `
                <div class="job-card">
                    <h3>${j.title}</h3>
                    <p class="job-company">${j.company} • ${j.location}</p>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error("Failed to load saved jobs", e);
    }
}

let activeJobForModal = null;
const _origOpenDetails = window.openJobDetails;
window.openJobDetails = function (job) {
    activeJobForModal = job;
    _origOpenDetails(job);
};

const saveJobBtn = document.getElementById('saveJobBtn');
if (saveJobBtn) {
    saveJobBtn.addEventListener('click', async () => {
        if (!window.authToken) return showNotification('Login required', 'error');
        try {
            const res = await fetch('/api/jobs/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.authToken}`
                },
                body: JSON.stringify({ job: activeJobForModal })
            });
            if (res.ok) {
                showNotification('Job saved to your profile!', 'success');
                closeJobModal();
            }
        } catch (e) {
            showNotification('Error saving job', 'error');
        }
    });
}

// Hook showPage to load profile when 'profile' page is shown
// We replace the global showPage function carefully
const _originalShowPage = window.showPage;
window.showPage = function (pageName) {
    if (_originalShowPage) _originalShowPage(pageName);

    if (pageName === 'profile') {
        loadProfile();
    }
    // Also init search page
    if (pageName === 'jobSearch') {
        performJobSearch(); // Default load all
    }
};

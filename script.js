// Simple Attendance Tracker with True Cross-Browser Support
// Global constants - MULTIPLE STORAGE LOCATIONS FOR CROSS-BROWSER SHARING
const SHARED_DATA_KEY = 'SHARED_ATTENDANCE_DATA';
const BACKUP_KEYS = [
    'ATTENDANCE_BACKUP_1',
    'ATTENDANCE_BACKUP_2', 
    'ATTENDANCE_BACKUP_3',
    'GLOBAL_ATTENDANCE_SYNC',
    'TEAM_ATTENDANCE_DATA'
];
const MANAGER_PASSWORD = 'admin123';

// Employee list
const EMPLOYEES = [
    { id: 'bhavya', name: 'Bhavya' },
    { id: 'sahana', name: 'Sahana' },
    { id: 'asha', name: 'Asha' },
    { id: 'srikanth', name: 'Srikanth' }
];

// Global variables
let currentUser = null;
let userRole = null;
let todayDate = new Date().toDateString();

// Get shared attendance data from multiple storage locations
function getSharedData() {
    try {
        // First check URL parameters for shared data
        const urlData = loadFromURL();
        if (urlData && Object.keys(urlData).length > 0) {
            console.log('Loading data from URL:', urlData);
            // Save URL data to localStorage for persistence
            saveSharedData(urlData);
            return urlData;
        }
        
        // Try primary key first
        let data = localStorage.getItem(SHARED_DATA_KEY);
        if (data) {
            return JSON.parse(data);
        }
        
        // Try sessionStorage as backup
        try {
            data = sessionStorage.getItem(SHARED_DATA_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                localStorage.setItem(SHARED_DATA_KEY, data); // Copy to localStorage
                return parsed;
            }
        } catch (sessionError) {
            console.warn('SessionStorage not available:', sessionError);
        }
        
        // Try backup keys if primary fails
        for (let key of BACKUP_KEYS) {
            data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                // Copy to primary for future use
                localStorage.setItem(SHARED_DATA_KEY, data);
                return parsed;
            }
        }
        
        return {};
    } catch (e) {
        console.error('Error reading shared data:', e);
        return {};
    }
}

// Save shared attendance data to multiple locations for redundancy
function saveSharedData(attendanceData) {
    try {
        const dataString = JSON.stringify(attendanceData);
        
        // Save to primary key
        localStorage.setItem(SHARED_DATA_KEY, dataString);
        
        // Save to all backup keys for cross-browser accessibility
        BACKUP_KEYS.forEach(key => {
            localStorage.setItem(key, dataString);
        });
        
        // Also save with timestamp for debugging
        localStorage.setItem('LAST_UPDATE_TIME', new Date().toISOString());
        
        // Save to URL for cross-browser sharing
        saveToURL();
        
        console.log('Shared data saved:', attendanceData);
        
        // Try to trigger storage event for cross-tab communication
        window.dispatchEvent(new StorageEvent('storage', {
            key: SHARED_DATA_KEY,
            newValue: dataString
        }));
        
        // Additional cross-browser data persistence
        try {
            sessionStorage.setItem(SHARED_DATA_KEY, dataString);
            sessionStorage.setItem('LAST_SYNC', new Date().toISOString());
        } catch (sessionError) {
            console.warn('SessionStorage not available:', sessionError);
        }
        
        return true;
    } catch (e) {
        console.error('Error saving shared data:', e);
        return false;
    }
}

// URL-based data sharing for true cross-browser functionality
function saveToURL() {
    const sharedData = getSharedData();
    if (Object.keys(sharedData).length > 0) {
        try {
            const encodedData = btoa(JSON.stringify(sharedData));
            const newUrl = `${window.location.pathname}?data=${encodedData}`;
            window.history.replaceState({}, '', newUrl);
            console.log('Data saved to URL for sharing');
        } catch (e) {
            console.error('Error encoding data to URL:', e);
        }
    }
}

// Load data from URL if available
function loadFromURL() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('data');
        
        if (encodedData) {
            const decodedData = JSON.parse(atob(encodedData));
            saveSharedData(decodedData);
            console.log('Data loaded from URL:', decodedData);
            return decodedData;
        }
    } catch (e) {
        console.error('Error loading data from URL:', e);
    }
    return null;
}

// Generate shareable link with current data
function generateShareableLink() {
    const sharedData = getSharedData();
    if (Object.keys(sharedData).length > 0) {
        try {
            const encodedData = btoa(JSON.stringify(sharedData));
            const shareableUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
            return shareableUrl;
        } catch (e) {
            console.error('Error generating shareable link:', e);
        }
    }
    return window.location.href;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing attendance tracker...');
    
    // Load data from URL first (for cross-browser sharing)
    loadFromURL();
    
    displayCurrentDate();
    setupEmployeeDropdown();
    checkAutoLogin();
});

// Display current date
function displayCurrentDate() {
    const today = new Date();
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
}

// Setup employee dropdown
function setupEmployeeDropdown() {
    const select = document.getElementById('employeeSelect');
    select.innerHTML = '<option value="">Select your name</option>';
    
    EMPLOYEES.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = emp.name;
        select.appendChild(option);
    });
}

// Check for existing login
function checkAutoLogin() {
    const savedUser = localStorage.getItem('currentUser');
    const savedRole = localStorage.getItem('userRole');
    
    if (savedUser && savedRole) {
        currentUser = savedUser;
        userRole = savedRole;
        showMainApp();
    }
}

// Manager login
function loginAsManager() {
    const password = document.getElementById('managerPassword').value;
    
    if (password !== MANAGER_PASSWORD) {
        alert('❌ Wrong password! Use: admin123');
        return;
    }
    
    currentUser = 'manager';
    userRole = 'manager';
    
    localStorage.setItem('currentUser', currentUser);
    localStorage.setItem('userRole', userRole);
    
    showMainApp();
}

// Employee login
function loginAsEmployee() {
    const employeeId = document.getElementById('employeeSelect').value;
    const password = document.getElementById('employeePassword').value.toLowerCase();
    
    if (!employeeId) {
        alert('❌ Please select your name');
        return;
    }
    
    if (password !== employeeId) {
        alert('❌ Wrong password! Use your name in lowercase');
        return;
    }
    
    // Check if already submitted today (cross-browser prevention)
    const sharedData = getSharedData();
    const todayKey = `${todayDate}_${employeeId}`;
    
    if (sharedData[todayKey]) {
        const confirmEdit = confirm(`You already marked attendance as "${sharedData[todayKey].status.toUpperCase()}" today.\\n\\nDo you want to change it?`);
        if (!confirmEdit) {
            return;
        }
    }
    
    currentUser = employeeId;
    userRole = 'employee';
    
    localStorage.setItem('currentUser', currentUser);
    localStorage.setItem('userRole', userRole);
    
    showMainApp();
}

// Show main application
function showMainApp() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    if (userRole === 'manager') {
        document.getElementById('userInfo').textContent = '👨‍💼 Manager Dashboard';
        document.getElementById('managerActions').style.display = 'flex';
        document.getElementById('managerMode').style.display = 'block';
        document.getElementById('actionsSection').style.display = 'block';
        loadManagerView();
        
        // Start auto-refresh for real-time updates
        setupAutoRefresh();
    } else {
        const employee = EMPLOYEES.find(emp => emp.id === currentUser);
        document.getElementById('userInfo').textContent = `👤 ${employee.name}`;
        document.getElementById('managerActions').style.display = 'none';
        document.getElementById('loggedEmployeeName').textContent = employee.name;
        document.getElementById('employeeMode').style.display = 'block';
        loadEmployeeView();
    }
}

// Load manager view
function loadManagerView() {
    console.log('Loading manager view...');
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML = '';
    
    let presentCount = 0;
    let wfhCount = 0;
    let absentCount = 0;
    
    // Get shared data that works across browsers
    const sharedData = getSharedData();
    console.log('Manager viewing shared data:', sharedData);
    
    EMPLOYEES.forEach(emp => {
        const todayKey = `${todayDate}_${emp.id}`;
        const submission = sharedData[todayKey];
        
        let status = 'not-set';
        let timestamp = null;
        
        if (submission) {
            status = submission.status;
            timestamp = submission.timestamp;
            
            // Count for summary
            if (status === 'present') presentCount++;
            else if (status === 'wfh') wfhCount++;
            else if (status === 'absent') absentCount++;
        }
        
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.innerHTML = `
            <div class="employee-name">${emp.name}</div>
            ${status !== 'not-set' ? `
                <div class="status-display ${status}">
                    ${getStatusIcon(status)} ${getStatusText(status)}
                </div>
                <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">
                    Submitted: ${new Date(timestamp).toLocaleTimeString()}
                </div>
            ` : `
                <div style="color: #ff6b6b; padding: 10px; text-align: center;">
                    ⏰ Not submitted yet
                </div>
            `}
            <div class="status-buttons">
                <button class="status-btn present ${status === 'present' ? 'active' : ''}" 
                        onclick="managerSetAttendance('${emp.id}', 'present')">
                    🏢 Present
                </button>
                <button class="status-btn wfh ${status === 'wfh' ? 'active' : ''}" 
                        onclick="managerSetAttendance('${emp.id}', 'wfh')">
                    🏠 WFH
                </button>
                <button class="status-btn absent ${status === 'absent' ? 'active' : ''}" 
                        onclick="managerSetAttendance('${emp.id}', 'absent')">
                    ❌ Leave
                </button>
            </div>
        `;
        
        employeeList.appendChild(card);
    });
    
    // Update summary
    document.getElementById('presentCount').textContent = presentCount;
    document.getElementById('wfhCount').textContent = wfhCount;
    document.getElementById('absentCount').textContent = absentCount;
    
    updateSyncStatus('✅ Manager data loaded');
}

// Load employee view
function loadEmployeeView() {
    console.log('Loading employee view for:', currentUser);
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML = '';
    
    const employee = EMPLOYEES.find(emp => emp.id === currentUser);
    
    // Get shared data
    const sharedData = getSharedData();
    const todayKey = `${todayDate}_${currentUser}`;
    const submission = sharedData[todayKey];
    
    let status = 'not-set';
    let timestamp = null;
    
    if (submission) {
        status = submission.status;
        timestamp = submission.timestamp;
    }
    
    const card = document.createElement('div');
    card.className = 'employee-card';
    card.innerHTML = `
        <div class="employee-name">${employee.name}</div>
        ${status === 'not-set' ? `
            <div style="color: #ff6b6b; margin-bottom: 15px; text-align: center;">
                ⏰ Please mark your attendance for today
            </div>
        ` : `
            <div class="status-display ${status}">
                ${getStatusIcon(status)} ${getStatusText(status)}
            </div>
            <div style="color: #28a745; font-size: 0.9rem; margin: 10px 0; text-align: center;">
                ✅ Submitted at ${new Date(timestamp).toLocaleTimeString()}
            </div>
        `}
        <div class="status-buttons">
            <button class="status-btn present ${status === 'present' ? 'active' : ''}" 
                    onclick="employeeSetAttendance('present')">
                🏢 Present
            </button>
            <button class="status-btn wfh ${status === 'wfh' ? 'active' : ''}" 
                    onclick="employeeSetAttendance('wfh')">
                🏠 WFH
            </button>
            <button class="status-btn absent ${status === 'absent' ? 'active' : ''}" 
                    onclick="employeeSetAttendance('absent')">
                ❌ Leave
            </button>
        </div>
        ${status !== 'not-set' ? `
            <div class="success-message">
                ✅ Your attendance is recorded! You can change it anytime today.
            </div>
        ` : ''}
    `;
    
    employeeList.appendChild(card);
    updateSyncStatus('✅ Your data loaded');
}

// Employee sets their own attendance
function employeeSetAttendance(status) {
    console.log('Employee setting attendance:', currentUser, status);
    
    // Get current shared data
    const sharedData = getSharedData();
    const todayKey = `${todayDate}_${currentUser}`;
    
    // Update shared data
    sharedData[todayKey] = {
        employeeId: currentUser,
        status: status,
        timestamp: new Date().toISOString(),
        date: todayDate
    };
    
    // Save to shared storage
    if (saveSharedData(sharedData)) {
        const statusText = getStatusText(status);
        alert(`✅ Your attendance has been recorded as: ${statusText}`);
        loadEmployeeView();
        updateSyncStatus('✅ Attendance saved successfully!');
    } else {
        alert('❌ Error saving attendance. Please try again.');
    }
}

// Manager sets employee attendance
function managerSetAttendance(employeeId, status) {
    console.log('Manager setting attendance:', employeeId, status);
    
    // Get current shared data
    const sharedData = getSharedData();
    const todayKey = `${todayDate}_${employeeId}`;
    
    // Update shared data
    sharedData[todayKey] = {
        employeeId: employeeId,
        status: status,
        timestamp: new Date().toISOString(),
        date: todayDate,
        setBy: 'manager'
    };
    
    // Save to shared storage
    if (saveSharedData(sharedData)) {
        loadManagerView();
        updateSyncStatus('✅ Attendance updated');
    } else {
        alert('❌ Error updating attendance. Please try again.');
    }
}

// Force sync all data
function forceSyncAllData() {
    console.log('Force syncing all data...');
    updateSyncStatus('🔄 Syncing all data...');
    
    setTimeout(() => {
        loadManagerView();
        updateSyncStatus('✅ All data synchronized');
    }, 500);
}

// Show all submissions
function showAllSubmissions() {
    console.log('Showing all submissions...');
    
    const sharedData = getSharedData();
    const submissions = [];
    
    EMPLOYEES.forEach(emp => {
        const todayKey = `${todayDate}_${emp.id}`;
        const submission = sharedData[todayKey];
        
        if (submission) {
            const time = new Date(submission.timestamp).toLocaleTimeString();
            const setBy = submission.setBy === 'manager' ? ' (set by manager)' : '';
            submissions.push(`${emp.name}: ${getStatusText(submission.status)} at ${time}${setBy}`);
        } else {
            submissions.push(`${emp.name}: Not submitted`);
        }
    });
    
    alert(`📊 Today's Submissions (${todayDate}):\\n\\n${submissions.join('\\n')}`);
}

// Generate current data link (Manager feature)
function generateCurrentDataLink() {
    if (userRole !== 'manager') return;
    
    const shareableLink = generateShareableLink();
    
    // Show the link to the manager
    const message = `📱 Current Attendance Data Link:

${shareableLink}

📋 Share this link with employees to:
• See current attendance data
• Mark their attendance with latest info
• Sync across all devices

⚠️ This link contains current data and will work in any browser!`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareableLink).then(() => {
            alert(message + '\n\n✅ Link copied to clipboard!');
        }).catch(() => {
            prompt('📋 Copy this link:', shareableLink);
        });
    } else {
        prompt('📋 Copy this link:', shareableLink);
    }
}

// Auto-refresh data for real-time updates
function setupAutoRefresh() {
    setInterval(() => {
        if (userRole === 'manager') {
            const oldData = JSON.stringify(getSharedData());
            loadFromURL(); // Check for URL updates
            const newData = JSON.stringify(getSharedData());
            
            if (oldData !== newData) {
                console.log('New data detected, refreshing view...');
                loadManagerView();
            }
        }
    }, 5000); // Check every 5 seconds
}

// Debug function to check data sync status
function debugDataSync() {
    console.log('=== DATA SYNC DEBUG ===');
    console.log('Primary key data:', localStorage.getItem(SHARED_DATA_KEY));
    console.log('Backup keys data:');
    BACKUP_KEYS.forEach(key => {
        const data = localStorage.getItem(key);
        console.log(`${key}:`, data ? JSON.parse(data) : null);
    });
    console.log('SessionStorage data:', sessionStorage.getItem(SHARED_DATA_KEY));
    console.log('URL data:', loadFromURL());
    console.log('Last update:', localStorage.getItem('LAST_UPDATE_TIME'));
    console.log('=======================');
}

// Force refresh data from all sources
function forceDataRefresh() {
    const sharedData = getSharedData();
    console.log('Force refreshing data:', sharedData);
    if (userRole === 'manager') {
        loadManagerView();
    } else {
        loadEmployeeView();
    }
}

// Utility functions
function getStatusIcon(status) {
    switch(status) {
        case 'present': return '🏢';
        case 'wfh': return '🏠';
        case 'absent': return '❌';
        default: return '❓';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'present': return 'Present in Office';
        case 'wfh': return 'Work From Home';
        case 'absent': return 'On Leave';
        default: return 'Not Set';
    }
}

function updateSyncStatus(message) {
    const indicator = document.querySelector('.sync-indicator');
    if (indicator) {
        indicator.textContent = message;
        
        if (message.includes('✅')) {
            indicator.className = 'sync-indicator success';
        } else if (message.includes('🔄')) {
            indicator.className = 'sync-indicator syncing';
        } else {
            indicator.className = 'sync-indicator';
        }
    }
}

// Generate report
function generateReport() {
    if (userRole !== 'manager') return;
    
    const today = new Date().toLocaleDateString('en-GB');
    const submissions = [];
    
    let presentList = [];
    let wfhList = [];
    let absentList = [];
    let pendingList = [];
    
    EMPLOYEES.forEach(emp => {
        const submissionKey = `${SUBMISSIONS_KEY}_${emp.id}_${todayDate}`;
        const submission = localStorage.getItem(submissionKey);
        
        if (submission) {
            const data = JSON.parse(submission);
            if (data.status === 'present') presentList.push(emp.name);
            else if (data.status === 'wfh') wfhList.push(emp.name);
            else if (data.status === 'absent') absentList.push(emp.name);
        } else {
            pendingList.push(emp.name);
        }
    });
    
    const report = `📋 DAILY ATTENDANCE REPORT - ${today}

🏢 PRESENT IN OFFICE (${presentList.length}):
${presentList.length > 0 ? presentList.map(name => `• ${name}`).join('\\n') : '   None'}

🏠 WORK FROM HOME (${wfhList.length}):
${wfhList.length > 0 ? wfhList.map(name => `• ${name}`).join('\\n') : '   None'}

❌ ON LEAVE (${absentList.length}):
${absentList.length > 0 ? absentList.map(name => `• ${name}`).join('\\n') : '   None'}

⏰ PENDING (${pendingList.length}):
${pendingList.length > 0 ? pendingList.map(name => `• ${name}`).join('\\n') : '   None'}

TOTAL: ${EMPLOYEES.length} employees
SUBMITTED: ${EMPLOYEES.length - pendingList.length}

Generated: ${new Date().toLocaleString()}`;

    navigator.clipboard.writeText(report).then(() => {
        alert('📋 Report copied to clipboard!');
    }).catch(() => {
        prompt('📋 Copy this report:', report);
    });
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        
        currentUser = null;
        userRole = null;
        
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('managerMode').style.display = 'none';
        document.getElementById('employeeMode').style.display = 'none';
        document.getElementById('actionsSection').style.display = 'none';
        
        // Clear inputs
        document.getElementById('managerPassword').value = '';
        document.getElementById('employeePassword').value = '';
        document.getElementById('employeeSelect').value = '';
    }
}

// Reset daily attendance (manager only)
function resetDailyAttendance() {
    if (userRole !== 'manager') return;
    
    if (confirm('⚠️ This will clear all today\'s attendance. Continue?')) {
        EMPLOYEES.forEach(emp => {
            const submissionKey = `${SUBMISSIONS_KEY}_${emp.id}_${todayDate}`;
            localStorage.removeItem(submissionKey);
        });
        
        loadManagerView();
        alert('✅ All attendance data cleared for today');
    }
}

// Handle Enter key
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (document.activeElement.id === 'managerPassword') {
            loginAsManager();
        } else if (document.activeElement.id === 'employeePassword') {
            loginAsEmployee();
        }
    }
});

// Load data from URL on initial page load
window.addEventListener('load', () => {
    loadFromURL();
});

console.log('Attendance tracker script loaded successfully');

// Simple Attendance Tracker with Cross-Browser Support
// Global constants
const STORAGE_KEY = 'ATTENDANCE_TRACKER_DATA';
const SUBMISSIONS_KEY = 'ATTENDANCE_SUBMISSIONS';
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing attendance tracker...');
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
    
    // Check if already submitted today
    const submissionKey = `${SUBMISSIONS_KEY}_${employeeId}_${todayDate}`;
    const existingSubmission = localStorage.getItem(submissionKey);
    
    if (existingSubmission) {
        const data = JSON.parse(existingSubmission);
        const confirmEdit = confirm(`You already marked attendance as "${data.status.toUpperCase()}" today.\\n\\nDo you want to change it?`);
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
    
    EMPLOYEES.forEach(emp => {
        const submissionKey = `${SUBMISSIONS_KEY}_${emp.id}_${todayDate}`;
        const submission = localStorage.getItem(submissionKey);
        
        let status = 'not-set';
        let timestamp = null;
        
        if (submission) {
            const data = JSON.parse(submission);
            status = data.status;
            timestamp = data.timestamp;
            
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
    const submissionKey = `${SUBMISSIONS_KEY}_${currentUser}_${todayDate}`;
    const submission = localStorage.getItem(submissionKey);
    
    let status = 'not-set';
    let timestamp = null;
    
    if (submission) {
        const data = JSON.parse(submission);
        status = data.status;
        timestamp = data.timestamp;
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
    
    const submissionKey = `${SUBMISSIONS_KEY}_${currentUser}_${todayDate}`;
    const submissionData = {
        employeeId: currentUser,
        status: status,
        timestamp: new Date().toISOString(),
        date: todayDate
    };
    
    localStorage.setItem(submissionKey, JSON.stringify(submissionData));
    
    const statusText = getStatusText(status);
    alert(`✅ Your attendance has been recorded as: ${statusText}`);
    
    loadEmployeeView();
    updateSyncStatus('✅ Attendance saved successfully!');
}

// Manager sets employee attendance
function managerSetAttendance(employeeId, status) {
    console.log('Manager setting attendance:', employeeId, status);
    
    const submissionKey = `${SUBMISSIONS_KEY}_${employeeId}_${todayDate}`;
    const submissionData = {
        employeeId: employeeId,
        status: status,
        timestamp: new Date().toISOString(),
        date: todayDate,
        setBy: 'manager'
    };
    
    localStorage.setItem(submissionKey, JSON.stringify(submissionData));
    
    loadManagerView();
    updateSyncStatus('✅ Attendance updated');
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
    
    const submissions = [];
    
    EMPLOYEES.forEach(emp => {
        const submissionKey = `${SUBMISSIONS_KEY}_${emp.id}_${todayDate}`;
        const submission = localStorage.getItem(submissionKey);
        
        if (submission) {
            const data = JSON.parse(submission);
            const time = new Date(data.timestamp).toLocaleTimeString();
            const setBy = data.setBy === 'manager' ? ' (set by manager)' : '';
            submissions.push(`${emp.name}: ${getStatusText(data.status)} at ${time}${setBy}`);
        } else {
            submissions.push(`${emp.name}: Not submitted`);
        }
    });
    
    alert(`📊 Today's Submissions (${todayDate}):\\n\\n${submissions.join('\\n')}`);
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

console.log('Attendance tracker script loaded successfully');

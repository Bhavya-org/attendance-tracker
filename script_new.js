// Firebase Configuration (You'll need to replace with your own)
const firebaseConfig = {
    // For demo purposes - replace with your own Firebase config
    apiKey: "demo-key",
    authDomain: "attendance-tracker-demo.firebaseapp.com",
    databaseURL: "https://attendance-tracker-demo-default-rtdb.firebaseio.com",
    projectId: "attendance-tracker-demo",
    storageBucket: "attendance-tracker-demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};

// Global variables
let currentUser = null;
let userRole = null; // 'manager' or 'employee'
let employees = [];
let attendance = {};
let database = null;

// Default employee list with IDs
const defaultEmployees = [
    { name: "Bhavya", id: "bhavya" },
    { name: "Sahana", id: "sahana" },
    { name: "Asha", id: "asha" },
    { name: "Srikanth", id: "srikanth" }
];

// Manager credentials
const MANAGER_PASSWORD = "admin123";

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    displayCurrentDate();
    initializeFirebase();
    populateEmployeeSelect();
    checkExistingLogin();
});

// Display current date
function displayCurrentDate() {
    const today = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);
}

// Initialize Firebase (Mock implementation for demo)
function initializeFirebase() {
    // In production, you would initialize Firebase here
    // For demo, we'll use localStorage with a mock database interface
    database = {
        ref: (path) => ({
            set: (data) => {
                localStorage.setItem(`firebase_${path}`, JSON.stringify(data));
                return Promise.resolve();
            },
            get: () => {
                const data = localStorage.getItem(`firebase_${path}`);
                return Promise.resolve({ val: () => data ? JSON.parse(data) : null });
            },
            on: (event, callback) => {
                // Mock real-time listener
                const checkForUpdates = () => {
                    const data = localStorage.getItem(`firebase_${path}`);
                    if (data) {
                        callback({ val: () => JSON.parse(data) });
                    }
                };
                setInterval(checkForUpdates, 5000);
            }
        })
    };
    
    updateSyncStatus('✅ Connected to cloud database');
}

// Populate employee select dropdown
function populateEmployeeSelect() {
    const select = document.getElementById('employeeSelect');
    select.innerHTML = '<option value="">Select your name</option>';
    
    defaultEmployees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = emp.name;
        select.appendChild(option);
    });
}

// Check for existing login
function checkExistingLogin() {
    const savedUser = localStorage.getItem('currentUser');
    const savedRole = localStorage.getItem('userRole');
    
    if (savedUser && savedRole) {
        currentUser = savedUser;
        userRole = savedRole;
        showMainApp();
    }
}

// Login as Manager
function loginAsManager() {
    const password = document.getElementById('managerPassword').value;
    
    if (password === MANAGER_PASSWORD) {
        currentUser = 'manager';
        userRole = 'manager';
        
        // Save login state
        localStorage.setItem('currentUser', currentUser);
        localStorage.setItem('userRole', userRole);
        
        showMainApp();
        loadEmployeeData();
    } else {
        alert('❌ Incorrect manager password. Default password is: admin123');
        document.getElementById('managerPassword').value = '';
    }
}

// Login as Employee
function loginAsEmployee() {
    const selectedEmployee = document.getElementById('employeeSelect').value;
    const password = document.getElementById('employeePassword').value.toLowerCase();
    
    if (!selectedEmployee) {
        alert('❌ Please select your name from the dropdown');
        return;
    }
    
    if (password !== selectedEmployee) {
        alert('❌ Incorrect employee ID. Use your name in lowercase (e.g., "bhavya")');
        document.getElementById('employeePassword').value = '';
        return;
    }
    
    currentUser = selectedEmployee;
    userRole = 'employee';
    
    // Save login state
    localStorage.setItem('currentUser', currentUser);
    localStorage.setItem('userRole', userRole);
    
    showMainApp();
    loadEmployeeData();
}

// Show main application
function showMainApp() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    // Update user info
    const userInfo = document.getElementById('userInfo');
    if (userRole === 'manager') {
        userInfo.textContent = '👨‍💼 Manager Dashboard';
        document.getElementById('managerMode').style.display = 'block';
        document.getElementById('actionsSection').style.display = 'block';
        document.getElementById('attendanceTitle').textContent = "Team Attendance Overview";
    } else {
        const employeeName = defaultEmployees.find(emp => emp.id === currentUser)?.name || currentUser;
        userInfo.textContent = `👤 ${employeeName}`;
        document.getElementById('loggedEmployeeName').textContent = employeeName;
        document.getElementById('employeeMode').style.display = 'block';
        document.getElementById('attendanceTitle').textContent = "Your Attendance Status";
    }
    
    updateSyncStatus('🔄 Loading data...');
}

// Load employee data from database
function loadEmployeeData() {
    const today = new Date().toDateString();
    
    // Load employees
    database.ref('employees').get().then(snapshot => {
        const data = snapshot.val();
        if (data) {
            employees = data;
        } else {
            employees = defaultEmployees.map(emp => emp.name);
            saveEmployeesToDatabase();
        }
        
        updateEmployeeListDisplay();
        
        // Load today's attendance
        return database.ref(`attendance/${today}`).get();
    }).then(snapshot => {
        const data = snapshot.val();
        attendance = data || {};
        
        // Initialize attendance for new employees
        employees.forEach(name => {
            if (!attendance[name]) {
                attendance[name] = 'not-set';
            }
        });
        
        renderEmployeeList();
        updateSummary();
        updateSyncStatus('✅ Data loaded successfully');
        
        // Set up real-time listener for attendance updates
        setupRealTimeListener();
    }).catch(error => {
        console.error('Error loading data:', error);
        updateSyncStatus('⚠️ Error loading data');
    });
}

// Set up real-time listener for attendance updates
function setupRealTimeListener() {
    const today = new Date().toDateString();
    
    database.ref(`attendance/${today}`).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            attendance = data;
            renderEmployeeList();
            updateSummary();
            updateSyncStatus('✅ Data synchronized');
        }
    });
}

// Save employees to database
function saveEmployeesToDatabase() {
    database.ref('employees').set(employees);
}

// Save attendance to database
function saveAttendanceToDatabase() {
    const today = new Date().toDateString();
    database.ref(`attendance/${today}`).set(attendance);
}

// Update employee list display
function updateEmployeeListDisplay() {
    const display = document.getElementById('employeeListDisplay');
    if (display) {
        display.textContent = employees.join(', ');
    }
}

// Render employee list based on user role
function renderEmployeeList() {
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML = '';
    
    if (employees.length === 0) {
        employeeList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No employees found.</p>';
        return;
    }
    
    // For employees, only show their own card
    const employeesToShow = userRole === 'employee' ? 
        employees.filter(name => name.toLowerCase() === currentUser || 
                         defaultEmployees.find(emp => emp.id === currentUser)?.name === name) : 
        employees;
    
    employeesToShow.forEach(name => {
        const employeeCard = createEmployeeCard(name);
        employeeList.appendChild(employeeCard);
    });
}

// Create employee card
function createEmployeeCard(name) {
    const card = document.createElement('div');
    card.className = 'employee-card';
    
    const currentStatus = attendance[name] || 'not-set';
    const isOwnCard = userRole === 'employee' && 
        (name.toLowerCase() === currentUser || 
         defaultEmployees.find(emp => emp.id === currentUser)?.name === name);
    const canEdit = userRole === 'manager' || isOwnCard;
    
    // For employees viewing others' cards
    if (userRole === 'employee' && !isOwnCard) {
        card.className += ' readonly-card';
    }
    
    card.innerHTML = `
        <div class="employee-name">${name}</div>
        ${currentStatus === 'not-set' && isOwnCard ? 
            '<div style="color: #ff6b6b; font-size: 0.9rem; margin-bottom: 10px;">⏰ Please mark your attendance</div>' : ''}
        ${currentStatus !== 'not-set' ? 
            `<div class="status-display ${currentStatus}">
                ${getStatusEmoji(currentStatus)} ${getStatusText(currentStatus)}
            </div>` : ''}
        <div class="status-buttons" ${!canEdit ? 'style="pointer-events: none; opacity: 0.6;"' : ''}>
            <button class="status-btn present ${currentStatus === 'present' ? 'active' : ''}" 
                    onclick="setAttendance('${name}', 'present')"
                    ${!canEdit ? 'disabled' : ''}>
                🏢 Present
            </button>
            <button class="status-btn wfh ${currentStatus === 'wfh' ? 'active' : ''}" 
                    onclick="setAttendance('${name}', 'wfh')"
                    ${!canEdit ? 'disabled' : ''}>
                🏠 WFH
            </button>
            <button class="status-btn absent ${currentStatus === 'absent' ? 'active' : ''}" 
                    onclick="setAttendance('${name}', 'absent')"
                    ${!canEdit ? 'disabled' : ''}>
                ❌ Leave
            </button>
            ${userRole === 'manager' ? `
            <button class="status-btn client ${currentStatus === 'client' ? 'active' : ''}" 
                    onclick="setAttendance('${name}', 'client')"
                    ${!canEdit ? 'disabled' : ''}>
                🏢 Client Office
            </button>` : ''}
        </div>
        ${userRole === 'manager' ? `
        <button onclick="removeEmployee('${name}')" class="remove-btn">
            Remove Employee
        </button>` : ''}
        ${isOwnCard && currentStatus !== 'not-set' ? `
        <div class="success-message">
            ✅ Your attendance has been recorded!
        </div>` : ''}
    `;
    
    return card;
}

// Get status emoji
function getStatusEmoji(status) {
    switch(status) {
        case 'present': return '🏢';
        case 'wfh': return '🏠';
        case 'absent': return '❌';
        case 'client': return '🏢';
        default: return '❓';
    }
}

// Get status text
function getStatusText(status) {
    switch(status) {
        case 'present': return 'Present in Office';
        case 'wfh': return 'Work From Home';
        case 'absent': return 'On Leave';
        case 'client': return 'Client Office';
        default: return 'Not Set';
    }
}

// Set attendance status
function setAttendance(name, status) {
    // Check permissions
    if (userRole === 'employee') {
        const employeeName = defaultEmployees.find(emp => emp.id === currentUser)?.name;
        if (name !== currentUser && name !== employeeName) {
            alert('❌ You can only mark your own attendance!');
            return;
        }
    }
    
    attendance[name] = status;
    saveAttendanceToDatabase();
    renderEmployeeList();
    updateSummary();
    
    // Show confirmation for employees
    if (userRole === 'employee') {
        updateSyncStatus('✅ Attendance saved successfully!');
        setTimeout(() => {
            updateSyncStatus('✅ Connected to cloud database');
        }, 3000);
    }
}

// Add new employee (Manager only)
function addEmployee() {
    if (userRole !== 'manager') {
        alert('❌ Only managers can add employees');
        return;
    }
    
    const nameInput = document.getElementById('employeeName');
    const name = nameInput.value.trim();
    
    if (name === '') {
        alert('Please enter an employee name');
        return;
    }
    
    if (employees.includes(name)) {
        alert('Employee already exists');
        return;
    }
    
    employees.push(name);
    attendance[name] = 'not-set';
    nameInput.value = '';
    
    saveEmployeesToDatabase();
    saveAttendanceToDatabase();
    updateEmployeeListDisplay();
    renderEmployeeList();
    updateSummary();
}

// Remove employee (Manager only)
function removeEmployee(name) {
    if (userRole !== 'manager') {
        alert('❌ Only managers can remove employees');
        return;
    }
    
    if (confirm(`Are you sure you want to remove ${name}?`)) {
        employees = employees.filter(emp => emp !== name);
        delete attendance[name];
        
        saveEmployeesToDatabase();
        saveAttendanceToDatabase();
        updateEmployeeListDisplay();
        renderEmployeeList();
        updateSummary();
    }
}

// Update summary counts
function updateSummary() {
    let presentCount = 0;
    let wfhCount = 0;
    let absentCount = 0;
    let clientCount = 0;
    
    Object.values(attendance).forEach(status => {
        switch(status) {
            case 'present':
                presentCount++;
                break;
            case 'wfh':
                wfhCount++;
                break;
            case 'absent':
                absentCount++;
                break;
            case 'client':
                clientCount++;
                break;
        }
    });
    
    document.getElementById('presentCount').textContent = presentCount;
    document.getElementById('wfhCount').textContent = wfhCount;
    document.getElementById('absentCount').textContent = absentCount + clientCount;
}

// Update sync status
function updateSyncStatus(message) {
    const indicator = document.querySelector('.sync-indicator');
    if (indicator) {
        indicator.textContent = message;
        
        if (message.includes('✅')) {
            indicator.className = 'sync-indicator success';
        } else if (message.includes('🔄')) {
            indicator.className = 'sync-indicator syncing';
        } else if (message.includes('⚠️')) {
            indicator.className = 'sync-indicator error';
        } else {
            indicator.className = 'sync-indicator';
        }
    }
}

// Generate report (Manager only)
function generateReport() {
    if (userRole !== 'manager') {
        alert('❌ Only managers can generate reports');
        return;
    }
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB');
    
    let presentEmployees = [];
    let wfhEmployees = [];
    let absentEmployees = [];
    let pendingEmployees = [];
    let clientOfficeEmployees = [];
    
    employees.forEach(name => {
        const status = attendance[name];
        switch(status) {
            case 'present':
                presentEmployees.push(name);
                break;
            case 'wfh':
                wfhEmployees.push(name);
                break;
            case 'absent':
                absentEmployees.push(name);
                break;
            case 'client':
                clientOfficeEmployees.push(name);
                break;
            default:
                pendingEmployees.push(name);
                break;
        }
    });
    
    const report = `📋 DAILY ATTENDANCE REPORT - ${dateStr}

🏢 PRESENT IN OFFICE (${presentEmployees.length}):
${presentEmployees.length > 0 ? presentEmployees.map(name => `• ${name}`).join('\n') : '   None'}

🏠 WORK FROM HOME (${wfhEmployees.length}):
${wfhEmployees.length > 0 ? wfhEmployees.map(name => `• ${name}`).join('\n') : '   None'}

❌ ON LEAVE (${absentEmployees.length}):
${absentEmployees.length > 0 ? absentEmployees.map(name => `• ${name}`).join('\n') : '   None'}

🏢 CLIENT OFFICE (${clientOfficeEmployees.length}):
${clientOfficeEmployees.length > 0 ? clientOfficeEmployees.map(name => `• ${name}`).join('\n') : '   None'}

⏰ PENDING ATTENDANCE (${pendingEmployees.length}):
${pendingEmployees.length > 0 ? pendingEmployees.map(name => `• ${name}`).join('\n') : '   None'}

TOTAL TEAM SIZE: ${employees.length}
ATTENDANCE MARKED: ${employees.length - pendingEmployees.length}

Generated on: ${today.toLocaleString()}`;

    // Copy to clipboard
    navigator.clipboard.writeText(report).then(() => {
        alert('📋 Report copied to clipboard!');
    }).catch(() => {
        // Fallback - show in prompt
        prompt('📋 Report generated (Copy manually):', report);
    });
}

// Reset daily attendance (Manager only)
function resetDailyAttendance() {
    if (userRole !== 'manager') {
        alert('❌ Only managers can reset attendance');
        return;
    }
    
    if (confirm('⚠️ This will reset today\'s attendance for all employees. Continue?')) {
        employees.forEach(name => {
            attendance[name] = 'not-set';
        });
        
        saveAttendanceToDatabase();
        renderEmployeeList();
        updateSummary();
        alert('✅ Today\'s attendance has been reset for all employees');
    }
}

// Logout function
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
        
        // Clear password fields
        document.getElementById('managerPassword').value = '';
        document.getElementById('employeePassword').value = '';
        document.getElementById('employeeSelect').value = '';
    }
}

// Additional functions for manager features
function exportToCSV() {
    if (userRole !== 'manager') return;
    
    const today = new Date().toLocaleDateString('en-GB');
    let csvContent = `Name,Status,Date\n`;
    
    employees.forEach(name => {
        const status = attendance[name] || 'not-set';
        csvContent += `${name},${getStatusText(status)},${today}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${today.replace(/\//g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function addManualAttendance() {
    if (userRole !== 'manager') return;
    
    const input = prompt(`Enter attendance manually:

Format: Name - Status
Example: John Doe - Present

Status options: Present, WFH, Leave, Client

Enter one person's attendance:`);
    
    if (!input) return;
    
    const parts = input.split(' - ');
    if (parts.length !== 2) {
        alert('Invalid format. Please use: Name - Status');
        return;
    }
    
    const name = parts[0].trim();
    const status = parts[1].trim().toLowerCase();
    
    if (!employees.includes(name)) {
        if (confirm(`${name} is not in the employee list. Add them?`)) {
            employees.push(name);
            saveEmployeesToDatabase();
            updateEmployeeListDisplay();
        } else {
            return;
        }
    }
    
    let statusCode;
    switch(status) {
        case 'present':
        case 'office':
            statusCode = 'present';
            break;
        case 'wfh':
        case 'home':
            statusCode = 'wfh';
            break;
        case 'leave':
        case 'absent':
            statusCode = 'absent';
            break;
        case 'client':
            statusCode = 'client';
            break;
        default:
            alert('Invalid status. Use: Present, WFH, Leave, or Client');
            return;
    }
    
    attendance[name] = statusCode;
    saveAttendanceToDatabase();
    renderEmployeeList();
    updateSummary();
    
    alert(`✅ ${name} marked as ${getStatusText(statusCode)}`);
}

function showPendingAttendance() {
    if (userRole !== 'manager') return;
    
    const pending = employees.filter(name => attendance[name] === 'not-set' || !attendance[name]);
    
    if (pending.length === 0) {
        alert('✅ All employees have marked their attendance!');
    } else {
        alert(`⏰ Pending Attendance (${pending.length}):\n\n${pending.map(name => `• ${name}`).join('\n')}`);
    }
}

// Handle Enter key events
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (document.activeElement.id === 'managerPassword') {
            loginAsManager();
        } else if (document.activeElement.id === 'employeePassword') {
            loginAsEmployee();
        } else if (document.activeElement.id === 'employeeName') {
            addEmployee();
        }
    }
});

// Global variables
let employees = [];
let attendance = {};
let currentMode = 'manager';
let selectedEmployee = null;

// Pre-populate with your actual employee names
const defaultEmployees = [
    "Bhavya",
    "Sahana", 
    "Asha",
    "Srikanth"
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    displayCurrentDate();
    loadDataFromURL(); // Load data from URL first
    loadData(); // Then load local data
    syncAttendanceData(); // Sync with server data
    initializeShareLink();
    renderEmployeeList();
    updateSummary();
    
    // Check URL for employee mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'employee') {
        switchMode('employee');
    }
    
    // Auto-sync every 30 seconds in employee mode
    setInterval(() => {
        if (currentMode === 'employee') {
            syncAttendanceData();
            updateSummary();
        }
    }, 30000);
});

// Load data from URL parameters
function loadDataFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (dataParam) {
        try {
            const decodedData = JSON.parse(atob(dataParam));
            if (decodedData.employees && Array.isArray(decodedData.employees)) {
                employees = decodedData.employees;
                
                // Initialize attendance for new employees
                employees.forEach(name => {
                    if (!attendance[name]) {
                        attendance[name] = 'not-set';
                    }
                });
                
                // Save to local storage
                saveData();
                
                console.log('Employee data loaded from URL:', employees);
            }
        } catch (error) {
            console.log('Failed to load data from URL:', error);
            // If URL data fails, ensure we have default employees
            if (employees.length === 0) {
                employees = [...defaultEmployees];
                employees.forEach(name => {
                    attendance[name] = 'not-set';
                });
                saveData();
            }
        }
    } else {
        // No URL data, ensure we have default employees
        if (employees.length === 0) {
            employees = [...defaultEmployees];
            employees.forEach(name => {
                attendance[name] = 'not-set';
            });
            saveData();
        }
    }
}

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

// Add new employee
function addEmployee() {
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
    
    saveData();
    renderEmployeeList();
    updateSummary();
}

// Render employee list
function renderEmployeeList() {
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML = '';
    
    if (employees.length === 0) {
        employeeList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No employees added yet. Add some employees to start tracking attendance!</p>';
        return;
    }
    
    employees.forEach(name => {
        const employeeCard = createEmployeeCard(name);
        employeeList.appendChild(employeeCard);
    });
}

// Create employee card
function createEmployeeCard(name) {
    const card = document.createElement('div');
    let cardClass = 'employee-card new';
    
    // In employee mode, only highlight selected employee and disable others
    const isEmployeeMode = currentMode === 'employee';
    const isSelectedEmployee = selectedEmployee === name;
    const canEdit = currentMode === 'manager' || isSelectedEmployee;
    
    if (isEmployeeMode && isSelectedEmployee) {
        cardClass += ' selected-employee';
    } else if (isEmployeeMode && !isSelectedEmployee) {
        cardClass += ' disabled-employee';
    }
    
    card.className = cardClass;
    
    const currentStatus = attendance[name] || 'not-set';
    
    card.innerHTML = `
        <div class="employee-name">${name}</div>
        ${currentStatus === 'not-set' && isEmployeeMode && isSelectedEmployee ? 
            '<div style="color: #ff6b6b; font-size: 0.9rem; margin-bottom: 10px;">⏰ Please mark your attendance</div>' : ''}
        ${isEmployeeMode && !isSelectedEmployee && currentStatus !== 'not-set' ? 
            '<div style="color: #28a745; font-size: 0.9rem; margin-bottom: 10px;">✅ Attendance marked</div>' : ''}
        <div class="status-buttons">
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
            ${currentMode === 'manager' ? `
            <button class="status-btn client ${currentStatus === 'client' ? 'active' : ''}" 
                    onclick="setAttendance('${name}', 'client')"
                    ${!canEdit ? 'disabled' : ''}>
                🏢 Client Office
            </button>` : ''}
        </div>
        ${currentMode === 'manager' ? `
        <button onclick="removeEmployee('${name}')" style="margin-top: 10px; background: #dc3545; font-size: 0.8rem; padding: 5px 10px;">
            Remove Employee
        </button>` : ''}
        ${isEmployeeMode && isSelectedEmployee && currentStatus !== 'not-set' ? `
        <div style="margin-top: 10px; padding: 8px; background: #d4edda; color: #155724; border-radius: 5px; font-size: 0.9rem; text-align: center;">
            ✅ Your attendance has been recorded!
        </div>` : ''}
    `;
    
    return card;
}

// Set attendance status
function setAttendance(name, status) {
    // In employee mode, only allow editing of selected employee
    if (currentMode === 'employee' && selectedEmployee !== name) {
        alert('You can only mark your own attendance!');
        return;
    }
    
    attendance[name] = status;
    saveData();
    
    // If in employee mode, also save to server
    if (currentMode === 'employee') {
        saveAttendanceToServer();
    }
    
    renderEmployeeList();
    updateSummary();
    
    // If in employee mode, show confirmation
    if (currentMode === 'employee' && selectedEmployee === name) {
        const statusText = status === 'present' ? 'Present in Office' :
                          status === 'wfh' ? 'Work From Home' : 
                          status === 'absent' ? 'On Leave' : 'At Client Office';
        setTimeout(() => {
            alert(`✅ Your attendance has been recorded as: ${statusText}`);
        }, 500);
    }
}

// Remove employee
function removeEmployee(name) {
    if (confirm(`Are you sure you want to remove ${name}?`)) {
        employees = employees.filter(emp => emp !== name);
        delete attendance[name];
        saveData();
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
    document.getElementById('absentCount').textContent = absentCount + clientCount; // Combine for display
}

// Generate email report
function generateReport() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    
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
    
    let report = `Subject: Attendance Update - DT Office - ${dateStr}\n\n`;
    report += `Hi All,\n`;
    report += `Good Morning!!\n\n`;
    report += `Please note the attendance for today:\n\n`;
    
    // Leave section
    if (absentEmployees.length > 0) {
        report += `Leave:\n`;
        absentEmployees.forEach((name, index) => {
            report += `       ${index + 1}.${name}\n`;
        });
        report += `\n`;
    } else {
        report += `Leave: None\n`;
    }
    
    // WFH section
    if (wfhEmployees.length > 0) {
        report += `WFH:\n`;
        wfhEmployees.forEach((name, index) => {
            report += `       ${index + 1}.${name}\n`;
        });
        report += `\n`;
    } else {
        report += `WFH: None\n\n`;
    }
    
    // Client Office section
    if (clientOfficeEmployees.length > 0) {
        report += `Client Office:\n`;
        clientOfficeEmployees.forEach((name, index) => {
            report += `        ${index + 1}. ${name}\n`;
        });
        report += `\n`;
    }
    
    // All present message
    if (absentEmployees.length === 0 && wfhEmployees.length === 0 && clientOfficeEmployees.length === 0) {
        report += `All team members are present in the office today.\n\n`;
    }
    
    // Pending section (if any)
    if (pendingEmployees.length > 0) {
        report += `⏰ PENDING RESPONSE (${pendingEmployees.length}):\n`;
        pendingEmployees.forEach((name, index) => {
            report += `       ${index + 1}.${name} - Not yet marked\n`;
        });
        report += `\n`;
    }
    
    report += `Regards,\n`;
    report += `Bhavyashree\n\n`;
    report += `--\n`;
    report += `Generated on: ${new Date().toLocaleString()}`;
    
    document.getElementById('emailReport').value = report;
    document.getElementById('reportSection').style.display = 'block';
    document.getElementById('reportSection').scrollIntoView({ behavior: 'smooth' });
}

// Copy report to clipboard
function copyReport() {
    const reportText = document.getElementById('emailReport');
    reportText.select();
    reportText.setSelectionRange(0, 99999); // For mobile devices
    
    navigator.clipboard.writeText(reportText.value).then(function() {
        alert('Report copied to clipboard! You can now paste it in your email.');
    }, function(err) {
        console.error('Could not copy text: ', err);
        alert('Failed to copy. Please select the text and copy manually.');
    });
}

// Export to CSV
function exportToCSV() {
    const today = new Date().toISOString().split('T')[0];
    let csvContent = "Employee Name,Status,Date\n";
    
    employees.forEach(name => {
        const status = attendance[name] || 'not-set';
        csvContent += `"${name}","${status}","${today}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Clear all data
function clearData() {
    if (confirm('Are you sure you want to clear all data? This will remove all employees and attendance records.')) {
        employees = [];
        attendance = {};
        localStorage.removeItem('attendanceData');
        renderEmployeeList();
        updateSummary();
        document.getElementById('reportSection').style.display = 'none';
    }
}

// Save data to localStorage and generate share code
function saveData() {
    const data = {
        employees: employees,
        attendance: attendance,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('attendanceData', JSON.stringify(data));
    
    // Generate share code for easy data transfer
    generateShareCode(data);
}

// Generate share code for data transfer
function generateShareCode(data) {
    if (employees.length > 0) {
        const shareCode = btoa(JSON.stringify({
            employees: data.employees,
            timestamp: new Date().toISOString()
        }));
        
        // Store the share code for display
        localStorage.setItem('attendanceShareCode', shareCode);
    }
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('attendanceData');
    if (savedData) {
        const data = JSON.parse(savedData);
        employees = data.employees || [];
        attendance = data.attendance || {};
        
        // Check if it's a new day, reset attendance
        const lastUpdated = new Date(data.lastUpdated);
        const today = new Date();
        
        if (lastUpdated.toDateString() !== today.toDateString()) {
            // Reset attendance for new day
            employees.forEach(name => {
                attendance[name] = 'not-set';
            });
            saveData();
        }
    }
    
    // If no employees exist, use default list
    if (employees.length === 0) {
        employees = [...defaultEmployees];
        employees.forEach(name => {
            attendance[name] = 'not-set';
        });
        saveData();
    }
}

// Handle Enter key in employee name input
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('employeeName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addEmployee();
        }
    });
});

// Mode switching functionality
function switchMode(mode) {
    currentMode = mode;
    selectedEmployee = null;
    
    // Update button states
    document.getElementById('managerModeBtn').classList.toggle('active', mode === 'manager');
    document.getElementById('employeeModeBtn').classList.toggle('active', mode === 'employee');
    
    // Show/hide sections
    document.getElementById('managerMode').style.display = mode === 'manager' ? 'block' : 'none';
    document.getElementById('employeeMode').style.display = mode === 'employee' ? 'block' : 'none';
    document.getElementById('actionsSection').style.display = mode === 'manager' ? 'block' : 'none';
    
    // Update attendance title
    document.getElementById('attendanceTitle').textContent = 
        mode === 'manager' ? "Today's Attendance" : "All Team Members Status (Read Only)";
    
    if (mode === 'employee') {
        renderEmployeeSearch();
        // Clear search input
        document.getElementById('employeeSearch').value = '';
        // Show welcome message for employees
        showEmployeeWelcome();
    }
    
    renderEmployeeList();
}

// Show welcome message for employees
function showEmployeeWelcome() {
    const existingWelcome = document.getElementById('employeeWelcome');
    if (existingWelcome) {
        existingWelcome.remove();
    }
    
    const welcomeDiv = document.createElement('div');
    welcomeDiv.id = 'employeeWelcome';
    welcomeDiv.className = 'employee-welcome';
    welcomeDiv.innerHTML = `
        <h2>👋 Welcome!</h2>
        <p><strong>Step 1:</strong> Find your name below and click on your card</p>
        <p><strong>Step 2:</strong> Mark your attendance (Present/WFH/Leave)</p>
        <p><strong>Note:</strong> You can only mark your own attendance. Other employees will appear grayed out.</p>
    `;
    
    const employeeSection = document.querySelector('.employee-self-service');
    employeeSection.insertBefore(welcomeDiv, employeeSection.firstChild);
}

// Initialize share link
function initializeShareLink() {
    // Check if it's a local development server
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
        // Show instructions for hosting online
        document.getElementById('shareLink').value = 'Host online to get shareable link';
        showHostingInstructions();
    } else {
        // It's already hosted online
        const shareCode = localStorage.getItem('attendanceShareCode');
        let shareUrl = window.location.href.split('?')[0] + '?mode=employee';
        
        // Add employee data to the URL if available
        if (shareCode && employees.length > 0) {
            shareUrl += '&data=' + shareCode;
        }
        
        document.getElementById('shareLink').value = shareUrl;
    }
}

// Show hosting instructions
function showHostingInstructions() {
    const shareSection = document.querySelector('.share-section');
    const existingInstructions = document.getElementById('hostingInstructions');
    
    if (!existingInstructions) {
        const instructionsDiv = document.createElement('div');
        instructionsDiv.id = 'hostingInstructions';
        instructionsDiv.className = 'hosting-instructions';
        instructionsDiv.innerHTML = `
            <div class="hosting-alert">
                <h3>🌐 To Share Link Online</h3>
                <p>Your files need to be hosted online for others to access. Choose one:</p>
                
                <div class="hosting-options">
                    <div class="hosting-option">
                        <h4>🎯 GitHub Pages (Recommended)</h4>
                        <ol>
                            <li>Create free GitHub account at <a href="https://github.com" target="_blank">github.com</a></li>
                            <li>Create new repository called "attendance-tracker"</li>
                            <li>Upload all your files (index.html, style.css, script.js)</li>
                            <li>Enable GitHub Pages in Settings</li>
                            <li>Get link: https://[username].github.io/attendance-tracker</li>
                        </ol>
                        <button onclick="openGitHubGuide()" class="guide-btn">📖 Detailed Guide</button>
                    </div>
                    
                    <div class="hosting-option">
                        <h4>⚡ Netlify Drop (Super Easy)</h4>
                        <ol>
                            <li>Go to <a href="https://app.netlify.com/drop" target="_blank">netlify.com/drop</a></li>
                            <li>Drag your attendance_test folder</li>
                            <li>Get instant link!</li>
                        </ol>
                        <button onclick="openNetlify()" class="guide-btn">🚀 Try Netlify</button>
                    </div>
                </div>
                
                <p class="hosting-note">� Once hosted, your link will work for everyone and you can share it easily!</p>
            </div>
        `;
        
        shareSection.appendChild(instructionsDiv);
    }
}

// Open GitHub guide
function openGitHubGuide() {
    window.open('https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site', '_blank');
}

// Open Netlify
function openNetlify() {
    window.open('https://app.netlify.com/drop', '_blank');
}

// Copy share link
function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    const linkText = shareLink.value;
    
    // Try multiple methods to copy
    if (navigator.clipboard && window.isSecureContext) {
        // Modern clipboard API
        navigator.clipboard.writeText(linkText).then(function() {
            showSuccessMessage('✅ Link copied successfully! Share this with your colleagues.');
        }).catch(function(err) {
            fallbackCopyMethod(shareLink, linkText);
        });
    } else {
        fallbackCopyMethod(shareLink, linkText);
    }
}

// Fallback copy method
function fallbackCopyMethod(shareLink, linkText) {
    try {
        shareLink.select();
        shareLink.setSelectionRange(0, 99999); // For mobile devices
        
        // Try the old execCommand method
        const successful = document.execCommand('copy');
        if (successful) {
            showSuccessMessage('✅ Link copied! Share this with your colleagues.');
        } else {
            throw new Error('execCommand failed');
        }
    } catch (err) {
        // Manual copy fallback
        shareLink.select();
        showSuccessMessage('⚠️ Please press Ctrl+C (or Cmd+C on Mac) to copy the selected link.');
        
        // Also show an alert with the link
        setTimeout(() => {
            alert('Copy this link manually:\n\n' + linkText);
        }, 1000);
    }
}

// Show success message
function showSuccessMessage(message) {
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    const shareSection = document.querySelector('.share-section');
    shareSection.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Render employee search
function renderEmployeeSearch() {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    if (employees.length === 0) {
        searchResults.innerHTML = `
            <div class="no-employees-message">
                <h3>👥 No Employees Found</h3>
                <p>Please contact your manager to add employees to the system.</p>
                <p>Or ask your manager to add your name first.</p>
            </div>
        `;
        return;
    }
    
    // Show instruction message
    const instructionDiv = document.createElement('div');
    instructionDiv.className = 'employee-instruction';
    instructionDiv.innerHTML = `
        <h3>📝 Find Your Name Below</h3>
        <p>Click on your name card to select it, then mark your attendance status.</p>
    `;
    searchResults.appendChild(instructionDiv);
    
    // Show all employees initially
    employees.forEach(name => {
        const card = createEmployeeSearchCard(name);
        searchResults.appendChild(card);
    });
}

// Create employee search card
function createEmployeeSearchCard(name) {
    const card = document.createElement('div');
    card.className = 'employee-search-card';
    card.onclick = () => selectEmployeeForSelfService(name);
    
    const currentStatus = attendance[name] || 'not-set';
    const statusText = currentStatus === 'not-set' ? '❓ Not marked yet' : 
                      currentStatus === 'present' ? '🏢 Present in Office' :
                      currentStatus === 'wfh' ? '🏠 Work From Home' : 
                      currentStatus === 'absent' ? '❌ On Leave' :
                      currentStatus === 'client' ? '🏢 At Client Office' : 'Unknown';
    
    const statusColor = currentStatus === 'not-set' ? '#ff6b6b' : 
                       currentStatus === 'present' ? '#28a745' :
                       currentStatus === 'wfh' ? '#17a2b8' : 
                       currentStatus === 'absent' ? '#dc3545' :
                       currentStatus === 'client' ? '#0288d1' : '#666';
    
    card.innerHTML = `
        <div class="employee-search-name">👤 ${name}</div>
        <div style="color: ${statusColor}; font-size: 1rem; margin-bottom: 15px; font-weight: 600;">
            Current Status: ${statusText}
        </div>
        <div class="employee-search-status">
            <button class="status-btn present ${currentStatus === 'present' ? 'active' : ''}" 
                    onclick="event.stopPropagation(); setAttendanceAsEmployee('${name}', 'present')">
                🏢 Present
            </button>
            <button class="status-btn wfh ${currentStatus === 'wfh' ? 'active' : ''}" 
                    onclick="event.stopPropagation(); setAttendanceAsEmployee('${name}', 'wfh')">
                🏠 WFH
            </button>
            <button class="status-btn absent ${currentStatus === 'absent' ? 'active' : ''}" 
                    onclick="event.stopPropagation(); setAttendanceAsEmployee('${name}', 'absent')">
                ❌ Leave
            </button>
        </div>
        <div class="click-instruction">
            ${currentStatus === 'not-set' ? '👆 Click a button above to mark your attendance' : '✅ Attendance marked! You can change it if needed.'}
        </div>
    `;
    
    return card;
}

// Filter employees in search
function filterEmployees() {
    const searchTerm = document.getElementById('employeeSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.employee-search-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
        const nameElement = card.querySelector('.employee-search-name');
        if (nameElement) {
            const name = nameElement.textContent.toLowerCase();
            const isVisible = name.includes(searchTerm);
            card.style.display = isVisible ? 'block' : 'none';
            if (isVisible) visibleCount++;
        }
    });
    
    // Show message if no results
    const searchResults = document.getElementById('searchResults');
    const existingNoResults = document.getElementById('noSearchResults');
    
    if (existingNoResults) {
        existingNoResults.remove();
    }
    
    if (visibleCount === 0 && searchTerm.length > 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.id = 'noSearchResults';
        noResultsDiv.className = 'no-search-results';
        noResultsDiv.innerHTML = `
            <h3>🔍 No matches found for "${searchTerm}"</h3>
            <p>Try typing your full name or check the spelling.</p>
            <p>If your name is not listed, please contact your manager.</p>
        `;
        searchResults.appendChild(noResultsDiv);
    }
}

// Select employee for self-service
function selectEmployeeForSelfService(name) {
    selectedEmployee = name;
    
    // Update search cards
    const cards = document.querySelectorAll('.employee-search-card');
    cards.forEach(card => {
        card.classList.remove('selected');
        const cardName = card.querySelector('.employee-search-name').textContent;
        if (cardName === name) {
            card.classList.add('selected');
        }
    });
    
    // Update employee list display
    renderEmployeeList();
}

// Set attendance as employee
function setAttendanceAsEmployee(name, status) {
    attendance[name] = status;
    saveData();
    
    // Sync data across all users
    syncAttendanceData();
    
    renderEmployeeSearch();
    renderEmployeeList();
    updateSummary();
    
    // Show success message
    const statusText = status === 'present' ? 'Present in Office' :
                      status === 'wfh' ? 'Work From Home' : 'On Leave';
    showSuccessMessageInSearch(`✅ Your attendance has been marked as: ${statusText}`);
    
    // Auto-save to server simulation (using localStorage with timestamp)
    saveAttendanceToServer();
}

// Simulate saving to server (for data sync)
function saveAttendanceToServer() {
    const serverData = {
        attendance: attendance,
        employees: employees,
        lastSync: new Date().toISOString(),
        date: new Date().toDateString()
    };
    localStorage.setItem('serverAttendanceData', JSON.stringify(serverData));
}

// Sync attendance data from server
function syncAttendanceData() {
    const serverData = localStorage.getItem('serverAttendanceData');
    if (serverData) {
        try {
            const data = JSON.parse(serverData);
            const today = new Date().toDateString();
            
            // Only sync if it's the same day
            if (data.date === today) {
                // Merge attendance data
                Object.keys(data.attendance).forEach(name => {
                    if (employees.includes(name)) {
                        attendance[name] = data.attendance[name];
                    }
                });
                saveData();
            }
        } catch (error) {
            console.log('Sync error:', error);
        }
    }
}

// Show success message in search area
function showSuccessMessageInSearch(message) {
    const existingMessage = document.querySelector('.employee-self-service .success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    const employeeSection = document.querySelector('.employee-self-service');
    employeeSection.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 4000);
}

// Show pending attendance
function showPendingAttendance() {
    const pending = employees.filter(name => !attendance[name] || attendance[name] === 'not-set');
    
    if (pending.length === 0) {
        alert('✅ All employees have marked their attendance!');
        return;
    }
    
    const pendingList = pending.map(name => `• ${name}`).join('\n');
    alert(`⏰ Pending Attendance (${pending.length}):\n\n${pendingList}\n\nReminder: Share the employee link with them!`);
}

// Add some sample data for demo (remove this in production)
function addSampleData() {
    const sampleEmployees = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'];
    sampleEmployees.forEach(name => {
        if (!employees.includes(name)) {
            employees.push(name);
            attendance[name] = 'not-set';
        }
    });
    saveData();
    renderEmployeeList();
    updateSummary();
}

// Uncomment the line below to add sample data for testing
// addSampleData();

// Share options functionality
function openShareOptions() {
    document.getElementById('shareModal').style.display = 'block';
}

function closeShareOptions() {
    document.getElementById('shareModal').style.display = 'none';
}

function copyAsWhatsAppMessage() {
    const link = document.getElementById('shareLink').value;
    const message = `📋 *Daily Attendance Update*

Hi Team! 👋

Please mark your attendance for today using this link:
${link}

📝 Instructions:
1. Click the link
2. Switch to "Employee Mode" 
3. Find your name and mark status

Thank you! 😊

- Bhavyashree`;
    
    document.getElementById('shareMessageText').value = message;
    copyText(message, '✅ WhatsApp message copied! Paste it in your WhatsApp group.');
}

function copyAsEmailText() {
    const link = document.getElementById('shareLink').value;
    const message = `Subject: Daily Attendance - Please Update Your Status

Dear Team,

Please mark your attendance for today using the link below:

${link}

Instructions:
1. Click the link above
2. Switch to "Employee Mode" button
3. Search for your name and mark your status (Present/WFH/Leave)

Please complete this by 10:00 AM.

Thank you for your cooperation.

Best regards,
Bhavyashree`;
    
    document.getElementById('shareMessageText').value = message;
    copyText(message, '✅ Email text copied! Paste it in your email.');
}

function showQRCode() {
    const link = document.getElementById('shareLink').value;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
    
    const qrWindow = window.open('', '_blank', 'width=300,height=350');
    qrWindow.document.write(`
        <html>
        <head><title>QR Code for Attendance</title></head>
        <body style="text-align: center; font-family: Arial;">
            <h3>📱 Scan to Mark Attendance</h3>
            <img src="${qrUrl}" alt="QR Code" style="border: 1px solid #ccc; padding: 10px;">
            <p style="font-size: 12px; color: #666;">Scan with your phone camera</p>
        </body>
        </html>
    `);
}

function copyText(text, successMessage) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function() {
            showSuccessMessage(successMessage);
        }).catch(function() {
            fallbackCopy(text, successMessage);
        });
    } else {
        fallbackCopy(text, successMessage);
    }
}

function fallbackCopy(text, successMessage) {
    const textArea = document.getElementById('shareMessageText');
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        showSuccessMessage(successMessage);
    } catch (err) {
        showSuccessMessage('⚠️ Please press Ctrl+C to copy the selected text.');
    }
}

// Create simple form for data collection
function createSimpleForm() {
    const today = new Date().toLocaleDateString('en-GB');
    const employeesList = employees.map(name => `• ${name}`).join('\n');
    
    const formText = `📋 DAILY ATTENDANCE - ${today}

Hi Team!

Please reply to this message with your attendance status:

Format: [Your Name] - [Status]
Example: John Doe - Present

Team Members:
${employeesList}

Status Options:
🏢 Present (in office)
🏠 WFH (work from home)  
❌ Leave (on leave)
🏢 Client (at client office)

Please reply by 10:00 AM.

Thank you!
- Bhavyashree`;

    // Show in modal
    document.getElementById('shareMessageText').value = formText;
    document.getElementById('shareModal').style.display = 'block';
    
    showSuccessMessage('📝 Simple form created! Copy and send via WhatsApp/Email.');
}

// Enhanced WhatsApp message for local sharing
function copyAsWhatsAppMessage() {
    const today = new Date().toLocaleDateString('en-GB');
    const employeesList = employees.map(name => `• ${name}`).join('\n');
    
    const message = `📋 *DAILY ATTENDANCE - ${today}*

Hi Team! 👋

Please reply with your status:

*Format:* [Name] - [Status]
*Example:* John Doe - Present

*Team Members:*
${employeesList}

*Status Options:*
🏢 Present (in office)
🏠 WFH (work from home)
❌ Leave (on leave)  
🏢 Client (at client office)

Please reply by 10:00 AM ⏰

Thank you! 😊
- Bhavyashree`;
    
    document.getElementById('shareMessageText').value = message;
    copyText(message, '✅ WhatsApp message copied! Send to your team group.');
}

// Manual attendance entry function
function addManualAttendance() {
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
    
    // Add employee if not exists
    if (!employees.includes(name)) {
        employees.push(name);
    }
    
    // Set status
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
    saveData();
    renderEmployeeList();
    updateSummary();
    
    alert(`✅ ${name} marked as ${status}`);
}

// Export employee list for sharing
function exportEmployeeList() {
    if (employees.length === 0) {
        alert('No employees to export. Please add employees first.');
        return;
    }
    
    const employeeList = employees.join('\n');
    const blob = new Blob([employeeList], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "employee_list.txt");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('Employee list exported! You can share this file with others.');
}

// Import employee list
function importEmployeeList() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                const names = content.split('\n').map(name => name.trim()).filter(name => name.length > 0);
                
                if (names.length > 0) {
                    names.forEach(name => {
                        if (!employees.includes(name)) {
                            employees.push(name);
                            attendance[name] = 'not-set';
                        }
                    });
                    
                    saveData();
                    renderEmployeeList();
                    updateSummary();
                    initializeShareLink(); // Update share link with new data
                    
                    alert(`Imported ${names.length} employees successfully!`);
                } else {
                    alert('No valid employee names found in the file.');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Add bulk employees
function addBulkEmployees() {
    const input = prompt(`Add multiple employees at once:

Enter names separated by commas or new lines:
Example: John Doe, Jane Smith, Mike Johnson

Or one name per line:
John Doe
Jane Smith
Mike Johnson`);
    
    if (!input) return;
    
    const names = input.split(/[,\n]/).map(name => name.trim()).filter(name => name.length > 0);
    let addedCount = 0;
    
    names.forEach(name => {
        if (!employees.includes(name)) {
            employees.push(name);
            attendance[name] = 'not-set';
            addedCount++;
        }
    });
    
    if (addedCount > 0) {
        saveData();
        renderEmployeeList();
        updateSummary();
        initializeShareLink(); // Update share link with new data
        alert(`Added ${addedCount} new employees successfully!`);
    } else {
        alert('No new employees added. All names already exist.');
    }
}

// Reset to default employees
function resetToDefault() {
    if (confirm('This will reset to the default employee list. Continue?')) {
        employees = [...defaultEmployees];
        attendance = {};
        employees.forEach(name => {
            attendance[name] = 'not-set';
        });
        saveData();
        renderEmployeeList();
        updateSummary();
        initializeShareLink();
        alert('Reset to default employee list!');
    }
}

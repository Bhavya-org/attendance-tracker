# Daily Attendance Tracker

A simple web-based application to track daily attendance of colleagues and generate reports for managers.

## Features

- ✅ **Easy Employee Management**: Add and remove employees
- 📅 **Daily Attendance Tracking**: Track Present/WFH/Absent status
- 📊 **Real-time Summary**: See counts of each status
- 📧 **Email Report Generation**: Generate formatted reports for managers
- 📁 **CSV Export**: Export data to spreadsheet
- 💾 **Auto-save**: Data persists between sessions
- 🔄 **Daily Reset**: Attendance resets automatically each new day
- 📱 **Mobile Friendly**: Responsive design works on all devices

## How to Use

1. **Open the Application**: Double-click `index.html` to open in your web browser

2. **Add Employees**: 
   - Enter employee names in the "Add New Employee" section
   - Click "Add Employee" or press Enter

3. **Track Daily Attendance**:
   - For each employee, click their status: Present, WFH, or Absent
   - The summary will update automatically

4. **Generate Reports**:
   - Click "Generate Email Report" to create a formatted report
   - Copy the report and paste it into your email to the manager

5. **Export Data**:
   - Click "Export to CSV" to download attendance data as a spreadsheet

## File Structure

```
attendance_test/
├── index.html      # Main application page
├── style.css       # Styling and layout
├── script.js       # Application logic and functionality
└── README.md       # This file
```

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Data Storage

- Data is automatically saved to your browser's local storage
- Attendance resets each new day
- Employee list persists between days

## Tips

1. **Daily Routine**: Open the app each morning and update attendance status
2. **Report Timing**: Generate and send reports at your preferred time (e.g., 10 AM)
3. **Backup**: Occasionally export to CSV as a backup
4. **Mobile Use**: Access from your phone to update attendance on-the-go

## Sample Email Report Format

```
Subject: Daily Attendance Report - Monday, October 7, 2025

Dear Manager,

Please find below the attendance report for Monday, October 7, 2025:

📊 SUMMARY:
• Present in Office: 3
• Work From Home: 2
• Absent: 1
• Total Employees: 6

🏢 PRESENT IN OFFICE (3):
• John Doe
• Jane Smith
• Mike Johnson

🏠 WORK FROM HOME (2):
• Sarah Wilson
• David Brown

❌ ABSENT (1):
• Alex Chen

Best regards,
[Your Name]
```

## Troubleshooting

- **Data not saving**: Make sure you're using a modern browser with localStorage support
- **App not loading**: Check that all files are in the same folder
- **Mobile issues**: Try refreshing the page or clearing browser cache

## Customization

You can easily customize:
- Employee list (add/remove as needed)
- Report format (edit the `generateReport()` function in script.js)
- Styling (modify style.css)
- Add new status types (modify the status buttons)

Enjoy tracking attendance efficiently! 🎯

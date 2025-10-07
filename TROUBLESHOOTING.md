# 🔧 Troubleshooting Guide

## Issues and Solutions

### 1. **Firebase Import/Export Errors in Chrome**

**Problem**: You're seeing errors like:
- `Uncaught SyntaxError: Unexpected token 'export'`
- `Cannot use import statement outside a module`

**Cause**: Browser cache is loading old Firebase scripts that have been removed.

**Solutions**:
1. **Clear Browser Cache**: Ctrl+Shift+Delete → Clear cached images and files
2. **Hard Refresh**: Ctrl+F5 or Ctrl+Shift+R
3. **Open in Incognito/Private Mode**: This bypasses cache completely
4. **Add cache-busting**: The script now includes `?v=2.0` to force reload

### 2. **Manager Not Seeing Employee Attendance Data**

**Problem**: Manager dashboard shows empty data even after employees submit attendance.

**Causes & Solutions**:

#### **Different Browser/Storage Issue**
- **Cause**: Each browser has separate localStorage
- **Solution**: Use the "📱 Share Current Data" button in manager view to sync data

#### **Data Not Saving Properly**
- **Solution**: Use the debug buttons in manager view:
  - Click "🔧 Debug Data" to check what data is stored
  - Click "🔄 Refresh View" to reload the display

#### **Cross-Browser Sync**
- **Solution**: After any attendance is marked, manager should:
  1. Click "📱 Share Current Data"
  2. Copy the generated link
  3. Open that link to get latest data

### 3. **Private Browser Not Showing Previous Data**

**Problem**: Private/incognito browsers can't see data from regular browsers.

**Explanation**: This is intentional browser security - private mode isolates data.

**Solutions**:
1. **Use the shared link**: Manager generates and shares the current data URL
2. **URL-based sharing**: The app encodes data in the URL for cross-browser access

## 🔧 Debug Tools (Manager Only)

In manager view, you have these debug tools:

1. **🔧 Debug Data**: Shows all stored data in console
2. **🔄 Refresh View**: Forces reload of attendance display
3. **📊 View Submissions**: Shows detailed submission log
4. **📱 Share Current Data**: Generates URL with latest data

## 📋 Testing Steps

1. **Test Employee Submission**:
   - Login as employee (e.g., bhavya/bhavya)
   - Mark attendance
   - Check browser console for "Employee setting attendance" message

2. **Test Manager View**:
   - Login as manager (admin123)
   - Click "🔧 Debug Data" to see stored data
   - If no data, ask employee to resubmit
   - Use "📱 Share Current Data" to sync

3. **Test Cross-Browser**:
   - Submit attendance in one browser
   - In manager view, click "📱 Share Current Data"
   - Copy the generated URL
   - Open that URL in another browser/private mode
   - Login as manager to see synced data

## 🚨 Common Issues

### "Not working" - Check These:

1. **Console Errors**: Open browser DevTools (F12) → Console tab
2. **Network Issues**: Ensure you're accessing the file correctly
3. **JavaScript Disabled**: Ensure JavaScript is enabled
4. **Browser Compatibility**: Use modern browsers (Chrome, Firefox, Edge)

### Cross-Browser Data Sync Limitations:

- ✅ **Works**: Same browser, different tabs
- ✅ **Works**: URL-based sharing between browsers
- ❌ **Limited**: Automatic real-time sync across different browsers
- ❌ **No**: Private mode can't access regular browser data

## 💡 Best Practices

1. **Manager should periodically click "📱 Share Current Data"** to create synced URLs
2. **Use the shared URL** for accessing latest data across devices
3. **Clear browser cache** if seeing old Firebase errors
4. **Test in private mode** to ensure clean environment
5. **Check console logs** for debugging information

## 🆘 If Still Not Working

1. Clear all browser data for the site
2. Download fresh files from the repository
3. Use a local web server instead of file:// URLs:
   ```bash
   # In the project folder:
   python -m http.server 8000
   # Then open: http://localhost:8000
   ```

## 📞 Support Commands (Browser Console)

Open browser console (F12) and run:

```javascript
// Check stored data
debugDataSync();

// Force data refresh
forceDataRefresh();

// Clear all data
localStorage.clear();

// Check if data exists
console.log('Shared data:', JSON.parse(localStorage.getItem('SHARED_ATTENDANCE_DATA') || '{}'));
```

# 🚨 MCP Server Crash Report & Recovery Guide

## 📋 **Context: What We Fixed**

**Previous Issue:** MCP server was causing infinite waits and "bricking" chat due to:
- Auth failures taking 6+ seconds each (3 retries × 1s/2s/3s delays)  
- Invalid API keys causing all functions to fail slowly
- No startup validation
- Multiple simultaneous failures = 15+ second freezes

**Fixes Applied:** 
- ⚡ Fast failure for auth errors (<300ms)
- 🔐 API key validation on startup  
- ⏰ Reduced timeouts (30s → 15s)
- 📦 Argument-based configuration (no env vars needed)

---

## 🔍 **Failure Symptoms & Quick Fixes**

### **1. Chat Still Freezes/Infinite Wait**
**Symptoms:**
- Chat becomes unresponsive when using MCP functions
- Functions take 10+ seconds without response
- No error messages, just hanging

**Immediate Fix:**
```bash
# Kill the MCP server process
pkill -f "mcp-server"
# Or restart your chat application
```

**Root Cause Check:**
```bash
# Test the server manually
cd /Users/harrypall/Projects/templation/mcp-server
node dist/index.js your-api-key-here
```

**Expected Output:**
```
✅ API key validation successful
🚀 Templation MCP Server v2.0.1-patched running on stdio
```

**If you see errors:** API key is still invalid or backend is down.

---

### **2. "Authentication Failed" Errors**
**Symptoms:**
- Functions return immediately with auth errors
- Error messages mention API key issues

**Quick Fix:**  
1. Check API key: https://templation.up.railway.app/api-keys
2. Copy the FULL key (not just the prefix shown)
3. Update your MCP config with the complete key

**Test:**
```bash
curl -H "Authorization: Bearer YOUR_FULL_API_KEY" \
     https://templation-api.up.railway.app/api/users/me
```

---

### **3. "Server Error (500)" Messages**  
**Symptoms:**
- Functions fail with "Server error (500)"
- Backend API issues

**Quick Fix:**
- This is a backend issue, not the MCP server
- Check https://templation.up.railway.app/dashboard
- Wait 5-10 minutes and try again
- Backend may be restarting or experiencing issues

---

### **4. Chat Application Won't Start**
**Symptoms:**
- Chat app crashes on startup
- MCP configuration errors in logs

**Immediate Recovery:**
1. **Remove MCP config temporarily:**
   ```bash
   # Backup your config
   cp "~/Library/Application Support/Claude/claude_desktop_config.json" ~/claude_config_backup.json
   
   # Edit config to remove templation entry
   # Or rename the file temporarily
   mv "~/Library/Application Support/Claude/claude_desktop_config.json" ~/claude_config_disabled.json
   ```

2. **Restart chat application**

3. **Test MCP server separately:**
   ```bash
   cd /Users/harrypall/Projects/templation/mcp-server
   node dist/index.js your-api-key
   # Should validate successfully without errors
   ```

4. **Re-add config only if server tests OK**

---

## 🛠️ **Recovery Procedures**

### **Safe Testing Protocol**
1. **Always test the server manually first:**
   ```bash
   cd /Users/harrypall/Projects/templation/mcp-server
   node dist/index.js YOUR_ACTUAL_API_KEY
   ```

2. **If manual test fails, DON'T add to chat config yet**

3. **If manual test passes, add to ONE chat app first (not both)**

4. **Test with simple function first:**
   - Try `mcp_templation_get_user_info` (fastest, safest)
   - Avoid `search_exemplar` initially (backend issues possible)

### **Emergency Rollback**
If things go wrong and you can't recover:

1. **Restore original MCP server:**
   ```bash
   cd /Users/harrypall/Projects/templation/mcp-server
   cp src/index-backup.ts src/index.ts
   npm run build
   ```

2. **Remove from chat config:**
   ```bash
   # Edit and remove templation section:
   code "~/Library/Application Support/Claude/claude_desktop_config.json"
   ```

3. **Use environment variable approach (old way):**
   ```bash
   export TEMPLATION_API_KEY="your-key"
   ```

---

## 📊 **Diagnostic Commands**

### **Check MCP Server Status**
```bash
# Test server startup
cd /Users/harrypall/Projects/templation/mcp-server
node dist/index.js test-key-123 2>&1 | head -10

# Expected: Should show validation attempt and either success or clear error
```

### **Check API Key Validity**
```bash
# Test API directly
curl -s -H "Authorization: Bearer YOUR_API_KEY" \
     https://templation-api.up.railway.app/health

# Expected: {"status":"healthy","version":"1.0.0"}
```

### **Check Chat App Logs**
```bash
# Claude Desktop logs (macOS)
tail -f ~/Library/Logs/Claude/claude-desktop.log

# Look for MCP-related errors
```

### **Performance Test** 
```bash
# Time how long a simple request takes
time curl -H "Authorization: Bearer YOUR_API_KEY" \
          https://templation-api.up.railway.app/api/users/me

# Should complete in <2 seconds
```

---

## 🚀 **Before Testing Checklist**

- [ ] ✅ Manual server test passes (`node dist/index.js your-key`)
- [ ] 🔑 API key copied from dashboard (full key, not prefix)
- [ ] 💾 Chat config backed up
- [ ] 📱 Only one chat app configured initially
- [ ] 🧪 Plan to test with simple function first
- [ ] 🆘 Recovery steps understood

---

## 📞 **If All Else Fails**

**Immediate Recovery:**
1. Remove MCP server from chat config
2. Restart chat application  
3. Use web dashboard instead: https://templation.up.railway.app

**Contact Info:**
- Create issue: https://github.com/HarsukritP/templation/issues
- Include: Error messages, config used, steps tried

**Safe Mode:**
- Use web interface until MCP issues resolved
- All functionality available at https://templation.up.railway.app

---

## 🎯 **Success Indicators**

**MCP Server Working Correctly:**
- ✅ Startup takes <3 seconds with clear success message
- ✅ Functions return in <5 seconds (usually <1 second)
- ✅ Clear error messages if something goes wrong
- ✅ No infinite waits or hanging
- ✅ Chat remains responsive throughout

Ready to test when you see these indicators! 🚀 
    
        
        // Get DOM elements
        const activeTimeDisplay = document.getElementById('activeTimeDisplay');
        const slipList = document.getElementById('slipList');
        const listCount = document.getElementById('listCount');
        const grandTotal = document.getElementById('grandTotal');
        const loadingMessage = document.getElementById('loadingMessage');
        const copyNotification = document.getElementById('copyNotification');
        
        // Global variables
        let currentKey = '';
        let currentData = [];
        let supabase;
        let currentEditingSlipId = null;
        let pressTimer = null;
        const LONG_PRESS_DURATION = 800; // milliseconds
        
        // Initialize Supabase
        function initSupabase() {
            try {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('Supabase initialized successfully');
                return true;
            } catch (error) {
                console.error('Failed to initialize Supabase:', error);
                showMessage('Database connection failed', 'error');
                return false;
            }
        }
        
        // Function to get URL parameters
        function getUrlParams() {
            const params = {};
            const queryString = window.location.search.substring(1);
            const pairs = queryString.split('&');
            
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i].split('=');
                if (pair[0]) {
                    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
                }
            }
            return params;
        }
        
        // Function to show message
        function showMessage(message, type = 'info') {
            const messageDiv = document.createElement('div');
            messageDiv.className = type === 'error' ? 'error-message' : 
                                  type === 'success' ? 'success-message' : 'loading-text';
            messageDiv.textContent = message;
            messageDiv.style.position = 'fixed';
            messageDiv.style.top = '20px';
            messageDiv.style.left = '50%';
            messageDiv.style.transform = 'translateX(-50%)';
            messageDiv.style.zIndex = '1001';
            messageDiv.style.padding = '10px 20px';
            messageDiv.style.borderRadius = '5px';
            messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            
            document.body.appendChild(messageDiv);
            
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    document.body.removeChild(messageDiv);
                }
            }, 3000);
        }
        
        // Function to show copy notification
        function showCopyNotification() {
            copyNotification.style.display = 'block';
            setTimeout(() => {
                copyNotification.style.display = 'none';
            }, 2000);
        }
        
        // Function to copy slip data to clipboard
        function copySlipDataToClipboard(slip) {
            const userName = slip.name || 'No Name';
            let slipData = `User: ${userName}\n`;
            
            // Add bet numbers and amounts
            if (slip.bets && slip.bets.length > 0) {
                slip.bets.forEach(item => {
                    const displayNum = formatNumber(item.display || item.num || item.number);
                    const amount = item.amount || 0;
                    slipData += ` ${displayNum}: ${amount.toLocaleString()}\n`;
                });
            } else if (slip.numbers && slip.numbers.length > 0) {
                const estimatedAmount = slip.total_amount / slip.numbers.length;
                slip.numbers.forEach(num => {
                    slipData += ` ${formatNumber(num)}: ${Math.round(estimatedAmount).toLocaleString()}\n`;
                });
            }
            
            // Add slip total
            const total = slip.total_amount || slip.total || 0;
            slipData += `Total: ${total.toLocaleString()}`;
            
            // Copy to clipboard
            navigator.clipboard.writeText(slipData).then(() => {
                showCopyNotification();
            }).catch(err => {
                console.error('Failed to copy: ', err);
                showMessage('Copy failed', 'error');
            });
        }
        
        // Function to format number with leading zero
        function formatNumber(num) {
            if (num === undefined || num === null || isNaN(num)) return '';
            const numStr = num.toString();
            return numStr.length === 1 ? '0' + numStr : numStr;
        }
        
        // Function to format date in English
        function formatEnglishDate(dateString) {
            try {
                const date = new Date(dateString);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const seconds = date.getSeconds().toString().padStart(2, '0');
                
                return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            } catch (e) {
                return new Date().toLocaleString();
            }
        }
        
        // Function to get color class for total amount
        function getTotalColorClass(total) {
            if (total < 0) {
                return 'negative'; // အနီရောင်
            } else {
                return 'positive'; // အစိမ်းရောင်
            }
        }
        
        // Function to toggle slip details
        function toggleSlipDetails(slipNumber) {
            const slipHeader = document.querySelector(`[data-slip-number="${slipNumber}"]`);
            const slipDetails = document.getElementById(`slip-details-${slipNumber}`);
            
            if (!slipHeader || !slipDetails) return;
            
            const isExpanded = slipHeader.classList.contains('expanded');
            
            // Close all other open slips
            document.querySelectorAll('.slip-header-row.expanded').forEach(row => {
                if (row.dataset.slipNumber !== slipNumber.toString()) {
                    row.classList.remove('expanded');
                    const details = document.getElementById(`slip-details-${row.dataset.slipNumber}`);
                    if (details) details.classList.remove('expanded');
                }
            });
            
            // Toggle current slip
            slipHeader.classList.toggle('expanded');
            slipDetails.classList.toggle('expanded');
        }
        
        // Function to create slip header row
        function createSlipHeaderRow(slip, slipNumber) {
            const slipHeaderRow = document.createElement('div');
            slipHeaderRow.className = 'slip-header-row';
            slipHeaderRow.dataset.slipNumber = slipNumber;
            slipHeaderRow.dataset.id = slip.id;
            
            const userName = slip.name || 'No Name';
            const totalAmount = slip.total_amount || slip.total || 0;
            const colorClass = getTotalColorClass(totalAmount);
            
            slipHeaderRow.innerHTML = `
                <div class="slip-header-info">
                    <span class="slip-number">${slipNumber}</span>
                    <span class="slip-summary">
                        <span class="user-name">${userName}</span>
                        <span class="slip-total-summary ${colorClass}">${totalAmount.toLocaleString()}</span>
                    </span>
                    <div class="slip-date">${formatEnglishDate(slip.created_at || slip.timestamp || new Date().toISOString())}</div>
                </div>
                <div class="expand-icon">▼</div>
            `;
            
            // Add click event for expand/collapse
            slipHeaderRow.addEventListener('click', (e) => {
                // Don't toggle if clicking on edit/delete buttons
                if (!e.target.closest('.edit-btn') && !e.target.closest('.delete-btn')) {
                    toggleSlipDetails(slipNumber);
                }
            });
            
            // Add long press event for copy to clipboard
            slipHeaderRow.addEventListener('mousedown', (e) => {
                pressTimer = setTimeout(() => {
                    copySlipDataToClipboard(slip);
                }, LONG_PRESS_DURATION);
            });
            
            slipHeaderRow.addEventListener('mouseup', () => {
                clearTimeout(pressTimer);
            });
            
            slipHeaderRow.addEventListener('mouseleave', () => {
                clearTimeout(pressTimer);
            });
            
            // Touch events for mobile
            slipHeaderRow.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    copySlipDataToClipboard(slip);
                    e.preventDefault();
                }, LONG_PRESS_DURATION);
            });
            
            slipHeaderRow.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
            });
            
            slipHeaderRow.addEventListener('touchcancel', () => {
                clearTimeout(pressTimer);
            });
            
            return slipHeaderRow;
        }
        
        // Function to create slip details section
        function createSlipDetails(slip, slipNumber) {
            const slipDetails = document.createElement('div');
            slipDetails.className = 'slip-details';
            slipDetails.id = `slip-details-${slipNumber}`;
            
            const userName = slip.name || 'No Name';
            const userCom = slip.com || 0;
            const userZa = slip.za || 0;
            
            let betRows = '';
            if (slip.bets && slip.bets.length > 0) {
                slip.bets.forEach(item => {
                    const displayNum = formatNumber(item.display || item.num || item.number);
                    const amount = item.amount || 0;
                    
                    betRows += `
                        <div class="bet-row">
                            <div class="bet-number">${displayNum}</div>
                            <div class="bet-amount">${amount.toLocaleString()}</div>
                        </div>
                    `;
                });
            } else if (slip.numbers && slip.numbers.length > 0) {
                // Fallback: display from numbers array if bets not available
                slip.numbers.forEach((num, idx) => {
                    const amount = slip.total_amount / slip.numbers.length;
                    const displayNum = formatNumber(num);
                    
                    betRows += `
                        <div class="bet-row">
                            <div class="bet-number">${displayNum}</div>
                            <div class="bet-amount">${Math.round(amount).toLocaleString()}</div>
                        </div>
                    `;
                });
            }
            
            slipDetails.innerHTML = `
                <div class="user-info">
                    <span class="user-name-detail">${userName}</span>
                    <span class="user-stats">Com: ${userCom} | Za: ${userZa}</span>
                </div>
                ${betRows}
                <div class="slip-total">
                    Total: ${(slip.total_amount || slip.total || 0).toLocaleString()}
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="editSlip('${slip.id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteSlip('${slip.id}')">Delete</button>
                </div>
            `;
            
            return slipDetails;
        }
        
        // Function to load saved bets from Supabase
        async function loadSavedBets() {
            const params = getUrlParams();
            
            // Get current time from URL parameters
            if (params.date && params.time) {
                currentKey = `${params.date} ${params.time}`;
                activeTimeDisplay.textContent = currentKey;
            } else if (params.key) {
                currentKey = params.key;
                activeTimeDisplay.textContent = currentKey;
            } else {
                // Try to get from localStorage or default
                const storedDate = localStorage.getItem('selectedDate');
                const storedTime = localStorage.getItem('selectedTime');
                if (storedDate && storedTime) {
                    currentKey = `${storedDate} ${storedTime}`;
                    activeTimeDisplay.textContent = currentKey;
                } else {
                    activeTimeDisplay.textContent = 'No Active Time Selected';
                    showMessage('အချိန်မရွေးထားပါ', 'error');
                    return;
                }
            }
            
            // Show loading state
            loadingMessage.innerHTML = `
                <div class="spinner"></div>
                <div class="loading-text">လောင်းကြေးများ လာရောက်နေသည်...</div>
            `;
            loadingMessage.style.display = 'block';
            
            // Check if Supabase is initialized
            if (!supabase) {
                if (!initSupabase()) {
                    showMessage('Database connection failed. Please refresh.', 'error');
                    return;
                }
            }
            
            try {
                // Get data from Supabase
                const { data, error } = await supabase
                    .from('sales')
                    .select('*')
                    .eq('key', currentKey)
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Supabase error:', error);
                    throw error;
                }
                
                currentData = data || [];
                
                if (currentData.length === 0) {
                    loadingMessage.innerHTML = '<div class="empty-message">ဘောင်ချာများမရှိသေးပါ</div>';
                    listCount.textContent = '0';
                    grandTotal.textContent = '0';
                    return;
                }
                
                // Display the slips
                displaySlips(currentData);
                
            } catch (error) {
                console.error('Error loading slips:', error);
                loadingMessage.innerHTML = `<div class="error-message">လောင်းကြေးများရယူရာတွင်အမှားတစ်ခုဖြစ်နေသည်</div>`;
                
                // Fallback to localStorage if available
                try {
                    const savedData = JSON.parse(localStorage.getItem(currentKey));
                    if (savedData && savedData.length > 0) {
                        console.log('Using localStorage fallback');
                        currentData = savedData;
                        displaySlips(savedData);
                        showMessage('⚠️ LocalStorage မှဒေတာကိုအသုံးပြုထားသည်', 'error');
                    }
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                }
            }
        }
        
        // Function to display slips from Supabase
        function displaySlips(slipsData) {
            slipList.innerHTML = '';
            let totalGrandTotal = 0;
            
            if (slipsData.length === 0) {
                loadingMessage.innerHTML = '<div class="empty-message">ဘောင်ချာများမရှိသေးပါ</div>';
                listCount.textContent = '0';
                grandTotal.textContent = '0';
                return;
            }
            
            // First, sort the data by created_at (newest first)
            const sortedData = [...slipsData].sort((a, b) => {
                const dateA = new Date(a.created_at || a.timestamp || 0);
                const dateB = new Date(b.created_at || b.timestamp || 0);
                return dateB - dateA; // Newest first
            });
            
            // Create slip items
            sortedData.forEach((slip, index) => {
                // Slip number: newest (first in sorted array) gets highest number
                const slipNumber = sortedData.length - index;
                
                // Create slip header row
                const slipHeaderRow = createSlipHeaderRow(slip, slipNumber);
                
                // Create slip details section
                const slipDetails = createSlipDetails(slip, slipNumber);
                
                // Add to slipList
                slipList.appendChild(slipHeaderRow);
                slipList.appendChild(slipDetails);
                
                totalGrandTotal += (slip.total_amount || slip.total || 0);
            });
            
            // Hide loading message
            loadingMessage.style.display = 'none';
            
            // Update counters
            listCount.textContent = slipsData.length;
            grandTotal.textContent = totalGrandTotal.toLocaleString();
        }
        
        // Function to create edit modal
        function showEditModal(slipId) {
            const slip = currentData.find(s => s.id == slipId);
            if (!slip) {
                showMessage('Slip not found', 'error');
                return;
            }
            
            currentEditingSlipId = slipId;
            
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.id = 'editModal';
            
            // Create text for editing - format: "21 500\n12 1000"
            let editText = '';
            if (slip.bets && slip.bets.length > 0) {
                editText = slip.bets.map(item => {
                    const num = formatNumber(item.display || item.num || item.number);
                    return `${num} ${item.amount}`;
                }).join('\n');
            } else if (slip.numbers && slip.numbers.length > 0) {
                const estimatedAmount = slip.total_amount / slip.numbers.length;
                editText = slip.numbers.map(num => {
                    return `${formatNumber(num)} ${Math.round(estimatedAmount)}`;
                }).join('\n');
            }
            
            // Load user names from Name table for select dropdown
            loadUserNamesForSelect(slip.name).then(optionsHtml => {
                // Create modal content with select dropdown
                overlay.innerHTML = `
                    <div class="modal">
                        <div class="modal-header">
                            <div class="modal-title">Edit Slip</div>
                            <button class="close-btn" onclick="closeEditModal()">✕</button>
                        </div>
                        
                        <div class="edit-section">
                            <label class="edit-label">User Name:</label>
                            <select class="edit-input" id="editName" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-family: 'Pyidaungsu', sans-serif; font-size: 14px; margin-bottom: 10px;">
                                ${optionsHtml}
                            </select>
                        </div>
                        
                        <div class="edit-section">
                            <label class="edit-label">Bets (one per line: number amount):</label>
                            <textarea class="edit-textarea" id="editTextarea" placeholder="Enter number and amount on each line:\n21 500\n12 1000\n\nExample format:\n00 1000\n01 2000\n02 3000">${editText}</textarea>
                        </div>
                        
                        <div class="modal-buttons">
                            <button class="save-btn" id="saveEditBtn" onclick="saveEditedSlip()">Save</button>
                            <button class="cancel-btn" onclick="closeEditModal()">Cancel</button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(overlay);
                
                // Focus on name field
                setTimeout(() => {
                    const nameSelect = document.getElementById('editName');
                    if (nameSelect) {
                        nameSelect.focus();
                    }
                }, 100);
            });
        }
        
        // Function to load user names from Name table for select dropdown
        async function loadUserNamesForSelect(currentName) {
            try {
                // Get names from Name table
                const { data, error } = await supabase
                    .from('Name')
                    .select('name')
                    .order('name');
                
                if (error) {
                    console.error('Error loading user names:', error);
                    // Return just current name as option
                    return `<option value="${currentName || ''}">${currentName || 'Select Name'}</option>`;
                }
                
                // Build options HTML
                let optionsHtml = `<option value="">Select Name</option>`;
                
                // Add names from Name table
                data.forEach(item => {
                    if (item.name && item.name.trim()) {
                        const selected = item.name === currentName ? 'selected' : '';
                        optionsHtml += `<option value="${item.name}" ${selected}>${item.name}</option>`;
                    }
                });
                
                // Add current name if not in the list
                if (currentName && !data.some(item => item.name === currentName)) {
                    optionsHtml += `<option value="${currentName}" selected>${currentName}</option>`;
                }
                
                return optionsHtml;
                
            } catch (error) {
                console.error('Error loading names:', error);
                return `<option value="${currentName || ''}">${currentName || 'Enter Name'}</option>`;
            }
        }
        
        // Function to close edit modal
        function closeEditModal() {
            const modal = document.getElementById('editModal');
            if (modal) {
                document.body.removeChild(modal);
            }
            currentEditingSlipId = null;
        }
        
        // Function to edit slip
        function editSlip(slipId) {
            // Prevent event bubbling
            event.stopPropagation();
            showEditModal(slipId);
        }
        
        // Function to save edited slip to Supabase
        async function saveEditedSlip() {
            const modal = document.getElementById('editModal');
            if (!modal) return;
            
            const nameSelect = document.getElementById('editName');
            const textarea = document.getElementById('editTextarea');
            
            if (!nameSelect || !textarea) return;
            
            const name = nameSelect.value.trim();
            const editText = textarea.value.trim();
            
            if (!name) {
                showMessage('Please select user name', 'error');
                nameSelect.focus();
                return;
            }
            
            if (!editText) {
                showMessage('Please enter slip data', 'error');
                textarea.focus();
                return;
            }
            
            // Parse the edited text
            const lines = editText.split('\n').filter(line => line.trim());
            const items = [];
            let total = 0;
            
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2) {
                    const numStr = parts[0];
                    const amountStr = parts[1];
                    
                    const num = parseInt(numStr);
                    const amount = parseInt(amountStr.replace(/,/g, ''));
                    
                    if (!isNaN(num) && !isNaN(amount) && amount >= 0) {
                        items.push({
                            display: formatNumber(num),
                            num: num,
                            number: num,
                            amount: amount
                        });
                        total += amount;
                    }
                }
            }
            
            if (items.length === 0) {
                showMessage('Invalid data format. Please use: "number amount" on each line', 'error');
                return;
            }
            
            const saveBtn = document.getElementById('saveEditBtn');
            const originalText = saveBtn.textContent;
            
            try {
                // Show loading
                saveBtn.textContent = 'Saving...';
                saveBtn.disabled = true;
                
                // Prepare update data
                const updateData = {
                    name: name,
                    bets: items,
                    total_amount: total,
                    numbers: items.map(item => item.display)
                };
                
                console.log('Updating slip ID:', currentEditingSlipId);
                
                // Update in Supabase
                const { data, error } = await supabase
                    .from('sales')
                    .update(updateData)
                    .eq('id', currentEditingSlipId);
                
                if (error) {
                    console.error('Supabase update error:', error);
                    throw error;
                }
                
                console.log('Update successful');
                
                // Close modal
                closeEditModal();
                
                // Reload the list
                await loadSavedBets();
                
                showMessage('Slip updated successfully!', 'success');
                
            } catch (error) {
                console.error('Error updating slip:', error);
                showMessage('Failed to update slip. Please try again.', 'error');
                
                // Restore button
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        }
        
        // Function to delete slip from Supabase
        async function deleteSlip(slipId) {
            // Prevent event bubbling
            event.stopPropagation();
            
            if (!confirm('Are you sure you want to delete this slip?')) {
                return;
            }
            
            try {
                // Delete from Supabase
                const { error } = await supabase
                    .from('sales')
                    .delete()
                    .eq('id', slipId);
                
                if (error) {
                    throw error;
                }
                
                // Remove from currentData
                currentData = currentData.filter(slip => slip.id != slipId);
                
                // Update display
                displaySlips(currentData);
                
                showMessage('Slip deleted successfully!', 'success');
                
            } catch (error) {
                console.error('Error deleting slip:', error);
                showMessage('Failed to delete slip. Please try again.', 'error');
            }
        }
        
        // Function to setup real-time updates
        function setupRealTimeUpdates() {
            if (!supabase || !currentKey) return;
            
            supabase
                .channel('slip-updates')
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'sales',
                        filter: `key=eq.${currentKey}`
                    },
                    (payload) => {
                        console.log('Real-time update:', payload);
                        loadSavedBets();
                    }
                )
                .subscribe();
        }
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            if (initSupabase()) {
                loadSavedBets();
                setupRealTimeUpdates();
            }
            
            // Auto-refresh every 30 seconds
            setInterval(loadSavedBets, 30000);
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Go back to sale.html
                const params = getUrlParams();
                if (params.date && params.time) {
                    window.location.href = `sale.html?date=${encodeURIComponent(params.date)}&time=${encodeURIComponent(params.time)}`;
                } else if (params.key) {
                    window.location.href = `sale.html?key=${encodeURIComponent(params.key)}`;
                } else {
                    window.location.href = "sale.html";
                }
            } else if (e.key === 'F5') {
                e.preventDefault();
                loadSavedBets();
            } else if (e.key === 'r' && e.ctrlKey) {
                e.preventDefault();
                loadSavedBets();
            }
        });
        
        // Make functions available globally
        window.toggleSlipDetails = toggleSlipDetails;
        window.editSlip = editSlip;
        window.deleteSlip = deleteSlip;
        window.saveEditedSlip = saveEditedSlip;
        window.closeEditModal = closeEditModal;
    

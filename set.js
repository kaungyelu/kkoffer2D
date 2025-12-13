           // Initialize Supabase client
        let supabase;
        
        // DOM elements
        let addTimeBtn, inputBox, dateInput, timeInput, saveBtn, listView, errorMessage, successMessage;
        let selectAllCheckbox, selectedCount, selectionControls, bulkDeleteBtn;
        let confirmationModal, modalTitle, modalMessage, modalCancel, modalConfirm;
        let currentDate;
        
        // State management
        let timesData = [];
        let selectedItems = new Set();
        let deleteCallback = null;
        let currentDeleteId = null;
        
        // Initialize app when page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize Supabase
            try {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('Supabase initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Supabase:', error);
                showErrorOnPage('Failed to initialize database. Please refresh.');
                return;
            }
            
            // Get DOM elements
            addTimeBtn = document.getElementById('addTimeBtn');
            inputBox = document.getElementById('inputBox');
            dateInput = document.getElementById('dateInput');
            timeInput = document.getElementById('timeInput');
            saveBtn = document.getElementById('saveBtn');
            listView = document.getElementById('listView');
            errorMessage = document.getElementById('errorMessage');
            successMessage = document.getElementById('successMessage');
            selectAllCheckbox = document.getElementById('selectAllCheckbox');
            selectedCount = document.getElementById('selectedCount');
            selectionControls = document.getElementById('selectionControls');
            bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
            
            // Modal elements
            confirmationModal = document.getElementById('confirmationModal');
            modalTitle = document.getElementById('modalTitle');
            modalMessage = document.getElementById('modalMessage');
            modalCancel = document.getElementById('modalCancel');
            modalConfirm = document.getElementById('modalConfirm');
            
            // Initialize with current date
            const now = new Date();
            currentDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
            dateInput.value = currentDate;
            
            // Set up event listeners
            setupEventListeners();
            
            // Load times from Supabase
            loadTimesFromSupabase();
        });
        
        function showErrorOnPage(message) {
            listView.innerHTML = `<div class="error-message" style="display: block; text-align: center; padding: 20px;">${message}</div>`;
        }
        
        // Set up event listeners
        function setupEventListeners() {
            // Show input box when Add Time button is clicked
            addTimeBtn.addEventListener('click', () => {
                inputBox.style.display = 'block';
                dateInput.value = currentDate;
                timeInput.value = '';
                timeInput.focus();
                errorMessage.style.display = 'none';
                successMessage.style.display = 'none';
            });
            
            // Format date input (add slashes automatically)
            dateInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2);
                }
                if (value.length >= 5) {
                    value = value.slice(0, 5) + '/' + value.slice(5);
                }
                if (value.length > 10) {
                    value = value.slice(0, 10);
                }
                
                e.target.value = value;
            });
            
            // Restrict time input to AM/PM format
            timeInput.addEventListener('input', (e) => {
                let value = e.target.value.toUpperCase();
                
                value = value.replace(/[^0-9:APM\s]/g, '');
                
                if (value.length >= 2) {
                    const lastTwo = value.slice(-2);
                    if (lastTwo === 'AM' || lastTwo === 'PM') {
                        // Keep as is
                    } else if (value.slice(-1) === 'A' || value.slice(-1) === 'P') {
                        // Allow A or P alone
                    } else if (!value.slice(-1).match(/[APM0-9:\s]/)) {
                        value = value.slice(0, -1);
                    }
                }
                
                e.target.value = value;
            });
            
            // Save time entry to Supabase
            saveBtn.addEventListener('click', saveTimeEntry);
            
            // Allow Enter key to save
            timeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveTimeEntry();
                }
            });
            
            dateInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveTimeEntry();
                }
            });
            
            // Select All checkbox
            selectAllCheckbox.addEventListener('change', handleSelectAll);
            
            // Bulk delete button
            bulkDeleteBtn.addEventListener('click', () => {
                showBulkDeleteConfirmation();
            });
            
            // Modal event listeners
            modalCancel.addEventListener('click', () => {
                confirmationModal.style.display = 'none';
                deleteCallback = null;
                currentDeleteId = null;
            });
            
            modalConfirm.addEventListener('click', () => {
                if (deleteCallback) {
                    deleteCallback();
                }
                confirmationModal.style.display = 'none';
                deleteCallback = null;
                currentDeleteId = null;
            });
            
            // Close modal when clicking outside
            confirmationModal.addEventListener('click', (e) => {
                if (e.target === confirmationModal) {
                    confirmationModal.style.display = 'none';
                    deleteCallback = null;
                    currentDeleteId = null;
                }
            });
        }
        
        // Load times from Supabase
        async function loadTimesFromSupabase() {
            try {
                console.log('Loading times from Supabase...');
                
                const { data: times, error } = await supabase
                    .from('TimeC')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Supabase error:', error);
                    throw error;
                }
                
                console.log('Times loaded:', times);
                timesData = times || [];
                updateListView(timesData);
                
                // Show/hide selection controls
                if (timesData.length > 0) {
                    selectionControls.style.display = 'flex';
                } else {
                    selectionControls.style.display = 'none';
                }
                
                updateSelectionUI();
            } catch (error) {
                console.error('Error loading times:', error);
                showErrorOnPage('Error loading times. Please refresh the page.');
            }
        }
        
        // Check if time entry already exists
        async function isTimeExists(date, time) {
            try {
                const { data, error } = await supabase
                    .from('TimeC')
                    .select('*')
                    .eq('date', date)
                    .eq('time', time.toUpperCase());
                
                if (error) throw error;
                
                return data && data.length > 0;
            } catch (error) {
                console.error('Error checking time existence:', error);
                return false;
            }
        }
        
        // Validate date format (DD/MM/YYYY)
        function isValidDate(dateStr) {
            const regex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!regex.test(dateStr)) return false;
            
            const parts = dateStr.split('/');
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            
            if (year < 1000 || year > 3000 || month === 0 || month > 12) return false;
            
            const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            
            // Adjust for leap years
            if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
                monthDays[1] = 29;
            }
            
            return day > 0 && day <= monthDays[month - 1];
        }
        
        // Navigate to main.html with selected time data
        function navigateToMain(selectedDate, selectedTime) {
            const encodedDate = encodeURIComponent(selectedDate);
            const encodedTime = encodeURIComponent(selectedTime);
            window.location.href = `main.html?date=${encodedDate}&time=${encodedTime}`;
        }
        
        // Update list display
        function updateListView(timesArray) {
            // Clear current list
            listView.innerHTML = '';
            
            if (!timesArray || timesArray.length === 0) {
                listView.innerHTML = '<div class="empty-message">No times added yet. Click "Add Time" to get started.</div>';
                selectionControls.style.display = 'none';
                return;
            }
            
            timesArray.forEach((timeObj) => {
                const item = document.createElement('div');
                item.className = 'list-item';
                if (selectedItems.has(timeObj.id)) {
                    item.classList.add('selected');
                }
                
                item.innerHTML = `
                    <div class="item-content">
                        <div class="item-select">
                            <input type="checkbox" class="item-checkbox" data-id="${timeObj.id}" ${selectedItems.has(timeObj.id) ? 'checked' : ''}>
                        </div>
                        <div class="item-details" data-id="${timeObj.id}">
                            <div class="item-date">${timeObj.date}</div>
                            <div class="item-time">${timeObj.time}</div>
                        </div>
                        <button class="item-delete-single" data-id="${timeObj.id}" data-date="${timeObj.date}" data-time="${timeObj.time}">❎</button>
                    </div>
                `;
                
                // Handle item click for navigation
                const detailsEl = item.querySelector('.item-details');
                detailsEl.addEventListener('click', () => {
                    navigateToMain(timeObj.date, timeObj.time);
                });
                
                // Handle checkbox selection
                const checkboxEl = item.querySelector('.item-checkbox');
                checkboxEl.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const itemId = timeObj.id;
                    
                    if (e.target.checked) {
                        selectedItems.add(itemId);
                        item.classList.add('selected');
                    } else {
                        selectedItems.delete(itemId);
                        item.classList.remove('selected');
                    }
                    
                    updateSelectionUI();
                });
                
                // Delete single item
                const deleteBtnEl = item.querySelector('.item-delete-single');
                deleteBtnEl.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    currentDeleteId = timeObj.id;
                    showSingleDeleteConfirmation(timeObj.date, timeObj.time);
                });
                
                listView.appendChild(item);
            });
        }
        
        // Show single delete confirmation modal
        function showSingleDeleteConfirmation(date, time) {
            modalTitle.textContent = 'Confirm Delete';
            modalMessage.textContent = `Are you sure you want to delete time entry "${date} ${time}"? This will also delete all sales data with matching key.`;
            
            deleteCallback = async () => {
                await deleteTimeAndSales(currentDeleteId, date, time);
            };
            
            confirmationModal.style.display = 'flex';
        }
        
        // Show bulk delete confirmation modal
        function showBulkDeleteConfirmation() {
            if (selectedItems.size === 0) return;
            
            modalTitle.textContent = 'Confirm Bulk Delete';
            modalMessage.textContent = `Are you sure you want to delete ${selectedItems.size} selected time entries? This will also delete all sales data with matching keys.`;
            
            deleteCallback = async () => {
                await deleteSelectedTimesAndSales();
            };
            
            confirmationModal.style.display = 'flex';
        }
        
        // Create key from date and time (matching sales table format)
        function createKey(date, time) {
            return `${date} ${time}`;
        }
        
        // Delete time entry and ALL related sales data using the key
        async function deleteTimeAndSales(timeId, date, time) {
            try {
                showLoading(`Deleting time entry and all sales data for ${date} ${time}...`);
                
                // Create the key to match sales table
                const key = createKey(date, time);
                console.log(`Deleting sales with key: ${key}`);
                
                // First, find sales records with matching key
                const { data: salesRecords, error: salesFetchError } = await supabase
                    .from('sales')
                    .select('*')
                    .eq('key', key);
                
                if (salesFetchError) {
                    console.error('Error fetching sales records:', salesFetchError);
                } else {
                    console.log(`Found ${salesRecords ? salesRecords.length : 0} sales records with key: ${key}`);
                    
                    // Delete ALL sales records with matching key
                    const { error: salesDeleteError } = await supabase
                        .from('sales')
                        .delete()
                        .eq('key', key);
                    
                    if (salesDeleteError) {
                        console.error('Error deleting sales records:', salesDeleteError);
                    } else {
                        console.log(`Successfully deleted sales records with key: ${key}`);
                    }
                }
                
                // Now delete the time entry from TimeC table
                const { error: timeError } = await supabase
                    .from('TimeC')
                    .delete()
                    .eq('id', timeId);
                
                if (timeError) {
                    console.error('Error deleting time entry:', timeError);
                    throw timeError;
                }
                
                console.log(`Deleted time entry ${timeId}`);
                
                // Remove from selected items if present
                selectedItems.delete(timeId);
                
                // Refresh the list
                await loadTimesFromSupabase();
                showSuccess(`Successfully deleted time entry "${date} ${time}" and all related sales data!`);
                
            } catch (error) {
                console.error('Error in deleteTimeAndSales:', error);
                showError('Error deleting time entry and sales data. Please try again.');
            }
        }
        
        // Delete selected times and ALL their sales data
        async function deleteSelectedTimesAndSales() {
            if (selectedItems.size === 0) return;
            
            try {
                showLoading(`Deleting ${selectedItems.size} selected time entries and all related sales data...`);
                
                // Get selected time entries
                const selectedTimes = timesData.filter(timeObj => selectedItems.has(timeObj.id));
                
                // Track deleted counts
                let deletedTimeCount = 0;
                let deletedSalesCount = 0;
                
                // Process each selected time entry
                for (const timeObj of selectedTimes) {
                    console.log(`Processing deletion for ${timeObj.date} ${timeObj.time}`);
                    
                    // Create key for this time entry
                    const key = createKey(timeObj.date, timeObj.time);
                    
                    // Delete sales records with matching key
                    const { data: salesRecords, error: salesFetchError } = await supabase
                        .from('sales')
                        .select('*')
                        .eq('key', key);
                    
                    if (salesFetchError) {
                        console.error(`Error fetching sales records for key ${key}:`, salesFetchError);
                    } else {
                        console.log(`Found ${salesRecords ? salesRecords.length : 0} sales records for key: ${key}`);
                        
                        const { error: salesDeleteError } = await supabase
                            .from('sales')
                            .delete()
                            .eq('key', key);
                        
                        if (salesDeleteError) {
                            console.error(`Error deleting sales records for key ${key}:`, salesDeleteError);
                        } else {
                            deletedSalesCount += (salesRecords ? salesRecords.length : 0);
                            console.log(`Successfully deleted sales records for key: ${key}`);
                        }
                    }
                    
                    // Delete time entry from TimeC table
                    const { error: timeError } = await supabase
                        .from('TimeC')
                        .delete()
                        .eq('id', timeObj.id);
                    
                    if (timeError) {
                        console.error(`Error deleting time entry ${timeObj.id}:`, timeError);
                    } else {
                        deletedTimeCount++;
                        console.log(`Successfully deleted time entry ${timeObj.id}`);
                    }
                }
                
                console.log(`Deleted ${deletedTimeCount} time entries and ${deletedSalesCount} sales records`);
                
                // Clear selection
                selectedItems.clear();
                selectAllCheckbox.checked = false;
                
                // Refresh the list
                await loadTimesFromSupabase();
                showSuccess(`Successfully deleted ${deletedTimeCount} time entries and all related sales data!`);
                
            } catch (error) {
                console.error('Error in deleteSelectedTimesAndSales:', error);
                showError('Error deleting selected items. Please try again.');
            }
        }
        
        // Handle select all checkbox
        function handleSelectAll() {
            if (selectAllCheckbox.checked) {
                // Select all items
                timesData.forEach(timeObj => {
                    selectedItems.add(timeObj.id);
                });
            } else {
                // Deselect all items
                selectedItems.clear();
            }
            
            updateListView(timesData);
            updateSelectionUI();
        }
        
        // Update selection UI
        function updateSelectionUI() {
            // Update selected count
            selectedCount.textContent = `${selectedItems.size} selected`;
            
            // Enable/disable bulk delete button
            bulkDeleteBtn.disabled = selectedItems.size === 0;
            
            // Update select all checkbox state
            if (timesData.length === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.disabled = true;
            } else {
                selectAllCheckbox.disabled = false;
                selectAllCheckbox.checked = selectedItems.size === timesData.length;
            }
        }
        
        // Show success message
        function showSuccess(message) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
            errorMessage.style.display = 'none';
            
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
        }
        
        // Show error message
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
            
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
        
        // Show loading message
        function showLoading(message) {
            listView.innerHTML = `<div class="loading">${message}</div>`;
        }
        
        // Save time entry function
        async function saveTimeEntry() {
            const dateValue = dateInput.value.trim();
            const timeValue = timeInput.value.trim().toUpperCase();
            
            // Hide previous messages
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
            
            // Validate date format
            if (!isValidDate(dateValue)) {
                showError('Please enter a valid date in DD/MM/YYYY format');
                return;
            }
            
            // Validate time format (must contain AM or PM)
            if (!timeValue.match(/(AM|PM)$/i)) {
                showError('Please enter time in AM/PM format (e.g., "10:30 AM" or "2:00 PM")');
                return;
            }
            
            // Check if time already exists
            const exists = await isTimeExists(dateValue, timeValue);
            if (exists) {
                showError('This time entry already exists in the list!');
                return;
            }
            
            try {
                // Save to Supabase
                const { data, error } = await supabase
                    .from('TimeC')
                    .insert([
                        {
                            date: dateValue,
                            time: timeValue,
                            created_at: new Date().toISOString()
                        }
                    ])
                    .select();
                
                if (error) {
                    console.error('Supabase insert error:', error);
                    throw error;
                }
                
                // Show success message
                showSuccess('Time entry has been successfully created and saved!');
                
                // Reset and update UI
                inputBox.style.display = 'none';
                await loadTimesFromSupabase();
                
            } catch (error) {
                console.error('Error saving time:', error);
                showError('Error saving time entry. Please try again.');
            }
        }
        
        // Set up real-time subscription for live updates
        async function setupRealtimeSubscription() {
            try {
                const channel = supabase
                    .channel('times-channel')
                    .on('postgres_changes', 
                        { event: '*', schema: 'public', table: 'TimeC' },
                        () => {
                            console.log('Real-time update received');
                            loadTimesFromSupabase();
                        }
                    )
                    .subscribe((status) => {
                        console.log('Subscription status:', status);
                    });
            } catch (error) {
                console.error('Error setting up real-time subscription:', error);
            }
        }
        
        // Initialize real-time subscription after page loads
        setTimeout(() => {
            if (supabase) {
                setupRealtimeSubscription();
            }
        }, 1000);
    


    
    // Initialize Supabase client
    let supabase;
    let users = [];
    let currentKey = '';
    let slipCount = 0;
    
    // Initialize when page loads
    document.addEventListener('DOMContentLoaded', function() {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase initialized for sale.html');
            setupCurrentKey();
            loadUsersFromSupabase();
            setupEventListeners();
            loadSlipCount(); // Load slip count on page load
            
            // Check URL parameters for key
            checkUrlParams();
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            showUserErrorMessage('Database connection failed. Please refresh.');
        }
    });
    
    // Check URL parameters for date/time key
    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');
        const timeParam = urlParams.get('time');
        
        if (dateParam && timeParam) {
            currentKey = `${dateParam} ${timeParam}`;
            document.getElementById('activeTimeDisplay').textContent = timeParam;
            loadSlipCount();
        } else {
            setupCurrentKey();
        }
    }
    
    // Setup current key based on current time
    function setupCurrentKey() {
        const now = new Date();
        const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        currentKey = `${dateString} ${timeString}`;
        document.getElementById('activeTimeDisplay').textContent = timeString;
    }
    
    // Load users from Supabase
    async function loadUsersFromSupabase() {
        const userSelect = document.getElementById('userSelect');
        const selectedUserDisplay = document.getElementById('selectedUserDisplay');
        
        try {
            // Show loading state
            userSelect.innerHTML = '<option value="">Loading users...</option>';
            
            // Load data from Supabase
            const { data, error } = await supabase
                .from('Name')
                .select('*')
                .order('name', { ascending: true });
            
            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            users = data || [];
            
            // Clear and update dropdown
            userSelect.innerHTML = '<option value="">Select User</option>';
            
            if (users.length === 0) {
                userSelect.innerHTML = '<option value="">No users found</option>';
                showUserErrorMessage('No users found in database');
                return;
            }
            
            // Add users to dropdown
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.name;
                option.textContent = `${user.name} (${user.com}/${user.za})`;
                option.setAttribute('data-com', user.com);
                option.setAttribute('data-za', user.za);
                userSelect.appendChild(option);
            });
            
            // Set first user as default if available
            if (users.length > 0) {
                const firstUser = users[0];
                userSelect.value = firstUser.name;
                selectedUserDisplay.textContent = firstUser.name;
            }
            
        } catch (error) {
            console.error('Error loading users:', error);
            userSelect.innerHTML = '<option value="">Error loading users</option>';
            showUserErrorMessage('Error loading users from database');
        }
    }
    
    // Load slip count from Supabase
    async function loadSlipCount() {
        if (!supabase) return;
        
        if (!currentKey) {
            setupCurrentKey();
        }
        
        console.log('Loading slip count for key:', currentKey);
        
        try {
            // Get ALL slips from sales table for current key (not just count)
            const { data, error, count } = await supabase
                .from('sales')
                .select('*', { count: 'exact' })
                .eq('key', currentKey);
            
            if (error) {
                console.error('Error loading slip count:', error);
                return;
            }
            
            // Update slip number display
            slipCount = count || 0;
            const slipNumberElement = document.getElementById('slipnumber');
            if (slipNumberElement) {
                slipNumberElement.textContent = slipCount;
                console.log(`Updated slip count to: ${slipCount}`);
            }
            
            // Also update list count if element exists
            const listCountElement = document.getElementById('listCount');
            if (listCountElement) {
                listCountElement.textContent = slipCount;
            }
            
        } catch (error) {
            console.error('Error in loadSlipCount:', error);
        }
    }
    
    // Function to manually refresh slip count
    function refreshSlipCount() {
        console.log('Refreshing slip count...');
        loadSlipCount();
    }
    
    // Show error message in user section
    function showUserErrorMessage(message) {
        const userSection = document.querySelector('.user-select-section');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = message;
        userSection.appendChild(errorDiv);
    }
    
    // Setup event listeners
    function setupEventListeners() {
        const userSelect = document.getElementById('userSelect');
        const selectedUserDisplay = document.getElementById('selectedUserDisplay');
        
        // User selection change
        userSelect.addEventListener('change', function() {
            const selectedUser = this.value;
            selectedUserDisplay.textContent = selectedUser || '';
            
            // Update user info if needed
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption) {
                const com = selectedOption.getAttribute('data-com');
                const za = selectedOption.getAttribute('data-za');
                console.log(`Selected user: ${selectedUser}, Com: ${com}, Za: ${za}`);
            }
        });
        
       
        
        // Real-time updates for users
        if (supabase) {
            supabase
                .channel('sale-users-channel')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'Name' },
                    () => {
                        console.log('Users updated, reloading...');
                        loadUsersFromSupabase();
                    }
                )
                .subscribe();
            
            // Real-time updates for sales
            supabase
                .channel('sales-realtime-channel')
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'sales',
                        filter: `key=eq.${currentKey}`
                    },
                    (payload) => {
                        console.log('Sales real-time update:', payload);
                        
                        // Update slip count based on the change
                        if (payload.eventType === 'INSERT') {
                            slipCount++;
                        } else if (payload.eventType === 'DELETE') {
                            slipCount = Math.max(0, slipCount - 1);
                        }
                        
                        const slipNumberElement = document.getElementById('slipnumber');
                        if (slipNumberElement) {
                            slipNumberElement.textContent = slipCount;
                        }
                        
                        // Also update list count
                        const listCountElement = document.getElementById('listCount');
                        if (listCountElement) {
                            listCountElement.textContent = slipCount;
                        }
                    }
                )
                .subscribe();
        }
        
        // Add click handler for save button to update slip count after save
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                // This will be triggered when save button is clicked
                // The actual save happens in a3.js
                // We'll set up a listener in a3.js to call updateSlipCount
                setTimeout(() => {
                    loadSlipCount();
                }, 1000); // Wait 1 second then refresh count
            });
        }
        
        // Add keyboard shortcut to refresh slip count (Ctrl+R)
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                refreshSlipCount();
                showTempMessage('Slip count refreshed', '#2ecc71');
            }
        });
    }
    
    // Show temporary message
    function showTempMessage(message, color) {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '10px';
        messageDiv.style.right = '10px';
        messageDiv.style.backgroundColor = color || '#3498db';
        messageDiv.style.color = 'white';
        messageDiv.style.padding = '10px 15px';
        messageDiv.style.borderRadius = '5px';
        messageDiv.style.zIndex = '9999';
        messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 3000);
    }
    
    // Make functions available globally for a3.js to call
    window.refreshSlipCount = refreshSlipCount;
    window.getCurrentKey = function() { return currentKey; };
    window.updateSlipCountAfterSave = function() {
        setTimeout(() => {
            loadSlipCount();
        }, 500);
    };
    
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
    
    // On page load
    document.addEventListener('DOMContentLoaded', function() {
        const params = getUrlParams();
        const activeTimeDisplay = document.getElementById('activeTimeDisplay');
        
        // Check if date and time parameters exist
        if (params.date && params.time) {
            // Display the active time
            activeTimeDisplay.textContent = `${params.date} ${params.time}`;
            
            // Store the selected time in localStorage
            localStorage.setItem('selectedDate', params.date);
            localStorage.setItem('selectedTime', params.time);
        } else {
            // Check localStorage for stored time data
            const storedDate = localStorage.getItem('selectedDate');
            const storedTime = localStorage.getItem('selectedTime');
            
            if (storedDate && storedTime) {
                // Display stored time data
                activeTimeDisplay.textContent = `${storedDate} ${storedTime}`;
            } else {
                // No time data available
                activeTimeDisplay.textContent = 'Time not selected';
            }
        }
        
        // After successful save to Supabase
        if (window.updateSlipCountAfterSave) {
            window.updateSlipCountAfterSave();
        }
    });

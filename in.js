
        // Initialize Supabase client
        let supabase;
        
        // DOM elements
        let addTimeBtn, inputBox, dateInput, timeInput, saveBtn, listView, errorMessage, successMessage;
        let currentDate;
        
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
            listView.innerHTML = `<div class="error-message">${message}</div>`;
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
                updateListView(times || []);
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
                return;
            }
            
            timesArray.forEach((timeObj) => {
                const item = document.createElement('a');
                item.className = 'list-item';
                item.href = '#';
                
                item.innerHTML = `
                    <div class="item-content">
                        <div class="item-date">${timeObj.date}</div>
                        <div class="item-time">${timeObj.time}</div>
                    </div>
                `;
                
                // Navigate to main.html when list item is clicked
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigateToMain(timeObj.date, timeObj.time);
                });
                
                listView.appendChild(item);
            });
        }
        
        // Show success message
        function showSuccess(message) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
            errorMessage.style.display = 'none';
            
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        }
        
        // Show error message
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
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

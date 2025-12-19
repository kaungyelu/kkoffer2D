    
        
        
        let currentKey = '';
        let ledgerData = {}; // Store bets by number: { "00": 400, "12": 3500, ... }
        
        // Initialize Supabase
        function initSupabase() {
            try {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('Supabase initialized successfully');
                return true;
            } catch (error) {
                console.error('Failed to initialize Supabase:', error);
                showError('Database connection failed');
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
        
        // Function to show error message
        function showError(message) {
            const ledgerList = document.getElementById('ledgerList');
            ledgerList.innerHTML = `<div class="error">${message}</div>`;
        }
        
        // Function to format number with leading zero
        function formatNumber(num) {
            if (num === undefined || num === null || isNaN(num)) return '00';
            const numStr = num.toString();
            return numStr.length === 1 ? '0' + numStr : numStr;
        }
        
        // Load ledger data from Supabase
        async function loadLedgerData() {
            const params = getUrlParams();
            const activeTimeDisplay = document.getElementById('activeTimeDisplay');
            
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
                    showError('Please select a time first');
                    return;
                }
            }
            
            // Check if Supabase is initialized
            if (!supabase) {
                if (!initSupabase()) {
                    showError('Database connection failed. Please refresh.');
                    return;
                }
            }
            
            try {
                // Get data from Supabase
                const { data, error } = await supabase
                    .from('sales')
                    .select('*')
                    .eq('key', currentKey);
                
                if (error) {
                    console.error('Supabase error:', error);
                    throw error;
                }
                
                // Reset ledger data
                ledgerData = {};
                
                // Process data if exists
                if (data && data.length > 0) {
                    // Aggregate bets by number
                    data.forEach(slip => {
                        if (slip.bets && slip.bets.length > 0) {
                            slip.bets.forEach(bet => {
                                const num = formatNumber(bet.display || bet.num || bet.number);
                                const amount = bet.amount || 0;
                                
                                if (!ledgerData[num]) {
                                    ledgerData[num] = 0;
                                }
                                ledgerData[num] += amount;
                            });
                        }
                    });
                    
                    // Display the ledger
                    displayLedger();
                } else {
                    // No data found
                    showLedgerEmpty();
                }
                
            } catch (error) {
                console.error('Error loading ledger data:', error);
                showError('Error loading ledger data');
            }
        }
        
        // Display ledger data
        function displayLedger() {
            const ledgerList = document.getElementById('ledgerList');
            const totalInfo = document.getElementById('totalBetsDisplay');
            const totalBetsAmount = document.getElementById('totalBetsAmount');
            
            // Clear the list
            ledgerList.innerHTML = '';
            
            // Calculate total bets
            let grandTotal = 0;
            const numbers = Object.keys(ledgerData);
            
            if (numbers.length === 0) {
                showLedgerEmpty();
                return;
            }
            
            // Sort numbers ascending
            numbers.sort();
            
            // Create ledger items
            numbers.forEach(num => {
                const amount = ledgerData[num];
                grandTotal += amount;
                
                const item = document.createElement('div');
                item.className = 'list-item';
                
                item.innerHTML = `
                    <div class="number">${num}</div>
                    <div class="bet">${amount.toLocaleString()}</div>
                `;
                
                ledgerList.appendChild(item);
            });
            
            // Show total bets
            totalBetsAmount.textContent = grandTotal.toLocaleString();
            totalInfo.style.display = 'block';
        }
        
        // Show empty ledger message
        function showLedgerEmpty() {
            const ledgerList = document.getElementById('ledgerList');
            ledgerList.innerHTML = '<div class="loading">No bets found for this time period</div>';
            
            const totalInfo = document.getElementById('totalBetsDisplay');
            totalInfo.style.display = 'none';
        }
        
        // Setup real-time updates
        function setupRealTimeUpdates() {
            if (!supabase || !currentKey) return;
            
            supabase
                .channel('ledger-updates')
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'sales',
                        filter: `key=eq.${currentKey}`
                    },
                    (payload) => {
                        console.log('Real-time update received');
                        loadLedgerData();
                    }
                )
                .subscribe();
        }
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            if (initSupabase()) {
                loadLedgerData();
                setupRealTimeUpdates();
            }
            
            // Auto-refresh every 30 seconds
            setInterval(loadLedgerData, 30000);
            
            // Add keyboard shortcut for refresh
            document.addEventListener('keydown', (e) => {
                if (e.key === 'F5') {
                    e.preventDefault();
                    loadLedgerData();
                } else if (e.key === 'r' && e.ctrlKey) {
                    e.preventDefault();
                    loadLedgerData();
                } else if (e.key === 'Escape') {
                    // Go back to sale.html
                    const params = getUrlParams();
                    if (params.date && params.time) {
                        window.location.href = `sale.html?date=${encodeURIComponent(params.date)}&time=${encodeURIComponent(params.time)}`;
                    } else if (params.key) {
                        window.location.href = `sale.html?key=${encodeURIComponent(params.key)}`;
                    } else {
                        window.location.href = "sale.html";
                    }
                }
            });
        });
    

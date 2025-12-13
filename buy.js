  
    // Global variables
    let supabase;
    let currentKey = '';
    let ledgerData = {}; // { "12": 1500, "21": 500, "34": 1000 }
    let overBets = []; // Array of { number: "12", amount: 500 }
    let manualBets = []; // Array of { number: "12", amount: 1000, id: uniqueId }
    let inputAmount = 0;
    let users = [];
    let selectedUser = '';
    let selectedUserCom = 0;
    let selectedUserZa = 0;
    let manualBetIdCounter = 1;
    
    // Initialize Supabase with error handling
    function initSupabase() {
        try {
            if (!window.supabase) {
                console.error('Supabase library not loaded');
                return false;
            }
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            });
            console.log('Supabase initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            return false;
        }
    }
    
    // Load users from Supabase with error handling
    async function loadUsersFromSupabase() {
        const userSelect = document.getElementById('userSelect');
        const selectedUserDisplay = document.getElementById('selectedUserDisplay');
        
        try {
            // Show loading state
            userSelect.innerHTML = '<option value="">Loading users...</option>';
            
            if (!supabase) {
                if (!initSupabase()) {
                    userSelect.innerHTML = '<option value="">Database connection failed</option>';
                    return;
                }
            }
            
            // Load data from Supabase
            const { data, error } = await supabase
                .from('Name')
                .select('name, com, za')
                .order('name', { ascending: true });
            
            if (error) {
                console.error('Supabase error:', error);
                // Fallback to local storage if available
                const localUsers = localStorage.getItem('users');
                if (localUsers) {
                    users = JSON.parse(localUsers);
                    updateUserDropdown();
                    return;
                }
                throw error;
            }
            
            users = data || [];
            
            // Save to local storage as backup
            if (users.length > 0) {
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            updateUserDropdown();
            
        } catch (error) {
            console.error('Error loading users:', error);
            userSelect.innerHTML = '<option value="">Error loading users</option>';
        }
    }
    
    // Update user dropdown
    function updateUserDropdown() {
        const userSelect = document.getElementById('userSelect');
        const selectedUserDisplay = document.getElementById('selectedUserDisplay');
        
        // Clear and update dropdown
        userSelect.innerHTML = '<option value="">Select User</option>';
        
        if (users.length === 0) {
            userSelect.innerHTML = '<option value="">No users found</option>';
            return;
        }
        
        // Add users to dropdown
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.name;
            option.textContent = `${user.name} (${user.com || 0}/${user.za || 0})`;
            option.setAttribute('data-com', user.com || 0);
            option.setAttribute('data-za', user.za || 0);
            userSelect.appendChild(option);
        });
        
        // Set first user as default if available
        if (users.length > 0) {
            const firstUser = users[0];
            userSelect.value = firstUser.name;
            selectedUser = firstUser.name;
            selectedUserCom = firstUser.com || 0;
            selectedUserZa = firstUser.za || 0;
            selectedUserDisplay.textContent = `${firstUser.name} (${firstUser.com || 0}/${firstUser.za || 0})`;
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
    
    // Function to format number with leading zero
    function formatNumber(num) {
        if (num === undefined || num === null || isNaN(num)) return '00';
        const numStr = num.toString();
        return numStr.length === 1 ? '0' + numStr : numStr;
    }
    
    // Load ledger data from Supabase with error handling
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
                return;
            }
        }
        
        // Check if Supabase is initialized
        if (!supabase) {
            if (!initSupabase()) {
                console.log('Failed to initialize Supabase, using local data');
                // Try to load from local storage
                const localData = localStorage.getItem(`ledger_${currentKey}`);
                if (localData) {
                    try {
                        ledgerData = JSON.parse(localData);
                        updateSingleTextView();
                        updateTotalBox();
                        return;
                    } catch (e) {
                        console.error('Error parsing local data:', e);
                    }
                }
                return;
            }
        }
        
        try {
            // Get data from Supabase
            const { data, error } = await supabase
                .from('sales')
                .select('bets')
                .eq('key', currentKey);
            
            if (error) {
                console.error('Supabase error:', error);
                // Try to load from local storage
                const localData = localStorage.getItem(`ledger_${currentKey}`);
                if (localData) {
                    try {
                        ledgerData = JSON.parse(localData);
                        updateSingleTextView();
                        updateTotalBox();
                    } catch (e) {
                        console.error('Error parsing local data:', e);
                    }
                }
                return;
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
                
                // Save to local storage
                localStorage.setItem(`ledger_${currentKey}`, JSON.stringify(ledgerData));
                
                // Update displays
                updateSingleTextView();
                updateTotalBox();
                
                // Reset manual bets when loading new data
                manualBets = [];
                manualBetIdCounter = 1;
                updateListView1();
                
            } else {
                // No data found
                clearAllData();
            }
            
        } catch (error) {
            console.error('Error loading ledger data:', error);
            // Try to load from local storage
            const localData = localStorage.getItem(`ledger_${currentKey}`);
            if (localData) {
                try {
                    ledgerData = JSON.parse(localData);
                    updateSingleTextView();
                    updateTotalBox();
                } catch (e) {
                    console.error('Error parsing local data:', e);
                }
            } else {
                clearAllData();
            }
        }
    }
    
    // Update single text view with total bets
    function updateSingleTextView() {
        const singleTextView = document.getElementById('singleTextView');
        let total = 0;
        
        Object.values(ledgerData).forEach(amount => {
            total += amount;
        });
        
        singleTextView.textContent = `Total Bets: ${total.toLocaleString()}`;
        
        // Initialize text views
        document.getElementById('textView1').textContent = `Remaining: ${total.toLocaleString()}`;
        document.getElementById('textView2').textContent = 'Over Total: 0';
        document.getElementById('overTotalBox').textContent = 'OverTotal: 0';
    }
    
    // Update total box with manual bets total
    function updateTotalBox() {
        const totalBox = document.getElementById('totalBox');
        let total = 0;
        
        // Calculate total from manual bets
        manualBets.forEach(bet => {
            total += bet.amount;
        });
        
        totalBox.textContent = `Total: ${total.toLocaleString()}`;
    }
    
    // Calculate and display over bets based on input amount
    function calculateOverBets() {
        if (inputAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        // Clear previous over bets
        overBets = [];
        
        // Calculate over bets
        Object.keys(ledgerData).forEach(num => {
            const ledgerAmount = ledgerData[num];
            
            // Check if amount is greater than input amount
            if (ledgerAmount > inputAmount) {
                const overAmount = ledgerAmount - inputAmount;
                overBets.push({ number: num, amount: overAmount });
            }
        });
        
        // Sort over bets by number
        overBets.sort((a, b) => parseInt(a.number) - parseInt(b.number));
        
        // Update display
        updateListView2();
        updateOverTotalBox();
        updateTextViews();
    }
    
    // Update list view 1 (left side) with manual bets
    function updateListView1() {
        const listView1 = document.getElementById('listView1');
        listView1.innerHTML = '';
        
        if (manualBets.length === 0) {
            // Add empty rows if no manual bets
            for (let i = 0; i < 3; i++) {
                const row = document.createElement('div');
                row.className = 'list-row';
                row.innerHTML = `
                    <div class="list-cell"></div>
                    <div class="list-cell"></div>
                    <div class="list-cell"></div>
                `;
                listView1.appendChild(row);
            }
            updateTotalBox();
            return;
        }
        
        manualBets.forEach(bet => {
            const row = document.createElement('div');
            row.className = 'list-row';
            
            row.innerHTML = `
                <div class="list-cell">${bet.number}</div>
                <div class="list-cell">${bet.amount.toLocaleString()}</div>
                <div class="list-cell">
                    <button class="delete-btn-small" data-id="${bet.id}">Delete</button>
                </div>
            `;
            
            listView1.appendChild(row);
        });
        
        // Fill remaining rows if less than 3
        while (listView1.children.length < 3) {
            const row = document.createElement('div');
            row.className = 'list-row';
            row.innerHTML = `
                <div class="list-cell"></div>
                <div class="list-cell"></div>
                <div class="list-cell"></div>
            `;
            listView1.appendChild(row);
        }
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn-small').forEach(btn => {
            btn.addEventListener('click', function() {
                const betId = parseInt(this.getAttribute('data-id'));
                deleteManualBet(betId);
            });
        });
        
        // Update total box
        updateTotalBox();
    }
    
    // Delete a manual bet
    function deleteManualBet(betId) {
        const betIndex = manualBets.findIndex(bet => bet.id === betId);
        
        if (betIndex === -1) return;
        
        const deletedBet = manualBets[betIndex];
        
        // Return the amount back to over bets if it was originally from over
        const overBetIndex = overBets.findIndex(bet => bet.number === deletedBet.number);
        
        if (overBetIndex === -1) {
            overBets.push({ number: deletedBet.number, amount: deletedBet.amount });
        } else {
            overBets[overBetIndex].amount += deletedBet.amount;
        }
        
        // Sort over bets
        overBets.sort((a, b) => parseInt(a.number) - parseInt(b.number));
        
        // Remove from manual bets
        manualBets.splice(betIndex, 1);
        
        // Update displays
        updateListView1();
        updateListView2();
        updateOverTotalBox();
        updateTextViews();
    }
    
    // Update list view 2 (right side) with over bets
    function updateListView2() {
        const listView2 = document.getElementById('listView2');
        listView2.innerHTML = '';
        
        if (overBets.length === 0) {
            // Add empty rows if no over bets
            for (let i = 0; i < 3; i++) {
                const row = document.createElement('div');
                row.className = 'overlist-row';
                row.innerHTML = `
                    <div class="overlist-cell"></div>
                    <div class="overlist-cell"></div>
                `;
                listView2.appendChild(row);
            }
            return;
        }
        
        overBets.forEach(bet => {
            const row = document.createElement('div');
            row.className = 'overlist-row';
            
            row.innerHTML = `
                <div class="overlist-cell">${bet.number}</div>
                <div class="overlist-cell">${bet.amount.toLocaleString()}</div>
            `;
            
            listView2.appendChild(row);
        });
        
        // Fill remaining rows if less than 3
        while (listView2.children.length < 3) {
            const row = document.createElement('div');
            row.className = 'overlist-row';
            row.innerHTML = `
                <div class="overlist-cell"></div>
                <div class="overlist-cell"></div>
            `;
            listView2.appendChild(row);
        }
    }
    
    // Update over total box
    function updateOverTotalBox() {
        const overTotalBox = document.getElementById('overTotalBox');
        let overTotal = 0;
        
        overBets.forEach(bet => {
            overTotal += bet.amount;
        });
        
        overTotalBox.textContent = `OverTotal: ${overTotal.toLocaleString()}`;
    }
    
    // Update text views
    function updateTextViews() {
        const textView1 = document.getElementById('textView1');
        const textView2 = document.getElementById('textView2');
        
        // Calculate single text view total
        let singleTotal = 0;
        Object.values(ledgerData).forEach(amount => {
            singleTotal += amount;
        });
        
        // Calculate over total
        let overTotal = 0;
        overBets.forEach(bet => {
            overTotal += bet.amount;
        });
        
        // textView2 = over total
        textView2.textContent = `Over Total: ${overTotal.toLocaleString()}`;
        
        // textView1 = single total - over total
        const remaining = Math.max(0, singleTotal - overTotal);
        textView1.textContent = `Remaining: ${remaining.toLocaleString()}`;
    }
    
    // Add manual bet to listview1
    function addManualBet() {
        const numberInput = document.getElementById('editView1');
        const amountInput = document.getElementById('editView2');
        
        const number = formatNumber(parseInt(numberInput.value) || 0);
        let amount = parseInt(amountInput.value) || 0;
        
        if (number === '00' && amount === 0) {
            alert('Please enter valid number and amount');
            return;
        }
        
        if (amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        // Check if this number exists in overBets
        const overBetIndex = overBets.findIndex(bet => bet.number === number);
        
        if (overBetIndex !== -1) {
            // If number exists in over bets, subtract from over
            const overBet = overBets[overBetIndex];
            
            // If amount is greater than over amount, limit it
            if (amount > overBet.amount) {
                amount = overBet.amount;
            }
            
            // Update over bets
            overBet.amount -= amount;
            
            // Remove over bet if amount becomes 0
            if (overBet.amount <= 0) {
                overBets.splice(overBetIndex, 1);
            }
        }
        
        // Add to manual bets with unique ID
        const existingManualBetIndex = manualBets.findIndex(bet => bet.number === number);
        
        if (existingManualBetIndex === -1) {
            manualBets.push({ 
                id: manualBetIdCounter++, 
                number: number, 
                amount: amount 
            });
        } else {
            manualBets[existingManualBetIndex].amount += amount;
        }
        
        // Update displays
        updateListView1();
        updateListView2();
        updateOverTotalBox();
        updateTextViews();
        
        // Clear inputs
        numberInput.value = '';
        amountInput.value = '';
        numberInput.focus();
    }
    
    // Clear all data including manual bets
    function clearAllData() {
        ledgerData = {};
        overBets = [];
        manualBets = [];
        manualBetIdCounter = 1;
        inputAmount = 0;
        
        document.getElementById('singleTextView').textContent = 'Total Bets: 0';
        document.getElementById('mainEditText').value = '';
        document.getElementById('textView1').textContent = 'Remaining: 0';
        document.getElementById('textView2').textContent = 'Over Total: 0';
        document.getElementById('overTotalBox').textContent = 'OverTotal: 0';
        document.getElementById('totalBox').textContent = 'Total: 0';
        
        // Clear list views
        updateListView1();
        updateListView2();
    }
    
    // F1 function: Move all over bets to manual bets
    function moveAllOverToManual() {
        if (overBets.length === 0) {
            alert('No over bets to move');
            return;
        }
        
        // Move all over bets to manual bets
        overBets.forEach(overBet => {
            const existingManualBetIndex = manualBets.findIndex(bet => bet.number === overBet.number);
            
            if (existingManualBetIndex === -1) {
                manualBets.push({ 
                    id: manualBetIdCounter++, 
                    number: overBet.number, 
                    amount: overBet.amount 
                });
            } else {
                manualBets[existingManualBetIndex].amount += overBet.amount;
            }
        });
        
        // Clear over bets
        overBets = [];
        
        // Update displays
        updateListView1();
        updateListView2();
        updateOverTotalBox();
        updateTextViews();
        
        alert(`Moved ${overBets.length} over bets to manual bets`);
    }
    
    // Save manual bets to Supabase (as negative amounts) with error handling
    async function saveManualBetsToSupabase() {
        if (manualBets.length === 0) {
            alert('No manual bets to save');
            return;
        }
        
        if (!selectedUser) {
            alert('Please select a user');
            document.getElementById('userSelect').focus();
            return;
        }
        
        if (!currentKey) {
            alert('No active time selected');
            return;
        }
        
        try {
            // Prepare bets with negative amounts
            const negativeBets = manualBets.map(bet => ({
                display: bet.number,
                num: parseInt(bet.number),
                number: parseInt(bet.number),
                amount: -bet.amount // Negative amount
            }));
            
            // Calculate total negative amount
            const totalAmount = manualBets.reduce((sum, bet) => sum + bet.amount, 0);
            const negativeTotalAmount = -totalAmount;
            
            // Get selected user's com and za
            const selectedOption = document.getElementById('userSelect').options[document.getElementById('userSelect').selectedIndex];
            const userCom = selectedOption ? selectedOption.getAttribute('data-com') : 0;
            const userZa = selectedOption ? selectedOption.getAttribute('data-za') : 0;
            
            // Prepare sale data with com and za
            const saleData = {
                key: currentKey,
                name: selectedUser,
                com: parseInt(userCom) || 0,
                za: parseInt(userZa) || 0,
                bets: negativeBets,
                total_amount: negativeTotalAmount,
                numbers: manualBets.map(bet => bet.number),
                created_at: new Date().toISOString()
            };
            
            console.log('Saving to Supabase:', saleData);
            
            // Save to Supabase
            const { data, error } = await supabase
                .from('sales')
                .insert([saleData]);
            
            if (error) {
                console.error('Supabase error:', error);
                // Save to local storage as backup
                const localSales = JSON.parse(localStorage.getItem('pending_sales') || '[]');
                localSales.push(saleData);
                localStorage.setItem('pending_sales', JSON.stringify(localSales));
                
                alert('Saved to local storage. Will sync when connection is restored.');
            } else {
                alert(`Successfully saved ${manualBets.length} bets to Supabase`);
            }
            
            // Clear manual bets and reset
            manualBets = [];
            manualBetIdCounter = 1;
            updateListView1();
            
            // Reload ledger data to update totals
            loadLedgerData();
            
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            alert('Error: ' + error.message);
        }
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize Supabase
        initSupabase();
        
        // Load users
        loadUsersFromSupabase();
        
        // Load ledger data
        loadLedgerData();
        
        // Setup real-time updates
        setupRealTimeUpdates();
        
        // Set up event listeners
        setupEventListeners();
        
        // Add delete button styles
        addDeleteButtonStyles();
        
        // Try to sync pending sales
        syncPendingSales();
    });
    
    // Sync pending sales from local storage
    async function syncPendingSales() {
        try {
            const pendingSales = JSON.parse(localStorage.getItem('pending_sales') || '[]');
            if (pendingSales.length === 0 || !supabase) return;
            
            for (const saleData of pendingSales) {
                const { error } = await supabase
                    .from('sales')
                    .insert([saleData]);
                
                if (!error) {
                    console.log('Synced pending sale:', saleData);
                }
            }
            
            // Clear pending sales after successful sync
            localStorage.removeItem('pending_sales');
            
        } catch (error) {
            console.error('Error syncing pending sales:', error);
        }
    }
    
    // Add delete button styles
    function addDeleteButtonStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .delete-btn-small {
                padding: 2px 4px;
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 2px;
                font-size: 9px;
                font-weight: bold;
                cursor: pointer;
                width: 40px;
                height: 18px;
            }
            
            .delete-btn-small:hover {
                background: #c0392b;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Setup real-time updates
    function setupRealTimeUpdates() {
        if (!supabase || !currentKey) return;
        
        supabase
            .channel('buy-updates')
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
    
    // Setup event listeners
    function setupEventListeners() {
        // User selection change
        const userSelect = document.getElementById('userSelect');
        const selectedUserDisplay = document.getElementById('selectedUserDisplay');
        
        userSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            
            if (selectedOption && selectedOption.value) {
                selectedUser = selectedOption.value;
                selectedUserCom = selectedOption.getAttribute('data-com') || 0;
                selectedUserZa = selectedOption.getAttribute('data-za') || 0;
                selectedUserDisplay.textContent = `${selectedUser} (${selectedUserCom}/${selectedUserZa})`;
                console.log(`Selected user: ${selectedUser}, Com: ${selectedUserCom}, Za: ${selectedUserZa}`);
            } else {
                selectedUser = '';
                selectedUserCom = 0;
                selectedUserZa = 0;
                selectedUserDisplay.textContent = '';
            }
        });
        
        // Main save button - calculate over bets
        document.getElementById('mainSaveBtn').addEventListener('click', function() {
            const amountInput = document.getElementById('mainEditText');
            inputAmount = parseInt(amountInput.value) || 0;
            
            if (inputAmount <= 0) {
                alert('Please enter a valid amount');
                amountInput.focus();
                return;
            }
            
            calculateOverBets();
            amountInput.select();
        });
        
        // Clear button - clear manual bets
        document.getElementById('clearBtn').addEventListener('click', function() {
            manualBets = [];
            manualBetIdCounter = 1;
            updateListView1();
        });
        
        // Save button - save manual bets to Supabase
        document.getElementById('saveBtn').addEventListener('click', function() {
            saveManualBetsToSupabase();
        });
        
        // Edit save button - add manual bet
        document.getElementById('editSaveBtn').addEventListener('click', function() {
            addManualBet();
        });
        
        // F1 button - move all over bets to manual
        document.getElementById('f1Btn').addEventListener('click', function() {
            moveAllOverToManual();
        });
        
        // F2 button (no functionality yet)
        document.getElementById('f2Btn').addEventListener('click', function() {
            console.log('F2 pressed');
        });
        
        // F3 button (no functionality yet)
        document.getElementById('f3Btn').addEventListener('click', function() {
            console.log('F3 pressed');
        });
        
        // Enter key on main edit text
        document.getElementById('mainEditText').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('mainSaveBtn').click();
            }
        });
        
        // Enter key on edit view 2
        document.getElementById('editView2').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('editSaveBtn').click();
            }
        });
        
        // Additional input field enter key
        document.querySelector('.additional-input-field').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('Additional input entered:', this.value);
                this.select();
            }
        });
    }

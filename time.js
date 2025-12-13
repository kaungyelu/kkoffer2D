   
        let supabase;
        let listView;
        let viewBtn;
        let selectAllCheckbox;
        let reportDisplay;
        let selectedCount;
        let selectedItems = new Map(); // id -> time object

        document.addEventListener('DOMContentLoaded', function() {
            try {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('Supabase initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Supabase:', error);
                showErrorOnPage('Failed to initialize database. Please refresh.');
                return;
            }
            
            listView = document.getElementById('listView');
            viewBtn = document.getElementById('viewBtn');
            selectAllCheckbox = document.getElementById('selectAll');
            reportDisplay = document.getElementById('reportDisplay');
            selectedCount = document.getElementById('selectedCount');
            
            viewBtn.addEventListener('click', handleViewClick);
            selectAllCheckbox.addEventListener('change', handleSelectAll);
            
            loadTimesFromSupabase();
        });

        function showErrorOnPage(message) {
            listView.innerHTML = `<div class="empty-message">${message}</div>`;
        }

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

        function updateListView(timesArray) {
            listView.innerHTML = '';
            
            if (!timesArray || timesArray.length === 0) {
                listView.innerHTML = '<div class="empty-message">No times found</div>';
                return;
            }
            
            timesArray.forEach((timeObj) => {
                const item = createListItem(timeObj);
                listView.appendChild(item);
            });
            
            updateViewButton();
        }

        function createListItem(timeObj) {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.dataset.id = timeObj.id;
            
            item.innerHTML = `
                <input type="checkbox" class="item-checkbox" id="check_${timeObj.id}">
                <div class="item-content">
                    <div class="item-details">
                        <div class="item-date">${timeObj.date || 'No date'}</div>
                        <div class="item-time">${timeObj.time || 'No time'}</div>
                        <div class="item-pno">${timeObj.pno || '-'}</div>
                    </div>
                </div>
            `;
            
            const checkbox = item.querySelector('.item-checkbox');
            
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    selectedItems.set(timeObj.id, timeObj);
                    item.classList.add('selected');
                } else {
                    selectedItems.delete(timeObj.id);
                    item.classList.remove('selected');
                }
                updateViewButton();
                updateSelectAllCheckbox();
                updateSelectedCount();
            });
            
            return item;
        }

        function handleSelectAll() {
            const checkboxes = document.querySelectorAll('.item-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
                const timeId = checkbox.id.replace('check_', '');
                const listItem = checkbox.closest('.list-item');
                
                if (selectAllCheckbox.checked) {
                    // Find the time object from the list
                    const timeObj = {
                        id: timeId,
                        date: listItem.querySelector('.item-date').textContent,
                        time: listItem.querySelector('.item-time').textContent,
                        pno: listItem.querySelector('.item-pno').textContent
                    };
                    selectedItems.set(timeId, timeObj);
                    listItem.classList.add('selected');
                } else {
                    selectedItems.delete(timeId);
                    listItem.classList.remove('selected');
                }
            });
            
            updateViewButton();
            updateSelectedCount();
        }

        function updateSelectAllCheckbox() {
            const checkboxes = document.querySelectorAll('.item-checkbox');
            const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
        }

        function updateSelectedCount() {
            selectedCount.textContent = `${selectedItems.size} selected`;
        }

        function updateViewButton() {
            viewBtn.disabled = selectedItems.size === 0;
        }

        async function handleViewClick() {
            if (selectedItems.size === 0) {
                alert('Please select at least one time entry first');
                return;
            }
            
            console.log('Selected items:', Array.from(selectedItems.values()));
            
            try {
                // Show loading
                viewBtn.textContent = 'Loading...';
                viewBtn.disabled = true;
                
                // Get sales data for selected times
                const selectedTimes = Array.from(selectedItems.values());
                const salesPromises = selectedTimes.map(time => {
                    const key = `${time.date} ${time.time}`;
                    return supabase
                        .from('sales')
                        .select('*')
                        .eq('key', key);
                });
                
                const salesResults = await Promise.all(salesPromises);
                
                // Get user names from Name table
                const { data: nameData, error: nameError } = await supabase
                    .from('Name')
                    .select('*');
                
                if (nameError) throw nameError;
                
                // Process and display report
                displayReport(selectedTimes, salesResults, nameData || []);
                
            } catch (error) {
                console.error('Error generating report:', error);
                alert('Error generating report. Please try again.');
            } finally {
                // Restore button
                viewBtn.textContent = 'Generate Report';
                viewBtn.disabled = selectedItems.size === 0;
            }
        }

        function displayReport(selectedTimes, salesResults, nameData) {
            reportDisplay.style.display = 'block';
            reportDisplay.innerHTML = '';
            
            // Create name map from Name table
            const nameMap = {};
            nameData.forEach(item => {
                if (item.name && item.name.trim()) {
                    nameMap[item.name] = {
                        com: parseFloat(item.com) || 0,
                        za: parseFloat(item.za) || 0
                    };
                }
            });
            
            // Group data by user
            const userData = {};
            const grandTotals = {
                totalSales: 0,
                totalPnoWinnings: 0,
                totalCommission: 0,
                totalZa: 0,
                finalTotal: 0
            };
            
            // Process each selected time
            selectedTimes.forEach((time, index) => {
                const salesData = salesResults[index]?.data || [];
                const timeKey = `${time.date} ${time.time}`;
                const pno = time.pno || '';
                
                // Process sales for this time
                salesData.forEach(sale => {
                    const userName = sale.name || 'Unknown';
                    
                    if (!userData[userName]) {
                        userData[userName] = {
                            name: userName,
                            com: nameMap[userName] ? nameMap[userName].com : 0,
                            za: nameMap[userName] ? nameMap[userName].za : 0,
                            timeEntries: [],
                            totalSales: 0,
                            totalPnoWinnings: 0
                        };
                    }
                    
                    const totalSale = sale.total_amount || sale.total || 0;
                    userData[userName].totalSales += totalSale;
                    
                    // Calculate PNO winnings for this sale
                    const pnoWinnings = calculatePnoWinningsForSale(sale, pno);
                    userData[userName].totalPnoWinnings += pnoWinnings;
                    
                    // Add time entry
                    userData[userName].timeEntries.push({
                        date: time.date,
                        time: time.time,
                        pno: pno,
                        sales: totalSale,
                        pnoWinnings: pnoWinnings
                    });
                    
                    // Update grand totals
                    grandTotals.totalSales += totalSale;
                    grandTotals.totalPnoWinnings += pnoWinnings;
                });
            });
            
            // Calculate commission and final totals for each user
            Object.values(userData).forEach(user => {
                user.commissionAmount = (user.totalSales * user.com) / 100;
                user.zaAmount = user.totalPnoWinnings * user.za;
                user.finalTotal = user.totalSales - user.commissionAmount - user.zaAmount;
                
                // Update grand totals
                grandTotals.totalCommission += user.commissionAmount;
                grandTotals.totalZa += user.zaAmount;
                grandTotals.finalTotal += user.finalTotal;
            });
            
            // Build report HTML
            let html = `<div class="report-header">Report for Selected Times</div>`;
            
            // Sort users alphabetically
            const sortedUsers = Object.values(userData).sort((a, b) => a.name.localeCompare(b.name));
            
            sortedUsers.forEach(user => {
                const isProfit = user.finalTotal >= 0;
                const profitLossText = isProfit ? 'အမြတ်' : 'အရှုံး';
                const profitLossClass = isProfit ? 'profit' : 'loss-indicator';
                
                html += `
                    <div class="user-report">
                        <div class="user-name">${user.name}</div>
                        <table class="sales-table">
                            <thead>
                                <tr>
                                    <th>ရက်စွဲ</th>
                                    <th>အချိန်</th>
                                    <th>PNO</th>
                                    <th>ရောင်းကြေး</th>
                                    <th>PNO အမောက်</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                // Add each time entry row
                user.timeEntries.forEach(entry => {
                    html += `
                        <tr>
                            <td>${entry.date}</td>
                            <td>${entry.time}</td>
                            <td>${entry.pno || '-'}</td>
                            <td>${formatNumber(entry.sales)}</td>
                            <td>${formatNumber(entry.pnoWinnings)}</td>
                        </tr>
                    `;
                });
                
                // Add totals row
                html += `
                    <tr class="total-row">
                        <td colspan="3">စုစုပေါင်း</td>
                        <td>${formatNumber(user.totalSales)}</td>
                        <td>${formatNumber(user.totalPnoWinnings)}</td>
                    </tr>
                </tbody>
                </table>
                
                <div class="calculation-section">
                    <div class="calculation-row">
                        <span>စုစုပေါင်းရောင်းကြေး =</span>
                        <span>${formatNumber(user.totalSales)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>ကော်(${user.com}%) =</span>
                        <span>${formatNumber(user.commissionAmount)}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="calculation-row">
                        <span>${formatNumber(user.totalSales - user.commissionAmount)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>PNO အမောက်စုစုပေါင်း =</span>
                        <span>${formatNumber(user.totalPnoWinnings)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>ဇက်(${user.za}) =</span>
                        <span>${formatNumber(user.zaAmount)}</span>
                    </div>
                </div>
                
                <div class="final-total ${isProfit ? '' : 'loss'}">
                    <span>${formatNumber(Math.abs(user.finalTotal))}</span>
                </div>
                
                <div class="profit-loss-indicator ${profitLossClass}">
                    <span class="status-indicator ${isProfit ? 'profit-status' : 'loss-status'}"></span>
                    ${profitLossText} ${formatNumber(Math.abs(user.finalTotal))}
                </div>
                </div>
                `;
            });
            
            // Add grand total section
            const isGrandProfit = grandTotals.finalTotal >= 0;
            const grandProfitLossText = isGrandProfit ? 'စုစုပေါင်းအမြတ်' : 'စုစုပေါင်းအရှုံး';
            
            html += `
                <div class="grand-total-section">
                    <div class="grand-total-header">စုစုပေါင်းရလဒ်</div>
                    <table class="grand-total-table">
                        <tr>
                            <th>စုစုပေါင်းရောင်းကြေး</th>
                            <td>${formatNumber(grandTotals.totalSales)}</td>
                        </tr>
                        <tr>
                            <th>စုစုပေါင်းကော်</th>
                            <td>${formatNumber(grandTotals.totalCommission)}</td>
                        </tr>
                        <tr>
                            <th>PNO အရှုံးစုစုပေါင်း</th>
                            <td>${formatNumber(grandTotals.totalPnoWinnings)}</td>
                        </tr>
                        <tr>
                            <th>စုစုပေါင်းဇက်</th>
                            <td>${formatNumber(grandTotals.totalZa)}</td>
                        </tr>
                    </table>
                    <div class="grand-total-final">
                        <span>
                            <span class="status-indicator ${isGrandProfit ? 'profit-status' : 'loss-status'}"></span>
                            ${grandProfitLossText}
                        </span>
                        <span class="${isGrandProfit ? 'grand-profit' : 'grand-loss'}">
                            ${formatNumber(Math.abs(grandTotals.finalTotal))}
                        </span>
                    </div>
                </div>
            `;
            
            reportDisplay.innerHTML = html;
            
            // Scroll to report
            reportDisplay.scrollIntoView({ behavior: 'smooth' });
        }

        function calculatePnoWinningsForSale(sale, pno) {
            if (!pno || pno.trim() === '') {
                return 0;
            }
            
            let totalWinnings = 0;
            
            // Check if sale has bets
            if (sale.bets && sale.bets.length > 0) {
                sale.bets.forEach(bet => {
                    const betNumber = bet.display || bet.num || bet.number;
                    const amount = bet.amount || 0;
                    
                    if (betNumber.toString().padStart(2, '0') === pno.toString().padStart(2, '0')) {
                        totalWinnings += amount ; 
                    }
                });
            }
            
            return totalWinnings;
        }

        function formatNumber(num) {
            if (num === undefined || num === null || isNaN(num)) return '0';
            return Math.round(num).toLocaleString();
        }
    

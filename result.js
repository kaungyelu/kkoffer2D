
    
        
        
        let listView;
        let activeTimeDisplay;
        let resultBtn;
        let resultDisplay;
        let currentTimeData = null;

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
            activeTimeDisplay = document.getElementById('activeTimeDisplay');
            resultBtn = document.getElementById('resultBtn');
            resultDisplay = document.getElementById('resultDisplay');
            
            resultBtn.addEventListener('click', handleResultClick);
            
            loadCurrentTimeData();
        });

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

        function loadCurrentTimeData() {
            const params = getUrlParams();
            
            if (params.date && params.time) {
                currentTimeData = {
                    date: params.date,
                    time: params.time
                };
                
                activeTimeDisplay.innerHTML = `<div>${params.date} ${params.time}</div>`;
                
                loadMatchingTimesFromSupabase(params.date, params.time);
            } else {
                const storedDate = localStorage.getItem('selectedDate');
                const storedTime = localStorage.getItem('selectedTime');
                
                if (storedDate && storedTime) {
                    currentTimeData = {
                        date: storedDate,
                        time: storedTime
                    };
                    
                    activeTimeDisplay.innerHTML = `<div>${storedDate} ${storedTime}</div>`;
                    
                    loadMatchingTimesFromSupabase(storedDate, storedTime);
                } else {
                    activeTimeDisplay.innerHTML = '<div>No active time selected</div>';
                    showErrorOnPage('Please select a time from main page first');
                }
            }
        }

        function showErrorOnPage(message) {
            listView.innerHTML = `<div class="error-message">${message}</div>`;
        }

        function showMessage(message, type = 'success') {
            const messageDiv = document.createElement('div');
            messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
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

        async function loadMatchingTimesFromSupabase(date, time) {
            try {
                console.log('Loading matching times from Supabase...');
                
                const { data: times, error } = await supabase
                    .from('TimeC')
                    .select('*')
                    .eq('date', date)
                    .eq('time', time.toUpperCase())
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Supabase error:', error);
                    throw error;
                }
                
                console.log('Matching times loaded:', times);
                updateListView(times || []);
            } catch (error) {
                console.error('Error loading times:', error);
                showErrorOnPage('Error loading times. Please refresh the page.');
            }
        }

        function updateListView(timesArray) {
            listView.innerHTML = '';
            
            if (!timesArray || timesArray.length === 0) {
                listView.innerHTML = '<div class="empty-message">No matching times found</div>';
                return;
            }
            
            timesArray.forEach((timeObj) => {
                const item = createListItem(timeObj);
                listView.appendChild(item);
            });
        }

        function createListItem(timeObj) {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.dataset.id = timeObj.id;
            
            item.innerHTML = `
                <div class="item-content">
                    <div class="item-details">
                        <div class="item-date">${timeObj.date || 'No date'}</div>
                        <div class="item-time">${timeObj.time || 'No time'}</div>
                        <div class="item-pno">${timeObj.pno || 'No PNO'}</div>
                    </div>
                </div>
            `;
            
            const pnoDisplay = item.querySelector('.item-pno');
            
            pnoDisplay.addEventListener('click', function(e) {
                e.stopPropagation();
                startEditingPNO(timeObj, pnoDisplay);
            });
            
            let pressTimer;
            item.addEventListener('mousedown', function(e) {
                if (e.target !== pnoDisplay) {
                    pressTimer = setTimeout(() => {
                        startEditingPNO(timeObj, pnoDisplay);
                    }, 500);
                }
            });
            
            item.addEventListener('mouseup', function() {
                clearTimeout(pressTimer);
            });
            
            item.addEventListener('mouseleave', function() {
                clearTimeout(pressTimer);
            });
            
            item.addEventListener('touchstart', function(e) {
                if (e.target !== pnoDisplay) {
                    pressTimer = setTimeout(() => {
                        startEditingPNO(timeObj, pnoDisplay);
                    }, 500);
                }
            });
            
            item.addEventListener('touchend', function() {
                clearTimeout(pressTimer);
            });
            
            return item;
        }

        function startEditingPNO(timeObj, pnoElement) {
            const currentPNO = timeObj.pno || '';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'pno-edit-input';
            input.value = currentPNO;
            input.maxLength = 50;
            
            pnoElement.replaceWith(input);
            input.focus();
            input.select();
            
            function savePNO() {
                const newPNO = input.value.trim();
                
                if (newPNO !== currentPNO) {
                    updatePNOInSupabase(timeObj.id, newPNO)
                        .then(updatedTime => {
                            const newPnoDisplay = document.createElement('div');
                            newPnoDisplay.className = 'item-pno';
                            newPnoDisplay.textContent = newPNO || 'No PNO';
                            
                            newPnoDisplay.addEventListener('click', function(e) {
                                e.stopPropagation();
                                startEditingPNO(updatedTime, newPnoDisplay);
                            });
                            
                            input.replaceWith(newPnoDisplay);
                        })
                        .catch(error => {
                            console.error('Error updating PNO:', error);
                            showMessage('Failed to update PNO', 'error');
                            const pnoDisplay = document.createElement('div');
                            pnoDisplay.className = 'item-pno';
                            pnoDisplay.textContent = currentPNO || 'No PNO';
                            
                            pnoDisplay.addEventListener('click', function(e) {
                                e.stopPropagation();
                                startEditingPNO(timeObj, pnoDisplay);
                            });
                            
                            input.replaceWith(pnoDisplay);
                        });
                } else {
                    const pnoDisplay = document.createElement('div');
                    pnoDisplay.className = 'item-pno';
                    pnoDisplay.textContent = currentPNO || 'No PNO';
                    
                    pnoDisplay.addEventListener('click', function(e) {
                        e.stopPropagation();
                        startEditingPNO(timeObj, pnoDisplay);
                    });
                    
                    input.replaceWith(pnoDisplay);
                }
            }
            
            input.addEventListener('blur', savePNO);
            
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    savePNO();
                }
            });
        }

        async function updatePNOInSupabase(id, newPNO) {
            try {
                const { data, error } = await supabase
                    .from('TimeC')
                    .update({ pno: newPNO })
                    .eq('id', id)
                    .select();
                
                if (error) throw error;
                
                console.log('PNO updated successfully:', data[0]);
                return data[0];
            } catch (error) {
                console.error('Error updating PNO in Supabase:', error);
                throw error;
            }
        }

        async function handleResultClick() {
            if (!currentTimeData) {
                showMessage('No active time selected', 'error');
                return;
            }
            
            console.log('Generating result for:', currentTimeData);
            
            try {
                // Show loading
                resultBtn.textContent = 'Loading...';
                resultBtn.disabled = true;
                
                // Get PNO from TimeC table
                const { data: timeData, error: timeError } = await supabase
                    .from('TimeC')
                    .select('pno')
                    .eq('date', currentTimeData.date)
                    .eq('time', currentTimeData.time.toUpperCase())
                    .limit(1);
                
                if (timeError) throw timeError;
                
                const pno = timeData && timeData[0] ? timeData[0].pno : '';
                
                // Get sales data for this time
                const key = `${currentTimeData.date} ${currentTimeData.time}`;
                
                const { data: salesData, error: salesError } = await supabase
                    .from('sales')
                    .select('*')
                    .eq('key', key);
                
                if (salesError) throw salesError;
                
                console.log('Sales data loaded:', salesData);
                
                // Get user names from Name table
                const { data: nameData, error: nameError } = await supabase
                    .from('Name')
                    .select('*');
                
                if (nameError) throw nameError;
                
                console.log('Name data loaded:', nameData);
                
                // Process and display results
                displayResults(salesData || [], nameData || [], pno);
                
            } catch (error) {
                console.error('Error loading result data:', error);
                showMessage('Error loading result data', 'error');
            } finally {
                // Restore button
                resultBtn.textContent = 'Result';
                resultBtn.disabled = false;
            }
        }

        function displayResults(salesData, nameData, pno) {
            resultDisplay.style.display = 'block';
            
            if (!salesData || salesData.length === 0) {
                resultDisplay.innerHTML = '<div class="no-sales-message">No sales data found for this time</div>';
                return;
            }
            
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
            
            // Group sales by user name
            const userSales = {};
            let grandTotalSales = 0;
            let grandTotalPnoWinnings = 0;
            let grandTotalCommission = 0;
            let grandTotalZa = 0;
            let grandFinalTotal = 0;
            
            salesData.forEach(sale => {
                const userName = sale.name || 'Unknown';
                
                if (!userSales[userName]) {
                    userSales[userName] = {
                        sales: 0,
                        pnoWinnings: 0,
                        commission: 0,
                        zaAmount: 0,
                        finalTotal: 0,
                        bets: []
                    };
                }
                
                // Get com and za from Name table
                const userCom = nameMap[userName] ? nameMap[userName].com : 0;
                const userZa = nameMap[userName] ? nameMap[userName].za : 0;
                
                const totalSale = sale.total_amount || sale.total || 0;
                userSales[userName].sales += totalSale;
                
                // Add bets for PNO calculation
                if (sale.bets && sale.bets.length > 0) {
                    sale.bets.forEach(bet => {
                        const num = bet.display || bet.num || bet.number;
                        const amount = bet.amount || 0;
                        
                        userSales[userName].bets.push({
                            number: num,
                            amount: amount
                        });
                    });
                } else if (sale.numbers && sale.numbers.length > 0) {
                    // Fallback for old data format
                    const amountPerNumber = sale.total_amount / sale.numbers.length;
                    sale.numbers.forEach(num => {
                        userSales[userName].bets.push({
                            number: num,
                            amount: amountPerNumber
                        });
                    });
                }
                
                // Update grand totals
                grandTotalSales += totalSale;
            });
            
            // Calculate commission and PNO winnings for each user
            Object.keys(userSales).forEach(userName => {
                const userData = userSales[userName];
                const userCom = nameMap[userName] ? nameMap[userName].com : 0;
                const userZa = nameMap[userName] ? nameMap[userName].za : 0;
                
                // Calculate commission (ရောင်းကြေး × com ÷ 100)
                userData.commission = (userData.sales * userCom) / 100;
                
                // Calculate PNO winnings
                userData.pnoWinnings = calculatePnoWinnings(userData.bets, pno);
                
                // Calculate za (PNO အမောက်စုစုပေါင်း × za)
                userData.zaAmount = userData.pnoWinnings * userZa;
                
                // Calculate final total
                userData.finalTotal = userData.sales - userData.commission  - userData.zaAmount;
                
                // Update grand totals
                grandTotalCommission += userData.commission;
                grandTotalPnoWinnings += userData.pnoWinnings;
                grandTotalZa += userData.zaAmount;
                grandFinalTotal += userData.finalTotal;
            });
            
            // Build HTML for results
            let html = `<div class="result-header">Result for ${currentTimeData.date} ${currentTimeData.time}</div>`;
            
            // Sort users alphabetically
            const sortedUsers = Object.keys(userSales).sort();
            
            sortedUsers.forEach(userName => {
                const userData = userSales[userName];
                const userCom = nameMap[userName] ? nameMap[userName].com : 0;
                const userZa = nameMap[userName] ? nameMap[userName].za : 0;
                const isProfit = userData.finalTotal >= 0;
                const profitLossText = userData.finalTotal === 0 ? '' : 
                                      (isProfit ? 'အမြတ်' : 'အရှုံး');
                const profitLossClass = userData.finalTotal === 0 ? 'neutral-status' : 
                                       (isProfit ? 'profit-status' : 'loss-status');
                const profitLossIndicatorClass = userData.finalTotal === 0 ? '' : 
                                                (isProfit ? 'profit' : 'loss-indicator');
                
                html += `
                    <div class="user-result">
                        <div class="user-name">${userName}</div>
                        <div class="calculation-row">
                            <span class="calculation-label">ရောင်းကြေး =</span>
                            <span class="calculation-value">${formatNumber(userData.sales)}</span>
                        </div>
                        <div class="calculation-row">
                            <span class="calculation-label">ကော်(${userCom}%) =</span>
                            <span class="calculation-value">${formatNumber(userData.commission)}</span>
                        </div>
                        <div class="divider"></div>
                        <div class="sub-total">
                            <span>${formatNumber(userData.sales - userData.commission)}</span>
                        </div>
                        <div class="pno-section">
                            <div class="pno-row">
                                <span>PNO(${pno || '0'}) =</span>
                                <span>${formatNumber(userData.pnoWinnings)}</span>
                            </div>
                            <div class="pno-row">
                                <span>အဆ(${userZa}) =</span>
                                <span>${formatNumber(userData.zaAmount)}</span>
                            </div>
                            <div class="pno-row">
                                <span>စုစုပေါင်း =</span>
                                <span>${formatNumber( userData.zaAmount)}</span>
                            </div>
                        </div>
                        <div class="divider"></div>
                        <div class="final-total ${isProfit ? '' : 'loss'}">
                            <span>${formatNumber(Math.abs(userData.finalTotal))}</span>
                        </div>
                        ${userData.finalTotal !== 0 ? `
                            <div class="profit-loss-indicator ${profitLossIndicatorClass}">
                                <span class="status-indicator ${profitLossClass}"></span>
                                ${profitLossText} ${formatNumber(Math.abs(userData.finalTotal))}
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            
            // Add grand total section
            const isGrandProfit = grandFinalTotal >= 0;
            const grandProfitLossText = grandFinalTotal === 0 ? '' : 
                                      (isGrandProfit ? 'စုစုပေါင်းအမြတ်' : 'စုစုပေါင်းအရှုံး');
            const grandProfitLossClass = grandFinalTotal === 0 ? 'neutral-status' : 
                                       (isGrandProfit ? 'profit-status' : 'loss-status');
            
            html += `
                <div class="grand-total-section">
                    <div class="grand-total-header">စုစုပေါင်းရလဒ်</div>
                    <div class="grand-total-row">
                        <span class="grand-total-label">စုစုပေါင်းရောင်းကြေး</span>
                        <span class="grand-total-value">${formatNumber(grandTotalSales)}</span>
                    </div>
                    <div class="grand-total-row">
                        <span class="grand-total-label">စုစုပေါင်းကော်</span>
                        <span class="grand-total-value">${formatNumber(grandTotalCommission)}</span>
                    </div>
                    <div class="grand-total-row">
                        <span class="grand-total-label">ပေါက်ကြေး</span>
                        <span class="grand-total-value">${formatNumber(grandTotalPnoWinnings)}</span>
                    </div>
                    <div class="grand-total-row">
                        <span class="grand-total-label">စုစုပေါင်းအဆ</span>
                        <span class="grand-total-value">${formatNumber(grandTotalZa)}</span>
                    </div>
                    <div class="grand-total-final">
                        <span class="grand-total-label">
                            <span class="status-indicator ${grandProfitLossClass}"></span>
                            ${grandProfitLossText}
                        </span>
                        <span class="grand-total-value ${isGrandProfit ? 'grand-profit' : 'grand-loss'}">
                            ${formatNumber(Math.abs(grandFinalTotal))}
                        </span>
                    </div>
                </div>
            `;
            
            resultDisplay.innerHTML = html;
            
            // Scroll to results
            resultDisplay.scrollIntoView({ behavior: 'smooth' });
        }

        function calculatePnoWinnings(bets, pno) {
            if (!pno || pno.trim() === '' || !bets || bets.length === 0) {
                return 0;
            }
            
            let totalWinnings = 0;
            
            bets.forEach(bet => {
                // Check if the bet number matches the PNO
                const betNumber = bet.number.toString().padStart(2, '0');
                const pnoNumber = pno.toString().padStart(2, '0');
                
                if (betNumber === pnoNumber) {
                    // PNO wins typically pay 70x the bet amount
                    totalWinnings += bet.amount  ;
                }
            });
            
            return totalWinnings;
        }

        function formatNumber(num) {
            if (num === undefined || num === null || isNaN(num)) return '0';
            return Math.round(num).toLocaleString();
        }
    

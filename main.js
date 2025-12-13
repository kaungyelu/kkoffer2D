   
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
        
        // Function to get stored time data
        function getTimeData() {
            const params = getUrlParams();
            
            // Check if we have date and time from URL parameters
            if (params.date && params.time) {
                return {
                    date: params.date,
                    time: params.time,
                    source: 'url'
                };
            } else {
                // Check if we have stored data in localStorage
                const storedDate = localStorage.getItem('selectedDate');
                const storedTime = localStorage.getItem('selectedTime');
                
                if (storedDate && storedTime) {
                    return {
                        date: storedDate,
                        time: storedTime,
                        source: 'localStorage'
                    };
                } else {
                    return null;
                }
            }
        }
        
        // Generic function to navigate to any page with time data
        function navigateToPage(pageName) {
            const timeData = getTimeData();
            
            if (timeData) {
                // Navigate to page with time data
                window.location.href = `${pageName}.html?date=${encodeURIComponent(timeData.date)}&time=${encodeURIComponent(timeData.time)}`;
            } else {
                // No time data available, go to page without parameters
                window.location.href = `${pageName}.html`;
            }
        }
        
        // Specific navigation functions for each button
        function goToSale() {
            navigateToPage('sale');
        }
        
        function goToSlip() {
            navigateToPage('slip');
        }
        
        function goToBuy() {
            navigateToPage('buy');
        }
        
        function goToLedger() {
            navigateToPage('ledger');
        }
        
        function goToResult() {
            navigateToPage('result');
        }
        
        // Name and Set pages don't need time data
        function goToName() {
            window.location.href = "name.html";
        }
        
        function goToSet() {
            window.location.href = "set.html";
        }
        
        // Time button - goes to time selection page
        function goToTime() {
            window.location.href = "time.html";
        }
        
        // On page load
        document.addEventListener('DOMContentLoaded', function() {
            const timeData = getTimeData();
            const headerTitle = document.getElementById('headerTitle');
            
            // Update header with time data if available
            if (timeData) {
                headerTitle.innerHTML = `<span class="selected-time">${timeData.date} ${timeData.time}</span>`;
                
                // Store the selected time in localStorage if from URL
                if (timeData.source === 'url') {
                    localStorage.setItem('selectedDate', timeData.date);
                    localStorage.setItem('selectedTime', timeData.time);
                }
            } else {
                // Keep default text if no time data
                headerTitle.textContent = 'Active Time';
            }
            
            // Add click events to all buttons
            document.getElementById('saleButton').addEventListener('click', goToSale);
            document.getElementById('slipButton').addEventListener('click', goToSlip);
            document.getElementById('buyButton').addEventListener('click', goToBuy);
            document.getElementById('ledgerButton').addEventListener('click', goToLedger);
            document.getElementById('nameButton').addEventListener('click', goToName);
            document.getElementById('resultButton').addEventListener('click', goToResult);
            document.getElementById('timeButton').addEventListener('click', goToTime);
            document.getElementById('setButton').addEventListener('click', goToSet);
        });
    

   // Global variables
    let bets = [];
    let totalAmount = 0;
    let closedNumbers = new Set();
    let preparedBets = [];

    // DOM elements
    const betInput = document.getElementById('betInput');
    const a1Btn = document.getElementById('a1Btn');
    const a2Btn = document.getElementById('a2Btn');
    const a3Btn = document.getElementById('a3Btn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const saveBtn = document.getElementById('saveBtn');
    const betList = document.getElementById('betList');
    const totalAmountDisplay = document.getElementById('totalAmount');
    const listCount = document.getElementById('listCount');

    // Event listeners
    a2Btn.addEventListener('click', prepareBets);
    a3Btn.addEventListener('click', addPreparedBetsWithConfirmation);
    a1Btn.addEventListener('click', clearInput);
    clearAllBtn.addEventListener('click', clearAllBets);
    saveBtn.addEventListener('click', saveBets);
    
    betInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            prepareBets();
        }
    });

 // Function to normalize all special text
function normalizeAllSpecialText(text) {
    // အပူးအမျိုးမျိုး
    text = text.replace(/(အပူ|အပူး)/gi, 'အပူး');
    
    // ပါဝါအမျိုးမျိုး
    text = text.replace(/(ပါဝါ|ပါဝ|ပဝ)/gi, 'ပါဝါ');
    
    // နက္ခတ်အမျိုးမျိုး
    text = text.replace(/(နက္ခတ်|နက္ခ|နက|နခ|နက်ခက်|နတ်ခပ်)/gi, 'နက္ခ');
    
    // ညီကိုအမျိုးမျိုး
    text = text.replace(/(ညီကို|ညက|သေးကြီး)/gi, 'ညီကို');
    
    // ကိုညီအမျိုးမျိုး
    text = text.replace(/(ကိုညီ|ကည|ကြီးသေး)/gi, 'ကိုညီ');
    
    return text;
}

// Normalize reverse text function ထဲမှာလည်း ခေါ်သုံးရမယ်
function normalizeReverseText(text) {
    // Reverse အတွက်
    let normalized = text.replace(/[rR@&]/g, 'r');
    
    // ဘရိတ်အတွက်
    normalized = normalized.replace(/(ဘရိတ်|ဘ|ဘီ|Bk|bk|B|b)/gi, 'ဘရိတ်');
    
    // ပါအတွက်
    normalized = normalized.replace(/(ပါ|ပတ်|အပတ်|p|P)/gi, 'ပါ');
    
    // အထူးစကားလုံးအားလုံးအတွက်
    normalized = normalizeAllSpecialText(normalized);
    
    return normalized;
}


    // Function to reverse a number
    function reverseNumber(n) {
        const s = String(n).padStart(2, '0');
        return parseInt(s.split('').reverse().join(''));
    }

    // Special cases definitions
    const specialCases = {
        'အပူး': [0, 11, 22, 33, 44, 55, 66, 77, 88, 99],
        'ပါဝါ': [5, 16, 27, 38, 49, 50, 61, 72, 83, 94],
        'နက္ခ': [7, 18, 24, 35, 42, 53, 69, 70, 81, 96],
        'ညီကို': [1, 12, 23, 34, 45, 56, 67, 78, 89, 90],
        'ကိုညီ': [9, 10, 21, 32, 43, 54, 65, 76, 87, 98]
    };

    // Even/Odd system
    const evenOddCases = {
        'စုံစုံ': { first: 'even', second: 'even' },
        'မမ': { first: 'odd', second: 'odd' },
        'စုံမ': { first: 'even', second: 'odd' },
        'မစုံ': { first: 'odd', second: 'even' }
    };

    const evenDigits = [0, 2, 4, 6, 8];
    const oddDigits = [1, 3, 5, 7, 9];

    // All supported separators
    const allSeparators = /[\/\-\*\=\+\@\#\$\%\&\_\"\'\:\;\!\(\)\?\\\.\ ,]/;

    // Function to prepare bets (A2 button) - Paste from clipboard
    function prepareBets() {
        // Change button text to indicate pasting
        const originalText = a2Btn.textContent;
        a2Btn.textContent = 'Pasting...';
        a2Btn.disabled = true;
        
        // Try to read from clipboard
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText()
                .then(text => {
                    if (text && text.trim()) {
                        betInput.value = text.trim();
                        a2Btn.textContent = 'Pasted!';
                        setTimeout(() => {
                            a2Btn.textContent = 'Paste';
                            a2Btn.disabled = false;
                        }, 1000);
                    } else {
                        a2Btn.textContent = 'No Text!';
                        setTimeout(() => {
                            a2Btn.textContent = 'Paste';
                            a2Btn.disabled = false;
                        }, 1000);
                    }
                })
                .catch(err => {
                    console.error('Clipboard read failed:', err);
                    // Fallback: focus on input for manual paste
                    betInput.focus();
                    document.execCommand('paste');
                    a2Btn.textContent = 'Use Ctrl+V';
                    setTimeout(() => {
                        a2Btn.textContent = 'Paste';
                        a2Btn.disabled = false;
                    }, 1500);
                });
        } else {
            // Fallback for browsers without clipboard API
            betInput.focus();
            betInput.select();
            a2Btn.textContent = 'Use Ctrl+V';
            setTimeout(() => {
                a2Btn.textContent = 'Paste';
                a2Btn.disabled = false;
            }, 1500);
        }
    }

 // Function to add prepared bets with confirmation (A3 button)
function addPreparedBetsWithConfirmation() {
    const inputText = betInput.value.trim();
    if (!inputText) {
        alert('လောင်းကြေးထည့်ပါ');
        return;
    }

    const lines = inputText.split('\n');
    preparedBets = [];
    const invalidLines = [];

    for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        if (!trimmedLine) continue;

        let normalizedLine = normalizeReverseText(trimmedLine);
    
        const lineBets = parseBetLine(normalizedLine);
        if (lineBets.length > 0) {
            preparedBets.push(...lineBets);
        } else {
            invalidLines.push(trimmedLine);
        }
    }

    // Store invalid lines for copying
    const invalidText = invalidLines.join('\n');
    window.lastInvalidLines = invalidText;

    // Show custom dialog with Copy button
    showBetConfirmationDialog(preparedBets, invalidLines, invalidText);
}

// Custom confirmation dialog with Copy button
function showBetConfirmationDialog(preparedBets, invalidLines, invalidText) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    // Create dialog box
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white;
        border-radius: 10px;
        padding: 20px;
        width: 90%;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;

    let content = '';
    
    if (preparedBets.length > 0) {
        const totalPreparedAmount = preparedBets.reduce((sum, bet) => sum + bet.amount, 0);
        content += `<h3 style="color: #27ae60; margin-bottom: 10px;">ပြင်ဆင်ပြီးပါပြီ။</h3>`;
        content += `<p>စုစုပေါင်း: <strong>${preparedBets.length} ခု</strong></p>`;
        content += `<p>စုစုပေါင်းငွေ: <strong style="color: #e74c3c;">${totalPreparedAmount.toLocaleString()}</strong></p>`;
    }
    
    if (invalidLines.length > 0) {
        if (preparedBets.length > 0) {
            content += '<hr style="margin: 15px 0;">';
        }
        content += `<h4 style="color: #e74c3c; margin-bottom: 10px;">မဝင်သော လိုင်းများ (${invalidLines.length})</h4>`;
        
        // Show only first 5 lines to prevent overflow
        const displayLines = invalidLines.slice(0, 5);
        content += `<div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 10px; max-height: 150px; overflow-y: auto;">`;
        displayLines.forEach((line, index) => {
            content += `<div style="margin: 3px 0; font-family: monospace;">${line}</div>`;
        });
        
        if (invalidLines.length > 5) {
            content += `<div style="color: #7f8c8d; font-style: italic;">...နှင့် အခြား ${invalidLines.length - 5} လိုင်း</div>`;
        }
        content += `</div>`;
    }

    if (preparedBets.length === 0 && invalidLines.length > 0) {
        content = `<h3 style="color: #e74c3c; margin-bottom: 15px;">ဘာမှမဝင်ပါ</h3>` + 
                  `<p>မဝင်သော လိုင်းများ (${invalidLines.length})</p>` + 
                  `<div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; max-height: 200px; overflow-y: auto;">`;
        invalidLines.forEach(line => {
            content += `<div style="margin: 3px 0; font-family: monospace;">${line}</div>`;
        });
        content += `</div>`;
    }

    dialog.innerHTML = content;

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 20px;
        justify-content: space-between;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
        flex: 1;
        padding: 10px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-family: 'Pyidaungsu', sans-serif;
    `;
    cancelButton.onclick = function() {
        document.body.removeChild(overlay);
    };

    if (invalidLines.length > 0) {
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.style.cssText = `
            flex: 1;
            padding: 10px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Pyidaungsu', sans-serif;
        `;
        copyButton.onclick = function() {
            navigator.clipboard.writeText(invalidText)
                .then(() => {
                    // Copy ယူပြီးရင် input field ထဲထည့်ပေးမယ်
                    betInput.value = invalidText;
                    copyButton.textContent = 'Copied!';
                    copyButton.style.background = '#27ae60';
                    
                    // Copy ယူပြီးတာကို notification ပေးမယ်
                    const notification = document.createElement('div');
                    notification.textContent = 'မဝင်တဲ့ လိုင်းတွေ clipboard မှာရှိပြီးပြီ';
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #27ae60;
                        color: white;
                        padding: 10px 20px;
                        border-radius: 5px;
                        z-index: 1001;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    `;
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                        if (notification.parentNode) {
                            document.body.removeChild(notification);
                        }
                        copyButton.textContent = 'Copy';
                        copyButton.style.background = '#3498db';
                    }, 2000);
                })
                .catch(() => {
                    alert('Copy မရပါ');
                });
        };
        buttonContainer.appendChild(copyButton);
    }

    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.style.cssText = `
        flex: 1;
        padding: 10px;
        background: #2ecc71;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-family: 'Pyidaungsu', sans-serif;
        ${preparedBets.length === 0 ? 'display: none;' : ''}
    `;
    okButton.onclick = function() {
        document.body.removeChild(overlay);
        addPreparedBets();
    };

    // Button order: Cancel - Copy - OK
    buttonContainer.appendChild(cancelButton);
    if (invalidLines.length > 0) {
        // Copy button already added above
    }
    if (preparedBets.length > 0) {
        buttonContainer.appendChild(okButton);
    }

    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}
    // Function to add prepared bets to main list
    function addPreparedBets() {
        if (preparedBets.length === 0) {
            alert('မတင်ထားသောလောင်းကြေးများမရှိပါ');
            return;
        }

        // Add prepared bets to main list
        bets.push(...preparedBets);
        
        // Update total
        preparedBets.forEach(bet => {
            totalAmount += bet.amount;
        });

        updateDisplay();
        betInput.value = '';
        preparedBets = [];
        
        // Auto scroll to bottom of list to see the last item
        setTimeout(() => {
            const listView = document.querySelector('.list-view');
            listView.scrollTop = listView.scrollHeight;
        }, 100);
    }

    

    // Function to parse a single line of bet input
    function parseBetLine(line) {
        const bets = [];
        
        // 1. Check for dynamic types with reverse (ထိပ်, ပိတ်)
             const dynamicTypes = ['ထိပ်', 'ပိတ်', 'ဘရိတ်', 'ပါ'];
        for (const dtype of dynamicTypes) {
            if (line.includes(dtype) && line.includes('r')) {
                const dynamicReverseBets = parseDynamicReverseBet(line, dtype);
                if (dynamicReverseBets.length > 0) return dynamicReverseBets;
            }
        }
        
        // 2. First check for group reverse patterns
        const groupReverseBets = parseGroupReverseBet(line);
        if (groupReverseBets.length > 0) return groupReverseBets;
        
        // 3. Check for single reverse complex patterns like "24-1000r500"
        const reverseComplexBets = parseReverseComplexBet(line);
        if (reverseComplexBets.length > 0) return reverseComplexBets;
        
        // 4. Check for wheel cases (ခွေ, ခွေပူး)
        if (line.includes('ခွေ')) {
            const wheelBets = parseWheelBet(line);
            if (wheelBets.length > 0) return wheelBets;
        }

        // 5. Check for special cases
        for (const [caseName, caseNumbers] of Object.entries(specialCases)) {
            if (line.includes(caseName)) {
                const specialBets = parseSpecialBet(line, caseName, caseNumbers);
                if (specialBets.length > 0) return specialBets;
            }
        }

        // 6. Check for Even/Odd system
        for (const [caseName, caseType] of Object.entries(evenOddCases)) {
            if (line.includes(caseName)) {
                const evenOddBets = parseEvenOddBet(line, caseName, caseType);
                if (evenOddBets.length > 0) return evenOddBets;
            }
        }

        // 7. Check for single digit with Even/Odd
        const singleEvenOddMatch = line.match(/^(\d)(စုံ|မ)r?(\d+)$/);
        if (singleEvenOddMatch) {
            const singleEvenOddBets = parseSingleEvenOddBet(singleEvenOddMatch);
            if (singleEvenOddBets.length > 0) return singleEvenOddBets;
        }

        // 8. Check for dynamic types (ထိပ်, ပိတ်, ဘရိတ်, ပါ)

        for (const dtype of dynamicTypes) {
            if (line.includes(dtype)) {
                const dynamicBets = parseDynamicBet(line, dtype);
                if (dynamicBets.length > 0) return dynamicBets;
            }
        }

        // 9. Check for simple reverse system (r)
        if (line.includes('r')) {
            const reverseBets = parseSimpleReverseBet(line);
            if (reverseBets.length > 0) return reverseBets;
        }

        // 10. Regular number-amount format (fallback)
        const regularBets = parseRegularBet(line);
        if (regularBets.length > 0) return regularBets;

        return bets;
    }

    // Parse dynamic reverse bets (ထိပ်r, ပိတ်r)
    function parseDynamicReverseBet(line, dtype) {
        const bets = [];
        
        const reverseMatch = line.match(new RegExp(`^(\\d+)${dtype}(\\d+)r(\\d+)$`));
        if (reverseMatch) {
            const [, digitStr, amount1Str, amount2Str] = reverseMatch;
            const digit = parseInt(digitStr);
            const amount1 = parseInt(amount1Str);
            const amount2 = parseInt(amount2Str);
            
            if (digit >= 0 && digit <= 9 && amount1 >= 100 && amount2 >= 100) {
                if (dtype === 'ထိပ်') {
                    // ထိပ် with reverse - create both ထိပ် and ပိတ် bets
                    for (let i = 0; i <= 9; i++) {
                        bets.push({
                            number: digit * 10 + i,
                            amount: amount1,
                            display: (digit * 10 + i).toString().padStart(2, '0'),
                            type: 'ထိပ်'
                        });
                    }
                    
                    for (let i = 0; i <= 9; i++) {
                        bets.push({
                            number: i * 10 + digit,
                            amount: amount2,
                            display: (i * 10 + digit).toString().padStart(2, '0'),
                            type: 'ပိတ်'
                        });
                    }
                } else if (dtype === 'ပိတ်') {
                    // ပိတ် with reverse - create both ပိတ် and ထိပ် bets
                    for (let i = 0; i <= 9; i++) {
                        bets.push({
                            number: i * 10 + digit,
                            amount: amount1,
                            display: (i * 10 + digit).toString().padStart(2, '0'),
                            type: 'ပိတ်'
                        });
                    }
                    
                    for (let i = 0; i <= 9; i++) {
                        bets.push({
                            number: digit * 10 + i,
                            amount: amount2,
                            display: (digit * 10 + i).toString().padStart(2, '0'),
                            type: 'ထိပ်'
                        });
                    }
                }
                
                return bets;
            }
        }
        
        return [];
    }

    // Parse group reverse bets with various separators
    function parseGroupReverseBet(line) {
        const bets = [];
        
        const groupReverseMatch = line.match(/^([\d\s\.\-\/]+?)[\-\s\.]*(\d+)\s*r\s*(\d+)$/);
        if (groupReverseMatch) {
            const [, numbersPart, amount1Str, amount2Str] = groupReverseMatch;
            const amount1 = parseInt(amount1Str);
            const amount2 = parseInt(amount2Str);
            
            if (amount1 >= 100 && amount2 >= 100) {
                const numbers = [];
                const numberStrings = numbersPart.split(/[\/\-\*\.\s]+/);
                
                numberStrings.forEach(str => {
                    const numStr = str.replace(/\D/g, '');
                    if (numStr.length === 1 || numStr.length === 2) {
                        const num = parseInt(numStr);
                        if (num >= 0 && num <= 99 && !isNaN(num)) {
                            numbers.push(num);
                        }
                    }
                });
                
                if (numbers.length > 0) {
                    numbers.forEach(num => {
                        bets.push({
                            number: num,
                            amount: amount1,
                            display: num.toString().padStart(2, '0'),
                            type: 'Group Reverse'
                        });
                        
                        const revNum = reverseNumber(num);
                        bets.push({
                            number: revNum,
                            amount: amount2,
                            display: revNum.toString().padStart(2, '0'),
                            type: 'Group Reverse'
                        });
                    });
                    
                    return bets;
                }
            }
        }
        
        const groupReverseAfterMatch = line.match(/^([\d\s\.\-\/]+?)r\s*(\d+)\s*[\-\s\.]+\s*(\d+)$/);
        if (groupReverseAfterMatch) {
            const [, numbersPart, amount1Str, amount2Str] = groupReverseAfterMatch;
            const amount1 = parseInt(amount1Str);
            const amount2 = parseInt(amount2Str);
            
            if (amount1 >= 100 && amount2 >= 100) {
                const numbers = [];
                const numberStrings = numbersPart.split(/[\/\-\*\.\s]+/);
                
                numberStrings.forEach(str => {
                    const numStr = str.replace(/\D/g, '');
                    if (numStr.length === 1 || numStr.length === 2) {
                        const num = parseInt(numStr);
                        if (num >= 0 && num <= 99 && !isNaN(num)) {
                            numbers.push(num);
                        }
                    }
                });
                
                if (numbers.length > 0) {
                    numbers.forEach(num => {
                        bets.push({
                            number: num,
                            amount: amount1,
                            display: num.toString().padStart(2, '0'),
                            type: 'Group Reverse'
                        });
                        
                        const revNum = reverseNumber(num);
                        bets.push({
                            number: revNum,
                            amount: amount2,
                            display: revNum.toString().padStart(2, '0'),
                            type: 'Group Reverse'
                        });
                    });
                    
                    return bets;
                }
            }
        }
        
        return [];
    }

    // Parse complex reverse bets like "24-1000r500"
    function parseReverseComplexBet(line) {
        const bets = [];
        
        const complexReverseMatch = line.match(/^(\d{1,2})[\-\s\.]*(\d+)\s*r\s*(\d+)$/);
        if (complexReverseMatch) {
            const [, numStr, amount1Str, amount2Str] = complexReverseMatch;
            const num = parseInt(numStr);
            const amount1 = parseInt(amount1Str);
            const amount2 = parseInt(amount2Str);
            
            if (num >= 0 && num <= 99 && amount1 >= 100 && amount2 >= 100) {
                const revNum = reverseNumber(num);
                
                bets.push({
                    number: num,
                    amount: amount1,
                    display: num.toString().padStart(2, '0'),
                    type: 'Reverse'
                });
                
                bets.push({
                    number: revNum,
                    amount: amount2,
                    display: revNum.toString().padStart(2, '0'),
                    type: 'Reverse'
                });
                
                return bets;
            }
        }
        
        return [];
    }

    // Parse simple reverse bets like "12r1000" or "23r1000-500"
    function parseSimpleReverseBet(line) {
        const bets = [];
        const rPos = line.toLowerCase().indexOf('r');
        
        if (rPos === -1) return [];
        
        const beforeR = line.substring(0, rPos).trim();
        const afterR = line.substring(rPos + 1).trim();
        
        const numbersBefore = [];
        const numberMatches = beforeR.match(/\d+/g);
        if (numberMatches) {
            numberMatches.forEach(match => {
                const num = parseInt(match);
                if (num >= 0 && num <= 99 && !isNaN(num)) {
                    numbersBefore.push(num);
                }
            });
        }
        
        const amounts = [];
        const amountMatches = afterR.match(/\d+/g);
        if (amountMatches) {
            amountMatches.forEach(match => {
                const amount = parseInt(match);
                if (amount >= 100 && !isNaN(amount)) {
                    amounts.push(amount);
                }
            });
        }
        
        if (numbersBefore.length === 0 || amounts.length === 0) return [];
        
        if (amounts.length === 1) {
            numbersBefore.forEach(num => {
                bets.push({
                    number: num,
                    amount: amounts[0],
                    display: num.toString().padStart(2, '0'),
                    type: 'Reverse'
                });
                
                const revNum = reverseNumber(num);
                bets.push({
                    number: revNum,
                    amount: amounts[0],
                    display: revNum.toString().padStart(2, '0'),
                    type: 'Reverse'
                });
            });
        } else {
            numbersBefore.forEach((num, index) => {
                const amountIndex = Math.min(index, amounts.length - 1);
                const revAmountIndex = Math.min(index + 1, amounts.length - 1);
                
                bets.push({
                    number: num,
                    amount: amounts[amountIndex],
                    display: num.toString().padStart(2, '0'),
                    type: 'Reverse'
                });
                
                const revNum = reverseNumber(num);
                bets.push({
                    number: revNum,
                    amount: amounts[revAmountIndex],
                    display: revNum.toString().padStart(2, '0'),
                    type: 'Reverse'
                });
            });
        }
        
        return bets;
    }

    // Parse wheel bet (ခွေ, ခွေပူး)
    function parseWheelBet(line) {
        const bets = [];
        const isDouble = line.includes('ခွေပူး');
        const separator = isDouble ? 'ခွေပူး' : 'ခွေ';
        const parts = line.split(separator);
        
        if (parts.length < 2) return bets;
        
        const basePart = parts[0];
        const amountPart = parts[1];
        
        const baseNumbers = basePart.replace(/\D/g, '');
        const amount = parseInt(amountPart.replace(/\D/g, ''));
        
        if (!baseNumbers || !amount || amount < 100) return bets;
        
        const pairs = [];
        for (let i = 0; i < baseNumbers.length; i++) {
            for (let j = 0; j < baseNumbers.length; j++) {
                if (i !== j) {
                    const num = parseInt(baseNumbers[i] + baseNumbers[j]);
                    if (!pairs.includes(num)) {
                        pairs.push(num);
                    }
                }
            }
        }
        
        if (isDouble) {
            for (const d of baseNumbers) {
                const doubleNum = parseInt(d + d);
                if (!pairs.includes(doubleNum)) {
                    pairs.push(doubleNum);
                }
            }
        }
        
        pairs.forEach(num => {
            bets.push({
                number: num,
                amount: amount,
                display: num.toString().padStart(2, '0'),
                type: isDouble ? 'Wheel Double' : 'Wheel'
            });
        });
        
        return bets;
    }

    // Parse special bet
    function parseSpecialBet(line, caseName, caseNumbers) {
        const bets = [];
        const amountStr = line.replace(caseName, '').replace(/\D/g, '');
        const amount = parseInt(amountStr);
        
        if (amount && amount >= 100) {
            caseNumbers.forEach(num => {
                bets.push({
                    number: num,
                    amount: amount,
                    display: num.toString().padStart(2, '0'),
                    type: caseName
                });
            });
        }
        
        return bets;
    }

    // Parse Even/Odd bet
    function parseEvenOddBet(line, caseName, caseType) {
        const bets = [];
        const amountStr = line.replace(caseName, '').replace(/\D/g, '');
        const amount = parseInt(amountStr);
        
        if (amount && amount >= 100) {
            const numbers = generateEvenOddNumbers(caseType, line.includes('r'));
            
            numbers.forEach(num => {
                bets.push({
                    number: num,
                    amount: amount,
                    display: num.toString().padStart(2, '0'),
                    type: caseName + (line.includes('r') ? ' R' : '')
                });
            });
        }
        
        return bets;
    }

    // Generate numbers for Even/Odd system
    function generateEvenOddNumbers(caseType, includeReverse = false) {
        const numbers = [];
        
        if (caseType.first === 'even' && caseType.second === 'even') {
            for (const first of evenDigits) {
                for (const second of evenDigits) {
                    numbers.push(first * 10 + second);
                }
            }
        } else if (caseType.first === 'odd' && caseType.second === 'odd') {
            for (const first of oddDigits) {
                for (const second of oddDigits) {
                    numbers.push(first * 10 + second);
                }
            }
        } else if (caseType.first === 'even' && caseType.second === 'odd') {
            for (const first of evenDigits) {
                for (const second of oddDigits) {
                    numbers.push(first * 10 + second);
                    if (includeReverse) {
                        numbers.push(second * 10 + first);
                    }
                }
            }
        } else if (caseType.first === 'odd' && caseType.second === 'even') {
            for (const first of oddDigits) {
                for (const second of evenDigits) {
                    numbers.push(first * 10 + second);
                    if (includeReverse) {
                        numbers.push(second * 10 + first);
                    }
                }
            }
        }
        
        return [...new Set(numbers)];
    }

    // Parse single digit with Even/Odd
    function parseSingleEvenOddBet(match) {
        const bets = [];
        const [, digitStr, evenOddType, amountStr] = match;
        const digit = parseInt(digitStr);
        const amount = parseInt(amountStr);
        
        if (amount >= 100) {
            const numbers = [];
            const includeReverse = match[0].includes('r');
            
            if (evenOddType === 'စုံ') {
                for (const evenDigit of evenDigits) {
                    numbers.push(digit * 10 + evenDigit);
                    if (includeReverse) {
                        numbers.push(evenDigit * 10 + digit);
                    }
                }
            } else {
                for (const oddDigit of oddDigits) {
                    numbers.push(digit * 10 + oddDigit);
                    if (includeReverse) {
                        numbers.push(oddDigit * 10 + digit);
                    }
                }
            }
            
            const uniqueNumbers = [...new Set(numbers)];
            
            uniqueNumbers.forEach(num => {
                bets.push({
                    number: num,
                    amount: amount,
                    display: num.toString().padStart(2, '0'),
                    type: digit + evenOddType + (includeReverse ? ' R' : '')
                });
            });
        }
        
        return bets;
    }

    // Parse dynamic bet (ထိပ်, ပိတ်, ဘရိတ်, ပါ)
    function parseDynamicBet(line, dtype) {
        const bets = [];
        const numbers = [];
        let amount = 0;
        
        const parts = line.match(/\d+/g);
        if (parts) {
            amount = parseInt(parts[parts.length - 1]);
            const digits = parts.slice(0, -1).map(p => parseInt(p)).filter(d => d >= 0 && d <= 9);
            
            if (amount >= 100 && digits.length > 0) {
                if (dtype === 'ထိပ်') {
                    for (const d of digits) {
                        numbers.push(...Array.from({length: 10}, (_, i) => d * 10 + i));
                    }
                } else if (dtype === 'ပိတ်') {
                    for (const d of digits) {
                        numbers.push(...Array.from({length: 10}, (_, i) => i * 10 + d));
                    }
                } else if (dtype === 'ဘရိတ်') {
                    for (const d of digits) {
                        numbers.push(...Array.from({length: 100}, (_, n) => n).filter(n => (Math.floor(n/10) + n%10) % 10 === d));
                    }
                } else if (dtype === 'ပါ') {
                    for (const d of digits) {
                        const tens = Array.from({length: 10}, (_, i) => d * 10 + i);
                        const units = Array.from({length: 10}, (_, i) => i * 10 + d);
                        numbers.push(...tens, ...units);
                    }
                }
                
                const uniqueNumbers = [...new Set(numbers)];
                
                uniqueNumbers.forEach(num => {
                    bets.push({
                        number: num,
                        amount: amount,
                        display: num.toString().padStart(2, '0'),
                        type: dtype
                    });
                });
            }
        }
        
        return bets;
    }

    // Parse regular bet (fallback method)
    function parseRegularBet(line) {
        const bets = [];
        
        const universalMatch = line.match(/^([\d\s\S]+?)[\-\=\+\/\*\@\#\$\%\&\_\"\'\:\;\!\(\)\?\\\.\, ]+(\d+)$/);
        if (universalMatch) {
            const numbersPart = universalMatch[1].trim();
            const amount = parseInt(universalMatch[2]);
            
            if (amount >= 100) {
                const numberStrings = numbersPart.split(/[\/\-\*\\=\.\s]+/);
                const numbers = numberStrings.map(str => {
                    const numStr = str.replace(/\D/g, '');
                    if (numStr.length === 1 || numStr.length === 2) {
                        const num = parseInt(numStr);
                        return num >= 0 && num <= 99 ? num : null;
                    }
                    return null;
                }).filter(num => num !== null);
                
                numbers.forEach(num => {
                    bets.push({
                        number: num,
                        amount: amount,
                        display: num.toString().padStart(2, '0'),
                        type: 'Regular'
                    });
                });
                
                if (bets.length > 0) return bets;
            }
        }
        
        const allNumbers = line.match(/\d+/g) || [];
        
        if (allNumbers.length >= 2) {
            for (let i = 0; i < allNumbers.length - 1; i++) {
                const num = parseInt(allNumbers[i]);
                const nextNum = parseInt(allNumbers[i + 1]);
                
                if (num >= 0 && num <= 99 && nextNum >= 100) {
                    bets.push({
                        number: num,
                        amount: nextNum,
                        display: num.toString().padStart(2, '0'),
                        type: 'Regular'
                    });
                }
            }
        }
        
        return bets;
    }

    // Function to clear input
    function clearInput() {
        betInput.value = '';
        betInput.focus();
    }

    // Function to clear all bets
    function clearAllBets() {
        if (bets.length === 0) {
            alert('မရှိပါ');
            return;
        }
        
        if (confirm('လောင်းကြေးအားလုံးကိုဖျက်မှာသေချာပါသလား?')) {
            bets = [];
            totalAmount = 0;
            updateDisplay();
        }
    }

// Function to save bets to Supabase
async function saveBets() {
    if (bets.length === 0) {
        alert('မရှိပါ');
        return;
    }
    
    // 1. Get key from activeTimeDisplay
    const activeTimeDisplay = document.getElementById('activeTimeDisplay');
    if (!activeTimeDisplay) {
        alert('Active Time မရှိပါ');
        return;
    }
    
    const key = activeTimeDisplay.textContent.trim();
    if (!key) {
        alert('Active Time မရှိပါ');
        return;
    }
    
    // 2. Get user info from select
    const userSelect = document.getElementById('userSelect');
    const selectedOption = userSelect.options[userSelect.selectedIndex];
    
    if (!selectedOption || !selectedOption.value) {
        alert('User ရွေးပါ');
        return;
    }
    
    const name = selectedOption.value;
    const com = parseInt(selectedOption.getAttribute('data-com')) || 0;
    const za = parseInt(selectedOption.getAttribute('data-za')) || 0;
    
    // 3. Prepare numbers array
    const numbers = bets.map(bet => bet.display);
    
    // 4. Prepare bets data (same as localStorage format)
    const betsData = bets.map(bet => ({
        display: bet.display,
        number: bet.number,
        amount: bet.amount,
        type: bet.type
    }));
    
    // 5. Prepare data for Supabase
    const saleData = {
        key: key,
        name: name,
        com: com,
        za: za,
        numbers: numbers,
        bets: betsData,
        total_amount: totalAmount
        // created_at will be auto-generated by Supabase
    };
    
    try {
        // Show loading state
        const originalSaveText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        // 6. Insert into Supabase
        const { data, error } = await supabase
            .from('sales')
            .insert([saleData])
            .select();
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        // 7. Success handling
        console.log('Saved to Supabase:', data);
        
        // Clear current bets after successful save
        bets = [];
        totalAmount = 0;
        updateDisplay();
        
        // Show success message
        alert(`✅ လောင်းကြေးများသိမ်းဆည်းပြီးပါပြီ။\n\nအချိန်: ${key}\nအမည်: ${name}\nစုစုပေါင်း: ${saleData.total_amount.toLocaleString()}\nအရေအတွက်: ${betsData.length} ခု`);
        
    } catch (error) {
        console.error('Save failed:', error);
        alert('❌ သိမ်းဆည်းမှုမအောင်မြင်ပါ။\nကျေးဇူးပြု၍ ထပ်ကြိုးစားပါ။');
        
        // Fallback: Save to localStorage as backup
        const backupKey = `${key}_${Date.now()}`;
        const backupData = {
            timestamp: new Date().toISOString(),
            total: totalAmount,
            items: betsData,
            name: name,
            com: com,
            za: za
        };
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        console.log('Backup saved to localStorage with key:', backupKey);
        
    } finally {
        // Restore button state
        saveBtn.textContent = 'Save';
        saveBtn.disabled = false;
    }
// After successful save to Supabase
if (window.updateSlipCountAfterSave) {
    window.updateSlipCountAfterSave();
}
}
// Add this function for better error messages
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        document.body.removeChild(errorDiv);
    }, 5000);
}
    // Function to delete a bet
    function deleteBet(index) {
        if (confirm('ဖျက်မှာသေချာပါသလား?')) {
            const deletedBet = bets[index];
            totalAmount -= deletedBet.amount;
            bets.splice(index, 1);
            updateDisplay();
        }
    }

    // Function to update display
    function updateDisplay() {
        // Update bet list
        if (bets.length === 0) {
            betList.innerHTML = '<div class="empty-message">လောင်းကြေးမရှိသေးပါ</div>';
        } else {
            betList.innerHTML = '';
            bets.forEach((bet, index) => {
                const betItem = document.createElement('div');
                betItem.className = `bet-item ${bet.type.includes('Special') || bet.type.includes('Wheel') ? 'special-bet' : ''}`;
                
                betItem.innerHTML = `
                    <div class="bet-number">${bet.display}</div>
                    <div class="bet-amount">${bet.amount.toLocaleString()}</div>
                    <div class="bet-type">${bet.type}</div>
                    <button class="delete-btn" onclick="deleteBet(${index})">ဖျက်</button>
                `;
                
                betList.appendChild(betItem);
            });
            
            // Auto scroll to bottom to see the last item
            setTimeout(() => {
                const listView = document.querySelector('.list-view');
                listView.scrollTop = listView.scrollHeight;
            }, 100);
        }
        
        // Update total amount and count
        totalAmountDisplay.textContent = `${totalAmount.toLocaleString()}`;
        listCount.textContent = bets.length;
    }

    // Initialize
    updateDisplay();

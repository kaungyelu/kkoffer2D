// a4Btn အတွက် event listener ထပ်ထည့်မယ်
const a4Btn = document.getElementById('a4Btn');
a4Btn.addEventListener('click', processAndAddBets);

// Function to check if line contains any special system that should be skipped
function containsSpecialSystem(line) {
    // ခွေစနစ်
    const wheelKeywords = ['ခွေ', 'ခွေပူး'];
    // Dynamic စနစ်
    const dynamicKeywords = ['ထိပ်', 'ပိတ်', 'ပါ', 'ဘရိတ်'];
    // အထူးစနစ်များ
    const specialKeywords = ['အပူး', 'ပါဝါ', 'နက္ခ', 'ညီကို', 'ကိုညီ'];
    // စုံ/မစနစ်
    const evenOddKeywords = ['စုံစုံ', 'မမ', 'စုံမ', 'မစုံ'];
    
    // စုံ/မ တစ်လုံးတည်း (ဥပမာ: 1စုံ1000, 2မ500)
    const singleEvenOddPattern = /^\d(စုံ|မ)/;
    
    const allKeywords = [
        ...wheelKeywords,
        ...dynamicKeywords, 
        ...specialKeywords,
        ...evenOddKeywords
    ];
    
    // သာမန် keywords စစ်ဆေးခြင်း
    for (const keyword of allKeywords) {
        if (line.includes(keyword)) {
            return true;
        }
    }
    
    // စုံ/မ တစ်လုံးတည်း pattern စစ်ဆေးခြင်း
    if (singleEvenOddPattern.test(line)) {
        return true;
    }
    
    return false;
}

// Function to process text and combine numbers with same amount
function processAndAddBets() {
    const inputText = betInput.value.trim();
    if (!inputText) {
        alert('လောင်းကြေးထည့်ပါ');
        return;
    }

    const lines = inputText.split('\n');
    const betEntries = []; // Store all processed bet entries
    const remainingLines = []; // Store lines that contain special systems
    let lastRegularAmount = null;
    let lastReverseAmount = null;
    let lastAmountIsReverse = false;
    
    // Store original text for cancellation
    const originalText = betInput.value;
    
    for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        if (!trimmedLine) continue;

        let normalizedLine = normalizeAllSpecialText(trimmedLine);
        normalizedLine = normalizeReverseText(normalizedLine);
        
        // Check if line contains any special system that should be skipped
        if (containsSpecialSystem(normalizedLine)) {
            remainingLines.push(trimmedLine); // Keep original line (not normalized)
            continue; // Skip processing this line
        }
        
        // Case 1: Reverse pattern with two amounts (12-1000r500)
        const reverseTwoAmountMatch = normalizedLine.match(/^(\d{1,2})[\-\s\.]*(\d+)\s*r\s*(\d+)$/);
        if (reverseTwoAmountMatch) {
            const [, numStr, amount1Str, amount2Str] = reverseTwoAmountMatch;
            const num = parseInt(numStr);
            const amount1 = parseInt(amount1Str);
            const amount2 = parseInt(amount2Str);
            
            if (num >= 0 && num <= 99 && amount1 >= 100 && amount2 >= 100) {
                const revNum = reverseNumber(num);
                
                // Store amounts for future numbers
                lastRegularAmount = amount1;
                lastReverseAmount = amount2;
                lastAmountIsReverse = true;
                
                // Add both entries
                betEntries.push({ number: num, amount: amount1, type: 'Reverse' });
                betEntries.push({ number: revNum, amount: amount2, type: 'Reverse' });
                continue;
            }
        }
        
        // Case 2: Simple reverse pattern (78r1000)
        const simpleReverseMatch = normalizedLine.match(/^(\d{1,2})\s*r\s*(\d+)$/);
        if (simpleReverseMatch) {
            const [, numStr, amountStr] = simpleReverseMatch;
            const num = parseInt(numStr);
            const amount = parseInt(amountStr);
            
            if (num >= 0 && num <= 99 && amount >= 100) {
                const revNum = reverseNumber(num);
                
                // Store amounts for future numbers
                lastRegularAmount = amount;
                lastReverseAmount = amount;
                lastAmountIsReverse = true;
                
                // Add both entries with same amount
                betEntries.push({ number: num, amount: amount, type: 'Reverse' });
                betEntries.push({ number: revNum, amount: amount, type: 'Reverse' });
                continue;
            }
        }
        
        // Case 3: Regular number-amount pattern (90-100)
        const regularMatch = normalizedLine.match(/^(\d{1,2})[\-\s\.]*(\d+)$/);
        if (regularMatch && !normalizedLine.includes('r')) {
            const [, numStr, amountStr] = regularMatch;
            const num = parseInt(numStr);
            const amount = parseInt(amountStr);
            
            if (num >= 0 && num <= 99 && amount >= 100) {
                // Store amount for future numbers
                lastRegularAmount = amount;
                lastReverseAmount = null;
                lastAmountIsReverse = false;
                
                // Add entry
                betEntries.push({ number: num, amount: amount, type: 'Regular' });
                continue;
            }
        }
        
        // Case 4: Group numbers with amount (12/34/56-1000)
        const groupMatch = normalizedLine.match(/^([\d\/\.\-\s]+?)[\-\s\.]+(\d+)$/);
        if (groupMatch && !normalizedLine.includes('r')) {
            const [, numbersPart, amountStr] = groupMatch;
            const amount = parseInt(amountStr);
            
            if (amount >= 100) {
                // Store amount for future numbers
                lastRegularAmount = amount;
                lastReverseAmount = null;
                lastAmountIsReverse = false;
                
                // Extract all numbers
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
                        betEntries.push({ number: num, amount: amount, type: 'Group' });
                    });
                    continue;
                }
            }
        }
        
        // Case 5: Simple number only (34, 56, 45, 23)
        const simpleNumberMatch = trimmedLine.match(/^(\d{1,2})$/);
        if (simpleNumberMatch) {
            const num = parseInt(simpleNumberMatch[1]);
            
            if (num >= 0 && num <= 99) {
                if (lastRegularAmount !== null) {
                    // Add regular number
                    betEntries.push({ 
                        number: num, 
                        amount: lastRegularAmount, 
                        type: 'Follow Regular' 
                    });
                    
                    // If last was reverse pattern, also add reverse number
                    if (lastAmountIsReverse && lastReverseAmount !== null) {
                        const revNum = reverseNumber(num);
                        betEntries.push({ 
                            number: revNum, 
                            amount: lastReverseAmount, 
                            type: 'Follow Reverse' 
                        });
                    }
                } else {
                    // If no previous amount, keep the line
                    remainingLines.push(trimmedLine);
                }
                continue;
            }
        }
        
        // Case 6: If none of the above, try to parse anyway
        const fallbackMatch = trimmedLine.match(/(\d+)/g);
        if (fallbackMatch && fallbackMatch.length >= 1) {
            const num = parseInt(fallbackMatch[0]);
            if (num >= 0 && num <= 99) {
                if (fallbackMatch.length >= 2) {
                    const amount = parseInt(fallbackMatch[1]);
                    if (amount >= 100) {
                        lastRegularAmount = amount;
                        lastReverseAmount = null;
                        lastAmountIsReverse = false;
                        betEntries.push({ 
                            number: num, 
                            amount: amount, 
                            type: 'Fallback' 
                        });
                    }
                } else if (lastRegularAmount !== null) {
                    betEntries.push({ 
                        number: num, 
                        amount: lastRegularAmount, 
                        type: 'Follow Fallback' 
                    });
                    if (lastAmountIsReverse && lastReverseAmount !== null) {
                        const revNum = reverseNumber(num);
                        betEntries.push({ 
                            number: revNum, 
                            amount: lastReverseAmount, 
                            type: 'Follow Reverse Fallback' 
                        });
                    }
                } else {
                    // If no previous amount, keep the line
                    remainingLines.push(trimmedLine);
                }
                continue;
            }
        }
        
        // Case 7: If no pattern matched, keep the original line
        remainingLines.push(trimmedLine);
    }
    
    // Process the collected bets
    if (betEntries.length > 0) {
        // Format output as requested
        const formattedOutput = betEntries.map(entry => 
            `${entry.number.toString().padStart(2, '0')}-${entry.amount}`
        ).join('/');
        
        // Combine formatted bets with remaining lines
        let finalText = formattedOutput;
        if (remainingLines.length > 0) {
            if (formattedOutput) {
                finalText += '\n' + remainingLines.join('\n');
            } else {
                finalText = remainingLines.join('\n');
            }
        }
        
        // Show preview and ask for confirmation
        const totalAmountProcessed = betEntries.reduce((sum, entry) => sum + entry.amount, 0);
        let confirmMsg = `လောင်းကြေးအရေအတွက်: ${betEntries.length}\nစုစုပေါင်းငွေ: ${totalAmountProcessed.toLocaleString()}`;
        
        if (remainingLines.length > 0) {
            confirmMsg += `\n\nအထူးစနစ် ${remainingLines.length} ခု ရှာတွေ့ပါသည်။\nဤစနစ်များကို edittext တွင်ကျန်ရှိမည်။`;
        }
        
        confirmMsg += `\n\nလောင်းကြေးစာရင်းထဲထည့်မလား?`;
        
        if (confirm(confirmMsg)) {
            // Convert to bet objects and add to main list
            const processedBets = betEntries.map(entry => ({
                number: entry.number,
                amount: entry.amount,
                display: entry.number.toString().padStart(2, '0'),
                type: entry.type || 'A4 Processed'
            }));
            
            bets.push(...processedBets);
            processedBets.forEach(bet => {
                totalAmount += bet.amount;
            });
            
            updateDisplay();
            
            // Update input field with remaining lines
            betInput.value = remainingLines.join('\n');
            
            // Auto scroll to bottom
            setTimeout(() => {
                const listView = document.querySelector('.list-view');
                listView.scrollTop = listView.scrollHeight;
            }, 100);
        } else {
            // Cancel နှိပ်ရင် original text ကို ပြန်ထည့်
            betInput.value = originalText;
        }
    } else if (remainingLines.length > 0) {
        // Only special systems found
        alert(`အထူးစနစ် ${remainingLines.length} ခု ရှာတွေ့ပါသည်။\nဤစနစ်များကို A4 စနစ်ဖြင့် မထည့်သွင်းပါ။\nEdittext တွင်ကျန်ရှိနေပါမည်။`);
        
        // Keep the original special systems in the input field
        betInput.value = remainingLines.join('\n');
    } else {
        alert('လောင်းကြေးအသစ် မရှိပါ။');
    }
}

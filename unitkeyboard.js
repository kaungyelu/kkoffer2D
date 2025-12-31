document.addEventListener('DOMContentLoaded', function() {
    const uniteditTxt1 = document.getElementById('uniteditTxt1');
    const uniteditTxt2 = document.getElementById('uniteditTxt2');
    const uniteditTxt3 = document.getElementById('uniteditTxt3');
    const unittextView = document.getElementById('unittextView');
    const unitButtonsScrollContainer = document.getElementById('unitButtonsScrollContainer');
    const unitNumButtons = document.querySelectorAll('.unit-num-btn');
    const unitOkButton = document.querySelector('.unit-action-special-btn');
    const unitAdditionalButtons = document.querySelectorAll('.unit-additional-btn');
    
    let unitReverseMode = false;
    let unitIsSpecialMode = false;
    let unitSpecialType = '';
    let unitIsComboMode = false;
    let unitComboType = '';
    
    const unitSpecialCases = {
        'အပူး': [0, 11, 22, 33, 44, 55, 66, 77, 88, 99],
        'ပါဝါ': [5, 16, 27, 38, 49, 50, 61, 72, 83, 94],
        'နက္ခ': [7, 18, 24, 35, 42, 53, 69, 70, 81, 96],
        'ညီကို': [1, 12, 23, 34, 45, 56, 67, 78, 89, 90],
        'ကိုညီ': [9, 10, 21, 32, 43, 54, 65, 76, 87, 98],
        'ညီကိုR': [1, 12, 23, 34, 45, 56, 67, 78, 89, 90, 9, 10, 21, 32, 43, 54, 65, 76, 87, 98],
        'စုံစုံ': [0, 2, 4, 6, 8, 20, 22, 24, 26, 28, 40, 42, 44, 46, 48, 60, 62, 64, 66, 68, 80, 82, 84, 86, 88],
        'မမ': [11, 13, 15, 17, 19, 31, 33, 35, 37, 39, 51, 53, 55, 57, 59, 71, 73, 75, 77, 79, 91, 93, 95, 97, 99],
        'စုံမ': [1, 3, 5, 7, 9, 21, 23, 25, 27, 29, 41, 43, 45, 47, 49, 61, 63, 65, 67, 69, 81, 83, 85, 87, 89],
        'မစုံ': [10, 12, 14, 16, 18, 30, 32, 34, 36, 38, 50, 52, 54, 56, 58, 70, 72, 74, 76, 78, 90, 92, 94, 96, 98],
        'စုံပူး': [0, 22, 44, 66, 88],
        'မပူး': [11, 33, 55, 77, 99]
    };
    
    unitResetFields();
    unitSetupEventListeners();
    
    function unitResetFields() {
        uniteditTxt1.textContent = 'ဂဏန်း';
        uniteditTxt2.textContent = 'ယူနစ်';
        uniteditTxt3.style.display = 'none';
        uniteditTxt3.textContent = '';
        unittextView.textContent = '';
        unitReverseMode = false;
        unitIsSpecialMode = false;
        specialType = '';
        unitIsComboMode = false;
        comboType = '';
        unitHighlightField(uniteditTxt1);
        
        setTimeout(() => {
            unitButtonsScrollContainer.scrollTop = 0;
        }, 10);
    }
    
    function unitRemoveHighlights() {
        uniteditTxt1.style.borderColor = '#ddd';
        uniteditTxt1.style.backgroundColor = '#f8f9fa';
        uniteditTxt2.style.borderColor = '#ddd';
        uniteditTxt2.style.backgroundColor = '#f8f9fa';
        uniteditTxt3.style.borderColor = '#ddd';
        uniteditTxt3.style.backgroundColor = '#f8f9fa';
        unittextView.style.borderColor = '#ddd';
        unittextView.style.backgroundColor = '#f8f9fa';
    }
    
    function unitHighlightField(field) {
        unitRemoveHighlights();
        field.style.borderColor = '#3498db';
        field.style.backgroundColor = '#e3f2fd';
        
        if (field === uniteditTxt2 || field === uniteditTxt3) {
            setTimeout(() => {
                unitButtonsScrollContainer.scrollTop = 0;
            }, 10);
        }
    }
    
    function unitSetupEventListeners() {
        unitNumButtons.forEach(button => {
            const text = button.textContent;
            
            if (text !== 'R' && text !== 'အပါ' && text !== 'OK' && text !== 'DEL') {
                button.addEventListener('click', function() {
                    unitAddDigitToField(text);
                });
            }
        });
        
        const unitRButton = document.querySelector('.unit-num-btn.unit-special-btn');
        if (unitRButton && unitRButton.textContent === 'R') {
            unitRButton.addEventListener('click', function() {
                if (unitIsSpecialMode) {
                    if (unitSpecialType !== 'ထိပ်' && unitSpecialType !== 'ပိတ်') {
                        alert('R နှိပ်လို့မရပါ');
                        return;
                    }
                }
                
                if (uniteditTxt1.textContent === 'ဂဏန်း' || uniteditTxt1.textContent === '') {
                    alert('ဂဏန်းထည့်ပါ');
                    unitHighlightField(uniteditTxt1);
                    return;
                }
                
                if (uniteditTxt2.textContent === 'ယူနစ်' || uniteditTxt2.textContent === '') {
                    alert('ငွေပမာဏထည့်ပါ');
                    unitHighlightField(uniteditTxt2);
                    return;
                }
                
                unitReverseMode = true;
                unittextView.textContent = unittextView.textContent + ' R';
                uniteditTxt3.style.display = 'block';
                uniteditTxt3.textContent = '';
                
                unitHighlightField(uniteditTxt3);
                
                setTimeout(() => {
                    unitButtonsScrollContainer.scrollTop = 0;
                }, 10);
            });
        }
        
        const unitApalButton = Array.from(unitNumButtons).find(btn => btn.textContent === 'အပါ');
        if (unitApalButton) {
            unitApalButton.addEventListener('click', function() {
                unitIsSpecialMode = true;
                unitIsComboMode = false;
                unitReverseMode = false;
                unitSpecialType = 'အပါ';
                unitComboType = '';
                
                unittextView.textContent = 'အပါ';
                uniteditTxt1.textContent = '';
                uniteditTxt3.style.display = 'none';
                unitHighlightField(uniteditTxt1);
                
                setTimeout(() => {
                    unitButtonsScrollContainer.scrollTop = 0;
                }, 10);
            });
        }
        
        const unitDelButton = Array.from(unitNumButtons).find(btn => btn.textContent === 'DEL');
        if (unitDelButton) {
            unitDelButton.addEventListener('click', function() {
                unitHandleDelete();
            });
        }
        
        unitAdditionalButtons.forEach(button => {
            button.addEventListener('click', function() {
                unitHandleAdditionalButton(this.textContent);
            });
        });
        
        if (unitOkButton) {
            unitOkButton.addEventListener('click', function() {
                unitProcessOKButton();
            });
        }
        
        uniteditTxt1.addEventListener('click', () => unitHighlightField(uniteditTxt1));
        uniteditTxt2.addEventListener('click', () => unitHighlightField(uniteditTxt2));
        uniteditTxt3.addEventListener('click', () => unitHighlightField(uniteditTxt3));
        unittextView.addEventListener('click', () => unitHighlightField(unittextView));
    }
    
    function unitHandleDelete() {
        let currentField;
        
        if (uniteditTxt1.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = uniteditTxt1;
        } else if (uniteditTxt2.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = uniteditTxt2;
        } else if (uniteditTxt3.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = uniteditTxt3;
        } else if (unittextView.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = unittextView;
        } else {
            currentField = uniteditTxt1;
        }
        
        if (currentField === uniteditTxt1 && uniteditTxt1.textContent !== 'ဂဏန်း' && uniteditTxt1.textContent.length > 0) {
            uniteditTxt1.textContent = uniteditTxt1.textContent.slice(0, -1);
            if (uniteditTxt1.textContent === '') {
                uniteditTxt1.textContent = 'ဂဏန်း';
            }
        } 
        else if (currentField === uniteditTxt2 && uniteditTxt2.textContent !== 'ယူနစ်' && uniteditTxt2.textContent.length > 0) {
            uniteditTxt2.textContent = uniteditTxt2.textContent.slice(0, -1);
            if (uniteditTxt2.textContent === '') {
                uniteditTxt2.textContent = 'ယူနစ်';
            }
        }
        else if (currentField === uniteditTxt3 && uniteditTxt3.textContent.length > 0) {
            uniteditTxt3.textContent = uniteditTxt3.textContent.slice(0, -1);
        }
        else if (currentField === unittextView && unittextView.textContent.length > 0) {
            unittextView.textContent = '';
            unitReverseMode = false;
            unitIsSpecialMode = false;
            unitIsComboMode = false;
            unitSpecialType = '';
            unitComboType = '';
        }
    }
    
    function unitHandleAdditionalButton(buttonText) {
        unitReverseMode = false;
        unitIsSpecialMode = true;
        unitIsComboMode = false;
        unitSpecialType = buttonText;
        unitComboType = '';
        uniteditTxt3.style.display = 'none';
        
        uniteditTxt1.textContent = '';
        uniteditTxt2.textContent = 'ယူနစ်';
        uniteditTxt3.textContent = '';
        
        if (buttonText === 'အခွေ' || buttonText === 'ခွေပူး') {
            unitIsComboMode = true;
            unitComboType = buttonText;
            unitIsSpecialMode = false;
            unittextView.textContent = buttonText;
            unitHighlightField(uniteditTxt1);
        }
        else if (buttonText === 'အပါ' || buttonText === 'ထိပ်' || buttonText === 'ပိတ်' || 
                 buttonText === 'ဘရိတ်' || buttonText === 'စုံကပ်' || buttonText === 'မကပ်' || 
                 buttonText === 'စုံကပ်R' || buttonText === 'မကပ်R' || buttonText === 'ကပ်') {
            unittextView.textContent = buttonText;
            unitHighlightField(uniteditTxt1);
        }
        else if (buttonText === 'အပူး' || buttonText === 'ညီကို' || buttonText === 'ကိုညီ' || 
                 buttonText === 'ညီကိုR' || buttonText === 'ပါဝါ' || buttonText === 'နက္ခ' ||
                 buttonText === 'စုံစုံ' || buttonText === 'မမ' || buttonText === 'စုံမ' || 
                 buttonText === 'မစုံ' || buttonText === 'စုံပူး' || buttonText === 'မပူး') {
            unittextView.textContent = buttonText;
            unitHighlightField(uniteditTxt2);
        }
        else if (buttonText === 'K') {
            unittextView.textContent = 'K';
            unitHighlightField(uniteditTxt1);
        }
        
        setTimeout(() => {
            unitButtonsScrollContainer.scrollTop = 0;
        }, 10);
    }
    
    function unitAddDigitToField(digit) {
        let currentField;
        
        if (uniteditTxt1.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = uniteditTxt1;
        } else if (uniteditTxt2.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = uniteditTxt2;
        } else if (uniteditTxt3.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = uniteditTxt3;
        } else if (unittextView.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = unittextView;
        } else {
            currentField = uniteditTxt1;
        }
        
        if (currentField === uniteditTxt1 && uniteditTxt1.textContent === 'ဂဏန်း') {
            uniteditTxt1.textContent = '';
        } else if (currentField === uniteditTxt2 && uniteditTxt2.textContent === 'ယူနစ်') {
            uniteditTxt2.textContent = '';
        } else if (currentField === uniteditTxt3 && uniteditTxt3.textContent === '') {
            uniteditTxt3.textContent = '';
        }
        
        if (currentField === uniteditTxt1) {
            let maxLength = 2;
            
            if (unitIsComboMode && (unitComboType === 'အခွေ' || unitComboType === 'ခွေပူး')) {
                maxLength = 10;
            } else if (unitIsSpecialMode && (unitSpecialType === 'အပါ' || unitSpecialType === 'ထိပ်' || 
                       unitSpecialType === 'ပိတ်' || unitSpecialType === 'ဘရိတ်' || 
                       unitSpecialType === 'စုံကပ်' || unitSpecialType === 'မကပ်' || 
                       unitSpecialType === 'စုံကပ်R' || unitSpecialType === 'မကပ်R' || unitSpecialType === 'ကပ်')) {
                maxLength = 1;
            }
            
            if (uniteditTxt1.textContent.length < maxLength) {
                uniteditTxt1.textContent += digit;
            }
            
            if (unitIsSpecialMode && (unitSpecialType === 'အပါ' || unitSpecialType === 'ထိပ်' || 
                unitSpecialType === 'ပိတ်' || unitSpecialType === 'ဘရိတ်' || 
                unitSpecialType === 'စုံကပ်' || unitSpecialType === 'မကပ်' || 
                unitSpecialType === 'စုံကပ်R' || unitSpecialType === 'မကပ်R' || unitSpecialType === 'ကပ်')) {
                if (uniteditTxt1.textContent.length >= 1) {
                    unitHighlightField(uniteditTxt2);
                    setTimeout(() => {
                        unitButtonsScrollContainer.scrollTop = 0;
                    }, 10);
                }
            }
            else if (unitIsComboMode && (unitComboType === 'အခွေ' || unitComboType === 'ခွေပူး')) {
            }
            else if (!unitIsSpecialMode && !unitIsComboMode && uniteditTxt1.textContent.length >= 2) {
                unitHighlightField(uniteditTxt2);
                setTimeout(() => {
                    unitButtonsScrollContainer.scrollTop = 0;
                }, 10);
            }
        } 
        else if (currentField === uniteditTxt2 && uniteditTxt2.textContent.length < 7) {
            uniteditTxt2.textContent += digit;
        }
        else if (currentField === uniteditTxt3 && uniteditTxt3.textContent.length < 7) {
            uniteditTxt3.textContent += digit;
        }
    }
    
    function unitProcessOKButton() {
        if (unitIsComboMode) {
            unitProcessComboMode();
            return;
        }
        
        if (unitIsSpecialMode && unitSpecialCases[unitSpecialType]) {
            unitProcessSpecialModeNoDigit();
            return;
        }
        
        if (unitIsSpecialMode && (unitSpecialType === 'အပါ' || unitSpecialType === 'ထိပ်' || 
            unitSpecialType === 'ပိတ်' || unitSpecialType === 'ဘရိတ်' || 
            unitSpecialType === 'စုံကပ်' || unitSpecialType === 'မကပ်' || 
            unitSpecialType === 'စုံကပ်R' || unitSpecialType === 'မကပ်R' || unitSpecialType === 'ကပ်')) {
            unitProcessSpecialModeWithDigit();
            return;
        }
        
        unitProcessRegularBet();
    }
    
    function unitProcessComboMode() {
        const digitsStr = uniteditTxt1.textContent;
        if (digitsStr === 'ဂဏန်း' || digitsStr === '' || digitsStr.length < 2) {
            alert('ဂဏန်းနှစ်လုံး (သို့) အထက်ထည့်ပါ');
            unitHighlightField(uniteditTxt1);
            return;
        }
        
        const amountText = uniteditTxt2.textContent;
        if (amountText === 'ယူနစ်' || amountText === '') {
            alert('ငွေပမာဏထည့်ပါ');
            unitHighlightField(uniteditTxt2);
            return;
        }
        
        const userInput = parseInt(amountText.replace(/[^0-9]/g, ''));
        if (isNaN(userInput) || userInput < 1) {
            alert('ငွေပမာဏမှားယွင်းနေပါသည် (အနည်းဆုံး 1)');
            unitHighlightField(uniteditTxt2);
            return;
        }
        
        const amount = userInput * 100;
        
        let numbers;
        if (unitComboType === 'အခွေ') {
            numbers = unitGenerateAhkwayNumbers(digitsStr);
        } else if (unitComboType === 'ခွေပူး') {
            numbers = unitGenerateKhwayPhuNumbers(digitsStr);
        }
        
        if (numbers && numbers.length > 0) {
            unitAddBetsToGlobalArray(numbers, amount, unitComboType);
            unitResetFields();
        }
    }
    
    function unitProcessSpecialModeNoDigit() {
        const amountText = uniteditTxt2.textContent;
        if (amountText === 'ယူနစ်' || amountText === '') {
            alert('ငွေပမာဏထည့်ပါ');
            unitHighlightField(uniteditTxt2);
            return;
        }
        
        const userInput = parseInt(amountText.replace(/[^0-9]/g, ''));
        if (isNaN(userInput) || userInput < 1) {
            alert('ငွေပမာဏမှားယွင်းနေပါသည် (အနည်းဆုံး 1)');
            unitHighlightField(uniteditTxt2);
            return;
        }
        
        const amount = userInput * 100;
        
        const numbers = unitSpecialCases[unitSpecialType];
        unitAddBetsToGlobalArray(numbers, amount, unitSpecialType);
        unitResetFields();
    }
    
    function unitProcessSpecialModeWithDigit() {
        const digitStr = uniteditTxt1.textContent;
        if (digitStr === 'ဂဏန်း' || digitStr === '') {
            alert('ဂဏန်းထည့်ပါ');
            unitHighlightField(uniteditTxt1);
            return;
        }
        
        const digit = parseInt(digitStr);
        if (isNaN(digit) || digit < 0 || digit > 9) {
            alert('ဂဏန်းမှားယွင်းနေပါသည် (0-9)');
            unitHighlightField(uniteditTxt1);
            return;
        }
        
        const amountText = uniteditTxt2.textContent;
        if (amountText === 'ယူနစ်' || amountText === '') {
            alert('ငွေပမာဏထည့်ပါ');
            unitHighlightField(uniteditTxt2);
            return;
        }
        
        const userInput = parseInt(amountText.replace(/[^0-9]/g, ''));
        if (isNaN(userInput) || userInput < 1) {
            alert('ငွေပမာဏမှားယွင်းနေပါသည် (အနည်းဆုံး 1)');
            unitHighlightField(uniteditTxt2);
            return;
        }
        
        const amount = userInput * 100;
        
        let reverseAmount = amount;
        if (unitReverseMode) {
            const reverseAmountText = uniteditTxt3.textContent;
            if (reverseAmountText !== '') {
                const reverseUserInput = parseInt(reverseAmountText.replace(/[^0-9]/g, ''));
                if (isNaN(reverseUserInput) || reverseUserInput < 1) {
                    alert('အာယူနစ်မှားယွင်းနေပါသည် (အနည်းဆုံး 1)');
                    unitHighlightField(uniteditTxt3);
                    return;
                }
                reverseAmount = reverseUserInput * 100;
            }
        }
        
        let numbers = [];
        if (unitSpecialType === 'အပါ') {
            numbers = unitGenerateApalNumbers(digit);
        } else if (unitSpecialType === 'ထိပ်') {
            if (!unitReverseMode) {
                numbers = unitGenerateFrontNumbers(digit);
            } else {
                const frontNumbers = unitGenerateFrontNumbers(digit);
                const backNumbers = unitGenerateBackNumbers(digit);
                
                unitAddBetsToGlobalArray(frontNumbers, amount, 'ထိပ်');
                unitAddBetsToGlobalArray(backNumbers, reverseAmount, 'ပိတ်');
                
                unitResetFields();
                return;
            }
        } else if (unitSpecialType === 'ပိတ်') {
            if (!unitReverseMode) {
                numbers = unitGenerateBackNumbers(digit);
            } else {
                const backNumbers = unitGenerateBackNumbers(digit);
                const frontNumbers = unitGenerateFrontNumbers(digit);
                
                unitAddBetsToGlobalArray(backNumbers, amount, 'ပိတ်');
                unitAddBetsToGlobalArray(frontNumbers, reverseAmount, 'ထိပ်');
                
                unitResetFields();
                return;
            }
        } else if (unitSpecialType === 'ဘရိတ်') {
            numbers = unitGenerateBreakNumbers(digit);
        } else if (unitSpecialType === 'စုံကပ်') {
            numbers = unitGenerateEvenKhatNumbers(digit);
        } else if (unitSpecialType === 'မကပ်') {
            numbers = unitGenerateOddKhatNumbers(digit);
        } else if (unitSpecialType === 'စုံကပ်R') {
            numbers = unitGenerateEvenKhatRNumbers(digit);
        } else if (unitSpecialType === 'မကပ်R') {
            numbers = unitGenerateOddKhatRNumbers(digit);
        } else if (unitSpecialType === 'ကပ်') {
            numbers = unitGenerateKhatNumbers(digit);
        }
        
        if (!unitReverseMode) {
            if (numbers.length > 0) {
                unitAddBetsToGlobalArray(numbers, amount, unitSpecialType);
                unitResetFields();
            }
        } else {
            unitAddBetsToGlobalArray(numbers, amount, unitSpecialType + ' (Main)');
            
            let reverseNumbers = [];
            if (unitSpecialType === 'အပါ') {
                reverseNumbers = numbers;
            } else if (unitSpecialType === 'ဘရိတ်') {
                reverseNumbers = numbers;
            }
            
            if (reverseNumbers.length > 0) {
                unitAddBetsToGlobalArray(reverseNumbers, reverseAmount, unitSpecialType + ' (R)');
            }
            
            unitResetFields();
        }
    }
    
    function unitProcessRegularBet() {
        const numberText = uniteditTxt1.textContent;
        if (numberText === 'ဂဏန်း' || numberText === '') {
            alert('ဂဏန်းထည့်ပါ');
            unitHighlightField(uniteditTxt1);
            return;
        }
        
        const amountText = uniteditTxt2.textContent;
        if (amountText === 'ယူနစ်' || amountText === '') {
            alert('ငွေပမာဏထည့်ပါ');
            unitHighlightField(uniteditTxt2);
            return;
        }
        
        const userInput = parseInt(amountText.replace(/[^0-9]/g, ''));
        if (isNaN(userInput) || userInput < 1) {
            alert('ငွေပမာဏမှားယွင်းနေပါသည် (အနည်းဆုံး 1)');
            unitHighlightField(uniteditTxt2);
            return;
        }
        
        const amount = userInput * 100;
        
        let reverseAmount = amount;
        if (unitReverseMode) {
            const reverseAmountText = uniteditTxt3.textContent;
            if (reverseAmountText !== '') {
                const reverseUserInput = parseInt(reverseAmountText.replace(/[^0-9]/g, ''));
                if (isNaN(reverseUserInput) || reverseUserInput < 1) {
                    alert('အာယူနစ်မှားယွင်းနေပါသည် (အနည်းဆုံး 1)');
                    unitHighlightField(uniteditTxt3);
                    return;
                }
                reverseAmount = reverseUserInput * 100;
            }
        }
        
        const numbers = unitParseNumberInput(numberText);
        if (numbers.length === 0) {
            alert('ဂဏန်းမှားယွင်းနေပါသည်');
            unitHighlightField(uniteditTxt1);
            return;
        }
        
        if (!unitReverseMode) {
            unitAddBetsToGlobalArray(numbers, amount, 'Regular');
        } else {
            unitAddBetsToGlobalArray(numbers, amount, 'Reverse(M)');
            
            numbers.forEach(num => {
                const revNum = unitReverseNumber(num);
                if (revNum !== num) {
                    unitAddSingleBetToGlobalArray(revNum, reverseAmount, 'Reverse(R)');
                }
            });
        }
        
        unitResetFields();
    }
    
    function unitAddBetsToGlobalArray(numbers, amount, type) {
        numbers.forEach(num => {
            unitAddSingleBetToGlobalArray(num, amount, type);
        });
    }
    
    function unitAddSingleBetToGlobalArray(num, amount, type) {
        let targetBets;
        let targetTotal;
        
        if (typeof bets !== 'undefined') {
            targetBets = bets;
            targetTotal = totalAmount;
        } else if (window.bets) {
            targetBets = window.bets;
            targetTotal = window.totalAmount;
        } else {
            targetBets = [];
            targetTotal = 0;
            window.bets = targetBets;
            window.totalAmount = targetTotal;
        }
        
        const newBet = {
            number: num,
            amount: amount,
            display: num.toString().padStart(2, '0'),
            type: type
        };
        
        targetBets.push(newBet);
        targetTotal += amount;
        
        if (typeof bets !== 'undefined') {
            bets = targetBets;
            totalAmount = targetTotal;
        }
        
        window.bets = targetBets;
        window.totalAmount = targetTotal;
        
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        } else {
            unitUpdateDisplayDirectly();
        }
    }
    
    function unitUpdateDisplayDirectly() {
        const betList = document.getElementById('betList');
        const totalDisplay = document.getElementById('totalAmount');
        const countDisplay = document.getElementById('listCount');
        
        if (!betList || !totalDisplay || !countDisplay) return;
        
        const currentBets = window.bets || [];
        const currentTotal = window.totalAmount || 0;
        
        if (currentBets.length === 0) {
            betList.innerHTML = '<div class="empty-message">လောင်းကြေးမရှိသေးပါ</div>';
        } else {
            let html = '';
            currentBets.forEach((bet, index) => {
                html += `
                <div class="bet-item">
                    <div class="bet-number">${bet.display}</div>
                    <div class="bet-amount">${bet.amount.toLocaleString()}</div>
                    <div class="bet-type">${bet.type}</div>
                    <button class="delete-btn" onclick="deleteGlobalBet(${index})">ဖျက်</button>
                </div>
                `;
            });
            betList.innerHTML = html;
        }
        
        totalDisplay.textContent = currentTotal.toLocaleString();
        countDisplay.textContent = currentBets.length;
    }
    
    function unitParseNumberInput(input) {
        const numbers = [];
        const cleanInput = input.replace(/[^0-9\/\-]/g, '');
        
        if (cleanInput.includes('/') || cleanInput.includes('-')) {
            const parts = cleanInput.split(/[\/\-]/);
            parts.forEach(part => {
                if (part.length === 1 || part.length === 2) {
                    const num = parseInt(part);
                    if (!isNaN(num) && num >= 0 && num <= 99) {
                        numbers.push(num);
                    }
                }
            });
        } else {
            if (input.length === 1 || input.length === 2) {
                const num = parseInt(input);
                if (!isNaN(num) && num >= 0 && num <= 99) {
                    numbers.push(num);
                }
            }
        }
        
        return numbers;
    }
    
    function unitGenerateFrontNumbers(digit) {
        const numbers = [];
        for (let i = 0; i <= 9; i++) {
            numbers.push(parseInt(digit.toString() + i.toString()));
        }
        return numbers;
    }
    
    function unitGenerateBackNumbers(digit) {
        const numbers = [];
        for (let i = 0; i <= 9; i++) {
            numbers.push(parseInt(i.toString() + digit.toString()));
        }
        return numbers;
    }
    
    function unitGenerateBreakNumbers(digit) {
        const numbers = [];
        for (let n = 0; n <= 99; n++) {
            const tens = Math.floor(n / 10);
            const units = n % 10;
            const sum = tens + units;
            if (sum % 10 === digit) {
                numbers.push(n);
            }
        }
        return numbers;
    }
    
    function unitGenerateApalNumbers(digit) {
        const numbers = [];
        const digitStr = digit.toString();
        for (let n = 0; n <= 99; n++) {
            const numStr = n.toString().padStart(2, '0');
            if (numStr.includes(digitStr)) {
                numbers.push(n);
            }
        }
        return numbers;
    }
    
    function unitGenerateEvenKhatNumbers(digit) {
        const numbers = [];
        const evenDigits = [0, 2, 4, 6, 8];
        for (const evenDigit of evenDigits) {
            numbers.push(parseInt(digit.toString() + evenDigit.toString()));
        }
        return numbers;
    }
    
    function unitGenerateOddKhatNumbers(digit) {
        const numbers = [];
        const oddDigits = [1, 3, 5, 7, 9];
        for (const oddDigit of oddDigits) {
            numbers.push(parseInt(digit.toString() + oddDigit.toString()));
        }
        return numbers;
    }
    
    function unitGenerateEvenKhatRNumbers(digit) {
        const numbers = [];
        const evenDigits = [0, 2, 4, 6, 8];
        for (const evenDigit of evenDigits) {
            numbers.push(parseInt(digit.toString() + evenDigit.toString()));
            numbers.push(parseInt(evenDigit.toString() + digit.toString()));
        }
        return [...new Set(numbers)];
    }
    
    function unitGenerateOddKhatRNumbers(digit) {
        const numbers = [];
        const oddDigits = [1, 3, 5, 7, 9];
        for (const oddDigit of oddDigits) {
            numbers.push(parseInt(digit.toString() + oddDigit.toString()));
            numbers.push(parseInt(oddDigit.toString() + digit.toString()));
        }
        return [...new Set(numbers)];
    }
    
    function unitGenerateKhatNumbers(digit) {
        const numbers = [];
        for (let i = 0; i <= 9; i++) {
            numbers.push(parseInt(digit.toString() + i.toString()));
            numbers.push(parseInt(i.toString() + digit.toString()));
        }
        return [...new Set(numbers)];
    }
    
    function unitGenerateCombinationsFromArray(arr, k) {
        const combinations = [];
        
        function combine(start, current) {
            if (current.length === k) {
                combinations.push([...current]);
                return;
            }
            
            for (let i = start; i < arr.length; i++) {
                current.push(arr[i]);
                combine(i + 1, current);
                current.pop();
            }
        }
        
        combine(0, []);
        return combinations;
    }
    
    function unitGenerateAhkwayNumbers(digitsStr) {
        const numbers = new Set();
        const digits = digitsStr.split('');
        
        const combos = unitGenerateCombinationsFromArray(digits, 2);
        
        combos.forEach(combo => {
            const num1 = parseInt(combo[0] + combo[1]);
            const num2 = parseInt(combo[1] + combo[0]);
            numbers.add(num1);
            numbers.add(num2);
        });
        
        return Array.from(numbers);
    }
    
    function unitGenerateKhwayPhuNumbers(digitsStr) {
        const numbers = new Set();
        const digits = digitsStr.split('');
        
        const combos = unitGenerateCombinationsFromArray(digits, 2);
        
        combos.forEach(combo => {
            const num1 = parseInt(combo[0] + combo[1]);
            const num2 = parseInt(combo[1] + combo[0]);
            numbers.add(num1);
            numbers.add(num2);
        });
        
        const uniqueDigits = [...new Set(digits)];
        uniqueDigits.forEach(digit => {
            const doubleNum = parseInt(digit + digit);
            numbers.add(doubleNum);
        });
        
        return Array.from(numbers);
    }
    
    function unitReverseNumber(n) {
        const s = n.toString().padStart(2, '0');
        return parseInt(s.split('').reverse().join(''));
    }
    
    window.unitDeleteGlobalBet = function(index) {
        if (!confirm('ဖျက်မှာသေချာပါသလား?')) return;
        
        if (window.bets && window.bets[index]) {
            const deleted = window.bets[index];
            window.totalAmount -= deleted.amount;
            window.bets.splice(index, 1);
            
            if (typeof bets !== 'undefined') {
                bets = window.bets;
                totalAmount = window.totalAmount;
            }
            
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            } else {
                unitUpdateDisplayDirectly();
            }
        }
    };
});

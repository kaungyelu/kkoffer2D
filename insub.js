
// စာရိုက်ပြမှုအတွက် - စာကြောင်းအလိုက် ကြာချိန်သတ်မှတ်
const messages = [
    { text: "မဂ်လာပါ ခင်ဗျာ", duration: 5000, type: "short" },
    { text: "2Dစာရင်းအင်းများကို", duration: 6000, type: "medium" },
    { text: "လွယ်ကူမြန်ဆန်စွာ လုပ်ဆောင်နိုင်ရန်", duration: 8000, type: "long" },
    { text: "KK-user မှ ဖန်တီးထားခြင်းဖြစ်ပါသည်", duration: 9000, type: "long" },
    { text: "ယခု Webappအား အသုံးပြုရန်", duration: 7000, type: "medium" },
    { text: "သုံးသိန်းငါးသောင်း ကျပ် (၃၅၀၀၀၀ကျပ်)တိတိ ကျသင့်ပါမည်", duration: 10000, type: "long" },
    { text: "Server ကြေးပေးသွင်းရန်မှာ", duration: 7000, type: "medium" },
    { text: "အလုပ်ပေါ်မူတည်ပါတယ် Data မများပါက မလိုအပ်နိုင်", duration: 9000, type: "long" },
    { text: "လိုအပ်လာလျင်လည်း ပြောကြားပေးပါမည်", duration: 8000, type: "medium" }
];

let currentMessage = 0;
let autoLoginChecked = false;

// Auto login စစ်ဆေးခြင်း
async function checkAutoLogin() {
    try {
        const savedName = localStorage.getItem('name');
        const savedPassword = localStorage.getItem('pw');
        
        if (savedName && savedPassword) {
            const isValid = await authenticateUser(savedName, savedPassword);
            if (isValid) {
                // Auto login အောင်မြင်ရင် ချက်ချင်းခေါ်
                window.location.href = 'a.html';
                return true;
            } else {
                // Invalid credentials ရှိရင် ဖျက်ပစ်
                localStorage.removeItem('name');
                localStorage.removeItem('pw');
            }
        }
    } catch (error) {
        console.error('Auto login check error:', error);
    }
    return false;
}

// User authentication function
async function authenticateUser(name, password) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/Login?select=*&name=eq.${encodeURIComponent(name)}&pw=eq.${encodeURIComponent(password)}`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const loginData = await response.json();
        return loginData.length > 0 && loginData[0].name === name && loginData[0].pw === password;
    } catch (error) {
        console.error('Authentication error:', error);
        return false;
    }
}

// စာရိုက်ပြမှုစတင်
async function startTypingAnimation() {
    // ပထမဆုံး auto login စစ်ဆေး
    if (!autoLoginChecked) {
        autoLoginChecked = true;
        const shouldRedirect = await checkAutoLogin();
        if (shouldRedirect) {
            return; // Redirect ဖြစ်သွားရင် ရပ်လိုက်
        }
    }
    
    if (currentMessage >= messages.length) {
        // စာကြောင်းအားလုံးပြပြီးရင် လော့ဂင်ဖောင်းပြ
        document.getElementById('typingContainer').style.opacity = '0';
        document.getElementById('typingContainer').style.transition = 'opacity 1s ease';
        
        setTimeout(() => {
            document.getElementById('typingContainer').style.display = 'none';
            document.getElementById('loginCard').style.display = 'block';
            
            // Saved credentials တွေကို input ထဲထည့်
            const savedName = localStorage.getItem('name');
            const savedPassword = localStorage.getItem('pw');
            if (savedName) document.getElementById('nameInput').value = savedName;
            if (savedPassword) document.getElementById('passwordInput').value = savedPassword;
        }, 1000);
        return;
    }
    
    const message = messages[currentMessage];
    const typingBox = document.getElementById('typingBox');
    const messageDiv = document.createElement('div');
    
    // စာကြောင်းအလိုက် class သတ်မှတ်
    messageDiv.className = `typing-line ${message.type}`;
    messageDiv.textContent = message.text;
    
    typingBox.innerHTML = '';
    typingBox.appendChild(messageDiv);
    
    currentMessage++;
    
    // စာကြောင်းအရှည်အလိုက် ကြာချိန်သတ်မှတ် (အနည်းဆုံး 5000ms)
    const displayTime = Math.max(message.duration, 5000);
    setTimeout(startTypingAnimation, displayTime);
}

// Login process function
async function processLogin() {
    const name = document.getElementById('nameInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    const errorMsg = document.getElementById('errorMsg');
    const statusLine = document.getElementById('statusLine');
    
    // အမှားပြမှုရှင်းလင်း
    errorMsg.classList.remove('show');
    errorMsg.textContent = '';
    statusLine.style.width = '0%';
    statusLine.classList.remove('active');
    
    // အကွက်လွတ်စစ်ဆေး
    if (!name || !password) {
        errorMsg.textContent = 'Name နှင့် Password ထည့်သွင်းပါ';
        errorMsg.classList.add('show');
        return;
    }
    
    // လော့ဂင်အခြေအနေပြ
    statusLine.style.width = '100%';
    statusLine.classList.add('active');
    
    try {
        // Authenticate user
        const isValid = await authenticateUser(name, password);
        
        if (isValid) {
            // အောင်မြင်ရင် save လုပ်ပြီး redirect
            localStorage.setItem('name', name);
            localStorage.setItem('pw', password);
            
            setTimeout(() => {
                statusLine.classList.remove('active');
                window.location.href = 'a.html';
            }, 1000);
        } else {
            // မအောင်မြင်ရင်
            statusLine.style.width = '0%';
            statusLine.classList.remove('active');
            errorMsg.textContent = 'Name သို့မဟုတ် Password မှားနေပါသည်';
            errorMsg.classList.add('show');
            
            // Wrong credentials ဖျက်ပစ်
            localStorage.removeItem('name');
            localStorage.removeItem('pw');
            
            // Input fields ရှင်းလင်း
            document.getElementById('nameInput').value = '';
            document.getElementById('passwordInput').value = '';
        }
    } catch (error) {
        // Network error ဖြစ်ရင်
        statusLine.style.width = '0%';
        statusLine.classList.remove('active');
        errorMsg.textContent = 'Network error. Please check your connection.';
        errorMsg.classList.add('show');
        console.error('Login error:', error);
    }
}

// DOM Ready ဖြစ်တဲ့အခါ
document.addEventListener('DOMContentLoaded', function() {
    // စာရိုက်ပြမှုစတင်
    setTimeout(startTypingAnimation, 1000);
    
    // လော့ဂင်ခလုတ်ကို event listener ထည့်
    document.getElementById('loginBtn').addEventListener('click', processLogin);
    
    // Password input မှာ Enter နှိပ်ရင်
    document.getElementById('passwordInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            processLogin();
        }
    });
    
    // Input fields မှာ focus ရောက်ရင် effect
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
});

// Page visibility change ကို handle
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page ပြန်ပေါ်လာရင် auto login ပြန်စစ်
        checkAutoLogin();
    }
});

// Browser tab/window ပိတ်ခါနီး သို့မဟုတ် refresh လုပ်ခါနီး
window.addEventListener('beforeunload', function() {
    // Optional: တစ်ခုခုလုပ်ချင်ရင် ဒီမှာထည့်
});

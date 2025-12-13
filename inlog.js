

    
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

            const Login = await response.json();
            return Login.length > 0 && Login[0].name === name && Login[0].pw === password;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }

    async function checkAutoLogin() {
        const savedName = localStorage.getItem('name');
        const savedPassword = localStorage.getItem('pw');
        
        if (savedName && savedPassword) {
            const isValid = await authenticateUser(savedName, savedPassword);
            if (isValid) {
                window.location.href = 'a.html';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const nameInput = document.getElementById('nameInput');
        const passwordInput = document.getElementById('passwordInput');
        const saveBtn = document.getElementById('saveBtn');
        const statusIndicator = document.getElementById('statusIndicator');
        const errorMessage = document.getElementById('errorMessage');

        checkAutoLogin();

        const savedName = localStorage.getItem('name');
        const savedPassword = localStorage.getItem('pw');

        if (savedName) nameInput.value = savedName;
        if (savedPassword) passwordInput.value = savedPassword;

        saveBtn.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            const password = passwordInput.value.trim();

            errorMessage.textContent = '';
            errorMessage.classList.remove('show');
            statusIndicator.classList.remove('error');

            if (!name || !password) {
                errorMessage.textContent = 'Name နှင့် Password ထည့်သွင်းပါ';
                errorMessage.classList.add('show');
                return;
            }

            localStorage.setItem('name', name);
            localStorage.setItem('pw', password);

            statusIndicator.classList.add('active');

            const isValid = await authenticateUser(name, password);

            if (isValid) {
                setTimeout(() => {
                    statusIndicator.classList.remove('active');
                    window.location.href = 'a.html';
                }, 1000);
            } else {
                errorMessage.textContent = 'Name သို့မဟုတ် Password မှားနေပါသည်';
                errorMessage.classList.add('show');
                statusIndicator.classList.remove('active');
                statusIndicator.classList.add('error');
                localStorage.removeItem('name');
                localStorage.removeItem('pw');
            }
        });

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });
    });

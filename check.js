// check.js
(async function() {
    const savedName = localStorage.getItem('name');
    const savedPassword = localStorage.getItem('pw');
    
    if (!savedName || !savedPassword) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const response = await fetch(
            `https://uegrqmyswaxffiejxnoi.supabase.co/rest/v1/Login?name=eq.${encodeURIComponent(savedName)}&pw=eq.${encodeURIComponent(savedPassword)}`,
            {
                headers: {
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZ3JxbXlzd2F4ZmZpZWp4bm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MjU2NjYsImV4cCI6MjA4MTIwMTY2Nn0.OaYtJvafd4b70KbnveJtTHX_8mpsUbfwZkaCZoQrEx4',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZ3JxbXlzd2F4ZmZpZWp4bm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MjU2NjYsImV4cCI6MjA4MTIwMTY2Nn0.OaYtJvafd4b70KbnveJtTHX_8mpsUbfwZkaCZoQrEx4'
                }
            }
        );
        
        if (!response.ok) {
            window.location.href = 'index.html';
            return;
        }
        
        const Login = await response.json();
        
        if (!Login || Login.length === 0) {
            window.location.href = 'index.html';
            return;
        }
        
        if (Login[0].name !== savedName || Login[0].pw !== savedPassword) {
            window.location.href = 'index.html';
            return;
        }
        
        // Authentication successful, continue loading the page
        console.log('Authentication successful');
        
    } catch (error) {
        console.error('Error:', error);
        window.location.href = 'index.html';
    }
})();

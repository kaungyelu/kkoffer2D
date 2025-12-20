    let editingId = null;
        let originalName = '';
        
        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
            try {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('Supabase initialized for Name table');
                loadData();
                setupEventListeners();
                ensureAdminExists();
            } catch (error) {
                console.error('Failed to initialize Supabase:', error);
                showMessage('Database connection failed. Please refresh.', true);
            }
        });
        
        // Ensure Admin record exists
        async function ensureAdminExists() {
            try {
                const { data, error } = await supabase
                    .from('Name')
                    .select('*')
                    .eq('name', 'Admin')
                    .limit(1);
                
                if (error) throw error;
                
                if (!data || data.length === 0) {
                    const { error: insertError } = await supabase
                        .from('Name')
                        .insert([
                            {
                                name: 'Admin',
                                password: 'admin123',
                                com: 15,
                                za: 80
                            }
                        ]);
                    
                    if (insertError) throw insertError;
                    console.log('Admin record created');
                }
            } catch (error) {
                console.error('Error ensuring Admin exists:', error);
            }
        }
        
        // Load data from Supabase
        async function loadData() {
            try {
                const { data, error } = await supabase
                    .from('Name')
                    .select('*')
                    .order('name', { ascending: true });
                
                if (error) throw error;
                
                renderList(data || []);
            } catch (error) {
                console.error('Error loading data:', error);
                showMessage('ဒေတာဖတ်ရှုရာတွင် အမှားဖြစ်နေ', true);
            }
        }
        
        // Show message
        function showMessage(text, isError = false) {
            const msg = document.getElementById('message');
            msg.textContent = text;
            msg.className = 'message' + (isError ? ' error' : ' success');
            msg.style.display = 'block';
            setTimeout(() => {
                msg.style.display = 'none';
            }, 3000);
        }
        
        // Toggle password visibility
        function togglePasswordVisibility(button, id) {
            const passwordCell = document.getElementById('password-value-' + id);
            const password = button.getAttribute('data-password');
            
            if (passwordCell.textContent === '••••••') {
                passwordCell.textContent = password || '(none)';
                button.textContent = 'Hide';
            } else {
                passwordCell.textContent = '••••••';
                button.textContent = 'Show';
            }
        }
        
        // Add or Update item
        async function saveItem() {
            const nameInput = document.getElementById('name');
            const passwordInput = document.getElementById('password');
            const comInput = document.getElementById('com');
            const zaInput = document.getElementById('za');
            
            const name = nameInput.value.trim();
            const password = passwordInput.value.trim();
            const com = comInput.value.trim();
            const za = zaInput.value.trim();
            
            if (!name || !com || !za) {
                showMessage('အမည်၊ ကော်နှင့်အဆ ဖြည့်ရန်', true);
                return;
            }
            
            const comNum = parseInt(com);
            const zaNum = parseInt(za);
            
            if (isNaN(comNum) || isNaN(zaNum)) {
                showMessage('ကော်နှင့်အဆကို ဂဏန်းဖြည့်ရန်', true);
                return;
            }
            
            try {
                const passwordToSave = password === '' ? null : password;
                
                if (editingId) {
                    if (name !== originalName) {
                        const { data: existing } = await supabase
                            .from('Name')
                            .select('*')
                            .eq('name', name)
                            .neq('id', editingId)
                            .limit(1);
                        
                        if (existing && existing.length > 0) {
                            showMessage('ဤအမည်ရှိပြီးသား', true);
                            return;
                        }
                    }
                    
                    const updateData = {
                        name: name,
                        com: comNum,
                        za: zaNum
                    };
                    
                    if (passwordToSave !== null) {
                        updateData.password = passwordToSave;
                    }
                    
                    const { error } = await supabase
                        .from('Name')
                        .update(updateData)
                        .eq('id', editingId);
                    
                    if (error) throw error;
                    
                    editingId = null;
                    originalName = '';
                    document.getElementById('addBtn').textContent = 'ရေးထည့်မည်';
                    showMessage('ပြင်ဆင်ပြီး');
                } else {
                    const { data: existing } = await supabase
                        .from('Name')
                        .select('*')
                        .eq('name', name)
                        .limit(1);
                    
                    if (existing && existing.length > 0) {
                        showMessage('ဤအမည်ရှိပြီးသား', true);
                        return;
                    }
                    
                    const insertData = {
                        name: name,
                        com: comNum,
                        za: zaNum
                    };
                    
                    if (passwordToSave !== null) {
                        insertData.password = passwordToSave;
                    }
                    
                    const { error } = await supabase
                        .from('Name')
                        .insert([insertData]);
                    
                    if (error) throw error;
                    
                    showMessage('ထည့်သွင်းပြီး');
                }
                
                nameInput.value = '';
                passwordInput.value = '';
                comInput.value = '';
                zaInput.value = '';
                nameInput.focus();
                
                await loadData();
                
            } catch (error) {
                console.error('Error saving data:', error);
                showMessage('သိမ်းဆည်းရာတွင် အမှားဖြစ်နေ', true);
            }
        }
        
        // Edit item
        async function editItem(id) {
            try {
                const { data, error } = await supabase
                    .from('Name')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                
                if (data) {
                    document.getElementById('name').value = data.name;
                    document.getElementById('password').value = data.password || '';
                    document.getElementById('com').value = data.com;
                    document.getElementById('za').value = data.za;
                    editingId = id;
                    originalName = data.name;
                    document.getElementById('addBtn').textContent = 'ပြင်ဆင်မည်';
                    document.getElementById('name').focus();
                }
            } catch (error) {
                console.error('Error loading item for edit:', error);
                showMessage('တည်းဖြတ်ရာတွင် အမှားဖြစ်နေ', true);
            }
        }
        
        // Delete item
        async function deleteItem(id, name) {
            if (name === 'Admin') {
                showMessage('Admin ကိုဖျက်၍မရပါ', true);
                return;
            }
            
            if (!confirm(`"${name}" ကိုဖျက်မှာသေချာလား?`)) {
                return;
            }
            
            try {
                const { error } = await supabase
                    .from('Name')
                    .delete()
                    .eq('id', id);
                
                if (error) throw error;
                
                if (editingId === id) {
                    editingId = null;
                    originalName = '';
                    document.getElementById('addBtn').textContent = 'ရေးထည့်မည်';
                    document.getElementById('name').value = '';
                    document.getElementById('password').value = '';
                    document.getElementById('com').value = '';
                    document.getElementById('za').value = '';
                }
                
                showMessage('ဖျက်ပြီးပါပြီ');
                await loadData();
                
            } catch (error) {
                console.error('Error deleting item:', error);
                showMessage('ဖျက်ရာတွင် အမှားဖြစ်နေ', true);
            }
        }
        
        // Render list
        function renderList(items) {
            const listView = document.getElementById('listView');
            
            if (!items || items.length === 0) {
                listView.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">မည်သည့်အချက်အလက်မျှမရှိသေးပါ</div>';
                return;
            }
            
            listView.innerHTML = '';
            
            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'list-row';
                
                const deleteDisabled = item.name === 'Admin' ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : '';
                const password = item.password || '';
                const displayPassword = password === '' ? '(none)' : '••••••';
                const toggleButton = password !== '' ? 
                    `<button class="password-toggle" onclick="togglePasswordVisibility(this, '${item.id}')" data-password="${password}">Show</button>` : 
                    '';
                
                row.innerHTML = `
                    <div class="col-name">${item.name}</div>
                    <div class="col-password">
                        <span class="password-value" id="password-value-${item.id}">${displayPassword}</span>
                        ${toggleButton}
                    </div>
                    <div class="col-course">${item.com}</div>
                    <div class="col-level">${item.za}</div>
                    <div class="col-actions">
                        <div class="actions">
                            <button class="edit-btn" onclick="editItem('${item.id}')">edit</button>
                            <button class="delete-btn" onclick="deleteItem('${item.id}', '${item.name}')" ${deleteDisabled}>delete</button>
                        </div>
                    </div>
                `;
                
                listView.appendChild(row);
            });
        }
        
        // Setup event listeners
        function setupEventListeners() {
            document.getElementById('addBtn').addEventListener('click', saveItem);
            
            document.getElementById('name').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') document.getElementById('password').focus();
            });
            
            document.getElementById('password').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') document.getElementById('com').focus();
            });
            
            document.getElementById('com').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') document.getElementById('za').focus();
            });
            
            document.getElementById('za').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveItem();
            });
        }
        
        // Make functions available globally
        window.editItem = editItem;
        window.deleteItem = deleteItem;
        window.togglePasswordVisibility = togglePasswordVisibility;
        
        // Set up real-time updates
        setTimeout(() => {
            supabase
                .channel('names-channel')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'Name' },
                    () => {
                        console.log('Names updated, reloading...');
                        loadData();
                    }
                )
                .subscribe();
        }, 1000);

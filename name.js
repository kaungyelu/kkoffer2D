    
        
        // Initialize Supabase client
        let supabase;
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
                    // Create Admin record
                    const { error: insertError } = await supabase
                        .from('Name')
                        .insert([
                            {
                                name: 'Admin',
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
        
        // Add or Update item
        async function saveItem() {
            const nameInput = document.getElementById('name');
            const comInput = document.getElementById('com');
            const zaInput = document.getElementById('za');
            
            const name = nameInput.value.trim();
            const com = comInput.value.trim();
            const za = zaInput.value.trim();
            
            if (!name || !com || !za) {
                showMessage('အားလုံးဖြည့်ရန်', true);
                return;
            }
            
            const comNum = parseInt(com);
            const zaNum = parseInt(za);
            
            if (isNaN(comNum) || isNaN(zaNum)) {
                showMessage('ကော်နှင့်အဆကို ဂဏန်းဖြည့်ရန်', true);
                return;
            }
            
            try {
                if (editingId) {
                    // Check if name changed and already exists
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
                    
                    // Update existing record
                    const { error } = await supabase
                        .from('Name')
                        .update({
                            name: name,
                            com: comNum,
                            za: zaNum
                        })
                        .eq('id', editingId);
                    
                    if (error) throw error;
                    
                    editingId = null;
                    originalName = '';
                    document.getElementById('addBtn').textContent = 'ရေးထည့်မည်';
                    showMessage('ပြင်ဆင်ပြီး');
                } else {
                    // Check if name already exists
                    const { data: existing } = await supabase
                        .from('Name')
                        .select('*')
                        .eq('name', name)
                        .limit(1);
                    
                    if (existing && existing.length > 0) {
                        showMessage('ဤအမည်ရှိပြီးသား', true);
                        return;
                    }
                    
                    // Insert new record
                    const { error } = await supabase
                        .from('Name')
                        .insert([
                            {
                                name: name,
                                com: comNum,
                                za: zaNum
                            }
                        ]);
                    
                    if (error) throw error;
                    
                    showMessage('ထည့်သွင်းပြီး');
                }
                
                // Clear form and reload data
                nameInput.value = '';
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
        function editItem(id) {
            // Load current data to find the item
            supabase
                .from('Name')
                .select('*')
                .eq('id', id)
                .single()
                .then(({ data, error }) => {
                    if (error) throw error;
                    
                    if (data) {
                        document.getElementById('name').value = data.name;
                        document.getElementById('com').value = data.com;
                        document.getElementById('za').value = data.za;
                        editingId = id;
                        originalName = data.name;
                        document.getElementById('addBtn').textContent = 'ပြင်ဆင်မည်';
                        document.getElementById('name').focus();
                    }
                })
                .catch(error => {
                    console.error('Error loading item for edit:', error);
                });
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
                
                // If we were editing this item, clear the form
                if (editingId === id) {
                    editingId = null;
                    originalName = '';
                    document.getElementById('addBtn').textContent = 'ရေးထည့်မည်';
                    document.getElementById('name').value = '';
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
                
                row.innerHTML = `
                    <div class="col-name">${item.name}</div>
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
                if (e.key === 'Enter') document.getElementById('com').focus();
            });
            
            document.getElementById('com').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') document.getElementById('za').focus();
            });
            
            document.getElementById('za').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveItem();
            });
        }
        
        // Make functions available globally for onclick events
        window.editItem = editItem;
        window.deleteItem = deleteItem;
        
        // Set up real-time updates
        setTimeout(() => {
            if (supabase) {
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
            }
        }, 1000);
    

// 計劃相關功能
let plans = [];
let currentPlanPhotos = []; // 暫存目前計劃的照片
let editingIndex = -1; // 追蹤編輯中的計劃索引
let sortOrder = 'asc'; // 新增變數來追蹤排序順序
let currentView = 'list'; // 新增變數來追蹤當前視圖

// 視窗控制
function showElement(elementId) {
    console.log('顯示元素:', elementId);
    // 隱藏所有主要區塊
    ['plan-form', 'info-container', 'edit-plan'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
    // 顯示指定區塊
    const targetElement = document.getElementById(elementId);
    if (targetElement) {
        targetElement.style.display = 'block';
    }
}

// 隱藏元素的函數
function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none'; // 隱藏元素
    }
}

// 初始化事件監聽
function initializeEventListeners() {
    console.log('初始化事件監聽器');

    // 主要按鈕事件
    document.getElementById('create-plan').addEventListener('click', function() {
        console.log('點擊建立計劃按鈕');
        showElement('plan-form');
    });

    document.getElementById('view-info').addEventListener('click', function() {
        console.log('點擊查看資訊按鈕');
        showElement('info-container');
        displayPlans();
    });

    // 計劃表單照片預覽
    document.getElementById('plan-photos').addEventListener('change', function(e) {
        const photoPreview = document.querySelector('.plan-photo-preview');
        photoPreview.innerHTML = '';
        currentPlanPhotos = [];

        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                photoPreview.appendChild(img);
                currentPlanPhotos.push({
                    src: e.target.result,
                    name: file.name
                });
            };

            reader.readAsDataURL(file);
        });
    });

    // 儲存計劃
    document.getElementById('save-plan').addEventListener('click', function() {
        const planData = {
            name: document.getElementById('plan-name').value,
            date: document.getElementById('plan-date').value,
            duration: document.getElementById('plan-duration').value,
            destination: document.getElementById('plan-destination').value,
            budget: document.getElementById('plan-budget').value,
            notes: document.getElementById('plan-notes').value,
            photos: currentPlanPhotos
        };

        // 表單驗證
        const requiredFields = ['name', 'date', 'duration', 'destination', 'budget'];
        const emptyFields = requiredFields.filter(field => !planData[field]);
        
        if (emptyFields.length > 0) {
            alert('請填寫所有必填欄位');
            return;
        }

        // 檢查是否重複儲存
        const isDuplicate = plans.some(plan => plan.name === planData.name && plan.date === planData.date);
        if (isDuplicate) {
            alert('此計劃已存在，請使用不同的名稱或日期。');
            return;
        }

        if (editingIndex > -1) {
            plans[editingIndex] = planData;
            editingIndex = -1;
        } else {
            plans.push(planData);
        }
        
        savePlansToLocalStorage();
        
        // 清空表單
        document.getElementById('plan-name').value = '';
        document.getElementById('plan-date').value = '';
        document.getElementById('plan-duration').value = '';
        document.getElementById('plan-destination').value = '';
        document.getElementById('plan-budget').value = '';
        document.getElementById('plan-notes').value = '';
        document.querySelector('.plan-photo-preview').innerHTML = '';
        currentPlanPhotos = [];
        
        // 切換回旅遊計劃資訊
        showElement('info-container');
        displayPlans();
    });

    // 取消按鈕
    document.getElementById('cancel-plan').addEventListener('click', function() {
        document.getElementById('plan-name').value = '';
        document.getElementById('plan-date').value = '';
        document.getElementById('plan-duration').value = '';
        document.getElementById('plan-destination').value = '';
        document.getElementById('plan-budget').value = '';
        document.getElementById('plan-notes').value = '';
        document.querySelector('.plan-photo-preview').innerHTML = '';
        currentPlanPhotos = [];
        showElement('info-container');
    });

    // 編輯器工具列
    const editorToolbar = document.querySelector('.editor-toolbar');
    if (editorToolbar) {
        editorToolbar.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                const command = e.target.dataset.command;
                if (command === 'insertImage') {
                    const url = prompt('輸入圖片網址:');
                    if (url) {
                        document.execCommand('insertImage', false, url);
                    }
                } else if (command === 'createLink') {
                    const url = prompt('輸入連結網址:');
                    if (url) {
                        document.execCommand('createLink', false, url);
                    }
                } else {
                    document.execCommand(command, false, null);
                }
            }
        });
    }

    // 提取 Google Map 嵌入的 src 網址
    function extractMapSrc(mapHtml) {
        const regex = /src="([^"]+)"/; // 正則表達式匹配 src 屬性
        const match = mapHtml.match(regex);
        return match ? match[1] : ''; // 返回匹配的網址或空字串
    }

    // 儲存編輯
    document.getElementById('save-edit').addEventListener('click', function() {
        const mapInput = document.getElementById('edit-map').value;
        let mapUrl;

        // 檢查輸入的網址格式
        if (mapInput.startsWith('https://www.google.com/maps/embed?pb=')) {
            mapUrl = mapInput; // 直接使用輸入的網址
        } else {
            mapUrl = extractMapSrc(mapInput); // 使用提取函數
        }

        const planData = {
            name: document.getElementById('edit-name').value,
            date: document.getElementById('edit-date').value,
            duration: document.getElementById('edit-duration').value,
            destination: document.getElementById('edit-destination').value,
            budget: document.getElementById('edit-budget').value,
            notes: document.getElementById('editor').innerHTML,
            map: mapUrl, // 使用檢查後的網址
            photos: currentPlanPhotos
        };

        plans[editingIndex] = planData;
        savePlansToLocalStorage();
        showElement('info-container');
        displayPlans();
    });

    // 取消編輯
    document.getElementById('cancel-edit').addEventListener('click', function() {
        showElement('info-container');
        displayPlans();
    });

    // 添加檔案選擇器的事件監聽器
    document.getElementById('edit-photos').addEventListener('change', function(e) {
        const files = e.target.files;
        const editor = document.getElementById('editor');

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.maxWidth = '100%'; // 確保圖片不超過編輯區域
                img.style.float = 'left'; // 使圖片浮動到左側
                img.style.marginRight = '10px'; // 右側留出空間
                editor.appendChild(img); // 將圖片插入編輯器
            };
            reader.readAsDataURL(file);
        });
    });

    // 依日期排序
    document.getElementById('sort-by-date').addEventListener('click', function() {
        // 清除其他按鈕的活動狀態
        document.getElementById('sort-by-name').classList.remove('active');
        
        // 切換按鈕的活動狀態
        this.classList.add('active');

        // 切換排序順序
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        displayPlans(); // 重新顯示計劃

        // 更新按鈕顯示
        this.textContent = `依日期排序 (${sortOrder === 'asc' ? '升冪' : '降冪'})`;
    });

    // 依名稱排序
    document.getElementById('sort-by-name').addEventListener('click', function() {
        // 清除其他按鈕的活動狀態
        document.getElementById('sort-by-date').classList.remove('active');
        
        // 切換按鈕的活動狀態
        this.classList.add('active');

        // 切換排序順序
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        displayPlans(); // 重新顯示計劃

        // 更新按鈕顯示
        this.textContent = `依名稱排序 (${sortOrder === 'asc' ? '升冪' : '降冪'})`;
    });

    // 搜尋功能
    document.getElementById('search-input').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        displayPlans(searchTerm);
    });

    // 切換到列表視圖
    document.getElementById('view-list').addEventListener('click', function() {
        currentView = 'list';
        this.classList.add('active');
        document.getElementById('view-grid').classList.remove('active');
        displayPlans();
    });

    // 切換到網格視圖
    document.getElementById('view-grid').addEventListener('click', function() {
        currentView = 'grid';
        this.classList.add('active');
        document.getElementById('view-list').classList.remove('active');
        displayPlans();
    });

    // 匯出計劃功能
    document.getElementById('export-plans').addEventListener('click', function() {
        const dataStr = JSON.stringify(plans, null, 2); // 將計劃轉換為 JSON 字串
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'travel_plans.json'; // 設定下載檔案名稱
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // 釋放 URL 物件
    });

    // 匯入計劃功能
    document.getElementById('import-plans').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = event => {
                try {
                    const importedPlans = JSON.parse(event.target.result);
                    plans = importedPlans; // 將匯入的計劃賦值給 plans
                    savePlansToLocalStorage(); // 儲存到本地存儲
                    displayPlans(); // 更新顯示
                    alert('計劃匯入成功！');
                } catch (error) {
                    alert('匯入失敗，請確保檔案格式正確。');
                    console.error('匯入錯誤:', error);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click(); // 自動觸發檔案選擇對話框
    });

    // 在初始化事件監聽器中添加提示的事件
    document.getElementById('edit-map').addEventListener('focus', function() {
        document.querySelector('.tooltip').style.display = 'block';
    });

    document.getElementById('edit-map').addEventListener('blur', function() {
        document.querySelector('.tooltip').style.display = 'none';
    });
}

// 格式化日期顯示
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date(dateString).toLocaleDateString('zh-TW', options);
}

// 格式化金額顯示
function formatCurrency(amount) {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0
    }).format(amount);
}

// 顯示計劃列表
function displayPlans(searchTerm = '', sortedPlans = plans) {
    const planList = document.getElementById('plan-list');
    planList.innerHTML = '';

    // 過濾計劃
    const filteredPlans = sortedPlans.filter(plan => {
        return plan.name.toLowerCase().includes(searchTerm) || 
               plan.destination.toLowerCase().includes(searchTerm) || 
               plan.notes.toLowerCase().includes(searchTerm);
    });

    if (filteredPlans.length === 0) {
        planList.innerHTML = '<li class="empty-message">尚未儲存任何符合條件的旅遊計劃。</li>';
        return;
    }

    // 根據選擇的排序方式進行排序
    if (document.getElementById('sort-by-date').classList.contains('active')) {
        filteredPlans.sort((a, b) => sortOrder === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date));
    } else if (document.getElementById('sort-by-name').classList.contains('active')) {
        filteredPlans.sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    }

    // 根據當前視圖顯示計劃
    if (currentView === 'list') {
        filteredPlans.forEach((plan, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="plan-details">
                    <h3>${plan.name}</h3>
                    <span class="plan-destination">${plan.destination}</span>
                    <div class="plan-info">
                        <label>出發日期:</label>
                        <span>${formatDate(plan.date)}</span>
                    </div>
                </div>
                <div class="plan-actions">
                    <button class="view-plan" data-index="${index}">
                        <i class="view-icon">👁️</i>
                        瀏覽
                    </button>
                    <button class="edit-plan" data-index="${index}">
                        <i class="edit-icon">✏️</i>
                        編輯
                    </button>
                    <button class="delete-plan" data-index="${index}">
                        <i class="delete-icon">🗑️</i>
                        刪除
                    </button>
                </div>
            `;
            planList.appendChild(li);
        });
    } else if (currentView === 'grid') {
        filteredPlans.forEach((plan, index) => {
            const div = document.createElement('div');
            div.className = 'plan-grid-item'; // 新增的 CSS 類別
            div.innerHTML = `
                <div class="plan-header">
                    <h3>${plan.name}</h3>
                    <span class="plan-destination">
                        <i class="destination-icon">🏠</i>
                        ${plan.destination}
                    </span>
                </div>
                <div class="plan-info">
                    <i class="info-icon">📅</i>
                    <div class="info-content">
                        <label>出發日期</label>
                        <span>${formatDate(plan.date)}</span>
                    </div>
                </div>
                ${plan.map ? `
                    <div class="plan-map">
                        <h4>🗺️ 地圖位置</h4>
                        <iframe src="${plan.map}" title="Google Map of ${plan.name}" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                    </div>
                ` : ''}
                ${plan.photos && plan.photos.length > 0 ? `
                    <div class="plan-photos">
                        <h4>📸 旅遊照片</h4>
                        <div class="photo-grid">
                            ${plan.photos.map(photo => `
                                <div class="photo-item">
                                    <img src="${photo.src}" alt="${photo.name}">
                                    <p>${photo.name}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="plan-actions">
                    <button class="view-plan" data-index="${index}">
                        <i class="view-icon">👁️</i>
                        瀏覽
                    </button>
                    <button class="edit-plan" data-index="${index}">
                        <i class="edit-icon">✏️</i>
                        編輯
                    </button>
                    <button class="delete-plan" data-index="${index}">
                        <i class="delete-icon">🗑️</i>
                        刪除
                    </button>
                </div>
            `;
            planList.appendChild(div);
        });
    }

    // 添加瀏覽按鈕事件
    document.querySelectorAll('.view-plan').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.dataset.index;
            const plan = plans[index];
            showViewPlan(plan); // 顯示瀏覽模式
        });
    });

    // 添加刪除按鈕事件
    document.querySelectorAll('.delete-plan').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.dataset.index;
            if (confirm('確定要刪除這個旅遊計劃嗎？')) {
                plans.splice(index, 1);
                savePlansToLocalStorage();
                displayPlans();
            }
        });
    });

    // 添加編輯按鈕事件
    document.querySelectorAll('.edit-plan').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            editingIndex = index;
            const plan = plans[index];

            document.getElementById('edit-name').value = plan.name;
            document.getElementById('edit-date').value = plan.date;
            document.getElementById('edit-duration').value = plan.duration;
            document.getElementById('edit-destination').value = plan.destination;
            document.getElementById('edit-budget').value = plan.budget;
            document.getElementById('editor').innerHTML = plan.notes || '<p>開始寫下您的旅遊記事...</p>';
            document.getElementById('edit-map').value = plan.map || '';

            // 顯示計劃照片
            const insertPhotoGrid = document.querySelector('.insert-photo-grid');
            insertPhotoGrid.innerHTML = '';
            plan.photos.forEach(photo => {
                const img = document.createElement('img');
                img.src = photo.src;
                img.alt = photo.name;
                img.dataset.src = photo.src;
                img.className = 'insertable-photo';
                insertPhotoGrid.appendChild(img);
            });

            showElement('edit-plan');
        });
    });
}

// 顯示瀏覽模式
function showViewPlan(plan) {
    const viewContainer = document.getElementById('view-plan-container');
    viewContainer.innerHTML = `
        <h2>${plan.name}</h2>
        <p><strong>目的地:</strong> ${plan.destination}</p>
        <p><strong>出發日期:</strong> ${formatDate(plan.date)}</p>
        <p><strong>旅程天數:</strong> ${plan.duration} 天</p>
        <p><strong>預算:</strong> ${formatCurrency(plan.budget)}</p>
        <div class="plan-notes">
            <h4>備註:</h4>
            <p>${plan.notes || '無備註'}</p>
        </div>
        ${plan.map ? `
            <div class="plan-map">
                <h4>🗺️ 地圖位置</h4>
                <iframe src="${plan.map}" title="Google Map of ${plan.name}" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
            </div>
        ` : ''}
        ${plan.photos && plan.photos.length > 0 ? `
            <div class="plan-photos">
                <h4>📸 旅遊照片</h4>
                <div class="photo-grid">
                    ${plan.photos.map(photo => `
                        <div class="photo-item">
                            <img src="${photo.src}" alt="${photo.name}">
                            <p>${photo.name}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        <button id="close-view">關閉</button>
    `;
    showElement('view-plan-container');

    // 添加關閉按鈕事件
    document.getElementById('close-view').addEventListener('click', function() {
        hideElement('view-plan-container'); // 隱藏瀏覽模式
    });
}

// 本地存儲功能
function savePlansToLocalStorage() {
    localStorage.setItem('travelPlans', JSON.stringify(plans, function(key, value) {
        return value;
    }));
}

function loadPlansFromLocalStorage() {
    const storedPlans = localStorage.getItem('travelPlans');
    if (storedPlans) {
        try {
            plans = JSON.parse(storedPlans, function(key, value) {
                return value;
            });
        } catch (e) {
            console.error("Error parsing stored plans", e);
            plans = [];
        }
        displayPlans();
    }
}

// 頁面載入時初始化
window.addEventListener('load', function() {
    console.log('頁面載入完成');
    loadPlansFromLocalStorage();
    initializeEventListeners();
});
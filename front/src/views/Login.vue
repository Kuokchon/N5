// 定義表單驗證函數
const validate_form = () => {
  error.value = '';
  
  // 檢查郵箱格式
  if (!email.value) {
    error.value = '請輸入郵箱地址';
    return false;
  }
  
  // 簡單的郵箱格式驗證
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    error.value = '請輸入有效的郵箱地址';
    return false;
  }
  
  // 檢查密碼
  if (!password.value) {
    error.value = '請輸入密碼';
    return false;
  }
  
  return true;
};

// 處理登入表單提交
const handleLogin = async () => {
  if (!validate_form()) {
    console.log('表單驗證失敗');
    return;
  }
  
  // 顯示加載狀態
  loading.value = true;
  error.value = '';
  
  try {
    console.log('開始登入流程...');
    const userCredentials = {
      email: email.value,
      password: password.value
    };
    
    // 嘗試使用store登入
    try {
      const loginResult = await store.login(email.value, password.value);
      console.log('Store登入結果:', loginResult);
      
      if (loginResult.success) {
        console.log('登入成功，重定向到首頁');
        router.push('/');
        
        // 觸發登錄狀態變化事件
        window.dispatchEvent(new Event('login-state-change'));
        
        return;
      } else {
        throw new Error(loginResult.error || '登入失敗');
      }
    } catch (storeError) {
      console.warn('Store登入失敗，嘗試使用API服務登入:', storeError);
      
      // 如果store登入失敗，嘗試直接使用API服務
      const { authAPI } = await import('../services/api');
      
      try {
        const response = await authAPI.login(userCredentials);
        console.log('API登入成功:', response);
        
        const token = response.token || response.data?.token;
        const user = response.user || response.data?.user;
        
        if (token) {
          // 保存token
          localStorage.setItem('token', token);
          
          // 如果有用戶數據，保存用戶數據
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          }
          
          // 觸發登錄狀態變化事件
          window.dispatchEvent(new Event('login-state-change'));
          
          // 登入成功，重定向到首頁
          console.log('登入成功，重定向到首頁');
          router.push('/');
          return;
        } else {
          console.error('API登入成功但未返回token');
          throw new Error('登入成功但未獲得認證信息');
        }
      } catch (apiError) {
        console.error('API登入也失敗:', apiError);
        
        // 最後一次嘗試：直接使用axios
        try {
          console.log('嘗試直接使用axios登入...');
          
          // 獲取API基礎URL
          const { getApiBaseUrl } = await import('../services/utils');
          const baseUrl = getApiBaseUrl();
          
          // 嘗試多個可能的登入端點
          const endpoints = [
            `${baseUrl}/auth/login`,
            `${baseUrl}/auth/login`,
            `${baseUrl}/auth/login`,
            `${baseUrl}/auth/login`
          ];
          
          for (const endpoint of endpoints) {
            try {
              console.log(`嘗試登入端點: ${endpoint}`);
              const response = await axios.post(endpoint, userCredentials);
              
              console.log('直接登入成功:', response.data);
              
              const token = response.data.token || response.data.access_token;
              const user = response.data.user || response.data.data;
              
              if (token) {
                // 保存token
                localStorage.setItem('token', token);
                
                // 如果有用戶數據，保存用戶數據
                if (user) {
                  localStorage.setItem('user', JSON.stringify(user));
                }
                
                // 觸發登錄狀態變化事件
                window.dispatchEvent(new Event('login-state-change'));
                
                // 登入成功，重定向到首頁
                console.log('登入成功，重定向到首頁');
                router.push('/');
                return;
              }
            } catch (error) {
              console.log(`端點 ${endpoint} 登入失敗:`, error.message);
              // 繼續嘗試下一個端點
            }
          }
          
          // 所有端點都失敗，拋出原始錯誤
          throw apiError;
        } catch (directError) {
          console.error('所有登入方式都失敗:', directError);
          throw storeError; // 返回最初的錯誤
        }
      }
    }
  } catch (error) {
    console.error('登入過程中出錯:', error);
    
    // 設置錯誤信息
    if (error.response) {
      if (error.response.status === 401) {
        error.value = '帳號或密碼錯誤';
      } else if (error.response.data && error.response.data.message) {
        error.value = error.response.data.message;
      } else {
        error.value = `伺服器錯誤 (${error.response.status})`;
      }
    } else if (error.message) {
      error.value = error.message;
    } else {
      error.value = '發生未知錯誤，請稍後再試';
    }
  } finally {
    loading.value = false;
  }
};

const loginUser = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    // 檢查API健康狀況
    const apiHealthy = await window.checkApiHealth();
    
    if (!apiHealthy) {
      errorMessage.value = '無法連接到伺服器，請稍後重試';
      isLoading.value = false;
      return;
    }
    
    // 執行登錄請求
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: email.value,
      password: password.value
    });
    
    // 處理登錄成功
    if (res.data && res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('refresh_token', res.data.refreshToken || '');
      
      // 獲取用戶信息
      const userRes = await axios.get('http://localhost:3000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${res.data.token}`
        }
      });
      
      if (userRes.data) {
        // 更新 Pinia 存儲
        userStore.setUser(userRes.data);
        userStore.setAuthenticated(true);
        
        // 導航至余额页
        router.push('/balance');
      }
    }
  } catch (error) {
    console.error('登錄錯誤:', error);
    errorMessage.value = error.response?.data?.message || '登錄失敗，請檢查您的憑據';
  } finally {
    isLoading.value = false;
  }
}; 
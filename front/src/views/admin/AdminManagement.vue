<template>
  <div class="admin-management">
    <div class="page-header">
      <h1>管理员管理</h1>
      <button class="add-button" @click="openDialog('add')" v-if="hasPermission('manage_admins')">
        添加管理员
      </button>
    </div>
    
    <!-- 管理员列表 -->
    <div class="admin-table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>上次登录</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in admins" :key="admin.id">
            <td>{{ admin.id }}</td>
            <td>{{ admin.username }}</td>
            <td>{{ admin.email }}</td>
            <td>
              <span class="role-tag" :class="`role-${admin.role}`">
                {{ getRoleName(admin.role) }}
              </span>
            </td>
            <td>{{ formatDate(admin.last_login_time) || '从未登录' }}</td>
            <td>{{ formatDate(admin.created_at) }}</td>
            <td class="action-cell">
              <button class="action-button edit" @click="openDialog('edit', admin)" v-if="hasPermission('manage_admins')">
                编辑
              </button>
              <button class="action-button delete" @click="confirmDelete(admin)" v-if="hasPermission('manage_admins') && currentAdmin.id !== admin.id">
                删除
              </button>
            </td>
          </tr>
          <tr v-if="admins.length === 0">
            <td colspan="7" class="no-data">暂无管理员数据</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 分页组件 -->
    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="page-button" 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        上一页
      </button>
      
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      
      <button 
        class="page-button" 
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        下一页
      </button>
    </div>
    
    <!-- 添加/编辑管理员对话框 -->
    <div class="dialog-overlay" v-if="showDialog" @click="closeDialog"></div>
    <div class="dialog" v-if="showDialog">
      <div class="dialog-header">
        <h2>{{ dialogTitle }}</h2>
        <button class="close-button" @click="closeDialog">×</button>
      </div>
      
      <div class="dialog-body">
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label for="username">用户名</label>
            <input 
              type="text" 
              id="username" 
              v-model="form.username" 
              required 
              :disabled="dialogMode === 'edit'"
            >
          </div>
          
          <div class="form-group">
            <label for="email">邮箱</label>
            <input 
              type="email" 
              id="email" 
              v-model="form.email" 
              required
            >
          </div>
          
          <div class="form-group" v-if="dialogMode === 'add' || (dialogMode === 'edit' && currentAdmin.id === form.id)">
            <label for="password">密码</label>
            <input 
              type="password" 
              id="password" 
              v-model="form.password" 
              :required="dialogMode === 'add'"
              placeholder="新增时必填，编辑时留空表示不修改"
            >
          </div>
          
          <div class="form-group">
            <label for="role">角色</label>
            <select id="role" v-model="form.role" required>
              <option value="super_admin">超级管理员</option>
              <option value="operation">运营管理员</option>
              <option value="developer">开发者</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-button" @click="closeDialog">取消</button>
            <button type="submit" class="submit-button" :disabled="loading">
              {{ loading ? '提交中...' : '提交' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div class="dialog-overlay" v-if="showDeleteConfirm" @click="showDeleteConfirm = false"></div>
    <div class="dialog confirm-dialog" v-if="showDeleteConfirm">
      <div class="dialog-header">
        <h2>确认删除</h2>
        <button class="close-button" @click="showDeleteConfirm = false">×</button>
      </div>
      
      <div class="dialog-body">
        <p>您确定要删除管理员 "{{ adminToDelete?.username }}" 吗？此操作不可恢复。</p>
        
        <div class="form-actions">
          <button type="button" class="cancel-button" @click="showDeleteConfirm = false">取消</button>
          <button type="button" class="delete-button" @click="deleteAdmin" :disabled="loading">
            {{ loading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * @file AdminManagement.vue
 * @description 管理员管理组件，提供管理员的增删改查功能
 * 包括管理员列表展示、分页、添加、编辑和删除管理员等功能
 * 根据当前登录管理员的权限动态显示操作按钮
 */
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const adminStore = useAdminStore();

// 状态
const admins = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const showDialog = ref(false);
const dialogMode = ref('add'); // 'add' or 'edit'
const form = ref({
  id: null,
  username: '',
  email: '',
  password: '',
  role: 'operation'
});
const showDeleteConfirm = ref(false);
const adminToDelete = ref(null);

// 当前登录的管理员
const currentAdmin = computed(() => adminStore.getAdmin);

// 对话框标题
const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '添加管理员' : '编辑管理员';
});

// 检查权限
const hasPermission = (permission) => {
  return adminStore.hasPermission(permission);
};

// 获取角色名称
const getRoleName = (role) => {
  switch (role) {
    case 'super_admin':
      return '超级管理员';
    case 'operation':
      return '运营管理员';
    case 'developer':
      return '开发者';
    default:
      return '未知角色';
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 加载管理员列表
const loadAdmins = async () => {
  loading.value = true;
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/administrators`, {
      params: { page: currentPage.value, limit: 10 },
      headers: { Authorization: `Bearer ${adminStore.token}` }
    });
    
    admins.value = response.data.admins;
    totalPages.value = response.data.totalPages || 1;
  } catch (error) {
    console.error('加载管理员列表失败:', error);
    
    // 使用模拟数据
    admins.value = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'super_admin',
        last_login_time: new Date().toISOString(),
        created_at: new Date(Date.now() - 86400000 * 30).toISOString()
      },
      {
        id: 2,
        username: 'operation',
        email: 'operation@example.com',
        role: 'operation',
        last_login_time: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 20).toISOString()
      },
      {
        id: 3,
        username: 'developer',
        email: 'developer@example.com',
        role: 'developer',
        last_login_time: null,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString()
      }
    ];
  } finally {
    loading.value = false;
  }
};

// 切换页面
const changePage = (page) => {
  currentPage.value = page;
  loadAdmins();
};

// 打开对话框
const openDialog = (mode, admin = null) => {
  dialogMode.value = mode;
  
  if (mode === 'add') {
    form.value = {
      id: null,
      username: '',
      email: '',
      password: '',
      role: 'operation'
    };
  } else if (mode === 'edit' && admin) {
    form.value = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      password: '',
      role: admin.role
    };
  }
  
  showDialog.value = true;
};

// 关闭对话框
const closeDialog = () => {
  showDialog.value = false;
};

// 提交表单
const submitForm = async () => {
  if (loading.value) return;
  
  loading.value = true;
  
  try {
    if (dialogMode.value === 'add') {
      await axios.post(`${API_BASE_URL}/api/admin/administrators`, form.value, {
        headers: { Authorization: `Bearer ${adminStore.token}` }
      });
    } else {
      // 编辑时，如果密码为空，则不发送密码字段
      const dataToSend = { ...form.value };
      if (!dataToSend.password) {
        delete dataToSend.password;
      }
      
      await axios.put(`${API_BASE_URL}/api/admin/administrators/${form.value.id}`, dataToSend, {
        headers: { Authorization: `Bearer ${adminStore.token}` }
      });
    }
    
    closeDialog();
    loadAdmins();
  } catch (error) {
    console.error('提交管理员表单失败:', error);
    alert(error.response?.data?.message || '操作失败');
  } finally {
    loading.value = false;
  }
};

// 确认删除
const confirmDelete = (admin) => {
  adminToDelete.value = admin;
  showDeleteConfirm.value = true;
};

// 删除管理员
const deleteAdmin = async () => {
  if (!adminToDelete.value || loading.value) return;
  
  loading.value = true;
  
  try {
    await axios.delete(`${API_BASE_URL}/api/admin/administrators/${adminToDelete.value.id}`, {
      headers: { Authorization: `Bearer ${adminStore.token}` }
    });
    
    showDeleteConfirm.value = false;
    loadAdmins();
  } catch (error) {
    console.error('删除管理员失败:', error);
    alert(error.response?.data?.message || '删除失败');
  } finally {
    loading.value = false;
  }
};

// 组件挂载时
onMounted(() => {
  loadAdmins();
});
</script>

<style scoped>
.admin-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  margin: 0;
}

.add-button {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.add-button:hover {
  background-color: #40a9ff;
}

/* 表格样式 */
.admin-table-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th, .admin-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.admin-table th {
  background-color: #fafafa;
  font-weight: 500;
}

.admin-table tr:last-child td {
  border-bottom: none;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 24px 0;
}

/* 角色标签 */
.role-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.role-super_admin {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.role-operation {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.role-developer {
  background-color: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

/* 操作按钮 */
.action-cell {
  white-space: nowrap;
}

.action-button {
  margin-right: 8px;
  padding: 4px 8px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.action-button.edit {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.action-button.edit:hover {
  background-color: #bae7ff;
}

.action-button.delete {
  background-color: #fff1f0;
  color: #f5222d;
  border: 1px solid #ffa39e;
}

.action-button.delete:hover {
  background-color: #ffccc7;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.page-button {
  background-color: #f0f0f0;
  border: 1px solid #d9d9d9;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin: 0 8px;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-button:hover:not(:disabled) {
  background-color: #d9d9d9;
}

.page-info {
  color: #666;
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  width: 90%;
  max-width: 500px;
}

.confirm-dialog {
  max-width: 400px;
}

.dialog-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h2 {
  margin: 0;
  font-size: 18px;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: #999;
}

.dialog-body {
  padding: 24px;
}

/* 表单 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus, .form-group select:focus {
  border-color: #40a9ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.form-actions button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 8px;
}

.cancel-button {
  background-color: white;
  border: 1px solid #d9d9d9;
  color: #333;
}

.cancel-button:hover {
  background-color: #f0f0f0;
}

.submit-button {
  background-color: #1890ff;
  color: white;
  border: none;
}

.submit-button:hover:not(:disabled) {
  background-color: #40a9ff;
}

.submit-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.delete-button {
  background-color: #ff4d4f;
  color: white;
  border: none;
}

.delete-button:hover:not(:disabled) {
  background-color: #ff7875;
}

.delete-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
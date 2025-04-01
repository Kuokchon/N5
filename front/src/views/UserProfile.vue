// 处理头像上传
const handleAvatarUpload = async ({ formData }) => {
  try {
    console.log('处理用户头像上传');
    
    // 用户必须已登录
    if (!userStore.user) {
      showError('用户未登录，无法上传头像');
      return;
    }
    
    // 直接使用userStore中的uploadAvatar函数，不需要传递用户ID
    const success = await userStore.uploadAvatar(formData);
    
    if (success) {
      // 更新用户信息，确保显示最新头像
      refreshUserInfo();
    }
  } catch (error) {
    console.error('头像上传失败', error);
    showError('头像上传失败');
  }
}; 
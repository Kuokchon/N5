import { createStore } from 'vuex';
import api from '../services/api';

const store = createStore({
  state() {
    return {
      user: null,
      memberCard: null,
      freeQuota: null,
      loading: false,
      error: null
    };
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setMemberCard(state, memberCard) {
      state.memberCard = memberCard;
    },
    setFreeQuota(state, freeQuota) {
      state.freeQuota = freeQuota;
    },
    setLoading(state, loading) {
      state.loading = loading;
    },
    setError(state, error) {
      state.error = error;
    }
  },
  actions: {
    // 获取用户信息
    async fetchUser({ commit }) {
      try {
        commit('setLoading', true);
        const response = await api.auth.get_user_info();
        if (response.success) {
          commit('setUser', response.data);
        }
      } catch (error) {
        commit('setError', error.message);
      } finally {
        commit('setLoading', false);
      }
    },
    
    // 获取会员卡信息
    async fetchMemberCard({ commit }) {
      try {
        commit('setLoading', true);
        const response = await api.memberCard.get_member_card();
        if (response.success) {
          commit('setMemberCard', response.data);
        }
      } catch (error) {
        commit('setError', error.message);
      } finally {
        commit('setLoading', false);
      }
    },
    
    // 获取每日免费额度信息
    async fetchFreeQuota({ commit }) {
      try {
        commit('setLoading', true);
        const response = await api.get_daily_free_quota();
        if (response.success) {
          commit('setFreeQuota', response.data);
        }
      } catch (error) {
        commit('setError', error.message);
      } finally {
        commit('setLoading', false);
      }
    },
    
    // 更新自己的每日免费额度
    async updateMyFreeQuota({ commit, dispatch }, daily_free_limit) {
      try {
        commit('setLoading', true);
        const response = await api.update_my_free_quota(daily_free_limit);
        if (response.success) {
          // 更新成功后重新获取最新的免费额度信息
          await dispatch('fetchFreeQuota');
        }
        return response;
      } catch (error) {
        commit('setError', error.message);
        throw error;
      } finally {
        commit('setLoading', false);
      }
    },
    
    // 管理员更新用户的每日免费额度
    async adminUpdateUserFreeQuota({ commit }, { user_id, daily_free_limit }) {
      try {
        commit('setLoading', true);
        const response = await api.admin_update_user_free_quota(user_id, daily_free_limit);
        return response;
      } catch (error) {
        commit('setError', error.message);
        throw error;
      } finally {
        commit('setLoading', false);
      }
    },
    
    // 登出操作，清除用户信息
    logout({ commit }) {
      api.auth.logout();
      commit('setUser', null);
      commit('setMemberCard', null);
      commit('setFreeQuota', null);
    }
  },
  getters: {
    isLoggedIn(state) {
      return !!state.user;
    },
    username(state) {
      return state.user ? state.user.username : '';
    },
    hasMemberCard(state) {
      return !!state.memberCard;
    },
    memberCardBalance(state) {
      return state.memberCard ? state.memberCard.balance : 0;
    },
    // 返回每日免费额度信息
    dailyFreeLimit(state) {
      return state.freeQuota ? state.freeQuota.daily_free_limit : 0;
    },
    // 返回免费额度余额
    freeBalance(state) {
      return state.freeQuota ? state.freeQuota.free_balance : 0;
    },
    // 返回已使用的免费额度
    freeQuotaUsed(state) {
      return state.freeQuota ? state.freeQuota.used : 0;
    },
    // 判断是否有免费额度可用
    hasFreeQuota(state) {
      return state.freeQuota && parseFloat(state.freeQuota.daily_free_limit) > 0;
    }
  }
});

export default store; 
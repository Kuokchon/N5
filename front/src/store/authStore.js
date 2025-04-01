import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    theme: 'light'
  }),
  actions: {
    setTheme(newTheme) {
      this.theme = newTheme
    }
  }
})
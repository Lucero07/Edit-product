import Vue from 'vue'
import Vuex from 'vuex'
import axios from "axios"

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    product: {}

  },
  getters:{
    PRODUCT: state => state.product
    
  },
  mutations: {
    

  },
  actions: {
    GET_PRODUCT: async ({commit}) => {
      let payload = {
        applied_Attributes: "appliedAttributes",
        images: "images"
      }
       return await axios.get("http://www.mocky.io/v2/5d77a2293200005a00923f49", {params: payload}).then(response => response.data)
    }

  }
})

import Vue from 'vue'
import Vuex from 'vuex'
import * as firebase from 'firebase'


Vue.use(Vuex)

export const store = new Vuex.Store({
  // stored data
  state: {
    loadedfileUploads:[],


    user: null, // default: no user
    loading: false,
    error: null
  },
  // mutate state
  // called by commit "actions" part of this same file
  mutations: {
    setLoadedfileUploads (state, payload) {
      state.loadedfileUploads = payload
    },
    createfileUpload (state, payload) {
      state.loadedfileUploads.push(payload)
    },
    setUser (state, payload) {
      state.user = payload
    },
    setLoading (state, payload) {
      state.loading = payload
    },
    setError (state, payload) {
      state.error = payload
    },
    clearError (state) {
      state.error = null
    }
  },

  // asynchronous tasks
  actions: {
    loadfileUploads ({commit}) {
      commit('setLoading', true)
      // reach out to the fileUpload node
      // on('value'): listen to any value changes and get push notifications
      // once('value'): get the snapshot once
      firebase.database().ref('fileUploads').once('value')
        .then((data) => {
          const fileUploads = []
          // .val() will get you the value of the response
          const obj = data.val()
          // data.val is an object, not an array
          // The "let" statement declares a block-scoped local variable, optionally initializing it to a value.
          // loop through the object, same as for(key in obj), but limit key to block scope by "let"
          for (let key in obj) {
            fileUploads.push({
              id: key,
              type: obj[key].type,
              description: obj[key].description,
              imageUrl: obj[key].imageUrl,
              date: obj[key].date,
              filename: obj[key].filename
              // creatorId: obj[key].creatorId
            })
          }
          commit('setLoadedfileUploads', fileUploads)
          commit('setLoading', false)
        })
        .catch(
          (error) => {
            console.log(error)
            commit('setLoading', false)
          }
        )
    },
    createfileUpload ({commit, getters}, payload) {
      const fileUpload = {
        type: payload.type,
        date: payload.date.toISOString(),
        filename: payload.image.name,
        description: payload.description
        // creatorId: getters.user.id
      }
      let imageUrl
      let key
      // push fileUpload to database
      firebase.database().ref('fileUploads').push(fileUpload)
        .then((data) => {
          // data we get back from firebase contains the key of this object
          key = data.key
          return key
        })
        // use store image into storage
        .then(key => {
          const filename = payload.image.name
          const ext = filename.slice(filename.lastIndexOf('.'))
          // upload fire to the storage part of the firebase. for files we use put('xxx') to upload
          return firebase.storage().ref(filename).put(payload.image)
          // return firebase.storage().ref('fileUploads/' + key + '.' + ext).put(payload.image)
        })
        // A promise is an object that may produce a single value some time in the future : either a resolved value, or a reason that it's not resolved
        // this step is needed to get DownloadURL?
        .then(snapshot => {
          return new Promise((resolve, reject) => {
            snapshot.ref.getDownloadURL().then(url => {
              snapshot.downloadURL = url
              resolve(snapshot)
            })
          })
        })
        .then((snapshot) => {
          imageUrl = snapshot.downloadURL
          // update a node "fileUploads", child(key)
          return firebase.database().ref('fileUploads').child(key).update({imageUrl: imageUrl})
        })
        // commit in local store
        .then(() => {
          commit('createfileUpload', {
            ...fileUpload,
            imageUrl: imageUrl,
            id: key
          })
        })
        .catch((error) => {
          console.log(error)
        })
    },
    
    signUserUp ({commit}, payload) {
      // loading
      commit('setLoading', true)
      commit('clearError')
      firebase.auth().createUserWithEmailAndPassword(payload.email, payload.password)
        .then(
          user => {
            
            commit('setLoading', false) // not loading anymore
            const newUser = {
              id: user.uid,
              registeredfileUploads: []
            }
            commit('setUser', newUser)
          }
        )
        .catch(
          error => {
            commit('setLoading', false) // not loading anymore
            commit('setError', error) // saves the error
            console.log(error)
          }
        )
    },
    signUserIn ({commit}, payload) {
      commit('setLoading', true)
      commit('clearError')
      firebase.auth().signInWithEmailAndPassword(payload.email, payload.password)
        .then(
          user => {
            commit('setLoading', false)
            const newUser = {
              id: user.uid,
              registeredfileUploads: []
            }
            commit('setUser', newUser)
          }
        )
        .catch(
          error => {
            commit('setLoading', false)
            commit('setError', error)
            console.log(error)
          }
        )
    },
    autoSignIn ({commit}, payload) {
      commit('setUser', {id: payload.uid, registeredfileUploads: []})
    },
    logout ({commit}) {
      firebase.auth().signOut()
      commit('setUser', null)
    },
    clearError ({commit}) {
      commit('clearError')
    }
  },
  getters: {
    loadedfileUploads (state) {
      return state.loadedfileUploads
      // return state.loadedfileUploads.sort((fileUploadA, fileUploadB) => {
      //   return fileUploadA.date > fileUploadB.date
      // })
    },
    featuredfileUploads (state, getters) {
      return getters.loadedfileUploads.slice(0, 5)
    },
    loadedfileUpload (state) {
      return (fileUploadId) => {
        return state.loadedfileUploads.find((fileUpload) => {
          return fileUpload.id === fileUploadId
        })
      }
    },
    // get user that's stored in state
    user (state) {
      return state.user
    },
    loading (state) {
      return state.loading
    },
    error (state) {
      return state.error
    }
  }
})

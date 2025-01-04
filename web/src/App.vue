<script setup>
import {reactive, ref, onMounted} from 'vue'
import 'reset-css';


const selected = ref('湖人')
const enableLive = ref(true)

const teamItem = ref([])

const changeStarTeam = (value) => {
  try {
    window.electronAPI.send('confirmStarTeam', value);
  } catch (e) {
    console.warn(e)
  }
}

onMounted(() => {
  try {
    window.electronAPI.receive('receiveFromElectron', (response) => {
      if (response.type === 'teamInfo') {
        teamItem.value = response.message
      }
      if (response.type === 'enableLive') {
        enableLive.value = response.message
      }
      if (response.type === 'starTeam') {
        selected.value = response.message
      }
    })
  } catch (e) {
    console.warn(e)
  }
});

const changeLive = (value) => {
  try {
    window.electronAPI.send('enableLive', enableLive.value);
  } catch (e) {
    console.warn(e)
  }
}
const exit = () => {
  window.electronAPI.send('exit')

}
</script>

<template>
  <v-sheet class="mx-auto" max-width="300" style="margin-top: 20px;">
    <v-form validate-on="submit lazy">
      <v-select
          color="primary"
          v-model="selected"
          @update:modelValue="changeStarTeam"
          label="请选择你的主队"
          :items=teamItem
          variant="outlined"
      ></v-select>

      <v-switch v-model=enableLive color="primary" @change="changeLive" label="是否开启实时比分" inset></v-switch>

      <v-btn
          color="primary"
          class="mt-3"
          text="退出"
          @click="exit"
          type="submit"
          block
      ></v-btn>
    </v-form>
  </v-sheet>
</template>

<style scoped>


</style>

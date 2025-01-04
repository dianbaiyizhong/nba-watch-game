<script setup>
import {reactive, ref} from 'vue'
import 'reset-css';


const selected = ref('Florida')

const changeStarTeam = (value) => {
  window.electronAPI.send('confirmStarTeam', value);
}
const exit = () => {
  window.electronAPI.send('exit');

}
</script>

<template>
  <v-sheet class="mx-auto" max-width="300" style="margin-top: 10px;">
    <v-form validate-on="submit lazy">
      <v-select
          v-model="selected"
          @update:modelValue="changeStarTeam"
          label="Select"
          :items="['California', 'Colorado', 'Florida', 'Georgia', 'Texas', 'Wyoming']"
          variant="outlined"
      ></v-select>

      <v-switch label="是否开启实时比分" inset></v-switch>

      <v-btn
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

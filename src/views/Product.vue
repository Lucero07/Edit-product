<template>
  <v-container>
    <v-layout
      text-center
      wrap
    >
    <CardItem></CardItem>
    </v-layout>
  </v-container>
</template>

<script>
import CardItem from '../components/card';
export default {
  name: 'Product',
  components: {
    CardItem,
  },
  data: () => ({
    
  }),
}
</script>

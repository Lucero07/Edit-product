<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>Editor de producto</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-menu
        left
        bottom
      >
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item>
            <v-list-item-title>Editar</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-content>
      <Product/>
    </v-content>
  </v-app>
</template>

<script>
import Product from './views/Product';

export default {
  name: 'App',
  components: {
    Product,
  },
  data: () => ({
    //
  }),
};
</script>

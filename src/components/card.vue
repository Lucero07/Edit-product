<template>
	<v-card width="100%" :loading="isUpdating" >
		<template v-slot:progress>
			<v-progress-linear absolute color="green lighten-3" height="4" indeterminate></v-progress-linear>
		</template>
		<v-card-title>
			<v-row>
				<v-col class="text-left" cols="4">{{product.long_name}}</v-col>
				<v-col class="text-right" cols="8">
					<v-btn color="blue-grey darken-3" depressed v-if="showSave">Guardar</v-btn>
					<v-menu bottom left transition="slide-y-transition">
						<template v-slot:activator="{ on }">
							<v-btn icon v-on="on">
								<v-icon>mdi-dots-vertical</v-icon>
							</v-btn>
						</template>
						<v-list>
							<v-list-item @click="isUpdating = true">
								<v-list-item-action>
									<v-icon>mdi-settings</v-icon>
								</v-list-item-action>
								<v-list-item-content>
									<v-list-item-title>Update</v-list-item-title>
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</v-col>
			</v-row>
		</v-card-title>
		<v-card-text>
			<v-tabs v-model="tabsProduct" fixed-tabs>
				<v-tab href="#general">General</v-tab>
				<v-tab href="#detail">Caracteristicas</v-tab>
				<v-tabs-items v-model="tabsProduct">
					<v-tab-item value="general">
						<v-row>
							<v-col cols="8">
								<v-form href="formProduct">
									<v-text-field v-model="product.long_name" :disabled="isUpdating" outline label="Nombre"></v-text-field>
									<v-text-field v-model="product.model" :disabled="isUpdating" outline label="Modelo"></v-text-field>
									<v-text-field v-model="product.brand" :disabled="isUpdating" outline label="Marca"></v-text-field>
									<v-textarea name="input-4-1" label="Descripcion" :value="product.plain_description" outlined></v-textarea>
							</v-form>
							</v-col>
							<v-col cols="4">
								<v-carousel>
									<v-carousel-item v-for="image in product.images" :key="image.id">
									<v-sheet tile>
										<v-row class="fill-height" align="center" justify="center">
										<v-img :src="image.url" ></v-img>
										</v-row>
									</v-sheet>
									</v-carousel-item>
								</v-carousel>
							</v-col>
						</v-row>
					</v-tab-item>
						<v-tab-item value="detail">
						<v-row>
							<v-col cols="6">
								<h2>Dimensiones</h2>
								<v-form>
									<v-row>
										<v-col cols="3">
											<v-text-field v-model="product.length" :disabled="isUpdating" outline label="Largo"></v-text-field>
										</v-col>
										<v-col cols="3">
											<v-text-field v-model="product.height" :disabled="isUpdating" outline label="Alto"></v-text-field>
										</v-col>
										<v-col cols="3">
											<v-text-field v-model="product.width" :disabled="isUpdating" outline label="Ancho"></v-text-field>
										</v-col>
										<v-col cols="3">
											<v-text-field v-model="product.distance_unit" :disabled="isUpdating" outline label="Unidades"></v-text-field>
										</v-col>
										<v-col cols="3">
											<v-text-field v-model="product.weight" :disabled="isUpdating" outline label="Peso"></v-text-field>
										</v-col>
										<v-col cols="3">
											<v-text-field v-model="product.mass_unit" :disabled="isUpdating" outline label="Unidades"></v-text-field>
										</v-col>
									</v-row>
								</v-form>
							</v-col>
							<v-col cols="6">
								<h2>Atributos</h2>
								<v-form >
									<v-row>
										<v-col cols="3" v-for="attribute in product.applied_attributes" :key="attribute.id">
											<v-text-field  :value="attribute.value" outline :label="attribute.name"></v-text-field>
										</v-col>
									</v-row>
								</v-form>
							</v-col>
						</v-row>
					</v-tab-item>
				</v-tabs-items>
			</v-tabs>
		</v-card-text>
	</v-card>
</template>

<script>

import { debounce } from "lodash"

	export default {
		data: () => ({
				product: {},
				isUpdating: false,
				baseProduct: {},
				tabsProduct: "general",
				components: [],
				showSave: false,
				
		}),
		computed: {
		},
		mounted() {
			this.$store.dispatch("GET_PRODUCT").then(response => {
			this.initialize(response)
			})
			
		},

		watch: {
			
			product: {
				handler: debounce(function(e) {
					const dataPro = Object.assign({},this.baseProduct)					
					let valuesProduct =JSON.stringify(this.product)
					let valuesBaseProduct =JSON.stringify(dataPro)
					
					if (valuesProduct == valuesBaseProduct){
						this.showSave = false
					} else {
						this.showSave = true
					}
					
					}, 10
				),
				deep: true
			},
			
			
			isUpdating (val) {
				if (val) {
					setTimeout(() => (this.isUpdating = false), 500)
				}
			},
		},

		methods: {
			initialize(dataProduct) {
				const dataPro = Object.assign({},dataProduct)
				this.product = Object.assign({}, dataProduct.product)
				this.baseProduct = dataPro.product
				
			},
			
			remove (item) {
				const index = this.friends.indexOf(item.name)
				if (index >= 0) this.friends.splice(index, 1)
			},
		},
	}
</script>
<template>
  <div>
    <nn-header disable-back title="Oportunidades" icon="nn-money-pouch">
      <template v-slot:actions>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-icon class="pa-2 ma-1" size="18" v-on="on" @click="onToggleView">{{ view == "list" ? "nn-pipeline" : "nn-ul2"}}</v-icon>
          </template>
          <span>{{ view == "list" ? "Ver pipeline" : "Ver como lista"}}</span>
        </v-tooltip>
        <v-text-field
          flat
          style="min-width: 300px; flex: 0 1;"
          label="Buscar"
          prepend-inner-icon="nn-magnifier"
          v-model="keywords"
        ></v-text-field>
      </template>
    </nn-header>    
    <nn-fixed-aside type="filter">
      <simplebar>
        <nn-search-filter @reset="resetFilter" @clearFilter="clearChip" filterState="crm/DEALS_SEARCH_FILTER_VALUES">
          <nn-search-filter-item disableChips>
            <template v-slot:header>Equipo</template>
            <template v-for="(item, index) in filterOptions.teams">
              <v-checkbox :key="'team-' + index" :ripple="false" v-model="teamIds" :value="item.value" color="primary" class="v-input--small" hide-details :label="item.text"></v-checkbox>
            </template>
          </nn-search-filter-item>
          <nn-search-filter-item v-show="view == 'list'" disableChips>
            <template v-slot:header>Estatus</template>
            <v-radio-group hide-details v-model="statuses" class="v-input--small mt-0 pb-3 pt-0">
              <template v-for="(item, index) in filterOptions.statuses">
                <v-radio :key="'statuses-' + index" :ripple="false" color="secondary" :label="item.text" :value="item.value"></v-radio>
              </template>
            </v-radio-group>
          </nn-search-filter-item>
          <!-- <nn-search-filter-item>
            <template v-slot:header>Tipo de oportunidad</template>
            <v-radio-group
              hide-details
              v-model="filter.importances"
              class="v-input--small mt-0 pb-3 pt-0"
            >
              <template v-for="(item, index) in filterOpts.importances">
                <v-radio
                  :key="'importance-' + index"
                  :ripple="false"
                  color="secondary"
                  :label="item.text"
                  :value="item.value"
                ></v-radio>
              </template>
            </v-radio-group>
          </nn-search-filter-item> -->
          <nn-search-filter-item v-show="view == 'list'" disableChips>
            <template v-slot:header>Etapa</template>
            <template v-for="(item, index) in filterOptions.stages">
              <v-checkbox :key="'stage-' + index" :ripple="false" v-model="stageIds" :value="item.value" color="primary" class="v-input--small" hide-details :label="item.text"></v-checkbox>
            </template>
          </nn-search-filter-item>
          <nn-search-filter-item v-show="canManageMembers">
            <template v-slot:header>Asignado a</template>
            <v-select
              box
              dense
              single-line
              multiple
              :ripple="false"
              label="Cualquiera"
              v-model="userIds"
              :items="filterOptions.users"
              hide-details
            >
              <template v-slot:selection="{ item, index}">
                <span v-if="index === 0">{{ item.text }}</span>
                <span v-if="index === 1">(+{{ userIds.length - 1 }})</span>
              </template>
            </v-select>
          </nn-search-filter-item>
        </nn-search-filter>
      </simplebar>
    </nn-fixed-aside>
    <list v-if="view == 'list'" :canManageMembers="canManageMembers"
      @showMenu="initMenu"
      @showWonDialog="showDialogWonDeal"
      @showLostDialog="showDialogLostDeal"
      @reopen="onReopen"
      @showSidebar="setSidebar"
      @showMessageUpdateStage="confirmationMessage"></list>
    <pipeline v-else :canManageMembers="canManageMembers"
      @showMenu="initMenu"
      @showWonDialog="showDialogWonDeal"
      @showLostDialog="showDialogLostDeal"
      @showMessageUpdateStage="confirmationMessage"></pipeline>
    <v-snackbar v-model="confirmationAction" :timeout="2000" bottom>{{ textConfirmation }}</v-snackbar>    
    <v-menu v-model="showMenu" :position-x="x" :position-y="y" offset-y z-index="2">
      <v-list class="actions-group">
        <v-list-tile class="actions-group__active" @click="showEditDialog" v-if="canWriteDeals">
          <v-list-tile-title class="body-2 px-0">
            <i class="pr-2 nn nn-pencil" size="14"></i> Editar
          </v-list-tile-title>
        </v-list-tile>
        <v-list-tile class="actions-group__active" @click="setSidebar" v-if="view == 'pipeline' && canReadDeals">
          <v-list-tile-title class="body-2 px-0">
            <i class="pr-2 nn nn-paper" size="14"></i>Ver Resumen
          </v-list-tile-title>
        </v-list-tile>
        <v-list-tile class="actions-group__active">
          <v-list-tile-title class="body-2 px-0" v-if="canReadLeads">
            <i class="pr-2 nn nn-user" size="14"></i><router-link :to="{ name: 'lead-detail', params: { id: activeDeal.leadId }}" class="c-list__item-link">Ver Prospecto</router-link> 
          </v-list-tile-title>
        </v-list-tile>
        <v-list-tile class="actions-group__active" @click="showAllocateDialog" v-if="canManageMembers && activeDeal.status == 'Open' && canWriteDeals">
          <v-list-tile-title class="body-2 px-0">
            <i class="pr-2 nn nn-swap-horizontal" size="14"></i> Reasignar
          </v-list-tile-title>
        </v-list-tile>
        <v-list-tile class="actions-group__active" @click="() => showNurture = true" v-if="activeDeal.status == 'Open' && canWriteDeals">
          <v-list-tile-title class="body-2 px-0">
            <i class="pr-2 nn nn-box2" size="14"></i> Incubar  
          </v-list-tile-title>
        </v-list-tile>
        <v-list-tile class="actions-group__active" @click="() => showWon = true" v-if="view == 'pipeline' && canWriteDeals">
          <v-list-tile-title class="body-2 px-0">
            <i class="pr-2 nn nn-thumbs-up" size="14"></i> Oportunidad ganada   
          </v-list-tile-title>
        </v-list-tile>
        <v-list-tile class="actions-group__active" @click="() => showLost = true" v-if="view == 'pipeline' && canWriteDeals">
          <v-list-tile-title class="body-2 px-0">
            <i class="pr-2 nn nn-thumbs-down" size="14"></i> Oportunidad perdida 
          </v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
    <nn-dialog v-model="showEdit" persistent type="form" v-if="canWriteDeals">
      <template v-slot:title>Editar oportunidad</template>
      <template v-slot:content>
        <v-alert class="mb-3 mt-0" outline :value="true" type="info">
          Los cambios realizados a la información personal serán visibles para todos los que tengan acceso a este Contacto.
        </v-alert>
        <v-form ref="dealForm">
          <v-text-field box v-model="editDeal.contactName" label="Nombre y Apellidos"
            :rules="getRules($v.editDeal.contactName, 'contactName', 'editDeal')"></v-text-field>
          <v-text-field box v-model="editDeal.contactEmail" label="Email"
            :rules="getRules($v.editDeal.contactEmail, 'contactEmail', 'editDeal')"></v-text-field>
          <v-text-field box v-model="editDeal.contactPhone" label="Teléfono" mask="(###) ### ####"
            :rules="getRules($v.editDeal.contactPhone, 'contactPhone', 'editDeal')"></v-text-field>
          <v-select box v-model="editDeal.interest" label="Interés" :items="interests"></v-select>
        </v-form>
      </template>
      <template v-slot:actions>
        <v-layout>
          <v-spacer></v-spacer>
          <v-btn outline @click="() => showEdit = false">Cancelar</v-btn>
          <v-btn color="secondary" @click="onEdit">Guardar</v-btn>
        </v-layout>
      </template>
    </nn-dialog>
    <nn-dialog v-model="showAllocate" persistent type="form">
      <template v-slot:title>Reasignar oportunidad</template>
      <template v-slot:content>
        <h3>{{ activeDeal.contactName }}</h3>
        <p>
          <i class="nn nn-building" size="12"></i>
          {{activeDeal.teamName}}
        </p>
        <v-form ref="allocateForm">
          <v-select
            box
            v-model="allocateUserId"
            label="Reasignar a"
            :items="teamMembers"
          ></v-select>
        </v-form>
      </template>
      <template v-slot:actions>
        <v-layout>
          <v-spacer></v-spacer>
          <v-btn outline @click="() => showAllocate = false ">Cancelar</v-btn>
          <v-btn color="secondary" @click="onAllocateDeal">Guardar</v-btn>
        </v-layout>
      </template>
    </nn-dialog>
    <nn-dialog v-model="showNurture" persistent type="form">
      <template v-slot:title>Incubar oportunidad</template>
      <template v-slot:content>
        <h3>{{ activeDeal.contactName }}</h3>
        <p>
          <i class="nn nn-building" size="12"></i>
          {{activeDeal.teamName}}
        </p>
        <v-alert class="mb-3 mt-0" outline :value="true" type="info">
          La oportunidad se reactiva en el momento que finaliza el período de incubación.
        </v-alert>
        <v-form>
          <v-menu
            ref="dateNurture"
            v-model="dateNurture"
            :close-on-content-click="false"
            :nudge-right="30"
            lazy
            transition="scale-transition"
            full-width
            max-width="290px"
            min-width="290px"
          >
            <template v-slot:activator="{ on }">
              <v-text-field box
                v-model="promptDate"
                label="Incubar hasta"
                v-on="on"
                @blur="date = parseDate(promptDate)"
                @click="updateDate"
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="promptDate"
              :min="newDate"
              no-title
              @input="dateNurture = false"
            ></v-date-picker>
          </v-menu>
        </v-form>
      </template>
      <template v-slot:actions>
        <v-layout>
          <v-spacer></v-spacer>
          <v-btn outline @click="() => showNurture = false">Cancelar</v-btn>
          <v-btn color="secondary" @click="nurtureDeal">Guardar</v-btn>
        </v-layout>
      </template>
    </nn-dialog>
    <nn-dialog v-model="showWon" persistent type="form">
      <template v-slot:title>Oportunidad Ganada</template>
      <template v-slot:content>
        <h3>
          {{ activeDeal.contactName }}
        </h3>
        <p>
          <i class="nn nn-building" size="12"></i>
          {{activeDeal.teamName}}
        </p>
        <v-alert class="mb-3 mt-0" outline :value="true" type="info">
          Confirma el monto de esta oportunidad antes de guardarla como Ganada.
        </v-alert>
        <v-form ref="wonForm">
          <v-text-field
            label="Monto"
            box
            v-model="wonAmount"
            v-inputmask="{ maskType: 'money' }"
            :rules="getRules($v.wonAmount, 'amount')"
          ></v-text-field>
        </v-form>
      </template>
      <template v-slot:actions>
        <v-layout>
          <v-spacer></v-spacer>
          <v-btn outline @click="onWonCancel">Cancelar</v-btn>
          <v-btn color="secondary" @click="onWon">Guardar</v-btn>
        </v-layout>
      </template>
    </nn-dialog>
    <nn-dialog v-model="showLost" persistent type="form">
      <template v-slot:title>Oportunidad perdida</template>
      <template v-slot:content>
        <h3>
          <b>{{ activeDeal.contactName }}</b>
        </h3>
        <p>
          <i class="nn nn-building" size="12"></i>
          {{activeDeal.teamName}}
        </p>
        <v-form ref="lostForm">
          <v-select
            box
            v-model="lostReason"
            :items="lostReasons"
            label="Selecciona el motivo"
            :rules="getRules($v.lostReason, 'lostReason')"
          ></v-select>
				  <v-textarea v-if="requiresComment" v-model="lostNote" box label="Nota" no-resize :rules="getRules($v.lostNote, 'lostNote')"></v-textarea>
        </v-form>
      </template>
      <template v-slot:actions>
        <v-layout>
          <v-spacer></v-spacer>
          <v-btn outline @click="onLostCancel">Cancelar</v-btn>
          <v-btn color="secondary" @click="onLost">Guardar</v-btn>
        </v-layout>
      </template>
    </nn-dialog>
    <nn-sidebar v-model="showSidebar" title="Resumen">
      <p>
        <v-icon small class="mr-1">nn-user</v-icon> <b>{{ sidebar.contactName }}</b>
      </p>
      <p>
        <v-icon small class="mr-1">nn-envelope</v-icon> {{ sidebar.contactEmail }}
      </p>
      <p class="mb-1">
        <v-icon small class="mr-1">nn-telephone</v-icon> {{ sidebar.contactPhone }}
      </p>
      <v-btn flat right color="secondary" :to="'/' + sidebar.detailUrl">Ver detalle completo</v-btn>
      <nn-data-list class="mt-2 mb-4">
        <nn-data-list-item label="Estatus">
          {{ sidebar.statusText }}
        </nn-data-list-item>
        <nn-data-list-item label="Etapa">
          {{ sidebar.stageText }}
        </nn-data-list-item>
        <nn-data-list-item label="Interés">
          {{ sidebar.interest }}
        </nn-data-list-item>
        <nn-data-list-item label="Asignado a">
          {{ sidebar.userName }}
        </nn-data-list-item>
        <nn-data-list-item label="Equipo">
          {{ sidebar.teamName }}
        </nn-data-list-item>
      </nn-data-list>
      <div class="title mb-2">Agregar nota</div>
      <v-form ref="sidebarNoteForm" @submit.prevent="onAddSidebarNote">
        <v-textarea outline single-line no-resize placeholder="Escribe tu nota" v-model="sidebarNote" :rules="getRules($v.sidebarNote, 'sidebarNote')">
        </v-textarea>
        <v-layout>
          <v-spacer></v-spacer>
          <v-btn class="ma-0" color="secondary" type="submit">Añadir</v-btn>
        </v-layout>
      </v-form>
      <deal-timeline compact :logs="sidebar.logs"></deal-timeline>
    </nn-sidebar>
  </div>
</template>
<script>
import { crmService, lookupsService } from "api2"
import { debounce } from "lodash"
import inputMask from "directives/input-mask"

import { mapGetters } from "vuex"
import EventBus from 'libs/utils';
import list from "./list"
import pipeline from "./pipeline"

import Timeline from "./timeline"

import { required, requiredIf, email } from "vuelidate/lib/validators"
import { hasServerError } from "validators/custom-validators"
import { getRules } from "validators/form-validation-rules"

export default {
  directives: {
    inputmask: inputMask
	},
  components: {
    list,
    pipeline,
    "deal-timeline": Timeline
  },
  data() {
    return {
      x: 0,
      y: 0,
      newDate: "",
      date: new Date().toISOString().substr(0, 10),
      promptDate: this.formatDate(new Date().toISOString().substr(0, 10)),

      activeDeal: {},
      editDeal: {},

      allocateUserId: "",
      teamMembers: [],
      
      wonAmount: "",
      lostReason: "",
      lostNote: "",
      
      showMenu: false,
      showEdit: false,
      showLost: false,
      showWon: false,
      showAllocate: false,
      showNurture: false,

      dateNurture: false,
      interests: [],

      confirmationAction: false,
      textConfirmation: "",

      showSidebar: false,
      sidebar: {
        logs: []
      },
      sidebarNote: "",

      serverErrors: []
    }
  },
  created(){
    let promptDate = new Date()
    promptDate.setDate(promptDate.getDate() + 30)
    this.promptDate = promptDate.toISOString().substr(0, 10)
  },
  computed: {
    ...mapGetters({
      lostReasons: "crm/DEAL_LOST_REASONS",
      view: "crm/DEALS_VIEW",
      filterOptions: "crm/DEALS_SEARCH_FILTER_OPTIONS",
      filterValues: "crm/DEALS_SEARCH_FILTER_VALUES",
    }),
    teamIds: {
      get() {
        return this.$store.getters["crm/DEALS_SEARCH_FILTER_VALUES"].teamIds
      },
      set(val) {
        this.$store.dispatch("crm/UPDATE_DEALS_SEARCH_FILTER_VALUES", { teamIds: val })
      }
    },
    statuses: {
      get() {
        return this.$store.getters["crm/DEALS_SEARCH_FILTER_VALUES"].statuses
      },
      set(val) {
        this.$store.dispatch("crm/UPDATE_DEALS_SEARCH_FILTER_VALUES", { statuses: val })
      }
    },
    userIds: {
      get() {
        return this.$store.getters["crm/DEALS_SEARCH_FILTER_VALUES"].userIds
      },
      set(val) {
        this.$store.dispatch("crm/UPDATE_DEALS_SEARCH_FILTER_VALUES", { userIds: val })
      }
    },
    stageIds: {
      get() {
        return this.$store.getters["crm/DEALS_SEARCH_FILTER_VALUES"].stageIds
      },
      set(val) {
        this.$store.dispatch("crm/UPDATE_DEALS_SEARCH_FILTER_VALUES", { stageIds: val })
      }
    },
    keywords: {
      get() {
        return this.$store.getters["crm/DEALS_SEARCH_FILTER_VALUES"].keywords
      },
      set(val) {
        this.$store.dispatch("crm/UPDATE_DEALS_SEARCH_FILTER_VALUES", { keywords: val })
      }
    },
    canManageMembers() {
      return this.$store.getters["account/hasPermission"](
        "developments",
        "DealList"
      )
    },
		requiresComment() {
      if (this.lostReason == "" || this.lostReason == null) return false;
      
      let reasonId = this.lostReason
      return this.lostReasons.find(function(reason){
        return reason.value === reasonId
      }).data
    },
    canWriteDeals(){
      return this.$store.getters["account/hasPermission"]("developments", "DealWrite")
    },
    canReadDeals(){
      return this.$store.getters["account/hasPermission"]("developments", "DealRead")
    },
    canReadLeads(){
      return this.$store.getters["account/hasPermission"]("developments", "LeadRead")
    }

  },
  mounted() {
    this.initialize()
  },
  methods: {
    initialize() {
      this.$store.dispatch("crm/SET_DEAL_LOST_REASONS")

      Promise.all([
        this.$store.dispatch("crm/SET_TEAMS"),
        this.$store.dispatch("crm/SET_DEAL_STAGES")])
        .then(() => {
          this.$store.dispatch("crm/INIT_DEALS_SEARCH_FILTER_OPTIONS")
            .then(() => {
              this.$store.dispatch("crm/INIT_DEALS_SEARCH_FILTER_VALUES")
            })
        })
    },
    clearChip(expression) {
      let obj = { }
      if (Array.isArray(expression)) {
        obj[expression[0]] = ""
        obj[expression[1]] = ""
      } else if (expression.includes("|"))  {
        let val = expression.split('|')
        let index = this[val[0]].indexOf(val[1])
        this.$delete(this[val[0]], index)
      } else obj[expression] = ""
      this.$store.dispatch("crm/UPDATE_DEALS_SEARCH_FILTER_VALUES", obj)
    },
    resetFilter() {
      document.getElementsByClassName("content__chips")[0].remove()
      this.$store.dispatch("crm/RESET_DEALS_SEARCH_FILTER_VALUES")
    },
    onToggleView() {
      let view = this.view == "pipeline" ? "list" : "pipeline"
      this.$store.dispatch("crm/SET_DEALS_VIEW", view)
    },
    updateTeamMembers() {
      this.$store.dispatch("crm/UPDATE_DEALS_SEARCH_FILTER_TEAM_MEMBERS")
    },
    initMenu(item) {
      this.showMenu = false

      this.activeDeal = item
      
      this.x = event.clientX
      this.y =  event.clientY
      this.$nextTick(() => {
        this.showMenu = true
      })
    },
    showDialogWonDeal(item) {
      this.activeDeal = item
      this.showWon = true
    },
    showDialogLostDeal(item) {
      this.activeDeal = item
      this.showLost = true
    },
    showEditDialog() {
      this.editDeal = {...{}, ...this.activeDeal}

      this.$store.dispatch("crm/GET_TEAM_CONTACT_INTERESTS", this.activeDeal.teamId)
        .then(interests => {
          this.interests = interests

          this.showEdit = true
        })
    },
    showAllocateDialog() {
      this.$store.dispatch("crm/GET_TEAM_MEMBERS", this.activeDeal.teamId)
        .then(members => {
          this.teamMembers = members
          this.allocateUserId = this.activeDeal.userId

          this.showAllocate = true
        })
    },
    onAllocateDeal() {
      this.$store.dispatch("crm/ALLOCATE_DEAL", {id: this.activeDeal.id, userId: this.allocateUserId })
        .then(response => {
          this.$store.dispatch("crm/SEARCH_DEALS")
          this.showAllocate = false
          this.confirmationMessage("allocate")
        })
    },
    nurtureDeal() {
      this.$store.dispatch("crm/NURTURE_DEAL", { dealId: this.activeDeal.id, nurtureEndDate: this.promptDate }).then(response => {
        this.$store.dispatch("crm/SEARCH_DEALS")
        this.showNurture = false
        this.confirmationMessage("nurture")
      })
    },
    onEdit() {
      this.$v.editDeal.$touch()
      this.$refs.dealForm.validate()
      if (this.$v.editDeal.$invalid) return;

      this.$store.dispatch("crm/UPDATE_DEAL", this.editDeal).then(() => {
        this.showEdit = false
        this.$store.dispatch("crm/SEARCH_DEALS")
        this.confirmationMessage("edit")

        this.editDeal = {}
      })
    },
    onWon() {
      this.$v.wonAmount.$touch()
      this.$refs.wonForm.validate()
      if (this.$v.wonAmount.$invalid) return
      
      this.$store.dispatch("crm/WON_DEAL", { dealId: this.activeDeal.id, wonAmount: this.wonAmount})
        .then(()=> {
          this.showWon = false
          this.$store.dispatch("crm/SEARCH_DEALS")
          this.confirmationMessage("won")
        })
    },
    onLost() {
      this.$v.lostReason.$touch()
      this.$v.lostNote.$touch()
      this.$refs.lostForm.validate()
      if(this.$v.lostReason.$invalid || this.$v.lostNote.$invalid) return
      
      this.$store.dispatch("crm/LOST_DEAL", { dealId: this.activeDeal.id, lostReason: this.lostReason, lostNote: this.lostNote})
        .then(() => {
          this.showLost = false
          this.confirmationMessage("lost")

          this.$store.dispatch("crm/SEARCH_DEALS")
        })
    },
    onReopen(dealId) {
      this.$store.dispatch("crm/REOPEN_DEAL", dealId)
        .then(() => {
          this.confirmationMessage("reactive")
          this.$store.dispatch("crm/SEARCH_DEALS")
        })
    },
    onUpdateStage(dealId, stageId) {
      this.$store.dispatch("crm/UPDATE_DEAL_STAGE", { id: dealId, stageId: stageId })
        .then(() => {

        })
    },
    onLostCancel(){
      this.showLost = false
      if(this.view == "pipeline") this.$store.dispatch("crm/SEARCH_DEALS")
    },
    onWonCancel(){
      this.showWon = false
      if(this.view == "pipeline") this.$store.dispatch("crm/SEARCH_DEALS")
    },
    confirmationMessage(action) {
      this.confirmationAction = true
      switch (action) {
        case "won":
          this.textConfirmation = "La oportunidad se ha Ganado"
          break
        case "lost":
          this.textConfirmation = "La oportunidad se ha Perdido"
          break
        case "nurture":
          this.textConfirmation = "La oportunidad se ha Incubado"
          break
        case "edit":
          this.textConfirmation = "La oportunidad ha sido modificada"
          break
        case "allocate":
          this.textConfirmation = "La oportunidad ha sido reasignada"
					break
				case "reactive":
          this.textConfirmation = "La oportunidad ha sido reactivada"
          break
        case "noteAdded":
          this.textConfirmation = "La nota ha sido agregada"
          break
        default:
          this.textConfirmation = "La Oportunidad ha sido actualizada"
      }
    },
    async setSidebar(deal) {
      if (!deal.id)
        deal.id = this.activeDeal.id
      
      let sidebar = { logs: [] }
      const [currentDeal, logs] = await Promise.all([
        this.$store.dispatch("crm/GET_DEAL", {id: deal.id, view: 'detail'}),
        this.$store.dispatch("crm/GET_DEAL_LOGS", deal.id)])

      let result = { ...sidebar, ...currentDeal }
      result.logs = logs
      
      this.sidebar = result
      this.$nextTick(() => {
        this.showSidebar = true
      })
    },
    onAddSidebarNote() {
      this.$v.sidebarNote.$touch()
      this.$refs.sidebarNoteForm.validate()

      if (this.$v.sidebarNote.$invalid) return

      this.$store.dispatch("crm/ADD_DEAL_NOTE", { id: this.sidebar.id, note: this.sidebarNote })
        .then(result => {
          this.$refs.sidebarNoteForm.reset()
          this.$v.sidebarNote.$reset()

          this.confirmationMessage("noteAdded")

          this.$store.dispatch("crm/GET_DEAL_LOGS", this.sidebar.id)
            .then(logs => { this.sidebar.logs = logs })
        })
     },
     updateDate() {
      let dateSplit = this.date.split("-")[2]
      let newDate = new Date()
      let dias = 1 // Número de días a agregar
      newDate.setDate(newDate.getDate() + dias)

      this.newDate = newDate.toISOString().substr(0, 10)
    },
    formatDate(date) {
      if (!date) return null
      const [year, month, day] = date.split("-")
      return `${day}-${month}-${year}`
    },
    parseDate(date) {
      if (!date) return null

      const [month, day, year] = date.split("-")
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    },
    getRules($v, fieldName, parent) {
      let vm = this
      return getRules(vm, $v, parent, this.getErrorMessage(fieldName))
    },
    getErrorMessage(fieldName) {
      let error = _.find(this.serverErrors, error => {
        if (_.camelCase(error.name) == fieldName) return error
      })

      if (error) return error.description
      else return ""
    },
  },
  watch: {
    filterValues: {
      handler: debounce(function(e) {
          this.$store.dispatch("crm/SEARCH_DEALS").then(() => { this.searching = false })
        }, 500
      ),
      deep: true
    },
    teamIds: {
      handler: debounce(function() {
        if (!this.canManageMembers) return
        
        this.updateTeamMembers()
      }, 500)
    },
    showEdit(val) {
      if (val) return

      this.$v.editDeal.$reset()
      this.$refs.dealForm.reset()
    },
    showWon(val) {
      if (val) return

      this.$v.wonAmount.$reset()
      this.$refs.wonForm.reset()
    },
    showLost(val) {
      if (val) return

      this.$v.lostReason.$reset()
      this.$v.lostNote.$reset()
      this.$refs.lostForm.reset()
    },
    showSidebar(val) {
      if (val) return
      
      this.$refs.sidebarNoteForm.reset()
      this.$v.sidebarNote.$reset()
    }
  },
  validations: {
    editDeal: {
      contactName: { required },
      contactEmail: {
        required,
        email,
        serverError: function(val, vFields) {
          return hasServerError(vFields, "contactEmail", this.serverErrors);
        }
      },
      contactPhone: {
        required,
        serverError: function(val, vFields) {
          return hasServerError(vFields, "contactPhone", this.serverErrors);
        }}
    },
    wonAmount: { required },
    lostReason: { required },
    lostNote: { required:
      requiredIf(function() {
        return this.requiresComment
      })
    },
    sidebarNote: { required }
  }
}
</script>
<style lang="stylus" scoped>
  .c-list__item-link{
    text-decoration: none
    color: $gris-pantano
  }
</style>


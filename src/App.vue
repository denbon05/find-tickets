<template>
  <v-app>
    <v-container>
      <v-row class="my-2">
        <v-col class="d-flex justify-center">
          <img
            width="60"
            :src="require('./assets/logo.png')"
            alt="Plain logo"
          />
        </v-col>
      </v-row>
      <v-row>
        <!-- Filters -->
        <v-col cols="12" md="4" lg="3">
          <aside class="d-flex flex-row flex-md-column" style="gap: 20px">
            <v-card elevation="2" class="pa-3 flex-grow-1"
              ><v-card-title class="text-subtitle-1">{{
                $t("ticket.filter.transfer.title").toUpperCase()
              }}</v-card-title>
              <v-checkbox
                hide-details
                color="info"
                :key="`transfer_filter_${transferIdx}`"
                v-for="(
                  _isSelectedOption, transferAmount, transferIdx
                ) in amounts"
                :label="labels[transferIdx]"
                v-model="amounts[transferAmount]"
              ></v-checkbox>
            </v-card>
            <v-card
              elevation="2"
              class="pa-3 flex-grow-1"
              v-if="companies.length"
            >
              <v-card-title class="text-subtitle-1">{{
                $t("ticket.filter.company.title").toUpperCase()
              }}</v-card-title>
              <v-checkbox
                hide-details
                color="info"
                :key="`company_filter_${companyIdx}`"
                v-for="(company, companyIdx) in companies"
                :label="company.name"
                :value="company.name"
                v-model="selectedCompanies"
                @change="selectCompany"
              ></v-checkbox>
            </v-card>
          </aside>
        </v-col>
        <!-- List of flights -->
        <v-col cols="12" md="8">
          <v-btn-toggle
            v-model="sortBy"
            @update:model-value="changeSortBy"
            mandatory="0"
            divided
            selected-class="bg-info"
            class="d-flex"
          >
            <v-btn
              :key="`sort_by_${sortByIdx}`"
              border="1"
              v-for="(sortByOption, sortByIdx) in sortByList"
              class="flex-grow-1"
            >
              <span>{{ $t(`ticket.sort.${sortByOption}`) }}</span>
            </v-btn>
          </v-btn-toggle>
          <v-main class="d-flex flex-column">
            <template v-if="formatedTickets.length">
              <v-card
                :key="`ticket_${ticketIdx}`"
                v-for="(ticket, ticketIdx) in formatedTickets"
                elevation="2"
                class="pa-3 my-4 flex-grow-1"
                >{{ ticket.price }}</v-card
              >
              <v-btn @click="showMoreTickets" class="w-100" color="info">{{
                $t("ticket.list.more")
              }}</v-btn>
            </template>
          </v-main>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import { first, isEqual } from "lodash";
import { fetchCompaniesList, fetchTicketsList } from "@/api";

export default {
  name: "App",

  data: () => ({
    // filters
    labels: [],
    amounts: { 0: false, 1: false, 2: false, 3: false },
    companies: [],
    selectedCompanies: [],
    // sort
    sortBy: 0,
    sortByList: ["cheapest", "fastest", "optimal"],
    // tickets
    tickets: [],
    ticketsStep: 5,
    beginTicketsIdx: 0,
    endTicketsIdx: 5,
  }),

  methods: {
    async fetchCompaniesList() {
      try {
        const { data } = await fetchCompaniesList();
        this.companies = [
          { name: this.$t("ticket.filter.company.all") },
          ...data,
        ];
      } catch (err) {
        console.error(err);
      }
    },

    async fetchTicketsList() {
      try {
        const { data } = await fetchTicketsList();
        this.tickets = data;
      } catch (err) {
        console.error(err);
      }
    },

    selectCompany({ target: { value } }) {
      const companyNames = this.companies.map(({ name }) => name);
      const selectedAllValue = first(this.companies).name;
      const selectedCompanies = this.selectedCompanies.filter(
        (selectedValue) => selectedValue !== selectedAllValue
      );
      const restCompanies = companyNames.slice(1);
      const shouldBeSelectedAllCompanies =
        (value === selectedAllValue &&
          this.selectedCompanies.includes(value)) ||
        isEqual(selectedCompanies, restCompanies);
      const shouldAllCompaniesBeUnselected =
        value === selectedAllValue && !this.selectedCompanies.includes(value);

      if (shouldAllCompaniesBeUnselected) {
        this.selectedCompanies = [];
      } else if (shouldBeSelectedAllCompanies) {
        this.selectedCompanies = companyNames;
      } else if (!isEqual(selectedCompanies, restCompanies)) {
        this.selectedCompanies = this.selectedCompanies.filter(
          (selectedValue) => selectedValue !== selectedAllValue
        );
      }
    },

    changeSortBy(e) {
      console.log(e);
    },

    showMoreTickets() {
      this.endTicketsIdx += this.ticketsStep;
    },
  },

  computed: {
    formatedTickets() {
      return this.tickets.slice(this.beginTicketsIdx, this.endTicketsIdx);
    },
  },

  created() {
    this.labels = [0, 1, 2, 3].map((n) =>
      this.$tc("ticket.filter.transfer.amount", n, { count: n })
    );
    this.fetchCompaniesList();
    this.fetchTicketsList();
  },
};
</script>

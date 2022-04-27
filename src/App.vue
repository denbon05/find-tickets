<template>
  <v-app>
    <v-container>
      <v-row class="my-2">
        <v-col class="d-flex justify-center">
          <img
            width="60"
            :src="require('@/assets/logo.png')"
            alt="Plain logo"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <!-- Filters -->
        <v-col cols="12" md="4" lg="3" xl="2">
          <aside class="d-flex flex-row flex-md-column" style="gap: 20px">
            <v-card elevation="2" class="pa-3 flex-grow-1"
              ><v-card-title class="text-subtitle-1">{{
                $t("flight.filter.transfer.title").toUpperCase()
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
              v-if="companies.size"
            >
              <v-card-title class="text-subtitle-1">{{
                $t("flight.filter.company.title").toUpperCase()
              }}</v-card-title>
              <v-checkbox
                hide-details
                color="info"
                :key="`company_filter_${companyIdx}`"
                v-for="([, { name }], companyIdx) in [...companies].reverse()"
                :label="name"
                :value="name"
                v-model="selectedCompanies"
              ></v-checkbox>
            </v-card>
          </aside>
        </v-col>
        <!-- List of flights -->
        <v-col cols="12" md="8" lg="6" xl="4">
          <v-btn-toggle
            v-model="sortItemIdx"
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
              <span>{{ $t(`flight.sort.${sortByOption}`) }}</span>
            </v-btn>
          </v-btn-toggle>
          <v-main class="d-flex flex-column">
            <template v-if="formattedTickets.length">
              <v-card
                :key="`ticket_${ticketIdx}`"
                v-for="(ticket, ticketIdx) in formattedTickets"
                elevation="2"
                class="pa-3 my-4 flex-grow-1"
              >
                <section class="d-flex justify-space-between my-3">
                  <v-card-subtitle class="text-h6 text-info"
                    >{{ ticket.price }} {{ currentCurrency }}
                  </v-card-subtitle>
                  <div>
                    <v-img
                      :src="require(`@/assets/${ticket.logoName}`)"
                      height="36px"
                      width="110px"
                      cover
                    ></v-img>
                  </div>
                </section>
                <section class="d-flex flex-row justify-space-between px-4">
                  <div>
                    <span class="text-subtitle-2 text-grey"
                      >{{ departurePoint }} – {{ arrivalPoint }}</span
                    >
                    <div></div>
                  </div>
                  <div>
                    <span class="text-subtitle-2 text-grey">{{
                      $t("flight.ticket.segment.travelTime").toUpperCase()
                    }}</span>
                    <div></div>
                  </div>
                  <div>
                    <span class="text-subtitle-2 text-grey">{{
                      $tc("flight.filter.transfer.amount").toUpperCase()
                    }}</span>
                    <div></div>
                  </div>
                </section>
              </v-card>
              <v-btn @click="showMoreTickets" class="w-100" color="info">{{
                $t("flight.ticket.more", { n: ticketsStep })
              }}</v-btn>
            </template>
          </v-main>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import { isEqual, sortBy, difference } from "lodash";
import { loadContextData } from "@/api";

export default {
  name: "App",

  data: () => ({
    // query
    contextQuery: {
      isLoading: true,
      isSuccess: true,
      message: "",
    },
    // filters
    labels: [],
    amounts: { 0: false, 1: false, 2: false, 3: false },
    allCompaniesOption: null,
    companies: new Map(),
    selectedCompanies: [],
    // sort
    sortItemIdx: null,
    sortByList: ["cheapest", "fastest", "optimal"],
    // tickets
    tickets: [],
    ticketsStep: 5,
    beginTicketsIdx: 0,
    endTicketsIdx: 5,
    // flight
    currentCurrency: "UAH",
    departurePoint: "MOW",
    arrivalPoint: "HKT",
  }),

  methods: {
    async loadContext() {
      this.contextQuery.isLoading = true;
      try {
        const { companies, tickets } = await loadContextData();
        companies.set(null, this.allCompaniesOption);
        this.companies = companies;
        this.tickets = tickets;
        this.sortItemIdx = 0;
        this.contextQuery = { isLoading: false, isSuccess: true };
      } catch (err) {
        console.error(err);
        this.contextQuery = {
          isLoading: false,
          isSuccess: false,
          message: err.message,
        };
      }
    },

    showMoreTickets() {
      this.endTicketsIdx += this.ticketsStep;
    },
  },

  computed: {
    formattedTickets: {
      get() {
        const visibleTickets = this.tickets.slice(
          this.beginTicketsIdx,
          this.endTicketsIdx
        );
        const visibleTicketsWithLogo = visibleTickets.map((ticket) => ({
          ...ticket,
          logoName: this.companies.get(ticket.companyId).logo,
        }));
        return visibleTicketsWithLogo;
      },
      set(items) {
        this.tickets = items;
      },
    },
  },

  watch: {
    sortItemIdx(idx) {
      const sortByKey = this.sortByList[idx];
      switch (sortByKey) {
        case "cheapest":
          this.formattedTickets = sortBy(this.tickets, (t) => t.price);
          break;
        default:
          throw Error(`Unhandled sort option "${sortByKey}"`);
      }
    },

    selectedCompanies: {
      handler(newValues, oldValues) {
        if (isEqual(newValues, oldValues)) {
          return;
        }
        const companyNames = [...this.companies].map(([, { name }]) => name);
        const selectedAllKey = this.allCompaniesOption.name;
        const selectedCompanies = newValues.filter(
          (key) => key !== selectedAllKey
        );
        const restCompanies = companyNames.filter(
          (name) => name !== selectedAllKey
        );
        // debugger;
        const [newValue] = difference(newValues, oldValues);
        const [oldValue] = difference(oldValues, newValues);

        const areAllCompaniesSelected = isEqual(
          sortBy(selectedCompanies),
          sortBy(restCompanies)
        );
        const shouldAllCompaniesBeSelected =
          (newValue === selectedAllKey && newValues.includes(selectedAllKey)) ||
          (areAllCompaniesSelected && oldValue !== selectedAllKey);
        const shouldAllCompaniesBeUnselected =
          (!areAllCompaniesSelected || oldValue === selectedAllKey) &&
          newValue !== selectedAllKey;

        if (shouldAllCompaniesBeSelected) {
          this.selectedCompanies = companyNames;
        } else if (!areAllCompaniesSelected) {
          this.selectedCompanies = newValues.filter(
            (selectedValue) => selectedValue !== selectedAllKey
          );
        } else if (shouldAllCompaniesBeUnselected) {
          this.selectedCompanies = [];
        }
      },
      deep: true,
    },
  },

  created() {
    this.allCompaniesOption = {
      name: this.$t("flight.filter.company.all"),
    };
    this.labels = [0, 1, 2, 3].map((count) =>
      this.$tc("flight.filter.transfer.amount", count)
    );
    this.loadContext();
  },
};
</script>

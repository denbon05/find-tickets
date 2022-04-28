<template>
  <v-app style="background-color: #e9eff5">
    <v-container>
      <v-row class="my-2">
        <v-col class="d-flex justify-center">
          <img width="60" :src="mainLogo" alt="Plain logo" />
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
                v-for="([, { name, id }], companyIdx) in [
                  ...companies,
                ].reverse()"
                :label="name"
                :value="id"
                v-model="selectedCompanyIds"
              ></v-checkbox>
            </v-card>
          </aside>
        </v-col>
        <!-- Sort buttons -->
        <v-col cols="12" md="8" lg="6" xl="4">
          <template v-if="formattedTickets.length">
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
            <!-- List of tickets -->
            <v-main class="d-flex flex-column justify-center">
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
                    <img
                      :src="ticket.logoSrc"
                      :alt="ticket.logoName"
                      height="36"
                      width="110"
                      cover
                    />
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
            </v-main></template
          >
          <template v-else>
            <section class="d-flex justify-center my-4">
              <span class="text-h4 text--secondary">
                {{ $t("flight.ticket.emptyList") }}
              </span>
            </section>
          </template>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import { isEqual, sortBy, difference, camelCase } from "lodash";
import { loadContextData } from "@/api";
import publicImg from "~/img";
import img from "@/assets/img";

export default {
  name: "App",

  data: () => ({
    // static data
    mainLogo: publicImg.mainLogo,
    companyLogotypes: {
      s7Logo: img.s7Logo,
      xiamenAirLogo: img.xiamenAirLogo,
    },
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
    allCompaniesId: "ALL",
    companies: new Map(),
    selectedCompanyIds: [],
    filterCompanyIds: new Set(),
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
        companies.set(this.allCompaniesId, this.allCompaniesOption);
        this.companies = companies;
        this.tickets = tickets;
        this.sortItemIdx = 0;
        this.selectedCompanyIds = [this.allCompaniesOption.id];
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
    formattedTickets() {
      const visibleTickets = this.filteredTickets.slice(
        this.beginTicketsIdx,
        this.endTicketsIdx
      );
      const visibleTicketsWithLogo = visibleTickets.map((ticket) => {
        const [logoName] = this.companies.get(ticket.companyId).logo.split(".");
        return {
          ...ticket,
          logoName,
          logoSrc: this.companyLogotypes[camelCase(logoName)],
        };
      });

      return visibleTicketsWithLogo;
    },

    filteredTickets() {
      if (this.filterCompanyIds.has(this.allCompaniesId)) {
        // console.log("ALL");
        return this.tickets;
      }
      // console.log("Specific", { fcIDS: this.filterCompanyIds });
      return this.tickets.filter(({ companyId }) =>
        this.filterCompanyIds.has(companyId)
      );
    },
  },

  watch: {
    sortItemIdx(idx) {
      const sortKey = this.sortByList[idx];
      switch (sortKey) {
        case "cheapest":
          this.tickets = sortBy(this.tickets, (t) => t.price);
          break;
        default:
          throw Error(`Unhandled sort option "${sortKey}"`);
      }
    },

    selectedCompanyIds: {
      handler(newIds, oldIds) {
        if (isEqual(newIds, oldIds)) {
          return;
        }
        const companyIds = [...this.companies].map(([, { id }]) => id);
        const selectedAllId = this.allCompaniesOption.id;
        const selectedCompanyIds = newIds.filter((id) => id !== selectedAllId);
        const restCompaniesId = companyIds.filter((id) => id !== selectedAllId);

        const [newId] = difference(newIds, oldIds);
        const [oldId] = difference(oldIds, newIds);

        const areAllCompaniesSelected = isEqual(
          sortBy(selectedCompanyIds),
          sortBy(restCompaniesId)
        );
        const shouldAllCompaniesBeSelected =
          (newId === selectedAllId && newIds.includes(selectedAllId)) ||
          (areAllCompaniesSelected && oldId !== selectedAllId);

        if (shouldAllCompaniesBeSelected) {
          this.selectedCompanyIds = companyIds;
        } else if (!areAllCompaniesSelected) {
          this.selectedCompanyIds = newIds.filter(
            (selectedId) => selectedId !== selectedAllId
          );
        } else {
          this.selectedCompanyIds = [];
        }
        this.filterCompanyIds = new Set(this.selectedCompanyIds);
      },
      deep: true,
    },
  },

  created() {
    this.allCompaniesOption = {
      name: this.$t("flight.filter.company.all"),
      id: this.allCompaniesId,
    };
    this.labels = [0, 1, 2, 3].map((count) =>
      this.$tc("flight.filter.transfer.amount", count)
    );

    this.loadContext();
  },
};
</script>

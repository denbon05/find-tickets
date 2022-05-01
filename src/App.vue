<template>
  <v-app style="background-color: #e9eff5">
    <v-snackbar
      :color="snackbar.color"
      v-model="snackbar.isVisible"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.message }}
    </v-snackbar>
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
                ) in transferAmounts"
                :label="labels[transferIdx]"
                v-model="transferAmounts[transferAmount]"
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
                :key="`company_filter_${id}`"
                v-for="[, { name, id }] in [...companies].reverse()"
                :label="name"
                :value="id"
                v-model="selectedCompanyIds"
              ></v-checkbox>
            </v-card>
          </aside>
        </v-col>
        <!-- Sort buttons -->
        <v-col cols="12" md="8" lg="6" xl="4">
          <template v-if="formattedTickets.length && !contextQuery.isLoading">
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
                :key="`ticket_${ticketId}`"
                v-for="(
                  { id: ticketId, price, logoSrc, logoName }, ticketIdx
                ) in formattedTickets"
                elevation="2"
                class="pa-3 my-4 flex-grow-1"
              >
                <section class="d-flex justify-space-between my-3">
                  <v-card-subtitle class="text-h6 text-info"
                    >{{ price }} {{ currentCurrency }}
                  </v-card-subtitle>
                  <div>
                    <img
                      :src="logoSrc"
                      :alt="logoName"
                      height="36"
                      width="110"
                      cover
                    />
                  </div>
                </section>
                <!-- Segments -->
                <v-container>
                  <v-row
                    :key="`${ticketId}_${segmentId}`"
                    v-for="{
                      id: segmentId,
                      beginEndDate,
                      duration,
                      stops,
                      origin,
                      destination,
                    } in ticketSegments[ticketIdx]"
                  >
                    <v-col class="d-flex flex-column">
                      <span class="text-subtitle-2 text-grey">
                        {{ origin }} – {{ destination }}
                      </span>
                      <span class="font-weight-medium">{{ beginEndDate }}</span>
                    </v-col>
                    <v-col class="d-flex flex-column align-self-center">
                      <span class="text-subtitle-2 text-grey">{{
                        $t("flight.ticket.segment.travelTime").toUpperCase()
                      }}</span>
                      <span class="font-weight-medium">{{ duration }}</span>
                    </v-col>
                    <v-col class="d-flex flex-column">
                      <span class="text-subtitle-2 text-grey">{{
                        $tc(
                          "flight.filter.transfer.amount",
                          stops.length
                        ).toUpperCase()
                      }}</span>
                      <span class="font-weight-medium">
                        {{ stops.join(",") }}
                      </span>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card>
              <v-btn
                :disabled="areAllTicketsVisible"
                @click="showMoreTickets"
                class="w-100"
                color="info"
                >{{
                  $t("flight.ticket.more", {
                    n: nextVisibleTicketsAmount,
                  })
                }}
              </v-btn>
            </v-main>
          </template>
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
import moment from "moment";
import {
  isEqual,
  sortBy,
  difference,
  camelCase,
  omit,
  isEmpty,
  sum,
} from "lodash";
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
    snackbar: {
      isVisible: false,
      message: "",
      timeout: 3000,
      color: "error",
    },
    // filters
    labels: [],
    transferAmounts: { 0: true, 1: false, 2: false, 3: false },
    allCompaniesOption: null,
    allCompaniesId: "ALL",
    companies: new Map(),
    selectedCompanyIds: [],
    filterCompanyIds: new Set(),
    // sort
    sortItemIdx: 0,
    sortByList: ["cheapest", "fastest", "optimal"],
    // tickets
    tickets: [],
    ticketsStep: 5,
    beginTicketsIdx: 0,
    endTicketsIdx: 5,
    // segments
    segments: [],
    // flight
    currentCurrency: "UAH",
    departurePoint: "MOW",
    arrivalPoint: "HKT",
  }),

  methods: {
    toggleSnackbar({ message = "", isVisible = true, isSuccess = false }) {
      this.snackbar = {
        ...this.snackbar,
        isVisible,
        message,
        color: isSuccess ? "success" : "error",
      };
    },

    async loadContext() {
      this.contextQuery.isLoading = true;
      try {
        const { companies, tickets, segments } = await loadContextData();
        companies.set(this.allCompaniesId, this.allCompaniesOption);
        this.segments = segments;
        this.companies = companies;
        this.tickets = tickets;
        this.selectedCompanyIds = [this.allCompaniesOption.id];
        this.contextQuery = { isLoading: false, isSuccess: true };
      } catch (err) {
        this.toggleSnackbar({ message: err });
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

    sortByPrice() {
      return sortBy(this.filteredTickets, ({ price }) => price);
    },

    sortByTime() {
      return sortBy(this.filteredTickets, ({ segments }) => {
        const durations = segments.map(
          (segmentId) => this.filteredSegments.get(segmentId).duration
        );
        return sum(durations);
      });
    },
  },

  computed: {
    nextVisibleTicketsAmount() {
      const visibleTicketsAmount = this.filteredTickets.length;
      const invisibleTicketsCount = visibleTicketsAmount - this.endTicketsIdx;
      if (invisibleTicketsCount <= 0) return 0;
      if (invisibleTicketsCount >= this.ticketsStep) {
        return this.ticketsStep;
      }
      return invisibleTicketsCount;
    },

    areAllTicketsVisible() {
      return this.formattedTickets.length === this.filteredTickets.length;
    },

    formattedTickets() {
      const visibleTickets = this.sortedTickets.slice(
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

    filteredSegments() {
      const { departurePoint, arrivalPoint } = this;
      const segmentsFilteredByPointsAndTransfers = this.segments.filter(
        ({ origin, destination, stops }) => {
          const isSuitablePoints =
            departurePoint === origin && arrivalPoint === destination;
          const transferAmount = stops.length;
          const isSuitableTransfersAmount =
            this.transferAmounts[transferAmount];
          return isSuitablePoints && isSuitableTransfersAmount;
        }
      );
      return segmentsFilteredByPointsAndTransfers.reduce(
        (map, segment) => map.set(segment.id, segment),
        new Map()
      );
    },

    filteredTickets() {
      const tickets = [];
      this.tickets.forEach((ticket) => {
        const suitableSegments = ticket.segments.filter((segmentId) =>
          this.filteredSegments.has(segmentId)
        );
        if (!isEmpty(suitableSegments)) {
          ticket.segments = suitableSegments;
          tickets.push(ticket);
        }
      });

      if (this.filterCompanyIds.has(this.allCompaniesId)) {
        return tickets;
      }
      return tickets.filter(({ companyId }) =>
        this.filterCompanyIds.has(companyId)
      );
    },

    sortedTickets() {
      const sortKey = this.sortByList[this.sortItemIdx];

      switch (sortKey) {
        case "cheapest":
          return this.sortByPrice();
        case "fastest":
          return this.sortByTime();
        case "optimal":
          return sortBy(this.filteredTickets, [
            this.sortByPrice(),
            this.sortByTime(),
          ]);
        default:
          throw Error(`Unhandled sort option "${sortKey}"`);
      }
    },

    ticketSegments() {
      const segments = this.filteredSegments;
      return new Proxy(this.sortedTickets, {
        get(tickets, ticketIdx) {
          return tickets[ticketIdx].segments
            .filter((segmentId) => segments.get(segmentId))
            .map((segmentId) => {
              const segment = segments.get(segmentId);
              const { duration } = segment;
              const datesKeys = ["dateStart", "dateEnd"];
              const beginEndDate = datesKeys
                .map((d) => moment(segment[d]).format("HH:mm"))
                .join(" - ");
              return omit(
                {
                  ...{
                    ...segment,
                    duration: moment.utc(duration).format("HH:mm"),
                  },
                  beginEndDate,
                },
                datesKeys
              );
            });
        },
      });
    },
  },

  watch: {
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

    contextQuery: {
      handler({ isLoading, message, isSuccess }) {
        if (!isLoading && message && !isSuccess) {
          this.toggleSnackbar({ message, isSuccess });
        }
      },
      deep: true,
      immediately: false,
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

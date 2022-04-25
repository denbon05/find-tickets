import axios from "axios";

const mainFilterDataUrl =
  "https://raw.githubusercontent.com/denbon05/data/main/";
const companiesDataUrl = new URL("companies.json", mainFilterDataUrl);
const ticketsDataUrl = new URL("tickets.json", mainFilterDataUrl);

export const fetchCompaniesList = async () =>
  await axios.get(companiesDataUrl.toString());

export const fetchTicketsList = async () =>
  await axios.get(ticketsDataUrl.toString());

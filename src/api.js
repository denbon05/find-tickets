import axios from "axios";

const contextMainDataUrl =
  "https://raw.githubusercontent.com/denbon05/data/main/";
const contextDataUrl = new URL("yourcodereview.json", contextMainDataUrl);

const companies = new Map();

export const loadContextData = async () => {
  const {
    data: { tickets, companies: companiesList, segments },
  } = await axios.get(contextDataUrl.toString());

  companiesList.forEach((company) => {
    companies.set(company.id, company);
  });

  return { companies, tickets, segments };
};
